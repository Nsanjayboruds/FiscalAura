package taxengine

import (
	"fmt"
	"math"
)

// TaxSlab represents a single bracket of taxable income and its applicable rate.
type TaxSlab struct {
	MinIncome float64 `json:"min_income"`
	MaxIncome float64 `json:"max_income"` // math.MaxFloat64 for infinity
	Rate      float64 `json:"rate"`       // e.g. 0.05 for 5%
}

// TaxRuleSet encapsulates the deterministic tax parameters for a specific financial year and regime.
type TaxRuleSet struct {
	FinancialYear           string    `json:"financial_year"`
	StandardDeductionOld    float64   `json:"standard_deduction_old"`
	StandardDeductionNew    float64   `json:"standard_deduction_new"`
	Rebate87ALimitOld       float64   `json:"rebate_87a_limit_old"`
	Rebate87AMaxOld         float64   `json:"rebate_87a_max_old"`
	Rebate87ALimitNew       float64   `json:"rebate_87a_limit_new"`
	Rebate87AMaxNew         float64   `json:"rebate_87a_max_new"`
	HealthEducationCessRate float64   `json:"cess_rate"` // usually 0.04
	SlabsNew                []TaxSlab `json:"slabs_new"`
	SlabsOldNormal          []TaxSlab `json:"slabs_old_normal"`
	SlabsOldSenior          []TaxSlab `json:"slabs_old_senior"`      // 60-80 years
	SlabsOldSuperSenior     []TaxSlab `json:"slabs_old_super_senior"`// 80+ years
	LTCGExemptionLimit      float64   `json:"ltcg_exemption_limit"`  // 1,25,000 for FY 24-25+
	LTCGRate                float64   `json:"ltcg_rate"`             // 0.125
	STCGRate                float64   `json:"stcg_rate"`             // 0.20
}

// GetRuleSet returns the statutory tax rule set for the requested Financial Year.
// Defaults to FY 2025-26 / 2024-25 if unknown.
func GetRuleSet(financialYear string) TaxRuleSet {
	// FY 2025-26 / FY 2024-25 (Finance Act 2024 / Interim Budget 2024 revised slabs)
	return TaxRuleSet{
		FinancialYear:           financialYear,
		StandardDeductionOld:    50000,
		StandardDeductionNew:    75000,
		Rebate87ALimitOld:       500000,
		Rebate87AMaxOld:         12500,
		Rebate87ALimitNew:       700000, // FY 2024-25 Section 87A rebate ceiling for 115BAC
		Rebate87AMaxNew:         25000,
		HealthEducationCessRate: 0.04,
		LTCGExemptionLimit:      125000,
		LTCGRate:                0.125,
		STCGRate:                0.20,
		SlabsNew: []TaxSlab{
			{MinIncome: 0, MaxIncome: 300000, Rate: 0.0},
			{MinIncome: 300000, MaxIncome: 700000, Rate: 0.05},
			{MinIncome: 700000, MaxIncome: 1000000, Rate: 0.10},
			{MinIncome: 1000000, MaxIncome: 1200000, Rate: 0.15},
			{MinIncome: 1200000, MaxIncome: 1500000, Rate: 0.20},
			{MinIncome: 1500000, MaxIncome: math.MaxFloat64, Rate: 0.30},
		},
		SlabsOldNormal: []TaxSlab{
			{MinIncome: 0, MaxIncome: 250000, Rate: 0.0},
			{MinIncome: 250000, MaxIncome: 500000, Rate: 0.05},
			{MinIncome: 500000, MaxIncome: 1000000, Rate: 0.20},
			{MinIncome: 1000000, MaxIncome: math.MaxFloat64, Rate: 0.30},
		},
		SlabsOldSenior: []TaxSlab{
			{MinIncome: 0, MaxIncome: 300000, Rate: 0.0},
			{MinIncome: 300000, MaxIncome: 500000, Rate: 0.05},
			{MinIncome: 500000, MaxIncome: 1000000, Rate: 0.20},
			{MinIncome: 1000000, MaxIncome: math.MaxFloat64, Rate: 0.30},
		},
		SlabsOldSuperSenior: []TaxSlab{
			{MinIncome: 0, MaxIncome: 500000, Rate: 0.0},
			{MinIncome: 500000, MaxIncome: 1000000, Rate: 0.20},
			{MinIncome: 1000000, MaxIncome: math.MaxFloat64, Rate: 0.30},
		},
	}
}

// TaxCalculationInput holds all financial components required for calculation.
type TaxCalculationInput struct {
	FinancialYear string  `json:"financial_year"`
	AgeGroup      string  `json:"age_group"` // "below-60", "60-80", "above-80"
	GrossSalary   float64 `json:"gross_salary"`
	OtherIncome   float64 `json:"other_income"`
	RentalIncome  float64 `json:"rental_income"`
	InterestIncome float64 `json:"interest_income"`
	BusinessIncome float64 `json:"business_income"`
	STCG          float64 `json:"stcg"` // Short-Term Capital Gains
	LTCG          float64 `json:"ltcg"` // Long-Term Capital Gains

	// Chapter VI-A & Salary Deductions (Primary for Old Regime)
	Deduction80C       float64 `json:"deductions_80c"`
	Deduction80D       float64 `json:"deductions_80d"`
	Deduction80CCD1B   float64 `json:"deductions_nps"`
	Deduction80E       float64 `json:"deductions_80e"`
	Deduction80G       float64 `json:"deductions_80g"`
	Deduction80TTA     float64 `json:"deductions_80tta"`
	HRAExemption       float64 `json:"deductions_hra"`
	LTAExemption       float64 `json:"deductions_lta"`
	ProfessionalTax    float64 `json:"professional_tax"`
	HomeLoanInterest   float64 `json:"home_loan_interest"` // Section 24(b)
	OtherDeductions    float64 `json:"other_deductions"`

	// TDS and Advance Tax already paid
	TDSDeducted     float64 `json:"tds_deducted"`
	AdvanceTaxPaid  float64 `json:"advance_tax_paid"`
}

// SlabTaxDetail shows breakdown for each taxable slab.
type SlabTaxDetail struct {
	SlabName string  `json:"slab_name"`
	Rate     float64 `json:"rate"`
	Taxable  float64 `json:"taxable"`
	Tax      float64 `json:"tax"`
}

// RegimeCalculationResult contains deterministic outputs for a single regime.
type RegimeCalculationResult struct {
	RegimeName          string          `json:"regime_name"` // "old" or "new"
	GrossTotalIncome    float64         `json:"gross_total_income"`
	StandardDeduction   float64         `json:"standard_deduction"`
	ChapterVIADeductions float64        `json:"chapter_via_deductions"`
	TotalDeductions     float64         `json:"total_deductions"`
	TaxableIncome       float64         `json:"taxable_income"`
	SlabBreakdown       []SlabTaxDetail `json:"slab_breakdown"`
	TaxOnSlabs          float64         `json:"tax_on_slabs"`
	SpecialRateTax      float64         `json:"special_rate_tax"` // e.g. STCG/LTCG
	Rebate87A           float64         `json:"rebate_87a"`
	TaxAfterRebate      float64         `json:"tax_after_rebate"`
	Surcharge           float64         `json:"surcharge"`
	HealthEducationCess float64         `json:"cess"`
	TotalTaxLiability   float64         `json:"total_tax_liability"`
	TDSAndPrepaid       float64         `json:"tds_and_prepaid"`
	NetPayableOrRefund  float64         `json:"net_payable_or_refund"` // positive = payable, negative = refund
	IsRefund            bool            `json:"is_refund"`
	EffectiveTaxRate    float64         `json:"effective_tax_rate"` // percentage
}

// TaxComparisonResult is the comprehensive side-by-side comparison between Old and New Regimes.
type TaxComparisonResult struct {
	FinancialYear       string                  `json:"financial_year"`
	OldRegime           RegimeCalculationResult `json:"old_regime"`
	NewRegime           RegimeCalculationResult `json:"new_regime"`
	RecommendedRegime   string                  `json:"recommended_regime"` // "new" or "old"
	TaxDifference       float64                 `json:"tax_difference"`     // positive amount saved
	BreakEvenDeductions float64                 `json:"break_even_deductions"`
	RegimeReasoning     string                  `json:"regime_reasoning"`
}

// CalculateOldRegime performs a strictly deterministic tax calculation under the Old Tax Regime.
func CalculateOldRegime(input TaxCalculationInput) RegimeCalculationResult {
	rules := GetRuleSet(input.FinancialYear)
	
	// Gross income excluding special rate capital gains
	ordinaryIncome := input.GrossSalary + input.OtherIncome + input.RentalIncome + input.InterestIncome + input.BusinessIncome
	grossTotalIncome := ordinaryIncome + input.STCG + input.LTCG

	// Standard deduction applies only if salary income exists
	stdDeduction := 0.0
	if input.GrossSalary > 0 {
		stdDeduction = math.Min(input.GrossSalary, rules.StandardDeductionOld)
	}

	// Capped deductions
	ded80C := math.Min(input.Deduction80C, 150000)
	
	// 80D: Self + Family limit 25k (or 50k if senior)
	max80D := 25000.0
	if input.AgeGroup == "60-80" || input.AgeGroup == "above-80" {
		max80D = 50000.0
	}
	ded80D := math.Min(input.Deduction80D, max80D)
	
	// 80CCD(1B) NPS Tier 1 up to 50k
	dedNPS := math.Min(input.Deduction80CCD1B, 50000)

	// 80TTA (Savings interest up to 10k for non-seniors) or 80TTB (up to 50k for seniors)
	dedTTA := 0.0
	if input.AgeGroup == "60-80" || input.AgeGroup == "above-80" {
		dedTTA = math.Min(input.InterestIncome, 50000)
	} else {
		dedTTA = math.Min(input.InterestIncome, 10000)
	}
	if input.Deduction80TTA > 0 {
		dedTTA = math.Min(input.Deduction80TTA, dedTTA)
	}

	// Home loan interest Section 24(b) capped at 2,00,000 for self-occupied
	homeLoanDed := math.Min(input.HomeLoanInterest, 200000)

	chapterVIADeductions := ded80C + ded80D + dedNPS + dedTTA + input.Deduction80E + input.Deduction80G +
		input.HRAExemption + input.LTAExemption + input.ProfessionalTax + homeLoanDed + input.OtherDeductions

	totalDeductions := stdDeduction + chapterVIADeductions
	
	// Deductions cannot exceed ordinary income (capital gains cannot be reduced by Chapter VI-A)
	allowedDeductions := math.Min(ordinaryIncome, totalDeductions)
	taxableOrdinaryIncome := math.Max(0, ordinaryIncome-allowedDeductions)

	// Choose appropriate slabs based on age
	var slabs []TaxSlab
	switch input.AgeGroup {
	case "60-80":
		slabs = rules.SlabsOldSenior
	case "above-80":
		slabs = rules.SlabsOldSuperSenior
	default:
		slabs = rules.SlabsOldNormal
	}

	// Compute slab tax
	slabBreakdown, taxOnSlabs := computeSlabTax(taxableOrdinaryIncome, slabs)

	// Special rate tax on Capital Gains: STCG 111A (20%), LTCG 112A (12.5% above 1.25L)
	specialRateTax := computeCapitalGainsTax(input.STCG, input.LTCG, rules)

	totalBasicTax := taxOnSlabs + specialRateTax

	// Section 87A rebate for Old Regime: if taxable total income <= 5,00,000, rebate up to ₹12,500
	totalTaxableIncome := taxableOrdinaryIncome + input.STCG + math.Max(0, input.LTCG-rules.LTCGExemptionLimit)
	rebate87A := 0.0
	if totalTaxableIncome <= rules.Rebate87ALimitOld {
		rebate87A = math.Min(totalBasicTax, rules.Rebate87AMaxOld)
	}

	taxAfterRebate := math.Max(0, totalBasicTax-rebate87A)

	// Surcharge
	surcharge := computeSurcharge(totalTaxableIncome, taxAfterRebate, false)

	// Health and Education Cess (4%)
	cess := math.Round((taxAfterRebate + surcharge) * rules.HealthEducationCessRate)
	totalTaxLiability := math.Round(taxAfterRebate + surcharge + cess)

	prepaidTax := input.TDSDeducted + input.AdvanceTaxPaid
	netPayableOrRefund := totalTaxLiability - prepaidTax

	effectiveRate := 0.0
	if grossTotalIncome > 0 {
		effectiveRate = math.Round((totalTaxLiability/grossTotalIncome)*10000) / 100
	}

	return RegimeCalculationResult{
		RegimeName:           "old",
		GrossTotalIncome:     grossTotalIncome,
		StandardDeduction:    stdDeduction,
		ChapterVIADeductions: chapterVIADeductions,
		TotalDeductions:      totalDeductions,
		TaxableIncome:        totalTaxableIncome,
		SlabBreakdown:        slabBreakdown,
		TaxOnSlabs:           taxOnSlabs,
		SpecialRateTax:       specialRateTax,
		Rebate87A:            rebate87A,
		TaxAfterRebate:       taxAfterRebate,
		Surcharge:            surcharge,
		HealthEducationCess:  cess,
		TotalTaxLiability:    totalTaxLiability,
		TDSAndPrepaid:        prepaidTax,
		NetPayableOrRefund:   netPayableOrRefund,
		IsRefund:             netPayableOrRefund < 0,
		EffectiveTaxRate:     effectiveRate,
	}
}

// CalculateNewRegime performs a strictly deterministic tax calculation under Section 115BAC (New Tax Regime).
func CalculateNewRegime(input TaxCalculationInput) RegimeCalculationResult {
	rules := GetRuleSet(input.FinancialYear)

	ordinaryIncome := input.GrossSalary + input.OtherIncome + input.RentalIncome + input.InterestIncome + input.BusinessIncome
	grossTotalIncome := ordinaryIncome + input.STCG + input.LTCG

	// Standard deduction under New Regime
	stdDeduction := 0.0
	if input.GrossSalary > 0 {
		stdDeduction = math.Min(input.GrossSalary, rules.StandardDeductionNew)
	}

	// Under Section 115BAC, Chapter VI-A deductions are NOT allowed, EXCEPT employer contribution to NPS (80CCD(2))
	// Standard deduction of 75,000 is allowed.
	totalDeductions := stdDeduction
	taxableOrdinaryIncome := math.Max(0, ordinaryIncome-totalDeductions)

	// Compute slab tax
	slabBreakdown, taxOnSlabs := computeSlabTax(taxableOrdinaryIncome, rules.SlabsNew)

	// Special rate tax on Capital Gains
	specialRateTax := computeCapitalGainsTax(input.STCG, input.LTCG, rules)
	totalBasicTax := taxOnSlabs + specialRateTax

	totalTaxableIncome := taxableOrdinaryIncome + input.STCG + math.Max(0, input.LTCG-rules.LTCGExemptionLimit)

	// Section 87A rebate for New Regime:
	// Full rebate if total taxable income <= 7,00,000 (tax up to 25,000 is completely nil).
	// Marginal relief: If taxable income marginally exceeds 7,00,000, tax cannot exceed the excess income over 7,00,000.
	rebate87A := 0.0
	if totalTaxableIncome <= rules.Rebate87ALimitNew {
		rebate87A = math.Min(totalBasicTax, rules.Rebate87AMaxNew)
	} else if totalTaxableIncome > 700000 && totalTaxableIncome < 727778 {
		// Marginal relief under Section 87A
		excessIncome := totalTaxableIncome - 700000
		if totalBasicTax > excessIncome {
			rebate87A = totalBasicTax - excessIncome
		}
	}

	taxAfterRebate := math.Max(0, totalBasicTax-rebate87A)

	// Surcharge under New Regime (maximum rate capped at 25% for > 2Cr)
	surcharge := computeSurcharge(totalTaxableIncome, taxAfterRebate, true)

	// Health and Education Cess (4%)
	cess := math.Round((taxAfterRebate + surcharge) * rules.HealthEducationCessRate)
	totalTaxLiability := math.Round(taxAfterRebate + surcharge + cess)

	prepaidTax := input.TDSDeducted + input.AdvanceTaxPaid
	netPayableOrRefund := totalTaxLiability - prepaidTax

	effectiveRate := 0.0
	if grossTotalIncome > 0 {
		effectiveRate = math.Round((totalTaxLiability/grossTotalIncome)*10000) / 100
	}

	return RegimeCalculationResult{
		RegimeName:           "new",
		GrossTotalIncome:     grossTotalIncome,
		StandardDeduction:    stdDeduction,
		ChapterVIADeductions: 0,
		TotalDeductions:      totalDeductions,
		TaxableIncome:        totalTaxableIncome,
		SlabBreakdown:        slabBreakdown,
		TaxOnSlabs:           taxOnSlabs,
		SpecialRateTax:       specialRateTax,
		Rebate87A:            rebate87A,
		TaxAfterRebate:       taxAfterRebate,
		Surcharge:            surcharge,
		HealthEducationCess:  cess,
		TotalTaxLiability:    totalTaxLiability,
		TDSAndPrepaid:        prepaidTax,
		NetPayableOrRefund:   netPayableOrRefund,
		IsRefund:             netPayableOrRefund < 0,
		EffectiveTaxRate:     effectiveRate,
	}
}

// CompareRegimes runs both calculations and produces a deterministic comparison report with reasoning.
func CompareRegimes(input TaxCalculationInput) TaxComparisonResult {
	oldResult := CalculateOldRegime(input)
	newResult := CalculateNewRegime(input)

	diff := math.Abs(oldResult.TotalTaxLiability - newResult.TotalTaxLiability)
	recommended := "new"
	reasoning := ""

	if oldResult.TotalTaxLiability < newResult.TotalTaxLiability {
		recommended = "old"
		reasoning = fmt.Sprintf("The Old Tax Regime saves ₹%.0f because your eligible Chapter VI-A deductions and exemptions (₹%.0f) exceed the break-even threshold.",
			diff, oldResult.TotalDeductions)
	} else if newResult.TotalTaxLiability < oldResult.TotalTaxLiability {
		recommended = "new"
		reasoning = fmt.Sprintf("The New Tax Regime (Section 115BAC) saves ₹%.0f due to lower slab rates and an enhanced Standard Deduction of ₹75,000 without requiring locked-in investments.",
			diff)
	} else {
		recommended = "new"
		reasoning = "Both regimes yield an identical tax liability. The New Regime is recommended for simpler compliance with zero investment proof requirements."
	}

	// Approximate break-even deductions: amount of deductions needed in Old Regime to match New Regime
	breakEven := calculateBreakEvenDeductions(input.GrossSalary + input.OtherIncome)

	return TaxComparisonResult{
		FinancialYear:       input.FinancialYear,
		OldRegime:           oldResult,
		NewRegime:           newResult,
		RecommendedRegime:   recommended,
		TaxDifference:       math.Round(diff),
		BreakEvenDeductions: breakEven,
		RegimeReasoning:     reasoning,
	}
}

func computeSlabTax(income float64, slabs []TaxSlab) ([]SlabTaxDetail, float64) {
	var breakdown []SlabTaxDetail
	totalTax := 0.0

	for _, slab := range slabs {
		if income <= slab.MinIncome {
			continue
		}

		taxableInSlab := math.Min(income, slab.MaxIncome) - slab.MinIncome
		slabTax := taxableInSlab * slab.Rate
		totalTax += slabTax

		slabName := ""
		if slab.MaxIncome == math.MaxFloat64 {
			slabName = fmt.Sprintf("Above ₹%.0fL", slab.MinIncome/100000)
		} else {
			slabName = fmt.Sprintf("₹%.0fL - ₹%.0fL", slab.MinIncome/100000, slab.MaxIncome/100000)
		}

		breakdown = append(breakdown, SlabTaxDetail{
			SlabName: slabName,
			Rate:     slab.Rate * 100,
			Taxable:  taxableInSlab,
			Tax:      math.Round(slabTax),
		})
	}

	return breakdown, math.Round(totalTax)
}

func computeCapitalGainsTax(stcg, ltcg float64, rules TaxRuleSet) float64 {
	stcgTax := 0.0
	if stcg > 0 {
		stcgTax = stcg * rules.STCGRate
	}

	ltcgTax := 0.0
	if ltcg > rules.LTCGExemptionLimit {
		ltcgTax = (ltcg - rules.LTCGExemptionLimit) * rules.LTCGRate
	}

	return math.Round(stcgTax + ltcgTax)
}

func computeSurcharge(taxableIncome, basicTax float64, isNewRegime bool) float64 {
	rate := 0.0
	if taxableIncome > 50000000 { // > 5 Cr
		if isNewRegime {
			rate = 0.25 // capped at 25% in new regime
		} else {
			rate = 0.37 // 37% in old regime
		}
	} else if taxableIncome > 20000000 { // > 2 Cr
		rate = 0.25
	} else if taxableIncome > 10000000 { // > 1 Cr
		rate = 0.15
	} else if taxableIncome > 5000000 { // > 50 Lakh
		rate = 0.10
	}

	return math.Round(basicTax * rate)
}

func calculateBreakEvenDeductions(income float64) float64 {
	// Approximation for salaried individuals:
	// For income 10-15L: typically ~ ₹3.75L to ₹4.25L deductions needed in Old Regime to beat New Regime.
	if income <= 750000 {
		return 0 // New regime is 100% tax-free under 87A rebate
	}
	if income <= 1000000 {
		return 250000
	}
	if income <= 1500000 {
		return 375000
	}
	return 425000
}
