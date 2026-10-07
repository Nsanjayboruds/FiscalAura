package taxengine

import (
	"time"
)

// ITRExportPayload represents the formatted export bundle.
type ITRExportPayload struct {
	SchemaVersion   string                 `json:"schema_version"`
	FormType        string                 `json:"form_type"` // "ITR-1" or "ITR-2"
	AssessmentYear  string                 `json:"assessment_year"`
	GeneratedAt     time.Time              `json:"generated_at"`
	TaxpayerDetails map[string]interface{} `json:"taxpayer_details"`
	IncomeDetails   map[string]interface{} `json:"income_details"`
	TaxesPaid       map[string]interface{} `json:"taxes_paid"`
	TaxComputation  map[string]interface{} `json:"tax_computation"`
	ValidationErrors []string              `json:"validation_errors"`
	IsComplete      bool                   `json:"is_complete"`
}

// ITRExportService manages versioned generation and validation of ITR return datasets.
type ITRExportService struct {
	AssessmentYear string
}

func NewITRExportService(ay string) *ITRExportService {
	if ay == "" {
		ay = "2025-26"
	}
	return &ITRExportService{AssessmentYear: ay}
}

// GenerateITR1 creates an ITR-1 (Sahaj) structured dataset with schema validation.
func (s *ITRExportService) GenerateITR1(taxpayer map[string]interface{}, input TaxCalculationInput, comp TaxComparisonResult) ITRExportPayload {
	var valErrors []string

	pan, _ := taxpayer["pan"].(string)
	if pan == "" {
		valErrors = append(valErrors, "Missing PAN: Permanent Account Number is mandatory for ITR-1 filing.")
	}
	name, _ := taxpayer["full_name"].(string)
	if name == "" {
		valErrors = append(valErrors, "Missing Taxpayer Legal Name.")
	}

	if input.GrossSalary+input.OtherIncome > 5000000 {
		valErrors = append(valErrors, "Income Exceeds ₹50 Lakh: ITR-1 is not applicable for gross earnings over ₹50,00,000. Please select ITR-2.")
	}
	if input.STCG > 0 || input.LTCG > 0 {
		valErrors = append(valErrors, "Capital Gains Present: Individuals with capital gains cannot file ITR-1. ITR-2 is required.")
	}

	chosenRegime := comp.RecommendedRegime
	var activeResult RegimeCalculationResult
	if chosenRegime == "old" {
		activeResult = comp.OldRegime
	} else {
		activeResult = comp.NewRegime
	}

	payload := ITRExportPayload{
		SchemaVersion:  "CBDT-ITR1-AY2025-26-v1.0",
		FormType:       "ITR-1 (Sahaj)",
		AssessmentYear: s.AssessmentYear,
		GeneratedAt:    time.Now().UTC(),
		TaxpayerDetails: map[string]interface{}{
			"pan":          pan,
			"full_name":    name,
			"age_group":    input.AgeGroup,
			"regime_opted": chosenRegime,
		},
		IncomeDetails: map[string]interface{}{
			"gross_salary":        input.GrossSalary,
			"standard_deduction":  activeResult.StandardDeduction,
			"other_income":        input.OtherIncome,
			"interest_income":     input.InterestIncome,
			"gross_total_income":  activeResult.GrossTotalIncome,
			"total_deductions":    activeResult.TotalDeductions,
			"taxable_total_income": activeResult.TaxableIncome,
		},
		TaxesPaid: map[string]interface{}{
			"tds_claimed":      input.TDSDeducted,
			"advance_tax_paid": input.AdvanceTaxPaid,
			"total_prepaid":    activeResult.TDSAndPrepaid,
		},
		TaxComputation: map[string]interface{}{
			"tax_on_slabs":        activeResult.TaxOnSlabs,
			"rebate_87a":          activeResult.Rebate87A,
			"cess":                activeResult.HealthEducationCess,
			"total_tax_liability": activeResult.TotalTaxLiability,
			"net_payable_refund":  activeResult.NetPayableOrRefund,
			"is_refund":           activeResult.IsRefund,
		},
		ValidationErrors: valErrors,
		IsComplete:       len(valErrors) == 0,
	}

	return payload
}

// GenerateITR2 creates an ITR-2 structured dataset supporting capital gains and foreign assets.
func (s *ITRExportService) GenerateITR2(taxpayer map[string]interface{}, input TaxCalculationInput, comp TaxComparisonResult) ITRExportPayload {
	var valErrors []string

	pan, _ := taxpayer["pan"].(string)
	if pan == "" {
		valErrors = append(valErrors, "Missing PAN: Permanent Account Number is mandatory for ITR-2 filing.")
	}
	name, _ := taxpayer["full_name"].(string)
	if name == "" {
		valErrors = append(valErrors, "Missing Taxpayer Legal Name.")
	}

	chosenRegime := comp.RecommendedRegime
	var activeResult RegimeCalculationResult
	if chosenRegime == "old" {
		activeResult = comp.OldRegime
	} else {
		activeResult = comp.NewRegime
	}

	payload := ITRExportPayload{
		SchemaVersion:  "CBDT-ITR2-AY2025-26-v1.0",
		FormType:       "ITR-2",
		AssessmentYear: s.AssessmentYear,
		GeneratedAt:    time.Now().UTC(),
		TaxpayerDetails: map[string]interface{}{
			"pan":          pan,
			"full_name":    name,
			"age_group":    input.AgeGroup,
			"regime_opted": chosenRegime,
		},
		IncomeDetails: map[string]interface{}{
			"gross_salary":        input.GrossSalary,
			"standard_deduction":  activeResult.StandardDeduction,
			"capital_gains_stcg":  input.STCG,
			"capital_gains_ltcg":  input.LTCG,
			"other_income":        input.OtherIncome,
			"interest_income":     input.InterestIncome,
			"rental_income":       input.RentalIncome,
			"gross_total_income":  activeResult.GrossTotalIncome,
			"total_deductions":    activeResult.TotalDeductions,
			"taxable_total_income": activeResult.TaxableIncome,
		},
		TaxesPaid: map[string]interface{}{
			"tds_claimed":      input.TDSDeducted,
			"advance_tax_paid": input.AdvanceTaxPaid,
			"total_prepaid":    activeResult.TDSAndPrepaid,
		},
		TaxComputation: map[string]interface{}{
			"tax_on_slabs":        activeResult.TaxOnSlabs,
			"special_rate_tax":    activeResult.SpecialRateTax,
			"rebate_87a":          activeResult.Rebate87A,
			"cess":                activeResult.HealthEducationCess,
			"total_tax_liability": activeResult.TotalTaxLiability,
			"net_payable_refund":  activeResult.NetPayableOrRefund,
			"is_refund":           activeResult.IsRefund,
		},
		ValidationErrors: valErrors,
		IsComplete:       len(valErrors) == 0,
	}

	return payload
}
