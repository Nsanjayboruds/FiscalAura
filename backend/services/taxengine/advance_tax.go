package taxengine

import (
	"math"
)

// AdvanceTaxInstallment represents one quarterly milestone for advance tax.
type AdvanceTaxInstallment struct {
	QuarterName        string  `json:"quarter_name"` // "Q1 (June 15)", "Q2 (September 15)", "Q3 (December 15)", "Q4 (March 15)"
	DueDate            string  `json:"due_date"`
	CumulativePercent  float64 `json:"cumulative_percent"` // 15, 45, 75, 100
	MinimumDueAmount   float64 `json:"minimum_due_amount"`
	AmountPaid         float64 `json:"amount_paid"`
	Shortfall          float64 `json:"shortfall"`
	IsPaid             bool    `json:"is_paid"`
	Section234CInterest float64 `json:"section_234c_interest"`
}

// AdvanceTaxReport summarizes advance tax requirements and Section 234 interest liabilities.
type AdvanceTaxReport struct {
	AssessedTaxLiability float64                 `json:"assessed_tax_liability"`
	TotalTDSCredited     float64                 `json:"total_tds_credited"`
	NetTaxSubjectToAdv   float64                 `json:"net_tax_subject_to_adv"`
	IsAdvanceTaxRequired bool                    `json:"is_advance_tax_required"` // mandatory if net tax > 10,000
	Installments         []AdvanceTaxInstallment `json:"installments"`
	Interest234A         float64                 `json:"interest_234a"`
	Interest234B         float64                 `json:"interest_234b"`
	Interest234C         float64                 `json:"interest_234c"`
	TotalInterest        float64                 `json:"total_interest_payable"`
	Explanation234A      string                  `json:"explanation_234a"`
	Explanation234B      string                  `json:"explanation_234b"`
	Explanation234C      string                  `json:"explanation_234c"`
}

// ComputeAdvanceTax calculates statutory advance tax installments and 234A/B/C interest.
func ComputeAdvanceTax(assessedTax, totalTDS, paidQ1, paidQ2, paidQ3, paidQ4 float64, filingDelayMonths int) AdvanceTaxReport {
	netTax := math.Max(0, assessedTax-totalTDS)
	isMandatory := netTax >= 10000

	// Section 234C interest calculations:
	// Q1 (June 15): 15% of net tax. Shortfall incurs 1% per month for 3 months (3%)
	q1Req := math.Round(netTax * 0.15)
	q1Short := math.Max(0, q1Req-paidQ1)
	int234CQ1 := math.Round(q1Short * 0.01 * 3)

	// Q2 (Sept 15): 45% of net tax. Cumulative paid: Q1 + Q2. Shortfall incurs 1% per month for 3 months (3%)
	q2Req := math.Round(netTax * 0.45)
	cumulPaidQ2 := paidQ1 + paidQ2
	q2Short := math.Max(0, q2Req-cumulPaidQ2)
	int234CQ2 := math.Round(q2Short * 0.01 * 3)

	// Q3 (Dec 15): 75% of net tax. Cumulative paid: Q1 + Q2 + Q3. Shortfall incurs 1% per month for 3 months (3%)
	q3Req := math.Round(netTax * 0.75)
	cumulPaidQ3 := paidQ1 + paidQ2 + paidQ3
	q3Short := math.Max(0, q3Req-cumulPaidQ3)
	int234CQ3 := math.Round(q3Short * 0.01 * 3)

	// Q4 (March 15): 100% of net tax. Cumulative paid: Q1+Q2+Q3+Q4. Shortfall incurs 1% for 1 month
	q4Req := netTax
	totalPaid := paidQ1 + paidQ2 + paidQ3 + paidQ4
	q4Short := math.Max(0, q4Req-totalPaid)
	int234CQ4 := math.Round(q4Short * 0.01 * 1)

	total234C := int234CQ1 + int234CQ2 + int234CQ3 + int234CQ4

	// Section 234B interest:
	// If advance tax paid is less than 90% of assessed tax, 1% per month from April 1 to date of assessment/filing.
	int234B := 0.0
	if totalPaid < (netTax * 0.90) {
		shortfallB := netTax - totalPaid
		months := math.Max(1, float64(filingDelayMonths+3)) // e.g. April to July = 4 months
		int234B = math.Round(shortfallB * 0.01 * months)
	}

	// Section 234A interest:
	// 1% per month for delay in furnishing return of income beyond statutory deadline (July 31).
	int234A := 0.0
	if filingDelayMonths > 0 {
		unpaidTax := math.Max(0, netTax-totalPaid)
		int234A = math.Round(unpaidTax * 0.01 * float64(filingDelayMonths))
	}

	installments := []AdvanceTaxInstallment{
		{
			QuarterName:         "Q1 (15% by 15-Jun)",
			DueDate:             "15-Jun",
			CumulativePercent:   15,
			MinimumDueAmount:    q1Req,
			AmountPaid:          paidQ1,
			Shortfall:           q1Short,
			IsPaid:              paidQ1 >= q1Req,
			Section234CInterest: int234CQ1,
		},
		{
			QuarterName:         "Q2 (45% by 15-Sep)",
			DueDate:             "15-Sep",
			CumulativePercent:   45,
			MinimumDueAmount:    q2Req,
			AmountPaid:          cumulPaidQ2,
			Shortfall:           q2Short,
			IsPaid:              cumulPaidQ2 >= q2Req,
			Section234CInterest: int234CQ2,
		},
		{
			QuarterName:         "Q3 (75% by 15-Dec)",
			DueDate:             "15-Dec",
			CumulativePercent:   75,
			MinimumDueAmount:    q3Req,
			AmountPaid:          cumulPaidQ3,
			Shortfall:           q3Short,
			IsPaid:              cumulPaidQ3 >= q3Req,
			Section234CInterest: int234CQ3,
		},
		{
			QuarterName:         "Q4 (100% by 15-Mar)",
			DueDate:             "15-Mar",
			CumulativePercent:   100,
			MinimumDueAmount:    q4Req,
			AmountPaid:          totalPaid,
			Shortfall:           q4Short,
			IsPaid:              totalPaid >= q4Req,
			Section234CInterest: int234CQ4,
		},
	}

	return AdvanceTaxReport{
		AssessedTaxLiability: assessedTax,
		TotalTDSCredited:     totalTDS,
		NetTaxSubjectToAdv:   netTax,
		IsAdvanceTaxRequired: isMandatory,
		Installments:         installments,
		Interest234A:         int234A,
		Interest234B:         int234B,
		Interest234C:         total234C,
		TotalInterest:        int234A + int234B + total234C,
		Explanation234A:      "Section 234A charges 1% simple interest per month for delayed ITR filing beyond the July 31 deadline.",
		Explanation234B:      "Section 234B charges 1% interest per month from April 1 if prepaid advance tax was less than 90% of final assessed tax.",
		Explanation234C:      "Section 234C charges 1% interest per month for deferment or shortfall in quarterly advance tax installments.",
	}
}
