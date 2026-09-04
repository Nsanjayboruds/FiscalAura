package handlers

import (
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/csv-mongo-dreams/backend/middleware"
	"github.com/csv-mongo-dreams/backend/services"
	"github.com/go-chi/chi/v5"
)

type DocumentsHandler struct {
	SB *services.SupabaseClient
}

func (h *DocumentsHandler) List(w http.ResponseWriter, r *http.Request) {
	jwt := middleware.GetUserJWT(r)

	data, err := h.SB.Query("documents", "select=*&order=created_at.desc", jwt)
	if err != nil {
		jsonError(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.Write(data)
}

func (h *DocumentsHandler) Upload(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r)
	jwt := middleware.GetUserJWT(r)

	if err := r.ParseMultipartForm(32 << 20); err != nil {
		jsonError(w, "failed to parse form", http.StatusBadRequest)
		return
	}

	file, header, err := r.FormFile("file")
	if err != nil {
		jsonError(w, "no file provided", http.StatusBadRequest)
		return
	}
	defer file.Close()

	filePath := fmt.Sprintf("%s/%d_%s", userID, time.Now().UnixMilli(), header.Filename)
	if err := h.SB.StorageUpload("tax-documents", filePath, file, header.Header.Get("Content-Type"), jwt); err != nil {
		jsonError(w, "upload failed: "+err.Error(), http.StatusInternalServerError)
		return
	}

	doc := map[string]interface{}{
		"user_id":   userID,
		"file_name": header.Filename,
		"file_type": header.Header.Get("Content-Type"),
		"file_path": filePath,
		"file_size": header.Size,
		"status":    "uploaded",
	}
	result, err := h.SB.Insert("documents", doc, jwt)
	if err != nil {
		jsonError(w, "record insert failed: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.Write(result)
}

func (h *DocumentsHandler) Delete(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r)
	jwt := middleware.GetUserJWT(r)
	docID := chi.URLParam(r, "id")

	doc, err := h.SB.QuerySingle("documents", "select=file_path&id=eq."+docID+"&user_id=eq."+userID, jwt)
	if err != nil || doc == nil {
		jsonError(w, "document not found", http.StatusNotFound)
		return
	}

	var docData struct {
		FilePath string `json:"file_path"`
	}
	json.Unmarshal(doc, &docData)

	h.SB.StorageDelete("tax-documents", []string{docData.FilePath}, jwt)

	if err := h.SB.Delete("documents", "id=eq."+docID+"&user_id=eq."+userID, jwt); err != nil {
		jsonError(w, err.Error(), http.StatusInternalServerError)
		return
	}

	jsonResponse(w, map[string]interface{}{"success": true})
}

func (h *DocumentsHandler) Analyze(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r)
	jwt := middleware.GetUserJWT(r)
	docID := chi.URLParam(r, "id")

	doc, err := h.SB.QuerySingle("documents", "select=*&id=eq."+docID+"&user_id=eq."+userID, jwt)
	if err != nil || doc == nil {
		jsonError(w, "document not found", http.StatusNotFound)
		return
	}

	var docData struct {
		ID       string `json:"id"`
		FileName string `json:"file_name"`
		FileType string `json:"file_type"`
		FilePath string `json:"file_path"`
		FileSize int64  `json:"file_size"`
	}
	json.Unmarshal(doc, &docData)

	// Download file to get content for the edge function
	fileBytes, _, err := h.SB.StorageDownload("tax-documents", docData.FilePath, jwt)
	if err != nil {
		jsonError(w, "file download failed: "+err.Error(), http.StatusInternalServerError)
		return
	}

	// Use Gemini's native multimodal API for PDFs (no pdftotext needed)
	var extractedData map[string]interface{}
	var analysisErr error

	if strings.Contains(docData.FileType, "pdf") {
		// Send raw PDF bytes directly to Gemini - it natively reads PDFs
		extractedData, analysisErr = analyzeWithGeminiNativeBytes(docData.FileName, fileBytes, docData.FileType)
	} else {
		// For text/CSV: extract text content and send
		var textContent string
		if strings.Contains(docData.FileType, "text") || strings.Contains(docData.FileType, "csv") {
			textContent = string(fileBytes)
		} else {
			textContent = fmt.Sprintf("[Binary file: %s, type: %s, size: %d bytes]", docData.FileName, docData.FileType, docData.FileSize)
		}
		extractedData, analysisErr = analyzeWithGeminiNative(docData.FileName, textContent, nil)
	}

	if analysisErr != nil {
		fmt.Printf("Gemini analysis error: %v\n", analysisErr)
		extractedData = map[string]interface{}{
			"document_type": "Unknown Document",
			"gross_salary":  0,
			"key_findings":  []string{"AI analysis failed: " + analysisErr.Error()},
		}
	}

	// Update document record in Supabase
	updatePayload := map[string]interface{}{
		"extracted_data": extractedData,
		"status":         "analyzed",
	}
	_, err = h.SB.Update("documents", "id=eq."+docData.ID+"&user_id=eq."+userID, updatePayload, jwt)
	if err != nil {
		jsonError(w, "failed to update document status: "+err.Error(), http.StatusInternalServerError)
		return
	}

	jsonResponse(w, map[string]interface{}{
		"success": true,
		"data":    extractedData,
	})
}

func analyzeDocumentWithGroq(fileName string, content string) (map[string]interface{}, error) {
	// For text/CSV files: sends textContent. For PDF: not used (fileBytes used instead).
	return analyzeWithGeminiNative(fileName, content, nil)
}

// analyzeWithGeminiNativeBytes uses Gemini's multimodal API with raw PDF bytes.
// Called from the Analyze handler directly for PDF files.
func analyzeWithGeminiNativeBytes(fileName string, fileBytes []byte, mimeType string) (map[string]interface{}, error) {
	return analyzeWithGeminiNative(fileName, "", fileBytes)
}

func analyzeWithGeminiNative(fileName, textContent string, fileBytes []byte) (map[string]interface{}, error) {
	apiKey := os.Getenv("GEMINI_API_KEY")
	if apiKey == "" {
		return nil, fmt.Errorf("GEMINI_API_KEY is not configured")
	}

	prompt := `You are a financial document analyzer for Indian taxpayers. Extract structured financial data from this document.

Return ONLY a valid JSON object (no markdown, no explanation) with these fields (use 0 for missing numeric values, null for missing strings):
{
  "document_type": "Form 16 | Salary Slip | Investment Proof | Bank Statement | Other",
  "employer_name": "string or null",
  "financial_year": "2025-26",
  "gross_salary": 0,
  "hra_received": 0,
  "lta_received": 0,
  "other_income": 0,
  "deductions_80c": 0,
  "deductions_80d": 0,
  "deductions_80e": 0,
  "deductions_80g": 0,
  "deductions_nps": 0,
  "professional_tax": 0,
  "tds_deducted": 0,
  "key_findings": ["list of important observations"]
}

Be thorough. Extract ALL financial figures you see. YOU MUST RETURN ONLY VALID JSON.`

	// Build parts for the Gemini request
	var parts []map[string]interface{}

	if len(fileBytes) > 0 {
		// Native multimodal: send raw PDF bytes as base64 inline data
		b64Data := base64.StdEncoding.EncodeToString(fileBytes)
		parts = []map[string]interface{}{
			{"text": fmt.Sprintf("Analyze this document named '%s':\n%s", fileName, prompt)},
			{"inline_data": map[string]string{
				"mime_type": "application/pdf",
				"data":      b64Data,
			}},
		}
	} else {
		// For text/CSV: just send content as text
		parts = []map[string]interface{}{
			{"text": fmt.Sprintf("%s\n\nDocument name: %s\n\nDocument content:\n%s", prompt, fileName, textContent)},
		}
	}

	payload := map[string]interface{}{
		"contents": []map[string]interface{}{
			{"parts": parts},
		},
		"generationConfig": map[string]interface{}{
			"responseMimeType": "application/json",
			"temperature":      0.1,
		},
	}

	reqBody, err := json.Marshal(payload)
	if err != nil {
		return nil, err
	}

	model := os.Getenv("GEMINI_MODEL")
	if model == "" {
		model = "gemini-3.6-flash"
	}

	url := fmt.Sprintf("https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent?key=%s", model, apiKey)
	httpClient := &http.Client{Timeout: 90 * time.Second}
	resp, err := httpClient.Post(url, "application/json", strings.NewReader(string(reqBody)))
	if err != nil {
		return nil, fmt.Errorf("gemini request failed: %w", err)
	}
	defer resp.Body.Close()

	respBody, _ := io.ReadAll(resp.Body)

	if resp.StatusCode >= 400 {
		return nil, fmt.Errorf("gemini error %d: %s", resp.StatusCode, string(respBody))
	}

	// Parse Gemini's native response format
	var geminiResp struct {
		Candidates []struct {
			Content struct {
				Parts []struct {
					Text string `json:"text"`
				} `json:"parts"`
			} `json:"content"`
		} `json:"candidates"`
	}

	if err := json.Unmarshal(respBody, &geminiResp); err != nil || len(geminiResp.Candidates) == 0 {
		return nil, fmt.Errorf("failed to parse gemini response: %s", string(respBody))
	}

	text := ""
	for _, part := range geminiResp.Candidates[0].Content.Parts {
		text += part.Text
	}

	// Strip markdown code fences if present
	text = strings.TrimSpace(text)
	text = strings.TrimPrefix(text, "```json")
	text = strings.TrimPrefix(text, "```")
	text = strings.TrimSuffix(text, "```")
	text = strings.TrimSpace(text)

	var extractedData map[string]interface{}
	if err := json.Unmarshal([]byte(text), &extractedData); err != nil {
		return nil, fmt.Errorf("invalid JSON from gemini: %s", text)
	}

	return extractedData, nil
}


