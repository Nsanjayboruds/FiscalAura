package handlers

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"os/exec"
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

	var content string
	if strings.Contains(docData.FileType, "text") || strings.Contains(docData.FileType, "csv") {
		content = string(fileBytes)
	} else if strings.Contains(docData.FileType, "pdf") {
		tmpFile, err := os.CreateTemp("", "tax-doc-*.pdf")
		if err == nil {
			tmpFile.Write(fileBytes)
			tmpFile.Close()
			defer os.Remove(tmpFile.Name())
			
			out, err := exec.Command("pdftotext", tmpFile.Name(), "-").Output()
			if err == nil && len(out) > 0 {
				content = string(out)
			} else {
				content = fmt.Sprintf("[PDF extraction failed: %s, type: %s, size: %d bytes]", docData.FileName, docData.FileType, docData.FileSize)
			}
		} else {
			content = fmt.Sprintf("[Binary file: %s, type: %s, size: %d bytes]", docData.FileName, docData.FileType, docData.FileSize)
		}
	} else {
		content = fmt.Sprintf("[Binary file: %s, type: %s, size: %d bytes]",
			docData.FileName, docData.FileType, docData.FileSize)
	}

	// Call Groq API directly from backend instead of Edge Function
	extractedData, err := analyzeDocumentWithGroq(docData.FileName, content)
	if err != nil {
		jsonError(w, "analysis failed: "+err.Error(), http.StatusInternalServerError)
		return
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

func analyzeDocumentWithGroq(fileName, content string) (map[string]interface{}, error) {
	apiKey := os.Getenv("GEMINI_API_KEY")
	if apiKey == "" {
		return nil, fmt.Errorf("GEMINI_API_KEY is not configured")
	}
	model := strings.TrimSpace(os.Getenv("GEMINI_MODEL"))
	if model == "" {
		model = "gemini-3.5-flash-lite"
	}

	systemPrompt := `You are a financial document analyzer for Indian taxpayers. Extract structured financial data from the provided document content.

Return a JSON object with these fields (use 0 for missing values):
- document_type: string (e.g., "Form 16", "Salary Slip", "Investment Proof", "Bank Statement", "Other")
- employer_name: string or null
- financial_year: string (e.g., "2025-26")
- gross_salary: number
- hra_received: number
- lta_received: number
- other_income: number
- deductions_80c: number (PPF, ELSS, LIC, etc.)
- deductions_80d: number (health insurance)
- deductions_80e: number (education loan interest)
- deductions_80g: number (donations)
- deductions_nps: number (NPS contributions)
- professional_tax: number
- tds_deducted: number
- key_findings: string[] (list of important observations)

Be thorough in extracting all financial figures. YOU MUST RETURN ONLY VALID JSON.`

	payload := map[string]interface{}{
		"model": model,
		"messages": []map[string]string{
			{"role": "system", "content": systemPrompt},
			{"role": "user", "content": fmt.Sprintf("Analyze this document (%s):\n\n%s", fileName, content)},
		},
		"tools": []map[string]interface{}{
			{
				"type": "function",
				"function": map[string]interface{}{
					"name":        "extract_financial_data",
					"description": "Extract structured financial data from the document",
					"parameters": map[string]interface{}{
						"type": "object",
						"properties": map[string]interface{}{
							"document_type":    map[string]string{"type": "string"},
							"employer_name":    map[string]string{"type": "string"},
							"financial_year":   map[string]string{"type": "string"},
							"gross_salary":     map[string]string{"type": "number"},
							"hra_received":     map[string]string{"type": "number"},
							"lta_received":     map[string]string{"type": "number"},
							"other_income":     map[string]string{"type": "number"},
							"deductions_80c":   map[string]string{"type": "number"},
							"deductions_80d":   map[string]string{"type": "number"},
							"deductions_80e":   map[string]string{"type": "number"},
							"deductions_80g":   map[string]string{"type": "number"},
							"deductions_nps":   map[string]string{"type": "number"},
							"professional_tax": map[string]string{"type": "number"},
							"tds_deducted":     map[string]string{"type": "number"},
							"key_findings": map[string]interface{}{
								"type":  "array",
								"items": map[string]string{"type": "string"},
							},
						},
						"required":             []string{"document_type", "gross_salary", "key_findings"},
						"additionalProperties": false,
					},
				},
			},
		},
		"tool_choice": map[string]interface{}{
			"type": "function",
			"function": map[string]interface{}{
				"name": "extract_financial_data",
			},
		},
	}

	body, _ := json.Marshal(payload)
	httpReq, _ := http.NewRequest("POST", "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", bytes.NewReader(body))
	httpReq.Header.Set("Authorization", "Bearer "+apiKey)
	httpReq.Header.Set("Content-Type", "application/json")

	resp, err := http.DefaultClient.Do(httpReq)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	respBody, _ := io.ReadAll(resp.Body)
	if resp.StatusCode >= 400 {
		fmt.Printf("Groq API error: %d %s\n", resp.StatusCode, string(respBody))
		return map[string]interface{}{
			"document_type": "Unknown Document",
			"gross_salary":  0,
			"key_findings":  []string{"Could not extract text from binary file or model refused analysis."},
		}, nil
	}

	var parsed struct {
		Choices []struct {
			Message struct {
				ToolCalls []struct {
					Function struct {
						Arguments string `json:"arguments"`
					} `json:"function"`
				} `json:"tool_calls"`
			} `json:"message"`
		} `json:"choices"`
	}
	if err := json.Unmarshal(respBody, &parsed); err != nil {
		return nil, err
	}

	if len(parsed.Choices) > 0 && len(parsed.Choices[0].Message.ToolCalls) > 0 {
		var extractedData map[string]interface{}
		json.Unmarshal([]byte(parsed.Choices[0].Message.ToolCalls[0].Function.Arguments), &extractedData)
		return extractedData, nil
	}

	return map[string]interface{}{}, nil
}
