package taxengine

import (
	"fmt"
	"math"
)

// TaxHealthComponent represents one pillar of the Tax Health Score.
type TaxHealthComponent struct {
	Name        string  `json:"name"`
	Score       int     `json:"score"` // 0 to 100
	Weight      float64 `json:"weight"`
	Status      string  `json:"status"` // "Excellent", "Good", "Needs Attention", "Critical"
	Explanation string  `json:"explanation"`
}

// TaxHealthPenalty represents a specific item that reduced the taxpayer's score.
type TaxHealthPenalty struct {
	Pillar     string  `json:"pillar"`
	Impact     int     `json:"impact"` // e.g. -15
	Reason     string  `json:"reason"`
	ActionPlan string  `json:"action_plan"`
}

// TaxHealthReport represents the overall health score and its breakdown.
type TaxHealthReport struct {
	OverallScore int                  `json:"overall_score"` // 0 to 100
	Grade        string               `json:"grade"`         // "A+", "A", "B", "C", "D"
	Summary      string               `json:"summary"`
	Components   []TaxHealthComponent `json:"components"`
	Penalties    []TaxHealthPenalty   `json:"penalties"`
}

// TaxAnomaly represents a detected risk, mismatch, or inconsistency.
type TaxAnomaly struct {
	ID          string  `json:"id"`
	Severity    string  `json:"severity"` // "info", "warning", "critical"
	Title       string  `json:"title"`
	Description string  `json:"description"`
	Amount      float64 `json:"amount"`
	Source      string  `json:"source"` // "AIS", "Form 16", "26AS", "Deductions"
	Action      string  `json:"action"`
}

// ReconciliationData encapsulates third-party reported income and TDS for comparison.
type ReconciliationData struct {
	DeclaredSalary   float64 `json:"declared_salary"`
	Form16Salary     float64 `json:"form16_salary"`
	DeclaredInterest float64 `json:"declared_interest"`
	AISInterest      float64 `json:"ais_interest"`
	DeclaredDividend float64 `json:"declared_dividend"`
	AISDividend      float64 `json:"ais_dividend"`
	DeclaredTDS      float64 `json:"declared_tds"`
	Form26ASTDS      float64 `json:"form26as_tds"`
	Form16TDS        float64 `json:"form16_tds"`
	HasMultipleForm16 bool   `json:"has_multiple_form16"`
	ReportedSTCG     float64 `json:"reported_stcg"`
	AISSecuritySale  float64 `json:"ais_security_sale"`
}

// ComputeTaxHealthScore deterministically calculates the taxpayer's 0-100 score.
func ComputeTaxHealthScore(input TaxCalculationInput, recon ReconciliationData) TaxHealthReport {
	penalties := []TaxHealthPenalty{}

	// 1. Compliance (Weight: 25%)
	compScore := 100
	if input.GrossSalary > 0 && input.TDSDeducted == 0 && input.AdvanceTaxPaid == 0 && input.GrossSalary > 750000 {
		compScore -= 30
		penalties = append(penalties, TaxHealthPenalty{
			Pillar:     "Compliance",
			Impact:     30,
			Reason:     "No TDS or Advance Tax reported despite taxable salary exceeding standard threshold.",
			ActionPlan: "Verify Form 16 Part A or deposit self-assessment tax to prevent Section 234B/C interest.",
		})
	}
	if compScore < 0 {
		compScore = 0
	}

	// 2. Income Reporting Accuracy (Weight: 25%)
	incScore := 100
	if recon.AISInterest > 0 && input.InterestIncome == 0 {
		incScore -= 25
		penalties = append(penalties, TaxHealthPenalty{
			Pillar:     "Income Reporting",
			Impact:     25,
			Reason:     fmt.Sprintf("AIS reports ₹%.0f in bank interest, but declared interest is ₹0.", recon.AISInterest),
			ActionPlan: "Include bank interest under 'Income from Other Sources' to prevent automated ITD scrutiny notices.",
		})
	} else if recon.AISInterest > input.InterestIncome && (recon.AISInterest-input.InterestIncome) > 5000 {
		diff := recon.AISInterest - input.InterestIncome
		incScore -= 15
		penalties = append(penalties, TaxHealthPenalty{
			Pillar:     "Income Reporting",
			Impact:     15,
			Reason:     fmt.Sprintf("Declared interest is ₹%.0f less than interest captured in AIS (₹%.0f).", diff, recon.AISInterest),
			ActionPlan: "Reconcile passbook interest and Form 26AS Part G before filing return.",
		})
	}
	if recon.AISDividend > 0 && input.OtherIncome == 0 {
		incScore -= 10
		penalties = append(penalties, TaxHealthPenalty{
			Pillar:     "Income Reporting",
			Impact:     10,
			Reason:     fmt.Sprintf("AIS reports ₹%.0f in corporate dividend income not declared in other sources.", recon.AISDividend),
			ActionPlan: "Declare dividend receipts under Schedule OS (Other Sources).",
		})
	}
	if incScore < 0 {
		incScore = 0
	}

	// 3. Deduction Utilization (Weight: 20%)
	dedScore := 100
	if input.GrossSalary > 1000000 {
		unused80C := math.Max(0, 150000-input.Deduction80C)
		if unused80C > 50000 {
			dedScore -= 15
			penalties = append(penalties, TaxHealthPenalty{
				Pillar:     "Deduction Utilization",
				Impact:     15,
				Reason:     fmt.Sprintf("You have ₹%.0f in unutilized Section 80C headroom.", unused80C),
				ActionPlan: "Consider investing in ELSS, PPF, or Voluntary Provident Fund before March 31 if using Old Regime.",
			})
		}
		if input.Deduction80D == 0 {
			dedScore -= 10
			penalties = append(penalties, TaxHealthPenalty{
				Pillar:     "Deduction Utilization",
				Impact:     10,
				Reason:     "No medical insurance deduction (Section 80D) claimed.",
				ActionPlan: "Claim up to ₹25,000 for self/family and up to ₹50,000 for senior citizen parents.",
			})
		}
		if input.Deduction80CCD1B == 0 {
			dedScore -= 5
			penalties = append(penalties, TaxHealthPenalty{
				Pillar:     "Deduction Utilization",
				Impact:     5,
				Reason:     "Exclusive ₹50,000 Section 80CCD(1B) NPS benefit is untouched.",
				ActionPlan: "Allocate to Tier-1 NPS to reduce taxable income over and above the 80C limit.",
			})
		}
	}
	if dedScore < 0 {
		dedScore = 0
	}

	// 4. TDS Accuracy (Weight: 15%)
	tdsScore := 100
	if recon.Form26ASTDS > 0 && math.Abs(recon.DeclaredTDS-recon.Form26ASTDS) > 1000 {
		tdsScore -= 30
		penalties = append(penalties, TaxHealthPenalty{
			Pillar:     "TDS Accuracy",
			Impact:     30,
			Reason:     fmt.Sprintf("Declared TDS (₹%.0f) does not match Form 26AS TDS credits (₹%.0f).", recon.DeclaredTDS, recon.Form26ASTDS),
			ActionPlan: "Download updated 26AS to ensure deductor PAN/TAN matches employer filing.",
		})
	}
	if tdsScore < 0 {
		tdsScore = 0
	}

	// 5. AIS Reconciliation (Weight: 15%)
	reconScore := 100
	if recon.HasMultipleForm16 {
		reconScore -= 10 // Multi-employer requires heightened scrutiny
	}
	if recon.AISSecuritySale > 0 && input.STCG == 0 && input.LTCG == 0 {
		reconScore -= 25
		penalties = append(penalties, TaxHealthPenalty{
			Pillar:     "AIS Reconciliation",
			Impact:     25,
			Reason:     fmt.Sprintf("AIS reports security transactions of ₹%.0f, but no capital gains are declared.", recon.AISSecuritySale),
			ActionPlan: "Upload your broker capital gains statement (Zerodha, Groww, etc.) to report realized gains.",
		})
	}
	if reconScore < 0 {
		reconScore = 0
	}

	// Calculate weighted overall score
	weighted := (float64(compScore) * 0.25) +
		(float64(incScore) * 0.25) +
		(float64(dedScore) * 0.20) +
		(float64(tdsScore) * 0.15) +
		(float64(reconScore) * 0.15)

	overall := int(math.Round(weighted))
	if overall > 100 {
		overall = 100
	} else if overall < 0 {
		overall = 0
	}

	grade := "A"
	summary := "Your taxpayer health score is strong with clean cross-reconciliation."
	if overall >= 90 {
		grade = "A+"
		summary = "Outstanding compliance record. Records match AIS, Form 16, and 26AS with maximum efficiency."
	} else if overall >= 75 {
		grade = "A"
		summary = "Good tax posture. Minor deduction optimization or interest cross-checking recommended."
	} else if overall >= 60 {
		grade = "B"
		summary = "Fair standing. Discrepancies detected between declared income and AIS/26AS records."
	} else if overall >= 40 {
		grade = "C"
		summary = "Attention needed. Significant mismatches found in TDS or unverified external income."
	} else {
		grade = "D"
		summary = "High audit risk. Missing capital gains or severe TDS discrepancies require immediate reconciliation."
	}

	statusFor := func(score int) string {
		if score >= 85 {
			return "Excellent"
		} else if score >= 70 {
			return "Good"
		} else if score >= 50 {
			return "Needs Attention"
		}
		return "Critical"
	}

	components := []TaxHealthComponent{
		{Name: "Compliance", Score: compScore, Weight: 0.25, Status: statusFor(compScore), Explanation: "Statutory filing readiness and advance tax coverage."},
		{Name: "Income Accuracy", Score: incScore, Weight: 0.25, Status: statusFor(incScore), Explanation: "Alignment between declared income heads and AIS records."},
		{Name: "Deduction Optimization", Score: dedScore, Weight: 0.20, Status: statusFor(dedScore), Explanation: "Utilization of eligible Chapter VI-A investment limits."},
		{Name: "TDS Accuracy", Score: tdsScore, Weight: 0.15, Status: statusFor(tdsScore), Explanation: "Consistency between Form 16 TDS credits and Form 26AS."},
		{Name: "AIS Reconciliation", Score: reconScore, Weight: 0.15, Status: statusFor(reconScore), Explanation: "Cross-verification of bank interest, dividends, and asset sales."},
	}

	return TaxHealthReport{
		OverallScore: overall,
		Grade:        grade,
		Summary:      summary,
		Components:   components,
		Penalties:    penalties,
	}
}

// DetectTaxAnomalies inspects financial and third-party data for statutory red flags.
func DetectTaxAnomalies(input TaxCalculationInput, recon ReconciliationData) []TaxAnomaly {
	var anomalies []TaxAnomaly

	// 1. AIS Interest Mismatch
	if recon.AISInterest > 0 && recon.AISInterest > input.InterestIncome {
		diff := recon.AISInterest - input.InterestIncome
		severity := "warning"
		if diff > 10000 {
			severity = "critical"
		}
		anomalies = append(anomalies, TaxAnomaly{
			ID:          "ANOM-INT-01",
			Severity:    severity,
			Title:       "Bank Interest Income Discrepancy",
			Description: fmt.Sprintf("AIS reports ₹%.0f in savings/term deposit interest, but you have declared ₹%.0f.", recon.AISInterest, input.InterestIncome),
			Amount:      diff,
			Source:      "AIS",
			Action:      "Verify all active savings accounts and fixed deposits to ensure complete disclosure.",
		})
	}

	// 2. TDS Mismatch (Form 16 vs 26AS)
	if recon.Form26ASTDS > 0 && recon.DeclaredTDS > 0 && math.Abs(recon.DeclaredTDS-recon.Form26ASTDS) > 500 {
		diff := math.Abs(recon.DeclaredTDS - recon.Form26ASTDS)
		anomalies = append(anomalies, TaxAnomaly{
			ID:          "ANOM-TDS-02",
			Severity:    "critical",
			Title:       "TDS Credit Discrepancy (26AS vs Form 16)",
			Description: fmt.Sprintf("Reported TDS of ₹%.0f differs from tax credited in Form 26AS (₹%.0f) by ₹%.0f.", recon.DeclaredTDS, recon.Form26ASTDS, diff),
			Amount:      diff,
			Source:      "26AS",
			Action:      "Check if employer filed Q4 quarterly return or if deductor TAN is recorded properly.",
		})
	}

	// 3. Multi-Employer Duplicate Standard Deduction Warning
	if recon.HasMultipleForm16 {
		anomalies = append(anomalies, TaxAnomaly{
			ID:          "ANOM-F16-03",
			Severity:    "warning",
			Title:       "Multiple Form 16s Detected (Job Switch)",
			Description: "Both employers likely applied the standard deduction of ₹75,000/₹50,000 independently, leading to lower aggregate TDS.",
			Amount:      75000,
			Source:      "Form 16",
			Action:      "FiscalAura automatically deduplicates the standard deduction to prevent tax shortfall notice.",
		})
	}

	// 4. Missing Capital Gains
	if recon.AISSecuritySale > 0 && input.STCG == 0 && input.LTCG == 0 {
		anomalies = append(anomalies, TaxAnomaly{
			ID:          "ANOM-CG-04",
			Severity:    "warning",
			Title:       "Unreported Share/Mutual Fund Disposals in AIS",
			Description: fmt.Sprintf("Annual Information Statement lists transactions totaling ₹%.0f under SFT securities sale.", recon.AISSecuritySale),
			Amount:      recon.AISSecuritySale,
			Source:      "AIS",
			Action:      "Upload capital gains P&L from your broker (Zerodha, Groww, Upstox) to report capital gains.",
		})
	}

	// 5. 80C Overclaiming Alert
	if input.Deduction80C > 150000 {
		anomalies = append(anomalies, TaxAnomaly{
			ID:          "ANOM-80C-05",
			Severity:    "info",
			Title:       "Section 80C Cap Exceeded",
			Description: fmt.Sprintf("Declared 80C investments of ₹%.0f exceed the statutory ₹1,50,000 ceiling.", input.Deduction80C),
			Amount:      input.Deduction80C - 150000,
			Source:      "Deductions",
			Action:      "Capped at ₹1.5L automatically in calculations.",
		})
	}

	return anomalies
}
