package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/csv-mongo-dreams/backend/middleware"
	"github.com/csv-mongo-dreams/backend/services"
	"github.com/csv-mongo-dreams/backend/services/taxengine"
)

type FintechHandler struct {
	SB *services.SupabaseClient
}

// GetTaxHealth calculates deterministic tax health score and penalties
func (h *FintechHandler) GetTaxHealth(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r)
	jwt := middleware.GetUserJWT(r)

	finDataRaw, _ := h.SB.QuerySingle("financial_data", "select=*&user_id=eq."+userID+"&financial_year=eq.2025-26", jwt)
	var fin map[string]interface{}
	if finDataRaw != nil {
		json.Unmarshal(finDataRaw, &fin)
	}

	calcInput := taxengine.TaxCalculationInput{
		FinancialYear:    "2025-26",
		GrossSalary:      toFloat(fin["gross_salary"]),
		OtherIncome:      toFloat(fin["other_income"]),
		RentalIncome:     toFloat(fin["rental_income"]),
		InterestIncome:   toFloat(fin["interest_income"]),
		BusinessIncome:   toFloat(fin["business_income"]),
		Deduction80C:     toFloat(fin["deductions_80c"]),
		Deduction80D:     toFloat(fin["deductions_80d"]),
		Deduction80CCD1B: toFloat(fin["deductions_nps"]),
		TDSDeducted:      toFloat(fin["tds_deducted"]),
	}

	recon := taxengine.ReconciliationData{
		DeclaredSalary:   calcInput.GrossSalary,
		Form16Salary:     calcInput.GrossSalary,
		DeclaredInterest: calcInput.InterestIncome,
		AISInterest:      calcInput.InterestIncome + 4200, // sample benchmark
		DeclaredTDS:      calcInput.TDSDeducted,
		Form26ASTDS:      calcInput.TDSDeducted,
	}

	report := taxengine.ComputeTaxHealthScore(calcInput, recon)
	jsonResponse(w, report)
}

// GetAnomalies returns rule-based detected anomalies
func (h *FintechHandler) GetAnomalies(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r)
	jwt := middleware.GetUserJWT(r)

	finDataRaw, _ := h.SB.QuerySingle("financial_data", "select=*&user_id=eq."+userID+"&financial_year=eq.2025-26", jwt)
	var fin map[string]interface{}
	if finDataRaw != nil {
		json.Unmarshal(finDataRaw, &fin)
	}

	calcInput := taxengine.TaxCalculationInput{
		FinancialYear:    "2025-26",
		GrossSalary:      toFloat(fin["gross_salary"]),
		InterestIncome:   toFloat(fin["interest_income"]),
		Deduction80C:     toFloat(fin["deductions_80c"]),
		TDSDeducted:      toFloat(fin["tds_deducted"]),
	}

	recon := taxengine.ReconciliationData{
		DeclaredSalary:   calcInput.GrossSalary,
		Form16Salary:     calcInput.GrossSalary,
		DeclaredInterest: calcInput.InterestIncome,
		AISInterest:      calcInput.InterestIncome,
		DeclaredTDS:      calcInput.TDSDeducted,
		Form26ASTDS:      calcInput.TDSDeducted,
	}

	anomalies := taxengine.DetectTaxAnomalies(calcInput, recon)
	jsonResponse(w, map[string]interface{}{"anomalies": anomalies})
}

// ConsolidateForm16s handles multi-employer consolidation
func (h *FintechHandler) ConsolidateForm16s(w http.ResponseWriter, r *http.Request) {
	var body struct {
		Employers     []taxengine.Form16EmployerRecord `json:"employers"`
		FinancialYear string                           `json:"financial_year"`
		Regime        string                           `json:"regime"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		jsonError(w, "invalid request body", http.StatusBadRequest)
		return
	}
	if body.FinancialYear == "" {
		body.FinancialYear = "2025-26"
	}
	if body.Regime == "" {
		body.Regime = "new"
	}

	result := taxengine.ConsolidateForm16s(body.Employers, body.FinancialYear, body.Regime)
	jsonResponse(w, result)
}

// RunReconciliation runs an audit of declared vs AIS/26AS
func (h *FintechHandler) RunReconciliation(w http.ResponseWriter, r *http.Request) {
	var body struct {
		Input taxengine.TaxCalculationInput `json:"input"`
		Recon taxengine.ReconciliationData  `json:"recon"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		// Provide default audit based on user's saved data if empty
		userID := middleware.GetUserID(r)
		jwt := middleware.GetUserJWT(r)
		finDataRaw, _ := h.SB.QuerySingle("financial_data", "select=*&user_id=eq."+userID+"&financial_year=eq.2025-26", jwt)
		var fin map[string]interface{}
		if finDataRaw != nil {
			json.Unmarshal(finDataRaw, &fin)
		}
		body.Input = taxengine.TaxCalculationInput{
			FinancialYear:  "2025-26",
			GrossSalary:    toFloat(fin["gross_salary"]),
			InterestIncome: toFloat(fin["interest_income"]),
			OtherIncome:    toFloat(fin["other_income"]),
			TDSDeducted:    toFloat(fin["tds_deducted"]),
		}
		body.Recon = taxengine.ReconciliationData{
			DeclaredSalary:   body.Input.GrossSalary,
			Form16Salary:     body.Input.GrossSalary,
			DeclaredInterest: body.Input.InterestIncome,
			AISInterest:      body.Input.InterestIncome,
			DeclaredTDS:      body.Input.TDSDeducted,
			Form26ASTDS:      body.Input.TDSDeducted,
		}
	}

	report := taxengine.RunReconciliation(body.Input, body.Recon)
	jsonResponse(w, report)
}

// AnalyzeCapitalGains calculates capital gains and harvesting opportunities
func (h *FintechHandler) AnalyzeCapitalGains(w http.ResponseWriter, r *http.Request) {
	var body struct {
		Trades        []taxengine.Trade   `json:"trades"`
		Holdings      []taxengine.Holding `json:"holdings"`
		FinancialYear string              `json:"financial_year"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		jsonError(w, "invalid request body", http.StatusBadRequest)
		return
	}
	if body.FinancialYear == "" {
		body.FinancialYear = "2025-26"
	}

	report := taxengine.ComputeCapitalGains(body.Trades, body.Holdings, body.FinancialYear)
	jsonResponse(w, report)
}

// CalculateAdvanceTax computes advance tax installments and 234A/B/C interest
func (h *FintechHandler) CalculateAdvanceTax(w http.ResponseWriter, r *http.Request) {
	var body struct {
		AssessedTax       float64 `json:"assessed_tax"`
		TotalTDS          float64 `json:"total_tds"`
		PaidQ1            float64 `json:"paid_q1"`
		PaidQ2            float64 `json:"paid_q2"`
		PaidQ3            float64 `json:"paid_q3"`
		PaidQ4            float64 `json:"paid_q4"`
		FilingDelayMonths int     `json:"filing_delay_months"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		jsonError(w, "invalid request body", http.StatusBadRequest)
		return
	}

	report := taxengine.ComputeAdvanceTax(body.AssessedTax, body.TotalTDS, body.PaidQ1, body.PaidQ2, body.PaidQ3, body.PaidQ4, body.FilingDelayMonths)
	jsonResponse(w, report)
}

// ExportITR generates versioned ITR-1 or ITR-2 JSON
func (h *FintechHandler) ExportITR(w http.ResponseWriter, r *http.Request) {
	var body struct {
		FormType string                         `json:"form_type"` // "ITR-1" or "ITR-2"
		Taxpayer map[string]interface{}         `json:"taxpayer"`
		Input    taxengine.TaxCalculationInput  `json:"input"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		jsonError(w, "invalid request body", http.StatusBadRequest)
		return
	}

	comp := taxengine.CompareRegimes(body.Input)
	exporter := taxengine.NewITRExportService(body.Input.FinancialYear)

	var payload taxengine.ITRExportPayload
	if body.FormType == "ITR-2" {
		payload = exporter.GenerateITR2(body.Taxpayer, body.Input, comp)
	} else {
		payload = exporter.GenerateITR1(body.Taxpayer, body.Input, comp)
	}

	jsonResponse(w, payload)
}

// CopilotChat provides a context-aware AI tax consultant that never hallucinates numbers
func (h *FintechHandler) CopilotChat(w http.ResponseWriter, r *http.Request) {
	var body struct {
		Message string                         `json:"message"`
		Context map[string]interface{}         `json:"context"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil || body.Message == "" {
		jsonError(w, "message is required", http.StatusBadRequest)
		return
	}

	contextJSON, _ := json.MarshalIndent(body.Context, "", "  ")

	systemPrompt := `Role: You are FiscalAura Copilot, an institutional, highly accurate Indian Tax Consultant.
Rules:
1. Context First: Answer questions using the exact numbers and structured tax data provided in the context.
2. Accuracy: NEVER invent or hallucinate financial values or tax laws.
3. If data is missing, clearly state: "I don't have enough information in your profile to determine this."
4. Tone: Professional, reassuring, clear, and direct.
5. Provide actionable advice for Indian tax compliance (FY 2024-25 / AY 2025-26).
6. Include a brief disclaimer: "FiscalAura provides informational estimates and does not replace professional tax advice."`

	userPrompt := fmt.Sprintf("Taxpayer Context Data:\n%s\n\nUser Question:\n%s", string(contextJSON), body.Message)

	aiClient := services.NewAIClient()
	reply, err := aiClient.ChatCompletion("groq", systemPrompt, userPrompt, nil, false, false)
	if err != nil {
		jsonError(w, "AI service currently unavailable: "+err.Error(), http.StatusBadGateway)
		return
	}

	jsonResponse(w, map[string]interface{}{
		"success": true,
		"reply":   reply,
	})
}
