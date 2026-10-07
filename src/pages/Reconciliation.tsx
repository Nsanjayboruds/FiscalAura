import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import DashboardNav from "@/components/DashboardNav";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { toast } from "@/hooks/use-toast";
import { runReconciliationAudit, FullReconciliationReport } from "@/lib/api";
import { DEMO_TAXPAYER } from "@/lib/demoData";
import { FileCheck, AlertTriangle, CheckCircle2, XCircle, ArrowUpRight, ShieldCheck, RefreshCw, Upload } from "lucide-react";

const Reconciliation = () => {
  const isGlobalDemo = localStorage.getItem("fiscalaura_demo_mode") === "true";
  const [report, setReport] = useState<FullReconciliationReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [isDemo, setIsDemo] = useState(isGlobalDemo);

  useEffect(() => {
    if (isGlobalDemo) {
      loadAudit(true);
    } else {
      loadAudit(false);
    }
  }, [isGlobalDemo]);

  const loadAudit = async (useDemoData: boolean = false) => {
    setLoading(true);
    try {
      if (useDemoData) {
        const res = await runReconciliationAudit({
          input: DEMO_TAXPAYER.financialData,
          recon: DEMO_TAXPAYER.aisReconciliation,
        });
        setReport(res);
        setIsDemo(true);
        toast({ title: "Demo AIS Loaded", description: "Audit loaded using simulated multi-source records." });
      } else {
        const res = await runReconciliationAudit();
        setReport(res);
        setIsDemo(false);
      }
    } catch {
      if (useDemoData) {
        setReport({
          overall_status: "Attention Needed",
          total_matched_count: 2,
          total_discrepancies: 1,
          net_income_variance: 12900,
          net_tds_variance: 0,
          items: [
            {
              category: "Gross Salary",
              declared_value: 1350000,
              form16_value: 1350000,
              ais_value: 1350000,
              form26as_value: 1350000,
              variance: 0,
              status: "MATCHED",
              status_color: "green",
              suggested_action: "Salary aligns with Form 16 Part B.",
            },
            {
              category: "Bank & Deposit Interest",
              declared_value: 8500,
              form16_value: 0,
              ais_value: 21400,
              form26as_value: 21400,
              variance: 12900,
              status: "DIFFERENCE",
              status_color: "yellow",
              suggested_action: "Potential mismatch detected. AIS indicates ₹21,400 interest across 3 bank accounts. Update your return to avoid CPC notice.",
            },
            {
              category: "Total TDS Credits",
              declared_value: 85000,
              form16_value: 85000,
              ais_value: 85000,
              form26as_value: 85000,
              variance: 0,
              status: "MATCHED",
              status_color: "green",
              suggested_action: "TDS claimed matches Form 26AS / AIS tax credit ledger.",
            },
          ],
          compliance_advisory: "Discrepancies found between your entries and official AIS data. Please review highlighted items before filing to avoid CPC rectification notices.",
        });
        setIsDemo(true);
      } else {
        setReport(null);
        setIsDemo(false);
      }
    }
    setLoading(false);
  };

  const fmt = (n: number) => `₹${(n || 0).toLocaleString("en-IN")}`;

  const getStatusBadge = (status: string, color: string) => {
    if (color === "green") {
      return (
        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs font-semibold">
          <CheckCircle2 className="h-3 w-3 mr-1 text-emerald-600" /> Matched
        </Badge>
      );
    } else if (color === "yellow") {
      return (
        <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-200 text-xs font-semibold">
          <AlertTriangle className="h-3 w-3 mr-1 text-amber-600" /> Difference
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="bg-rose-50 text-rose-800 border-rose-200 text-xs font-semibold">
        <XCircle className="h-3 w-3 mr-1 text-rose-600" /> Unreported
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50/50">
      <DashboardNav />
      <main className="container max-w-7xl py-6 sm:py-8 space-y-6 px-4 sm:px-6 lg:px-8 pb-24 lg:pb-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-5">
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <Badge variant="outline" className="text-primary border-primary/30 bg-primary/5 font-semibold text-xs">
                <FileCheck className="h-3 w-3 mr-1" /> Multi-Source Reconciliation
              </Badge>
              {isDemo && (
                <Badge className="bg-blue-100 text-blue-800 border-blue-200 text-[10px] font-semibold">
                  Demo Dataset Active
                </Badge>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">AIS / TIS / Form 26AS Reconciliation</h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-3xl">
              Cross-verify your self-declared income against official Income Tax Department feeds (Annual Information Statement, Tax Information Summary, and Form 26AS).
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadAudit(!isDemo)}
              disabled={loading}
              className="text-xs font-medium"
            >
              <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`} />
              {isDemo ? "Switch to Live Records" : "Load Demo Scenario"}
            </Button>
          </div>
        </div>

        {!report && (
          <Card className="shadow-sm border-dashed border-slate-300 bg-white">
            <CardContent className="p-12 text-center space-y-4">
              <div className="h-12 w-12 rounded-full bg-blue-50 text-primary flex items-center justify-center mx-auto">
                <FileCheck className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">No Reconciliation Audit Run Yet</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                  Upload your AIS (Annual Information Statement) PDF/JSON and Form 26AS or enter financial data to perform automated cross-verification.
                </p>
              </div>
              <div className="flex justify-center gap-3 pt-2">
                <Link to="/documents">
                  <Button size="sm" className="bg-primary text-white text-xs font-medium">
                    Upload Tax Documents →
                  </Button>
                </Link>
                <Button variant="outline" size="sm" onClick={() => loadAudit(true)} className="text-xs font-semibold text-primary border-primary/20">
                  Preview Sample Reconciliation
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {report && (
          <>
            {/* Status Alert Banner */}
            <Alert className={report.total_discrepancies > 0 ? "border-amber-200 bg-amber-50/70" : "border-emerald-200 bg-emerald-50/70"}>
              <ShieldCheck className={`h-4 w-4 ${report.total_discrepancies > 0 ? "text-amber-700" : "text-emerald-700"}`} />
              <AlertTitle className="text-sm font-semibold">
                Status: {report.overall_status} — {report.total_matched_count} Matched, {report.total_discrepancies} Discrepanc{report.total_discrepancies === 1 ? "y" : "ies"}
              </AlertTitle>
              <AlertDescription className="text-xs text-slate-600 mt-0.5">
                {report.compliance_advisory}
              </AlertDescription>
            </Alert>

            {/* Reconciliation Comparison Table */}
            <Card className="shadow-sm border-slate-200 bg-white">
              <CardHeader className="pb-3 border-b">
                <CardTitle className="text-base font-semibold text-slate-900">Cross-Verification Matrix</CardTitle>
                <CardDescription className="text-xs">
                  Side-by-side comparison between your tax declaration, Form 16 Part B, AIS ledger, and Form 26AS tax credits.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0 overflow-x-auto">
                <Table className="min-w-[700px]">
                  <TableHeader>
                    <TableRow className="bg-slate-50/80">
                      <TableHead className="font-semibold text-xs text-slate-700">Financial Head</TableHead>
                      <TableHead className="font-semibold text-xs text-slate-700 text-right">Self Declared</TableHead>
                      <TableHead className="font-semibold text-xs text-slate-700 text-right">Form 16</TableHead>
                      <TableHead className="font-semibold text-xs text-slate-700 text-right">AIS / TIS Feed</TableHead>
                      <TableHead className="font-semibold text-xs text-slate-700 text-right">Form 26AS</TableHead>
                      <TableHead className="font-semibold text-xs text-slate-700 text-center">Audit Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {report.items.map((row, i) => (
                      <TableRow key={i} className="hover:bg-slate-50/60">
                        <TableCell className="font-medium text-xs text-slate-900">
                          <div>{row.category}</div>
                          <span className="text-[11px] text-slate-500 font-normal">{row.suggested_action}</span>
                        </TableCell>
                        <TableCell className="text-xs text-right font-semibold text-slate-900">
                          {fmt(row.declared_value)}
                        </TableCell>
                        <TableCell className="text-xs text-right text-slate-600">
                          {row.form16_value > 0 ? fmt(row.form16_value) : "—"}
                        </TableCell>
                        <TableCell className="text-xs text-right font-medium text-slate-800">
                          {row.ais_value > 0 ? fmt(row.ais_value) : "—"}
                        </TableCell>
                        <TableCell className="text-xs text-right text-slate-600">
                          {row.form26as_value > 0 ? fmt(row.form26as_value) : "—"}
                        </TableCell>
                        <TableCell className="text-center">
                          {getStatusBadge(row.status, row.status_color)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Explanatory Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="shadow-sm border-slate-200 bg-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    How Mismatches Are Resolved
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-xs text-slate-600 leading-relaxed space-y-2">
                  <p>
                    <strong>1. Bank Interest Discrepancies:</strong> If AIS shows higher interest than declared, the Centralized Processing Center (CPC) will automatically adjust your return and demand differential tax under Section 143(1).
                  </p>
                  <p>
                    <strong>2. TDS Timing Differences:</strong> If an employer deposited TDS in July for Q4, it may take 7-10 days to reflect in Form 26AS. Always ensure deductor TAN and PAN match.
                  </p>
                </CardContent>
              </Card>

              <Card className="shadow-sm border-slate-200 bg-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                    <Upload className="h-4 w-4 text-primary" />
                    Upload Official AIS / 26AS JSON
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-xs text-slate-600 leading-relaxed space-y-3">
                  <p>
                    You can download your official JSON or PDF files from the Income Tax e-Filing portal (`incometax.gov.in` → Services → AIS) and upload them here to auto-populate the reconciliation ledger.
                  </p>
                  <Button variant="outline" size="sm" className="text-xs font-medium w-full">
                    Upload AIS / 26AS File <ArrowUpRight className="h-3.5 w-3.5 ml-1" />
                  </Button>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default Reconciliation;
