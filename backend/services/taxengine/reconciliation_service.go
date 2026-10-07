package taxengine

import (
	"fmt"
	"math"
)

// ReconciliationItem represents one financial line item cross-referenced across sources.
type ReconciliationItem struct {
	Category        string  `json:"category"` // "Salary", "Savings Interest", "FD Interest", "Dividend", "Securities Sale", "TDS"
	DeclaredValue   float64 `json:"declared_value"`
	Form16Value     float64 `json:"form16_value"`
	AISValue        float64 `json:"ais_value"`
	Form26ASValue   float64 `json:"form26as_value"`
	Variance        float64 `json:"variance"` // AIS / 26AS benchmark vs declared
	Status          string  `json:"status"`   // "MATCHED", "DIFFERENCE", "MISSING"
	StatusColor     string  `json:"status_color"` // "green", "yellow", "red"
	SuggestedAction string  `json:"suggested_action"`
}

// FullReconciliationReport contains the aggregated reconciliation audit.
type FullReconciliationReport struct {
	OverallStatus       string               `json:"overall_status"` // "Fully Reconciled", "Attention Needed", "High Risk"
	TotalMatchedCount   int                  `json:"total_matched_count"`
	TotalDiscrepancies  int                  `json:"total_discrepancies"`
	NetIncomeVariance   float64              `json:"net_income_variance"`
	NetTDSVariance      float64              `json:"net_tds_variance"`
	Items               []ReconciliationItem `json:"items"`
	ComplianceAdvisory  string               `json:"compliance_advisory"`
}

// RunReconciliation audits user declarations against AIS and 26AS.
func RunReconciliation(input TaxCalculationInput, recon ReconciliationData) FullReconciliationReport {
	var items []ReconciliationItem
	matchedCount := 0
	discrepancies := 0
	netIncVar := 0.0
	netTdsVar := 0.0

	// 1. Salary
	salVar := math.Abs(input.GrossSalary - recon.Form16Salary)
	salStatus := "MATCHED"
	salColor := "green"
	salAction := "Salary aligns with Form 16 Part B."
	if salVar > 1000 && recon.Form16Salary > 0 {
		salStatus = "DIFFERENCE"
		salColor = "yellow"
		salAction = "Potential mismatch detected. Verify gross earnings with your Form 16 Part B."
		discrepancies++
		netIncVar += salVar
	} else {
		matchedCount++
	}
	items = append(items, ReconciliationItem{
		Category:        "Gross Salary",
		DeclaredValue:   input.GrossSalary,
		Form16Value:     recon.Form16Salary,
		AISValue:        recon.Form16Salary,
		Form26ASValue:   recon.Form16Salary,
		Variance:        salVar,
		Status:          salStatus,
		StatusColor:     salColor,
		SuggestedAction: salAction,
	})

	// 2. Bank Interest (Savings & FD)
	intVar := recon.AISInterest - input.InterestIncome
	intStatus := "MATCHED"
	intColor := "green"
	intAction := "Interest reported matches AIS records."
	if recon.AISInterest > 0 && input.InterestIncome == 0 {
		intStatus = "MISSING"
		intColor = "red"
		intAction = "Potential mismatch detected. AIS records interest income not yet included in your return."
		discrepancies++
		netIncVar += recon.AISInterest
	} else if intVar > 2000 {
		intStatus = "DIFFERENCE"
		intColor = "yellow"
		intAction = fmt.Sprintf("Potential mismatch detected. Declared interest is ₹%.0f lower than AIS figure.", intVar)
		discrepancies++
		netIncVar += intVar
	} else {
		matchedCount++
	}
	items = append(items, ReconciliationItem{
		Category:        "Bank & Deposit Interest",
		DeclaredValue:   input.InterestIncome,
		Form16Value:     0,
		AISValue:        recon.AISInterest,
		Form26ASValue:   recon.AISInterest,
		Variance:        intVar,
		Status:          intStatus,
		StatusColor:     intColor,
		SuggestedAction: intAction,
	})

	// 3. Dividend Income
	divVar := recon.AISDividend - input.OtherIncome
	divStatus := "MATCHED"
	divColor := "green"
	divAction := "Dividend income verified."
	if recon.AISDividend > 0 && input.OtherIncome == 0 {
		divStatus = "MISSING"
		divColor = "yellow"
		divAction = "Potential mismatch detected. Verify corporate dividend credits reported in AIS."
		discrepancies++
		netIncVar += recon.AISDividend
	} else {
		matchedCount++
	}
	items = append(items, ReconciliationItem{
		Category:        "Corporate Dividends",
		DeclaredValue:   input.OtherIncome,
		Form16Value:     0,
		AISValue:        recon.AISDividend,
		Form26ASValue:   recon.AISDividend,
		Variance:        divVar,
		Status:          divStatus,
		StatusColor:     divColor,
		SuggestedAction: divAction,
	})

	// 4. TDS Credits
	tdsVar := math.Abs(input.TDSDeducted - recon.Form26ASTDS)
	tdsStatus := "MATCHED"
	tdsColor := "green"
	tdsAction := "TDS claimed matches Form 26AS / AIS tax credit ledger."
	if recon.Form26ASTDS > 0 && tdsVar > 500 {
		tdsStatus = "DIFFERENCE"
		tdsColor = "red"
		tdsAction = fmt.Sprintf("Potential mismatch detected of ₹%.0f between declared TDS and Form 26AS credits.", tdsVar)
		discrepancies++
		netTdsVar += tdsVar
	} else {
		matchedCount++
	}
	items = append(items, ReconciliationItem{
		Category:        "Total TDS Credits",
		DeclaredValue:   input.TDSDeducted,
		Form16Value:     recon.Form16TDS,
		AISValue:        recon.Form26ASTDS,
		Form26ASValue:   recon.Form26ASTDS,
		Variance:        tdsVar,
		Status:          tdsStatus,
		StatusColor:     tdsColor,
		SuggestedAction: tdsAction,
	})

	// 5. Securities / Capital Gain Sales
	secStatus := "MATCHED"
	secColor := "green"
	secAction := "No unverified capital asset disposals detected."
	if recon.AISSecuritySale > 0 && (input.STCG == 0 && input.LTCG == 0) {
		secStatus = "MISSING"
		secColor = "yellow"
		secAction = "Potential mismatch detected. SFT trade turnover detected in AIS without capital gains declaration."
		discrepancies++
	} else {
		matchedCount++
	}
	items = append(items, ReconciliationItem{
		Category:        "Securities Sale Turnover (SFT)",
		DeclaredValue:   input.STCG + input.LTCG,
		Form16Value:     0,
		AISValue:        recon.AISSecuritySale,
		Form26ASValue:   0,
		Variance:        recon.AISSecuritySale,
		Status:          secStatus,
		StatusColor:     secColor,
		SuggestedAction: secAction,
	})

	overallStatus := "Fully Reconciled"
	advisory := "All reported lines match AIS and Form 26AS data. You are ready to generate your ITR return with high compliance confidence."
	if discrepancies >= 2 || netTdsVar > 1000 {
		overallStatus = "Attention Needed"
		advisory = "Discrepancies found between your entries and official AIS / 26AS databases. Please review highlighted items before filing to avoid CPC rectification notices."
	}

	return FullReconciliationReport{
		OverallStatus:      overallStatus,
		TotalMatchedCount:  matchedCount,
		TotalDiscrepancies: discrepancies,
		NetIncomeVariance:  netIncVar,
		NetTDSVariance:     netTdsVar,
		Items:              items,
		ComplianceAdvisory: advisory,
	}
}
