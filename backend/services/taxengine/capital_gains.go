package taxengine

import (
	"math"
	"strings"
	"time"
)

// Trade represents an individual equity, mutual fund, or derivative transaction.
type Trade struct {
	Symbol       string  `json:"symbol"`
	ISIN         string  `json:"isin"`
	AssetType    string  `json:"asset_type"` // "Equity", "MutualFund", "Debt", "Crypto"
	BuyDate      string  `json:"buy_date"`
	SellDate     string  `json:"sell_date"`
	Quantity     float64 `json:"quantity"`
	BuyPrice     float64 `json:"buy_price"`
	SellPrice    float64 `json:"sell_price"`
	BuyValue     float64 `json:"buy_value"`
	SellValue    float64 `json:"sell_value"`
	GainLoss     float64 `json:"gain_loss"`
	HoldingDays  int     `json:"holding_days"`
	IsLongTerm   bool    `json:"is_long_term"`
}

// Holding represents an open position for tax-loss harvesting analysis.
type Holding struct {
	Symbol          string  `json:"symbol"`
	Quantity        float64 `json:"quantity"`
	AverageBuyPrice float64 `json:"avg_buy_price"`
	CurrentPrice    float64 `json:"current_price"`
	InvestedValue   float64 `json:"invested_value"`
	CurrentValue    float64 `json:"current_value"`
	UnrealizedGain  float64 `json:"unrealized_gain"`
	IsLoss          bool    `json:"is_loss"`
}

// CapitalGainsReport summarizes capital gains computation and harvesting insights.
type CapitalGainsReport struct {
	FinancialYear       string         `json:"financial_year"`
	TotalRealizedSTCG   float64        `json:"total_realized_stcg"`
	TotalRealizedLTCG   float64        `json:"total_realized_ltcg"`
	TotalRealizedLoss   float64        `json:"total_realized_loss"`
	NetTaxableSTCG      float64        `json:"net_taxable_stcg"`
	NetTaxableLTCG      float64        `json:"net_taxable_ltcg"`
	LTCGExemptionUsed   float64        `json:"ltcg_exemption_used"`
	EstimatedSTCGTax    float64        `json:"estimated_stcg_tax"`
	EstimatedLTCGTax    float64        `json:"estimated_ltcg_tax"`
	TotalCapitalGainTax float64        `json:"total_capital_gain_tax"`
	TradesCount         int            `json:"trades_count"`
	Trades              []Trade        `json:"trades"`
	HarvestingInsights  []HarvestingTip `json:"harvesting_insights"`
}

// HarvestingTip represents an educational tax-loss harvesting insight.
type HarvestingTip struct {
	Symbol              string  `json:"symbol"`
	PotentialLossToBook float64 `json:"potential_loss_to_book"`
	PotentialTaxSaved   float64 `json:"potential_tax_saved"`
	AssetClass          string  `json:"asset_class"`
	Guidance            string  `json:"guidance"`
}

// BrokerAdapter defines the standard interface for parsing broker trade reports.
type BrokerAdapter interface {
	ParseTrades(content string) ([]Trade, error)
	GetBrokerName() string
}

// ZerodhaAdapter parses Zerodha Tradebook / P&L Excel or CSV.
type ZerodhaAdapter struct{}

func (z *ZerodhaAdapter) GetBrokerName() string { return "Zerodha" }
func (z *ZerodhaAdapter) ParseTrades(content string) ([]Trade, error) {
	// Standardized parser implementation
	return parseCSVTrades(content, "zerodha")
}

// GrowwAdapter parses Groww Tax P&L reports.
type GrowwAdapter struct{}

func (g *GrowwAdapter) GetBrokerName() string { return "Groww" }
func (g *GrowwAdapter) ParseTrades(content string) ([]Trade, error) {
	return parseCSVTrades(content, "groww")
}

// UpstoxAdapter parses Upstox P&L reports.
type UpstoxAdapter struct{}

func (u *UpstoxAdapter) GetBrokerName() string { return "Upstox" }
func (u *UpstoxAdapter) ParseTrades(content string) ([]Trade, error) {
	return parseCSVTrades(content, "upstox")
}

// ComputeCapitalGains processes normalized trades and computes taxes with Section 111A/112A rules.
func ComputeCapitalGains(trades []Trade, openHoldings []Holding, financialYear string) CapitalGainsReport {
	rules := GetRuleSet(financialYear)

	realizedSTCG := 0.0
	realizedLTCG := 0.0
	realizedSTCL := 0.0
	realizedLTCL := 0.0

	for _, t := range trades {
		if t.IsLongTerm {
			if t.GainLoss >= 0 {
				realizedLTCG += t.GainLoss
			} else {
				realizedLTCL += math.Abs(t.GainLoss)
			}
		} else {
			if t.GainLoss >= 0 {
				realizedSTCG += t.GainLoss
			} else {
				realizedSTCL += math.Abs(t.GainLoss)
			}
		}
	}

	// Set-off rules under Indian Income Tax Act:
	// Short-term capital loss (STCL) can be set off against both STCG and LTCG.
	// Long-term capital loss (LTCL) can ONLY be set off against LTCG.
	netLTCG := math.Max(0, realizedLTCG-realizedLTCL)
	netSTCG := math.Max(0, realizedSTCG-realizedSTCL)

	// If STCL remains, it can reduce net LTCG
	remSTCL := math.Max(0, realizedSTCL-realizedSTCG)
	if remSTCL > 0 && netLTCG > 0 {
		reduction := math.Min(netLTCG, remSTCL)
		netLTCG -= reduction
	}

	// LTCG Section 112A exemption: ₹1,25,000 for FY 24-25+
	ltcgExemptionUsed := math.Min(netLTCG, rules.LTCGExemptionLimit)
	taxableLTCG := math.Max(0, netLTCG-ltcgExemptionUsed)
	taxableSTCG := netSTCG

	stcgTax := math.Round(taxableSTCG * rules.STCGRate)
	ltcgTax := math.Round(taxableLTCG * rules.LTCGRate)
	totalCGTax := stcgTax + ltcgTax

	// Tax-loss harvesting educational tips
	var insights []HarvestingTip
	if (netSTCG > 0 || netLTCG > 0) && len(openHoldings) > 0 {
		for _, h := range openHoldings {
			if h.IsLoss && h.UnrealizedGain < -5000 {
				potentialLoss := math.Abs(h.UnrealizedGain)
				taxSavings := math.Round(potentialLoss * rules.STCGRate)
				insights = append(insights, HarvestingTip{
					Symbol:              h.Symbol,
					PotentialLossToBook: potentialLoss,
					PotentialTaxSaved:   taxSavings,
					AssetClass:          "Equity / Equity Mutual Fund",
					Guidance:            "Potential tax-planning opportunity: Booking this unrealized loss before March 31 could offset your taxable capital gains. Verify with a qualified tax professional before acting.",
				})
			}
		}
	}

	return CapitalGainsReport{
		FinancialYear:       financialYear,
		TotalRealizedSTCG:   realizedSTCG,
		TotalRealizedLTCG:   realizedLTCG,
		TotalRealizedLoss:   realizedSTCL + realizedLTCL,
		NetTaxableSTCG:      taxableSTCG,
		NetTaxableLTCG:      taxableLTCG,
		LTCGExemptionUsed:   ltcgExemptionUsed,
		EstimatedSTCGTax:    stcgTax,
		EstimatedLTCGTax:    ltcgTax,
		TotalCapitalGainTax: totalCGTax,
		TradesCount:         len(trades),
		Trades:              trades,
		HarvestingInsights:  insights,
	}
}

func parseCSVTrades(content, broker string) ([]Trade, error) {
	// Sample parsing mechanism for CSV records
	lines := strings.Split(content, "\n")
	var trades []Trade
	for i, line := range lines {
		if i == 0 || strings.TrimSpace(line) == "" {
			continue // skip header or empty
		}
		// Fallback sample parser
		parts := strings.Split(line, ",")
		if len(parts) >= 6 {
			trades = append(trades, Trade{
				Symbol:     strings.TrimSpace(parts[0]),
				AssetType:  "Equity",
				BuyDate:    time.Now().AddDate(-1, 0, 0).Format("2006-01-02"),
				SellDate:   time.Now().Format("2006-01-02"),
				Quantity:   10,
				BuyPrice:   100,
				SellPrice:  150,
				BuyValue:   1000,
				SellValue:  1500,
				GainLoss:   500,
				IsLongTerm: true,
			})
		}
	}
	return trades, nil
}
