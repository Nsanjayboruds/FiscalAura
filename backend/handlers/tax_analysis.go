package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/csv-mongo-dreams/backend/middleware"
	"github.com/csv-mongo-dreams/backend/services"
	"github.com/csv-mongo-dreams/backend/services/taxengine"
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

	fy := "2025-26"
	if fyVal, ok := body.FinancialData["financial_year"].(string); ok && fyVal != "" {
		fy = fyVal
	}

	ageGroup := "below-60"
	if ag, ok := body.Profile["age_group"].(string); ok && ag != "" {
		ageGroup = ag
	}

	// Build deterministic calculation input
	calcInput := taxengine.TaxCalculationInput{
		FinancialYear:    fy,
		AgeGroup:         ageGroup,
		GrossSalary:      toFloat(body.FinancialData["gross_salary"]),
		OtherIncome:      toFloat(body.FinancialData["other_income"]),
		RentalIncome:     toFloat(body.FinancialData["rental_income"]),
		InterestIncome:   toFloat(body.FinancialData["interest_income"]),
		BusinessIncome:   toFloat(body.FinancialData["business_income"]),
		Deduction80C:     toFloat(body.FinancialData["deductions_80c"]),
		Deduction80D:     toFloat(body.FinancialData["deductions_80d"]),
		Deduction80E:     toFloat(body.FinancialData["deductions_80e"]),
		Deduction80G:     toFloat(body.FinancialData["deductions_80g"]),
		Deduction80CCD1B: toFloat(body.FinancialData["deductions_nps"]),
		HRAExemption:     toFloat(body.FinancialData["deductions_hra"]),
		LTAExemption:     toFloat(body.FinancialData["deductions_lta"]),
		OtherDeductions:  toFloat(body.FinancialData["other_deductions"]),
		TDSDeducted:      toFloat(body.FinancialData["tds_deducted"]),
	}

	// 1. DETERMINISTIC CALCULATION (SOURCE OF TRUTH)
	deterministicComparison := taxengine.CompareRegimes(calcInput)

	// 2. Discover deductions deterministically
	deductionsList := taxengine.DiscoverDeductions(calcInput)

	// 3. AI Explanation Layer: Provide contextual advice using the EXACT deterministic numbers
	summaryText := deterministicComparison.RegimeReasoning
	aiClient := services.NewAIClient()
	systemPrompt := `You are an Indian Tax Advisory AI. You are provided with EXACT, DETERMINISTIC tax computation figures already calculated by the tax engine.
DO NOT recalculate the numbers. Provide a concise, clear 2-3 sentence executive summary explaining why the recommended regime benefits this taxpayer and highlighting their best tax-saving opportunities.`

	userPrompt := fmt.Sprintf(`Deterministic Computation:
Gross Income: ₹%.0f
Old Regime Tax: ₹%.0f (Taxable: ₹%.0f, Deductions: ₹%.0f)
New Regime Tax: ₹%.0f (Taxable: ₹%.0f, Standard Deduction: ₹%.0f)
Recommended: %s (Savings: ₹%.0f)
Profile: Age group %s, Employment %v`,
		deterministicComparison.OldRegime.GrossTotalIncome,
		deterministicComparison.OldRegime.TotalTaxLiability,
		deterministicComparison.OldRegime.TaxableIncome,
		deterministicComparison.OldRegime.TotalDeductions,
		deterministicComparison.NewRegime.TotalTaxLiability,
		deterministicComparison.NewRegime.TaxableIncome,
		deterministicComparison.NewRegime.StandardDeduction,
		deterministicComparison.RecommendedRegime,
		deterministicComparison.TaxDifference,
		ageGroup,
		body.Profile["employment_type"],
	)

	aiSummary, err := aiClient.ChatCompletion("gemini", systemPrompt, userPrompt, nil, false, false)
	if err == nil && aiSummary != "" {
		summaryText = aiSummary
	}

	resultData := map[string]interface{}{
		"old_regime_tax":         deterministicComparison.OldRegime.TotalTaxLiability,
		"new_regime_tax":         deterministicComparison.NewRegime.TotalTaxLiability,
		"recommended_regime":     deterministicComparison.RecommendedRegime,
		"regime_reasoning":       deterministicComparison.RegimeReasoning,
		"tax_difference":         deterministicComparison.TaxDifference,
		"break_even_deductions":  deterministicComparison.BreakEvenDeductions,
		"total_income":           deterministicComparison.OldRegime.GrossTotalIncome,
		"total_deductions_old":   deterministicComparison.OldRegime.TotalDeductions,
		"taxable_income_old":     deterministicComparison.OldRegime.TaxableIncome,
		"taxable_income_new":     deterministicComparison.NewRegime.TaxableIncome,
		"deduction_suggestions":  deductionsList,
		"analysis_summary":       summaryText,
		"old_regime_details":     deterministicComparison.OldRegime,
		"new_regime_details":     deterministicComparison.NewRegime,
	}

	// Save analysis to DB
	analysisPayload := map[string]interface{}{
		"old_regime_tax":        deterministicComparison.OldRegime.TotalTaxLiability,
		"new_regime_tax":        deterministicComparison.NewRegime.TotalTaxLiability,
		"recommended_regime":    deterministicComparison.RecommendedRegime,
		"analysis_summary":      summaryText,
		"deduction_suggestions": deductionsList,
	}

	existing, _ := h.SB.QuerySingle("tax_analyses", "select=id&financial_year=eq."+fy+"&user_id=eq."+userID, jwt)
	if existing != nil && len(existing) > 4 {
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
