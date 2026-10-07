import { useState, useRef, useCallback } from "react";
import DashboardNav from "@/components/DashboardNav";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { toast } from "@/hooks/use-toast";
import { analyzeCapitalGains, CapitalGainsReport } from "@/lib/api";
import { parseBrokerFile, summarizeTrades, BrokerKey, CapitalGainsTrade } from "@/lib/brokerAdapters";
import { DEMO_TAXPAYER } from "@/lib/demoData";
import {
  TrendingUp, Upload, ShieldCheck, Sparkles, AlertCircle,
  RefreshCw, FileText, CheckCircle2, X, ChevronDown, ChevronUp,
  TrendingDown, BarChart3
} from "lucide-react";

type BrokerOption = { id: BrokerKey; label: string; description: string };

const BROKERS: BrokerOption[] = [
  { id: "zerodha", label: "Zerodha Console", description: "Tradewise P&L CSV from Kite Console" },
  { id: "groww", label: "Groww Tax P&L", description: "Equity & MF Tax P&L from Groww" },
  { id: "upstox", label: "Upstox Trade Report", description: "Trade History CSV from Upstox" },
  { id: "generic", label: "Generic CSV", description: "Any well-formed P&L CSV (auto-detect)" },
];

const fmt = (n: number) => `\u20B9${Math.abs(n || 0).toLocaleString("en-IN")}`;
const fmtSigned = (n: number) => `${n < 0 ? "-" : "+"}${fmt(n)}`;

const CapitalGains = () => {
  const isDemo = localStorage.getItem("fiscalaura_demo_mode") === "true";
  const [report, setReport] = useState<CapitalGainsReport | null>(null);
  const [localTrades, setLocalTrades] = useState<CapitalGainsTrade[]>([]);
  const [parseWarnings, setParseWarnings] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeBroker, setActiveBroker] = useState<BrokerKey>("zerodha");
  const [dragOver, setDragOver] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [showAllTrades, setShowAllTrades] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Local-only computation (no backend required for CSV parsing)
  const computeLocalReport = (trades: CapitalGainsTrade[]) => {
    const s = summarizeTrades(trades);
    const fallback: CapitalGainsReport = {
      financial_year: "2025-26",
      total_realized_stcg: s.totalSTCG,
      total_realized_ltcg: s.totalLTCG,
      total_realized_loss: s.totalLoss,
      net_taxable_stcg: s.netTaxableSTCG,
      net_taxable_ltcg: s.netTaxableLTCG,
      ltcg_exemption_used: s.ltcgExemption,
      estimated_stcg_tax: s.stcgTax,
      estimated_ltcg_tax: s.ltcgTax,
      total_capital_gain_tax: s.totalTax,
      trades_count: s.tradesCount,
      trades: trades as any,
      harvesting_insights: [],
    };
    setReport(fallback);
  };

  const processFile = async (file: File) => {
    if (!file.name.match(/\.(csv|xlsx|xls)$/i)) {
      toast({ title: "Invalid file", description: "Please upload a CSV or Excel file.", variant: "destructive" });
      return;
    }
    setLoading(true);
    setUploadedFile(file);
    try {
      const result = await parseBrokerFile(file, activeBroker);
      setLocalTrades(result.trades);
      setParseWarnings(result.warnings);
      if (result.trades.length === 0) {
        toast({ title: "No trades found", description: result.warnings[0] || "The file contained no parseable trade rows.", variant: "destructive" });
        setLoading(false);
        return;
      }
      // Try backend; fall back to local computation
      try {
        const apiReport = await analyzeCapitalGains(result.trades as any, []);
        setReport(apiReport);
      } catch {
        computeLocalReport(result.trades);
      }
      toast({ title: `${result.parsed_count} trades parsed`, description: result.skipped_count > 0 ? `${result.skipped_count} rows skipped. Check warnings below.` : "All rows successfully imported." });
    } catch (err: any) {
      toast({ title: "Parse error", description: err.message || "Could not parse the file.", variant: "destructive" });
    }
    setLoading(false);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = "";
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  }, [activeBroker]);

  const loadDemoData = async () => {
    setLoading(true);
    try {
      const res = await analyzeCapitalGains(DEMO_TAXPAYER.capitalGains.trades, DEMO_TAXPAYER.capitalGains.holdings);
      setReport(res);
      setLocalTrades(DEMO_TAXPAYER.capitalGains.trades as any);
    } catch {
      setLocalTrades(DEMO_TAXPAYER.capitalGains.trades as any);
      computeLocalReport(DEMO_TAXPAYER.capitalGains.trades as any);
    }
    setLoading(false);
  };

  const clearData = () => {
    setReport(null);
    setLocalTrades([]);
    setParseWarnings([]);
    setUploadedFile(null);
  };

  const visibleTrades = showAllTrades ? localTrades : localTrades.slice(0, 10);

  return (
    <div className="min-h-screen bg-slate-50/50">
      <DashboardNav />
      <main className="container max-w-7xl py-8 space-y-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-5">
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <Badge variant="outline" className="text-primary border-primary/30 bg-primary/5 font-semibold text-xs">
                <TrendingUp className="h-3 w-3 mr-1" /> Capital Gains & Securities Tax
              </Badge>
              <Badge className="bg-emerald-100 text-emerald-800 text-[10px] font-semibold">
                Budget 2024 Rates (Sec 111A / 112A)
              </Badge>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Capital Gains Intelligence</h1>
            <p className="text-sm text-slate-500 mt-1 max-w-3xl">
              Import P&L reports from Zerodha, Groww, Upstox, or upload any trade CSV.
              Applies Section 111A STCG (20%) and Section 112A LTCG (12.5% above ₹1.25L exemption) with loss set-off.
            </p>
          </div>
          {report && (
            <Button variant="outline" size="sm" onClick={clearData} className="text-xs font-medium text-slate-600">
              <X className="h-3.5 w-3.5 mr-1.5" /> Clear & Re-upload
            </Button>
          )}
        </div>

        {/* Broker Selector & Upload */}
        {!report && (
          <Card className="shadow-sm border-slate-200 bg-white">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-sm font-semibold text-slate-900">Step 1 — Select Your Broker</CardTitle>
              <CardDescription className="text-xs">Parser auto-adapts to the selected broker's column format</CardDescription>
            </CardHeader>
            <CardContent className="pt-4 space-y-5">
              {/* Broker Pills */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {BROKERS.map((b) => (
                  <button
                    key={b.id}
                    onClick={() => setActiveBroker(b.id)}
                    className={`text-left p-3 rounded-lg border text-xs transition-all ${
                      activeBroker === b.id
                        ? "border-primary bg-primary/5 text-primary font-semibold shadow-sm"
                        : "border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    <div className="font-semibold mb-0.5">{b.label}</div>
                    <div className="text-[10px] text-slate-500 leading-tight">{b.description}</div>
                  </button>
                ))}
              </div>

              {/* Drop Zone */}
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all ${
                  dragOver
                    ? "border-primary bg-primary/5 scale-[1.01]"
                    : "border-slate-300 bg-slate-50/50 hover:border-primary/50 hover:bg-slate-50"
                }`}
              >
                <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={handleFileInput} />
                {loading ? (
                  <div className="flex items-center justify-center gap-2 text-primary">
                    <RefreshCw className="h-6 w-6 animate-spin" />
                    <span className="text-sm font-medium">Parsing your trades...</span>
                  </div>
                ) : (
                  <>
                    <Upload className="h-10 w-10 mx-auto text-slate-400 mb-3" />
                    <p className="text-sm font-semibold text-slate-800">Drop {activeBroker.charAt(0).toUpperCase() + activeBroker.slice(1)} CSV here, or click to browse</p>
                    <p className="text-[11px] text-slate-500 mt-1">Supports .CSV and .XLSX — dates, ISINs, and grandfathering prices are normalized automatically</p>
                  </>
                )}
              </div>

              <div className="pt-1 flex flex-col sm:flex-row items-center justify-center gap-2 text-xs text-slate-500 border-t border-slate-100 pt-3">
                <span>Don't have your statement? Preview with sample data:</span>
                <Button variant="outline" size="sm" onClick={loadDemoData} disabled={loading} className="text-xs font-semibold h-8 text-primary border-primary/20">
                  <BarChart3 className="h-3.5 w-3.5 mr-1.5" /> Load Sample Portfolio
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Parse Warnings */}
        {parseWarnings.length > 0 && (
          <Alert className="border-amber-200 bg-amber-50/50">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <AlertTitle className="text-amber-800 text-sm font-semibold">{parseWarnings.length} row(s) skipped during import</AlertTitle>
            <AlertDescription className="text-xs text-amber-700 mt-1 space-y-0.5">
              {parseWarnings.slice(0, 5).map((w, i) => <div key={i}>{w}</div>)}
              {parseWarnings.length > 5 && <div className="font-medium">...and {parseWarnings.length - 5} more</div>}
            </AlertDescription>
          </Alert>
        )}

        {/* Uploaded file banner */}
        {uploadedFile && (
          <div className="flex items-center gap-2 text-xs text-slate-600 bg-white border border-slate-200 rounded-lg px-4 py-2.5 shadow-sm">
            <FileText className="h-4 w-4 text-primary" />
            <span className="font-medium">{uploadedFile.name}</span>
            <span className="text-slate-400">({(uploadedFile.size / 1024).toFixed(1)} KB)</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-600 ml-auto" />
            <span className="text-emerald-700 font-semibold">{localTrades.length} trades imported</span>
          </div>
        )}

        {/* Results */}
        {report && (
          <div className="space-y-6">
            {/* KPI Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <Card className="shadow-sm border-slate-200 bg-white">
                <CardContent className="p-4">
                  <div className="flex items-center gap-1.5 mb-1">
                    <TrendingUp className="h-3.5 w-3.5 text-amber-600" />
                    <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">STCG (Sec 111A)</span>
                  </div>
                  <p className="text-xl font-bold text-slate-900">{fmt(report.total_realized_stcg)}</p>
                  <span className="text-[10px] text-amber-700 font-medium">Tax @ 20%: {fmt(report.estimated_stcg_tax)}</span>
                </CardContent>
              </Card>

              <Card className="shadow-sm border-slate-200 bg-white">
                <CardContent className="p-4">
                  <div className="flex items-center gap-1.5 mb-1">
                    <TrendingUp className="h-3.5 w-3.5 text-blue-600" />
                    <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">LTCG (Sec 112A)</span>
                  </div>
                  <p className="text-xl font-bold text-slate-900">{fmt(report.total_realized_ltcg)}</p>
                  <span className="text-[10px] text-emerald-600 font-medium">₹{report.ltcg_exemption_used.toLocaleString("en-IN")} exempt</span>
                </CardContent>
              </Card>

              <Card className="shadow-sm border-slate-200 bg-white">
                <CardContent className="p-4">
                  <div className="flex items-center gap-1.5 mb-1">
                    <TrendingDown className="h-3.5 w-3.5 text-rose-500" />
                    <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Loss Set-Off</span>
                  </div>
                  <p className="text-xl font-bold text-rose-700">{fmt(report.total_realized_loss)}</p>
                  <span className="text-[10px] text-slate-500">Offset against taxable gains</span>
                </CardContent>
              </Card>

              <Card className="shadow-sm border-primary/20 bg-primary/5">
                <CardContent className="p-4">
                  <div className="flex items-center gap-1.5 mb-1">
                    <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                    <span className="text-[11px] font-semibold text-primary/80 uppercase tracking-wide">Total CG Tax</span>
                  </div>
                  <p className="text-xl font-bold text-primary">{fmt(report.total_capital_gain_tax)}</p>
                  <span className="text-[10px] text-slate-500">On {report.trades_count} transactions</span>
                </CardContent>
              </Card>
            </div>

            {/* Tax breakdown bar */}
            {(report.estimated_stcg_tax + report.estimated_ltcg_tax) > 0 && (
              <Card className="shadow-sm border-slate-200 bg-white">
                <CardHeader className="pb-2 border-b">
                  <CardTitle className="text-sm font-semibold text-slate-900">Tax Liability Breakdown</CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-3">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-600 font-medium">STCG Tax (20% on ₹{report.net_taxable_stcg.toLocaleString("en-IN")})</span>
                      <span className="font-semibold text-amber-700">{fmt(report.estimated_stcg_tax)}</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-500 rounded-full"
                        style={{ width: `${report.total_capital_gain_tax > 0 ? (report.estimated_stcg_tax / report.total_capital_gain_tax) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-600 font-medium">LTCG Tax (12.5% on ₹{report.net_taxable_ltcg.toLocaleString("en-IN")})</span>
                      <span className="font-semibold text-blue-700">{fmt(report.estimated_ltcg_tax)}</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full"
                        style={{ width: `${report.total_capital_gain_tax > 0 ? (report.estimated_ltcg_tax / report.total_capital_gain_tax) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Tax-Loss Harvesting Insights */}
            {report.harvesting_insights && report.harvesting_insights.length > 0 && (
              <Card className="shadow-sm border-emerald-200 bg-emerald-50/40">
                <CardHeader className="pb-3 border-b border-emerald-100">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-emerald-600" />
                    <CardTitle className="text-sm font-semibold text-emerald-950">Tax-Loss Harvesting Opportunities</CardTitle>
                  </div>
                  <CardDescription className="text-xs text-emerald-800">
                    Potential planning opportunities identified across your portfolio before March 31.
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-4 space-y-3">
                  {report.harvesting_insights.map((tip, idx) => (
                    <div key={idx} className="p-3 rounded-lg bg-white border border-emerald-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                      <div>
                        <div className="flex items-center gap-2">
                          <strong className="text-slate-900">{tip.symbol}</strong>
                          <Badge variant="outline" className="text-[10px] py-0 px-1 text-slate-600">{tip.asset_class}</Badge>
                        </div>
                        <p className="text-slate-600 mt-1">{tip.guidance}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-[11px] text-slate-500 block">Potential Tax Saved</span>
                        <strong className="text-emerald-700 text-sm">{fmt(tip.potential_tax_saved)}</strong>
                      </div>
                    </div>
                  ))}
                  <div className="text-[11px] text-slate-500 pt-2 flex items-center gap-1.5">
                    <AlertCircle className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <span>FiscalAura does not execute trades or provide financial advice. Consult a certified financial planner.</span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Trades Ledger Table */}
            {localTrades.length > 0 && (
              <Card className="shadow-sm border-slate-200 bg-white">
                <CardHeader className="pb-3 border-b">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base font-semibold text-slate-900">Realized Trades Ledger</CardTitle>
                      <CardDescription className="text-xs">{localTrades.length} transactions — parsed from {localTrades[0]?.broker || "your"} report</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant="outline" className="text-[10px] text-amber-800 bg-amber-50 border-amber-200">
                        STCG: {localTrades.filter((t) => !t.is_long_term && t.gain_loss > 0).length} trades
                      </Badge>
                      <Badge variant="outline" className="text-[10px] text-blue-800 bg-blue-50 border-blue-200">
                        LTCG: {localTrades.filter((t) => t.is_long_term && t.gain_loss > 0).length} trades
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader className="bg-slate-50">
                      <TableRow>
                        <TableHead className="text-xs font-semibold pl-4">Security</TableHead>
                        <TableHead className="text-xs font-semibold text-right">Qty</TableHead>
                        <TableHead className="text-xs font-semibold text-right">Buy Price</TableHead>
                        <TableHead className="text-xs font-semibold text-right">Sell Price</TableHead>
                        <TableHead className="text-xs font-semibold text-right">Gain / (Loss)</TableHead>
                        <TableHead className="text-xs font-semibold text-center">Holding Class</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {visibleTrades.map((t, idx) => (
                        <TableRow key={idx} className="hover:bg-slate-50/50">
                          <TableCell className="text-xs font-medium text-slate-900 pl-4">
                            <div>{t.symbol}</div>
                            {t.isin && <div className="text-[10px] text-slate-400">{t.isin}</div>}
                          </TableCell>
                          <TableCell className="text-xs text-right text-slate-700">{t.quantity.toLocaleString("en-IN")}</TableCell>
                          <TableCell className="text-xs text-right text-slate-600">{fmt(t.buy_price)}</TableCell>
                          <TableCell className="text-xs text-right text-slate-600">{fmt(t.sell_price)}</TableCell>
                          <TableCell className={`text-xs text-right font-semibold ${t.gain_loss >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
                            {fmtSigned(t.gain_loss)}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline" className={`text-[10px] ${t.is_long_term ? "text-blue-700 bg-blue-50 border-blue-200" : "text-amber-800 bg-amber-50 border-amber-200"}`}>
                              {t.is_long_term ? "LTCG (112A)" : "STCG (111A)"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {localTrades.length > 10 && (
                    <div className="flex justify-center py-3 border-t border-slate-100">
                      <Button variant="ghost" size="sm" className="text-xs text-slate-600" onClick={() => setShowAllTrades((p) => !p)}>
                        {showAllTrades ? (
                          <><ChevronUp className="h-3.5 w-3.5 mr-1" /> Show less</>
                        ) : (
                          <><ChevronDown className="h-3.5 w-3.5 mr-1" /> Show all {localTrades.length} trades</>
                        )}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Disclaimer */}
            <Alert className="border-slate-200 bg-slate-50">
              <ShieldCheck className="h-4 w-4 text-slate-500" />
              <AlertTitle className="text-sm font-semibold text-slate-700">Important Disclaimer</AlertTitle>
              <AlertDescription className="text-xs text-slate-500 mt-1">
                Tax calculations are indicative only. Grandfathering price (31-Jan-2018 FMV), bonus shares, splits, and scrip-level adjustments must be verified. Always consult a Chartered Accountant before filing your ITR.
              </AlertDescription>
            </Alert>
          </div>
        )}
      </main>
    </div>
  );
};

export default CapitalGains;
