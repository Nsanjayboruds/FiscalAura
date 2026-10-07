package taxengine

import (
	"fmt"
	"math"
)

// Form16EmployerRecord represents parsed data from a single Form 16 (Part A & B).
type Form16EmployerRecord struct {
	ID                string  `json:"id"`
	EmployerName      string  `json:"employer_name"`
	EmployerTAN       string  `json:"employer_tan"`
	EmployeePAN       string  `json:"employee_pan"`
	PeriodFrom        string  `json:"period_from"` // e.g. "01-Apr-2024"
	PeriodTo          string  `json:"period_to"`   // e.g. "30-Sep-2024"
	GrossSalary       float64 `json:"gross_salary"`
	ExemptAllowances  float64 `json:"exempt_allowances"` // HRA, LTA under Sec 10
	StandardDeduction float64 `json:"standard_deduction"` // As claimed on this Form 16
	ProfessionalTax   float64 `json:"professional_tax"`
	ChapterVIADeductions float64 `json:"chapter_via_deductions"`
	TaxableSalary     float64 `json:"taxable_salary"`
	TDSDeducted       float64 `json:"tds_deducted"`
}

// ConsolidatedForm16Result represents the unified multi-employer computation.
type ConsolidatedForm16Result struct {
	EmployerCount            int                    `json:"employer_count"`
	Employers                []Form16EmployerRecord `json:"employers"`
	TotalGrossSalary         float64                `json:"total_gross_salary"`
	TotalExemptAllowances    float64                `json:"total_exempt_allowances"`
	StandardDeductionApplied float64                `json:"standard_deduction_applied"` // Deduplicated! Exactly once
	TotalProfessionalTax     float64                `json:"total_professional_tax"`
	TotalChapterVIADeductions float64               `json:"total_chapter_via_deductions"`
	ConsolidatedTaxableSalary float64               `json:"consolidated_taxable_salary"`
	TotalTDSDeducted         float64                `json:"total_tds_deducted"`
	EstimatedTaxOnCombined   float64                `json:"estimated_tax_on_combined"`
	TDSShortfallOrSurplus    float64                `json:"tds_shortfall_or_surplus"` // positive = shortfall (payable), negative = surplus (refund)
	DuplicateDeductionCaught float64                `json:"duplicate_deduction_caught"`
	Warnings                 []string               `json:"warnings"`
}

// ConsolidateForm16s processes 2 to 5 Form 16s, deduplicating standard deduction and computing tax liability.
func ConsolidateForm16s(records []Form16EmployerRecord, financialYear string, regime string) ConsolidatedForm16Result {
	rules := GetRuleSet(financialYear)
	allowedStdDeduction := rules.StandardDeductionNew
	if regime == "old" {
		allowedStdDeduction = rules.StandardDeductionOld
	}

	totalGross := 0.0
	totalExempt := 0.0
	totalProfTax := 0.0
	totalChapterVIA := 0.0
	totalTDS := 0.0
	claimedStdDeductions := 0.0

	for _, rec := range records {
		totalGross += rec.GrossSalary
		totalExempt += rec.ExemptAllowances
		totalProfTax += rec.ProfessionalTax
		totalChapterVIA += rec.ChapterVIADeductions
		totalTDS += rec.TDSDeducted
		claimedStdDeductions += rec.StandardDeduction
	}

	// Apply standard deduction exactly ONCE across all employers
	actualStdDeduction := math.Min(totalGross, allowedStdDeduction)
	duplicateDeductionCaught := math.Max(0, claimedStdDeductions-actualStdDeduction)

	// Consolidated taxable salary under selected regime
	var consolidatedTaxable float64
	var estimatedTax float64

	calcInput := TaxCalculationInput{
		FinancialYear:   financialYear,
		GrossSalary:     totalGross,
		TDSDeducted:     totalTDS,
		ProfessionalTax: totalProfTax,
		HRAExemption:    totalExempt,
		Deduction80C:    totalChapterVIA,
	}

	if regime == "old" {
		res := CalculateOldRegime(calcInput)
		consolidatedTaxable = res.TaxableIncome
		estimatedTax = res.TotalTaxLiability
	} else {
		res := CalculateNewRegime(calcInput)
		consolidatedTaxable = res.TaxableIncome
		estimatedTax = res.TotalTaxLiability
	}

	tdsDiff := estimatedTax - totalTDS

	var warnings []string
	if len(records) > 1 {
		warnings = append(warnings, fmt.Sprintf("Consolidated %d employers. Standard deduction was applied exactly once (₹%.0f) instead of sum of individual deductions (₹%.0f).",
			len(records), actualStdDeduction, claimedStdDeductions))

		if tdsDiff > 5000 {
			warnings = append(warnings, fmt.Sprintf("Estimated tax shortfall of ₹%.0f detected because each employer applied lower tax slabs independently. Pay self-assessment tax before July 31 to prevent Section 234B interest.", tdsDiff))
		}
	}

	return ConsolidatedForm16Result{
		EmployerCount:            len(records),
		Employers:                records,
		TotalGrossSalary:         totalGross,
		TotalExemptAllowances:    totalExempt,
		StandardDeductionApplied: actualStdDeduction,
		TotalProfessionalTax:     totalProfTax,
		TotalChapterVIADeductions: totalChapterVIA,
		ConsolidatedTaxableSalary: consolidatedTaxable,
		TotalTDSDeducted:         totalTDS,
		EstimatedTaxOnCombined:   estimatedTax,
		TDSShortfallOrSurplus:    tdsDiff,
		DuplicateDeductionCaught: duplicateDeductionCaught,
		Warnings:                 warnings,
	}
}
