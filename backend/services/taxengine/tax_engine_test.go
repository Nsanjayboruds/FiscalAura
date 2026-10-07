package taxengine

import (
	"testing"
)

func TestNewRegimeUpTo7LakhsTaxFree(t *testing.T) {
	input := TaxCalculationInput{
		FinancialYear: "2025-26",
		GrossSalary:   775000, // 7.75L - 75k standard deduction = 7L taxable
	}

	result := CalculateNewRegime(input)
	if result.TotalTaxLiability != 0 {
		t.Errorf("Expected total tax liability 0 for 7.75L gross (7L taxable), got %.2f", result.TotalTaxLiability)
	}
	if result.Rebate87A != 20000 {
		t.Errorf("Expected Section 87A rebate applied 20,000, got %.2f", result.Rebate87A)
	}
}

func TestOldRegimeStandardDeductionAnd80C(t *testing.T) {
	input := TaxCalculationInput{
		FinancialYear: "2025-26",
		AgeGroup:      "below-60",
		GrossSalary:   1000000,
		Deduction80C:  150000,
		Deduction80D:  25000,
	}

	result := CalculateOldRegime(input)
	// Ordinary income: 10,00,000
	// Standard deduction: 50,000
	// 80C: 1,50,000, 80D: 25,000
	// Total deductions: 2,25,000
	// Taxable income: 7,75,000
	// 0-2.5L: 0
	// 2.5-5L (2.5L @ 5%): 12,500
	// 5-7.75L (2.75L @ 20%): 55,000
	// Base tax: 67,500
	// 4% cess: 2,700
	// Total: 70,200
	expectedTax := 70200.0
	if result.TotalTaxLiability != expectedTax {
		t.Errorf("Expected Old Regime tax %.0f, got %.0f", expectedTax, result.TotalTaxLiability)
	}
}

func TestCompareRegimesRecommendation(t *testing.T) {
	input := TaxCalculationInput{
		FinancialYear: "2025-26",
		AgeGroup:      "below-60",
		GrossSalary:   1500000,
		Deduction80C:  150000,
		Deduction80D:  25000,
		Deduction80CCD1B: 50000,
	}

	comparison := CompareRegimes(input)
	if comparison.RecommendedRegime == "" {
		t.Errorf("Expected recommended regime to be populated, got empty")
	}
	if comparison.TaxDifference <= 0 {
		t.Errorf("Expected tax difference > 0, got %.2f", comparison.TaxDifference)
	}
}
