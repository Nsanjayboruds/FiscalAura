package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/csv-mongo-dreams/backend/middleware"
	"github.com/csv-mongo-dreams/backend/services"
)

type TaxAnalysisHandler struct {
	SB *services.SupabaseClient
}

func (h *TaxAnalysisHandler) GetAnalysis(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r)
	jwt := middleware.GetUserJWT(r)

	data, err := h.SB.QuerySingle("tax_analyses", "select=*&user_id=eq."+userID+"&financial_year=eq.2025-26", jwt)
	if err != nil {
		jsonError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	if data == nil {
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte("null"))
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.Write(data)
}

func (h *TaxAnalysisHandler) RunAnalysis(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r)
	jwt := middleware.GetUserJWT(r)

	var body struct {
		FinancialData map[string]interface{} `json:"financialData"`
		Profile       map[string]interface{} `json:"profile"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		jsonError(w, "invalid request body", http.StatusBadRequest)
		return
	}

	// Save financial data first
	if body.FinancialData != nil {
		finUpdate := make(map[string]interface{})
		for k, v := range body.FinancialData {
			if k != "id" && k != "user_id" && k != "created_at" && k != "updated_at" {
				finUpdate[k] = v
			}
		}
		finUpdate = normalizeFinancialUpdate(finUpdate)
		if len(finUpdate) > 0 {
			if _, err := h.SB.Update("financial_data", "user_id=eq."+userID+"&financial_year=eq.2025-26", finUpdate, jwt); err != nil {
				jsonError(w, "failed to save financial data: "+err.Error(), http.StatusInternalServerError)
				return
			}
		}
	}

	// AI Analysis using Unified AIClient

	systemPrompt := `You are an expert Indian tax consultant AI. Analyze the user's financial data and provide comprehensive tax guidance for the Indian tax system (FY 2025-26).

Rules:
- Calculate tax under both Old and New regimes accurately
- New regime FY 2025-26 slabs: 0-4L (nil), 4-8L (5%), 8-12L (10%), 12-16L (15%), 16-20L (20%), 20-24L (25%), >24L (30%). Standard deduction: 75,000.
- Old regime: 0-2.5L (nil), 2.5-5L (5%), 5-10L (20%), >10L (30%). Standard deduction: 50,000.
- Section 87A rebate: Old regime up to 5L taxable (12,500 max); New regime up to 12L taxable (60,000 max).
- 4% cess on total tax
- Suggest specific deductions the user can claim but hasn't
- Recommend the better regime with clear reasoning
- Suggest eligible government schemes

Provide actionable, specific advice. YOU MUST RETURN ONLY VALID JSON matching this structure:
{
  "old_regime_tax": number,
  "new_regime_tax": number,
  "recommended_regime": "old" | "new",
  "regime_reasoning": "string",
  "total_income": number,
  "total_deductions_old": number,
  "taxable_income_old": number,
  "taxable_income_new": number,
  "savings_potential": number,
  "deduction_suggestions": [{"section":"string","title":"string","description":"string","max_limit":number,"current_claimed":number,"potential_saving":number}],
  "scheme_recommendations": [{"name":"string","type":"string","tax_benefit":"string","eligibility":"string","description":"string","how_to_apply":"string"}],
  "analysis_summary": "string"
}`

	finDataJSON, _ := json.MarshalIndent(body.FinancialData, "", "  ")
	profileJSON, _ := json.MarshalIndent(body.Profile, "", "  ")
	userPrompt := fmt.Sprintf("User Profile:\n%s\n\nFinancial Data:\n%s\n\nProvide complete tax analysis with regime comparison, deduction suggestions, and scheme recommendations.", string(profileJSON), string(finDataJSON))

	aiClient := services.NewAIClient()
	responseStr, err := aiClient.ChatCompletion("gemini", systemPrompt, userPrompt, nil, true, false)
	if err != nil {
		jsonError(w, "AI Failover Exhausted: "+err.Error(), http.StatusInternalServerError)
		return
	}

	var resultData map[string]interface{}
	if err := json.Unmarshal([]byte(responseStr), &resultData); err != nil {
		jsonError(w, "Invalid JSON from AI", http.StatusInternalServerError)
		return
	}

	// Save analysis to DB
	fy := "2025-26"
	if fyVal, ok := body.FinancialData["financial_year"].(string); ok && fyVal != "" {
		fy = fyVal
	}

	analysisPayload := map[string]interface{}{
		"old_regime_tax":         resultData["old_regime_tax"],
		"new_regime_tax":         resultData["new_regime_tax"],
		"recommended_regime":     resultData["recommended_regime"],
		"deduction_suggestions":  resultData["deduction_suggestions"],
		"scheme_recommendations": resultData["scheme_recommendations"],
		"analysis_summary":       resultData["analysis_summary"],
	}

	existing, _ := h.SB.QuerySingle("tax_analyses", "select=id&financial_year=eq."+fy+"&user_id=eq."+userID, jwt)

	if existing != nil && len(existing) > 4 { // if found and not empty json
		var existingData map[string]interface{}
		json.Unmarshal(existing, &existingData)
		if id, ok := existingData["id"]; ok {
			h.SB.Update("tax_analyses", fmt.Sprintf("id=eq.%v", id), analysisPayload, jwt)
		}
	} else {
		analysisPayload["user_id"] = userID
		analysisPayload["financial_year"] = fy
		h.SB.Insert("tax_analyses", []map[string]interface{}{analysisPayload}, jwt)
	}

	jsonResponse(w, map[string]interface{}{"success": true, "data": resultData})
}
