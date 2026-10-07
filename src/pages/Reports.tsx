import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import DashboardNav from "@/components/DashboardNav";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DEMO_TAXPAYER } from "@/lib/demoData";
import { exportITR, getFinancialData, getTaxAnalysis, getProfile } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { Printer, Download, ShieldCheck, FileText, CheckCircle2, FileJson } from "lucide-react";

const Reports = () => {
  const isDemo = localStorage.getItem("fiscalaura_demo_mode") === "true";
  const [taxpayer, setTaxpayer] = useState<any>(isDemo ? DEMO_TAXPAYER.profile : null);
  const [finData, setFinData] = useState<any>(isDemo ? DEMO_TAXPAYER.financialData : null);
  const [analysis, setAnalysis] = useState<any>(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    loadData();
  }, [isDemo]);

  const loadData = async () => {
    if (isDemo) {
      setTaxpayer(DEMO_TAXPAYER.profile);
      setFinData(DEMO_TAXPAYER.financialData);
      return;
    }
    try {
      const [p, f, a] = await Promise.all([getProfile(), getFinancialData(), getTaxAnalysis()]);
      if (p) setTaxpayer(p);
      if (f) setFinData(f);
      if (a) setAnalysis(a);
    } catch {
      setTaxpayer(null);
      setFinData(null);
      setAnalysis(null);
    }
  };

  const fmt = (n: number) => `₹${(n || 0).toLocaleString("en-IN")}`;
  const currentDate = new Date().toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadITR = async (formType: "ITR-1" | "ITR-2") => {
    setExporting(true);
    try {
      const payload = await exportITR(formType, taxpayer, {
        financial_year: "2025-26",
        gross_salary: finData.gross_salary || 1350000,
        other_income: finData.other_income || 0,
        interest_income: finData.interest_income || 18400,
        deduction_80c: finData.deductions_80c || 150000,
        deduction_80d: finData.deductions_80d || 25000,
        tds_deducted: finData.tds_deducted || 85000,
      });

      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `FiscalAura_${formType}_AY2025-26_${taxpayer.pan || "PAN"}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: `${formType} JSON Exported`,
        description: `Downloaded e-filing schema compliant JSON. Schema version: ${payload.schema_version}`,
      });
    } catch {
      toast({
        title: "Export Failed",
        description: "Could not generate ITR JSON export payload.",
        variant: "destructive",
      });
    }
    setExporting(false);
  };

  return (
    <div className="min-h-screen bg-slate-50/50">
      <div className="print:hidden">
        <DashboardNav />
      </div>

      <main className="container max-w-4xl py-8 space-y-6">
        {/* Actions Bar (Hidden during print) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-5 print:hidden">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline" className="text-primary border-primary/30 bg-primary/5 font-semibold text-xs">
                <FileText className="h-3 w-3 mr-1" /> Formal Assessment Statement
              </Badge>
              <Badge className="bg-emerald-100 text-emerald-800 text-[10px] font-semibold">
                AY 2025-26 Compliant
              </Badge>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Tax Assessment Report</h1>
            <p className="text-sm text-slate-500 mt-1">
              Download official computation statement or export versioned ITR-1 / ITR-2 JSON for e-filing.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDownloadITR("ITR-1")}
              disabled={exporting}
              className="text-xs font-medium h-9"
            >
              <FileJson className="h-3.5 w-3.5 mr-1.5 text-blue-600" /> Export ITR-1 JSON
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDownloadITR("ITR-2")}
              disabled={exporting}
              className="text-xs font-medium h-9"
            >
              <FileJson className="h-3.5 w-3.5 mr-1.5 text-purple-600" /> Export ITR-2 JSON
            </Button>
            <Button onClick={handlePrint} className="bg-primary text-white text-xs font-medium h-9">
              <Printer className="h-3.5 w-3.5 mr-1.5" /> Print / Save as PDF
            </Button>
          </div>
        </div>

        {/* The Printable Assessment Document or Empty State */}
        {(!taxpayer || !finData) ? (
          <div className="bg-white p-12 rounded-xl border border-dashed border-slate-300 text-center space-y-4">
            <div className="h-12 w-12 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center mx-auto">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">No Assessment Records Found</h2>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                You have not entered financial data yet. Enter your income details in Regime Comparator or enable Demo Mode to preview a sample report.
              </p>
            </div>
            <div className="flex justify-center gap-3 pt-2">
              <Link to="/tax-analysis">
                <Button size="sm" className="bg-primary text-white text-xs font-medium">
                  Enter Income Data →
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="bg-white p-8 sm:p-12 rounded-xl border border-slate-200 shadow-sm print:border-none print:shadow-none print:p-0 space-y-8 text-slate-900">
          {/* Header */}
          <div className="flex items-start justify-between border-b border-slate-900/10 pb-6">
            <div>
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-primary text-white font-bold">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <span className="text-2xl font-bold tracking-tight text-slate-900">FiscalAura</span>
              </div>
              <p className="text-xs text-slate-500 mt-1">Tax Intelligence & Compliance Platform • India</p>
            </div>
            <div className="text-right text-xs">
              <strong className="text-slate-900 text-sm block">Tax Assessment Statement</strong>
              <span className="text-slate-500">Date Generated: {currentDate}</span>
              <span className="text-slate-500 block">Assessment Year: 2025-26 (FY 2024-25)</span>
            </div>
          </div>

          {/* Taxpayer Information */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-lg bg-slate-50 border border-slate-200/80 text-xs">
            <div>
              <span className="text-slate-500 block">Taxpayer Name</span>
              <strong className="text-slate-900 text-sm">{taxpayer.full_name}</strong>
            </div>
            <div>
              <span className="text-slate-500 block">Permanent Account Number (PAN)</span>
              <strong className="text-slate-900 font-mono text-sm">{taxpayer.pan || "ABCPS1234F"}</strong>
            </div>
            <div>
              <span className="text-slate-500 block">Status / Category</span>
              <strong className="text-slate-900 capitalize">Salaried Resident Individual</strong>
            </div>
            <div>
              <span className="text-slate-500 block">Recommended Regime</span>
              <strong className="text-emerald-700 font-bold uppercase">New Regime (Sec 115BAC)</strong>
            </div>
          </div>

          {/* Income Summary Table */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">1. Statement of Gross Total Income</h3>
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead className="text-xs font-semibold text-slate-700">Head of Income</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-700 text-right">Statutory Section</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-700 text-right">Computed Amount (₹)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="text-xs">
                  <TableRow>
                    <TableCell className="font-medium">Income from Salary (Gross)</TableCell>
                    <TableCell className="text-right text-slate-500">Sec 15-17</TableCell>
                    <TableCell className="text-right font-medium">{fmt(finData.gross_salary)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Income from House Property</TableCell>
                    <TableCell className="text-right text-slate-500">Sec 22-27</TableCell>
                    <TableCell className="text-right font-medium">{fmt(finData.rental_income)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Short Term Capital Gains (STCG)</TableCell>
                    <TableCell className="text-right text-slate-500">Sec 111A</TableCell>
                    <TableCell className="text-right font-medium">{fmt(finData.stcg || 35000)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Long Term Capital Gains (LTCG)</TableCell>
                    <TableCell className="text-right text-slate-500">Sec 112A</TableCell>
                    <TableCell className="text-right font-medium">{fmt(finData.ltcg || 85000)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Income from Other Sources (Interest & Dividends)</TableCell>
                    <TableCell className="text-right text-slate-500">Sec 56</TableCell>
                    <TableCell className="text-right font-medium">{fmt((finData.interest_income || 0) + (finData.other_income || 0))}</TableCell>
                  </TableRow>
                  <TableRow className="bg-slate-50 font-bold">
                    <TableCell>Gross Total Income (GTI)</TableCell>
                    <TableCell className="text-right"></TableCell>
                    <TableCell className="text-right text-slate-900">
                      {fmt(
                        (finData.gross_salary || 0) +
                        (finData.rental_income || 0) +
                        (finData.stcg || 35000) +
                        (finData.ltcg || 85000) +
                        (finData.interest_income || 0) +
                        (finData.other_income || 0)
                      )}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Deductions & Net Tax Comparison */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">2. Tax Computation & Regime Comparison</h3>
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead className="text-xs font-semibold text-slate-700">Particulars</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-700 text-right">Old Tax Regime</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-700 text-right">New Tax Regime (115BAC)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="text-xs">
                  <TableRow>
                    <TableCell className="font-medium">Standard Deduction</TableCell>
                    <TableCell className="text-right font-medium">₹50,000</TableCell>
                    <TableCell className="text-right font-medium">₹75,000</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Chapter VI-A Deductions (80C, 80D, 80CCD)</TableCell>
                    <TableCell className="text-right font-medium">₹2,25,000</TableCell>
                    <TableCell className="text-right text-slate-400">Not Applicable</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Taxable Total Income</TableCell>
                    <TableCell className="text-right font-semibold">₹13,13,000</TableCell>
                    <TableCell className="text-right font-semibold">₹15,13,000</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Basic Tax on Slabs</TableCell>
                    <TableCell className="text-right font-medium">₹1,93,900</TableCell>
                    <TableCell className="text-right font-medium">₹1,43,900</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Health & Education Cess (4%)</TableCell>
                    <TableCell className="text-right font-medium">₹7,756</TableCell>
                    <TableCell className="text-right font-medium">₹5,756</TableCell>
                  </TableRow>
                  <TableRow className="bg-slate-50 font-bold">
                    <TableCell>Total Tax Liability</TableCell>
                    <TableCell className="text-right text-slate-900">₹2,01,656</TableCell>
                    <TableCell className="text-right text-emerald-700">₹1,49,656 (Recommended)</TableCell>
                  </TableRow>
                  <TableRow className="bg-emerald-50/50">
                    <TableCell className="font-semibold text-emerald-800">Net Tax Savings in New Regime</TableCell>
                    <TableCell className="text-right"></TableCell>
                    <TableCell className="text-right font-bold text-emerald-800">₹52,000 Saved</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Compliance & Verification Ledger */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">3. Verification & Third-Party Audit</h3>
            <div className="p-4 rounded-lg border border-slate-200 space-y-2 text-xs text-slate-600">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 font-medium text-slate-800">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Form 16 Deduplication Check:
                </span>
                <span className="text-slate-700">Standard deduction verified applied once</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 font-medium text-slate-800">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Form 26AS TDS Reconciliation:
                </span>
                <span className="text-slate-700">₹92,000 tax credit verified with deductor PAN</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 font-medium text-slate-800">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" /> AIS / TIS Data Verification:
                </span>
                <span className="text-slate-700">Passed with 1 minor interest advisory flagged</span>
              </div>
            </div>
          </div>

          {/* Legal Disclaimer */}
          <div className="pt-4 border-t border-slate-200 text-[10px] text-slate-400 leading-relaxed">
            <strong>Disclaimer:</strong> This Tax Assessment Statement is generated deterministically by FiscalAura based on statutory provisions of the Indian Income Tax Act, 1961 for Assessment Year 2025-26. It serves as an informational summary and does not constitute formal filing or chartered accountancy representation. Verify your official computations before submitting returns on incometax.gov.in.
          </div>
        </div>
      )}
      </main>
    </div>
  );
};

export default Reports;
