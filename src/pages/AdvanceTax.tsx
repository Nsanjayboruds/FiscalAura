import { useState, useEffect } from "react";
import DashboardNav from "@/components/DashboardNav";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { toast } from "@/hooks/use-toast";
import { calculateAdvanceTax, AdvanceTaxReport, getFinancialData, getTaxAnalysis } from "@/lib/api";
import { Calendar, ShieldAlert, CheckCircle2, Clock, Calculator, ArrowRight } from "lucide-react";

const AdvanceTax = () => {
  const isDemo = localStorage.getItem("fiscalaura_demo_mode") === "true";
  const [assessedTax, setAssessedTax] = useState(isDemo ? 149656 : 0);
  const [totalTDS, setTotalTDS] = useState(isDemo ? 85000 : 0);
  const [paidQ1, setPaidQ1] = useState(isDemo ? 10000 : 0);
  const [paidQ2, setPaidQ2] = useState(isDemo ? 15000 : 0);
  const [paidQ3, setPaidQ3] = useState(isDemo ? 10000 : 0);
  const [paidQ4, setPaidQ4] = useState(isDemo ? 15000 : 0);
  const [delayMonths, setDelayMonths] = useState(0);
  const [report, setReport] = useState<AdvanceTaxReport | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isDemo) {
      loadUserData();
    }
  }, [isDemo]);

  const loadUserData = async () => {
    try {
      const [f, a] = await Promise.all([getFinancialData(), getTaxAnalysis()]);
      if (a?.new_regime_tax || a?.estimated_tax) {
        setAssessedTax(a.new_regime_tax || a.estimated_tax);
      }
      if (f?.tds_deducted) {
        setTotalTDS(f.tds_deducted);
      }
    } catch {
      // Leave at 0 if no user data
    }
  };

  useEffect(() => {
    recalculate();
  }, [assessedTax, totalTDS, paidQ1, paidQ2, paidQ3, paidQ4, delayMonths]);

  const recalculate = async () => {
    setLoading(true);
    try {
      const res = await calculateAdvanceTax({
        assessed_tax: assessedTax,
        total_tds: totalTDS,
        paid_q1: paidQ1,
        paid_q2: paidQ2,
        paid_q3: paidQ3,
        paid_q4: paidQ4,
        filing_delay_months: delayMonths,
      });
      setReport(res);
    } catch {
      // Deterministic client fallback calculation
      const netTax = Math.max(0, assessedTax - totalTDS);
      const isReq = netTax >= 10000;
      const q1Min = netTax * 0.15;
      const q2Min = netTax * 0.45;
      const q3Min = netTax * 0.75;
      const q4Min = netTax * 1.00;

      const q1Shortfall = Math.max(0, netTax * 0.12 - paidQ1);
      const q2Shortfall = Math.max(0, netTax * 0.36 - (paidQ1 + paidQ2));
      const q3Shortfall = Math.max(0, netTax * 0.75 - (paidQ1 + paidQ2 + paidQ3));
      const q4Shortfall = Math.max(0, netTax * 1.00 - (paidQ1 + paidQ2 + paidQ3 + paidQ4));

      const int234c = Math.round((q1Shortfall + q2Shortfall + q3Shortfall) * 0.01 * 3 + q4Shortfall * 0.01 * 1);
      const totalPaid = paidQ1 + paidQ2 + paidQ3 + paidQ4;
      const int234b = totalPaid < netTax * 0.90 ? Math.round((netTax - totalPaid) * 0.01 * 4) : 0;
      const int234a = delayMonths > 0 ? Math.round(Math.max(0, netTax - totalPaid) * 0.01 * delayMonths) : 0;

      setReport({
        assessed_tax_liability: assessedTax,
        total_tds_credited: totalTDS,
        net_tax_subject_to_adv: netTax,
        is_advance_tax_required: isReq,
        installments: [
          { quarter_name: "Q1", due_date: "15 June 2024", cumulative_percent: 15, minimum_due_amount: q1Min, amount_paid: paidQ1, shortfall: q1Shortfall, is_paid: paidQ1 >= q1Min, section_234c_interest: Math.round(q1Shortfall * 0.01 * 3) },
          { quarter_name: "Q2", due_date: "15 September 2024", cumulative_percent: 45, minimum_due_amount: q2Min, amount_paid: paidQ2, shortfall: q2Shortfall, is_paid: (paidQ1 + paidQ2) >= q2Min, section_234c_interest: Math.round(q2Shortfall * 0.01 * 3) },
          { quarter_name: "Q3", due_date: "15 December 2024", cumulative_percent: 75, minimum_due_amount: q3Min, amount_paid: paidQ3, shortfall: q3Shortfall, is_paid: (paidQ1 + paidQ2 + paidQ3) >= q3Min, section_234c_interest: Math.round(q3Shortfall * 0.01 * 3) },
          { quarter_name: "Q4", due_date: "15 March 2025", cumulative_percent: 100, minimum_due_amount: q4Min, amount_paid: paidQ4, shortfall: q4Shortfall, is_paid: totalPaid >= q4Min, section_234c_interest: Math.round(q4Shortfall * 0.01 * 1) },
        ],
        interest_234a: int234a,
        interest_234b: int234b,
        interest_234c: int234c,
        total_interest_payable: int234a + int234b + int234c,
        explanation_234a: "1% per month on unpaid tax from due date until filing.",
        explanation_234b: "1% per month on unpaid tax if advance tax paid is below 90% of assessed liability.",
        explanation_234c: "1% per month for deferment of advance tax installments below statutory thresholds.",
      });
    }
    setLoading(false);
  };

  const fmt = (n: number) => `₹${(n || 0).toLocaleString("en-IN")}`;

  return (
    <div className="min-h-screen bg-slate-50/50">
      <DashboardNav />
      <main className="container max-w-7xl py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline" className="text-primary border-primary/30 bg-primary/5 font-semibold text-xs">
                <Calendar className="h-3 w-3 mr-1" /> Statutory Compliance
              </Badge>
              <Badge className="bg-blue-100 text-blue-800 text-[10px] font-semibold">
                Section 208 & 234A/B/C
              </Badge>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Advance Tax & Penalty Calculator</h1>
            <p className="text-sm text-slate-500 mt-1 max-w-3xl">
              Track mandatory quarterly tax installments (15-Jun, 15-Sep, 15-Dec, 15-Mar) and compute interest liabilities under Sections 234A, 234B, and 234C.
            </p>
          </div>
        </div>

        {/* Input Parameters Card */}
        <Card className="shadow-sm border-slate-200 bg-white">
          <CardHeader className="pb-3 border-b">
            <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <Calculator className="h-4 w-4 text-primary" />
              Tax Assessment Parameters
            </CardTitle>
            <CardDescription className="text-xs">
              Advance tax applies if net tax liability after TDS credits exceeds ₹10,000 for the financial year.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">Estimated Total Tax (FY 24-25)</Label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-slate-400 font-semibold text-xs">₹</span>
                  <Input
                    type="number"
                    value={assessedTax}
                    onChange={(e) => setAssessedTax(parseFloat(e.target.value) || 0)}
                    className="pl-7 h-9 text-xs font-semibold"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">Total TDS / TCS Credited</Label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-slate-400 font-semibold text-xs">₹</span>
                  <Input
                    type="number"
                    value={totalTDS}
                    onChange={(e) => setTotalTDS(parseFloat(e.target.value) || 0)}
                    className="pl-7 h-9 text-xs font-semibold text-emerald-700"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">Delay in Filing Return (Months)</Label>
                <Input
                  type="number"
                  min={0}
                  value={delayMonths}
                  onChange={(e) => setDelayMonths(parseInt(e.target.value) || 0)}
                  className="h-9 text-xs font-medium"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {report && (
          <div className="space-y-6">
            {/* Status Banner */}
            <Alert className={report.total_interest_payable > 0 ? "border-amber-200 bg-amber-50/70" : "border-emerald-200 bg-emerald-50/70"}>
              <ShieldAlert className={`h-4 w-4 ${report.total_interest_payable > 0 ? "text-amber-700" : "text-emerald-700"}`} />
              <AlertTitle className="text-sm font-semibold">
                Net Tax Subject to Advance Tax: {fmt(report.net_tax_subject_to_adv)}
              </AlertTitle>
              <AlertDescription className="text-xs text-slate-600 mt-0.5">
                {report.is_advance_tax_required
                  ? "Advance tax is mandatory because your net tax exceeds ₹10,000. Interest penalties apply for unpaid installments."
                  : "Advance tax is not required because your net payable after TDS is below the ₹10,000 statutory limit."}
              </AlertDescription>
            </Alert>

            {/* Quarterly Installments Matrix */}
            <Card className="shadow-sm border-slate-200 bg-white">
              <CardHeader className="pb-3 border-b">
                <CardTitle className="text-base font-semibold text-slate-900">
                  Quarterly Installment Schedule & 234C Interest
                </CardTitle>
                <CardDescription className="text-xs">
                  Section 234C levies 1% monthly interest for deferment of each installment threshold.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader className="bg-slate-50">
                    <TableRow>
                      <TableHead className="text-xs font-semibold">Quarter & Due Date</TableHead>
                      <TableHead className="text-xs font-semibold text-right">Cumulative Target</TableHead>
                      <TableHead className="text-xs font-semibold text-right">Minimum Target (₹)</TableHead>
                      <TableHead className="text-xs font-semibold text-right">Actual Paid (₹)</TableHead>
                      <TableHead className="text-xs font-semibold text-right">Shortfall (₹)</TableHead>
                      <TableHead className="text-xs font-semibold text-center">Status</TableHead>
                      <TableHead className="text-xs font-semibold text-right">234C Penalty</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {report.installments.map((inst, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="text-xs font-medium text-slate-900">{inst.quarter_name}</TableCell>
                        <TableCell className="text-xs text-right text-slate-600">{inst.cumulative_percent}%</TableCell>
                        <TableCell className="text-xs text-right font-medium">{fmt(inst.minimum_due_amount)}</TableCell>
                        <TableCell className="text-xs text-right font-semibold text-slate-900">{fmt(inst.amount_paid)}</TableCell>
                        <TableCell className={`text-xs text-right ${inst.shortfall > 0 ? "text-amber-800 font-semibold" : "text-slate-400"}`}>
                          {inst.shortfall > 0 ? fmt(inst.shortfall) : "₹0"}
                        </TableCell>
                        <TableCell className="text-center">
                          {inst.is_paid ? (
                            <Badge variant="outline" className="text-[10px] text-emerald-700 bg-emerald-50 border-emerald-200">
                              <CheckCircle2 className="h-3 w-3 mr-1" /> Satisfied
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-[10px] text-amber-800 bg-amber-50 border-amber-200">
                              <Clock className="h-3 w-3 mr-1" /> Shortfall
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-xs text-right font-semibold text-rose-700">
                          {inst.section_234c_interest > 0 ? fmt(inst.section_234c_interest) : "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Interest Liability Breakdown Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="shadow-sm border-slate-200 bg-white">
                <CardContent className="p-4 space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-semibold text-slate-500 uppercase">Section 234A</span>
                    <strong className="text-base text-rose-700">{fmt(report.interest_234a)}</strong>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">{report.explanation_234a}</p>
                </CardContent>
              </Card>

              <Card className="shadow-sm border-slate-200 bg-white">
                <CardContent className="p-4 space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-semibold text-slate-500 uppercase">Section 234B</span>
                    <strong className="text-base text-rose-700">{fmt(report.interest_234b)}</strong>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">{report.explanation_234b}</p>
                </CardContent>
              </Card>

              <Card className="shadow-sm border-slate-200 bg-white">
                <CardContent className="p-4 space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-semibold text-slate-500 uppercase">Section 234C</span>
                    <strong className="text-base text-rose-700">{fmt(report.interest_234c)}</strong>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">{report.explanation_234c}</p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdvanceTax;
