package taxengine

import (
	"fmt"
	"math"
)

// DeductionOpportunity represents an actionable tax deduction avenue.
type DeductionOpportunity struct {
	Section            string  `json:"section"`
	Title              string  `json:"title"`
	Description        string  `json:"description"`
	MaximumCeiling     float64 `json:"maximum_ceiling"`
	CurrentlyClaimed   float64 `json:"currently_claimed"`
	UnclaimedHeadroom  float64 `json:"unclaimed_headroom"`
	PotentialTaxSaving float64 `json:"potential_tax_saving"`
	RegimeApplicable   string  `json:"regime_applicable"` // "Old Regime Only", "Both Old & New", etc.
	RequiredDocuments  string  `json:"required_documents"`
	EligibilityRules   string  `json:"eligibility_rules"`
}

// DiscoverDeductions analyzes a user's financial profile to find unclaimed legal deductions.
func DiscoverDeductions(input TaxCalculationInput) []DeductionOpportunity {
	var opportunities []DeductionOpportunity
	marginalRate := 0.30 // Assume 30% slab for potential savings calculation if > 15L
	if input.GrossSalary < 1000000 {
		marginalRate = 0.20
	}

	// 1. Section 80C
	rem80C := math.Max(0, 150000-input.Deduction80C)
	if rem80C > 0 {
		opportunities = append(opportunities, DeductionOpportunity{
			Section:            "Section 80C",
			Title:              "Unclaimed Chapter VI-A Investment Limit",
			Description:        fmt.Sprintf("You have ₹%.0f in unclaimed Section 80C capacity.", rem80C),
			MaximumCeiling:     150000,
			CurrentlyClaimed:   input.Deduction80C,
			UnclaimedHeadroom:  rem80C,
			PotentialTaxSaving: math.Round(rem80C * marginalRate * 1.04),
			RegimeApplicable:   "Old Tax Regime",
			RequiredDocuments:  "ELSS statement, PPF passbook, EPF statement, or LIC receipt",
			EligibilityRules:   "Available to individuals and HUFs for statutory investments made before March 31.",
		})
	}

	// 2. Section 80CCD(1B) - NPS Exclusive
	remNPS := math.Max(0, 50000-input.Deduction80CCD1B)
	if remNPS > 0 {
		opportunities = append(opportunities, DeductionOpportunity{
			Section:            "Section 80CCD(1B)",
			Title:              "Exclusive National Pension System (NPS) Allowance",
			Description:        "Additional deduction of up to ₹50,000 exclusively for Tier-1 NPS contributions over and above Section 80C.",
			MaximumCeiling:     50000,
			CurrentlyClaimed:   input.Deduction80CCD1B,
			UnclaimedHeadroom:  remNPS,
			PotentialTaxSaving: math.Round(remNPS * marginalRate * 1.04),
			RegimeApplicable:   "Old Tax Regime",
			RequiredDocuments:  "NPS Tier-1 Transaction Statement (PRAN statement)",
			EligibilityRules:   "Any resident Indian aged 18-70 contributing voluntarily to eNPS Tier-1 account.",
		})
	}

	// 3. Section 80D - Health Insurance
	max80D := 25000.0
	if input.AgeGroup == "60-80" || input.AgeGroup == "above-80" {
		max80D = 50000.0
	}
	rem80D := math.Max(0, max80D-input.Deduction80D)
	if rem80D > 0 {
		opportunities = append(opportunities, DeductionOpportunity{
			Section:            "Section 80D",
			Title:              "Medical Insurance & Preventive Health Checkup",
			Description:        "Deduction for health insurance premiums (including ₹5,000 for annual preventive health checks).",
			MaximumCeiling:     max80D,
			CurrentlyClaimed:   input.Deduction80D,
			UnclaimedHeadroom:  rem80D,
			PotentialTaxSaving: math.Round(rem80D * marginalRate * 1.04),
			RegimeApplicable:   "Old Tax Regime",
			RequiredDocuments:  "IRDAI insurance premium 80D certificate",
			EligibilityRules:   "Premiums paid by non-cash mode (banking channels). Preventive health checks allowed in cash.",
		})
	}

	// 4. Section 80CCD(2) - Employer NPS (Works in BOTH Regimes!)
	opportunities = append(opportunities, DeductionOpportunity{
		Section:            "Section 80CCD(2)",
		Title:              "Employer NPS Corporate Scheme (Tax-Free in New Regime!)",
		Description:        "Employer contribution to your NPS account (up to 14% of Basic + DA for Central Govt, 10% for private sector) is deductible under BOTH regimes.",
		MaximumCeiling:     input.GrossSalary * 0.10,
		CurrentlyClaimed:   0,
		UnclaimedHeadroom:  input.GrossSalary * 0.10,
		PotentialTaxSaving: math.Round(input.GrossSalary * 0.10 * marginalRate * 1.04),
		RegimeApplicable:   "Both Old & New Regimes",
		RequiredDocuments:  "Salary slip reflecting corporate NPS deduction from employer",
		EligibilityRules:   "Must be structured through employer payroll as employer contribution.",
	})

	// 5. Section 24(b) - Home Loan Interest
	if input.HomeLoanInterest == 0 {
		opportunities = append(opportunities, DeductionOpportunity{
			Section:            "Section 24(b)",
			Title:              "Home Loan Interest on Self-Occupied House Property",
			Description:        "Interest on housing loan for purchase or construction of house property up to ₹2,00,000 per financial year.",
			MaximumCeiling:     200000,
			CurrentlyClaimed:   0,
			UnclaimedHeadroom:  200000,
			PotentialTaxSaving: math.Round(200000 * marginalRate * 1.04),
			RegimeApplicable:   "Old Tax Regime",
			RequiredDocuments:  "Provisional Interest Certificate from lending bank/NBFC",
			EligibilityRules:   "Loan taken for construction/purchase completed within 5 years.",
		})
	}

	return opportunities
}
