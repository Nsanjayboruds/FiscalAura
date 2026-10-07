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
import { consolidateForm16s, Form16EmployerRecord, ConsolidatedForm16Result } from "@/lib/api";
import { DEMO_TAXPAYER } from "@/lib/demoData";
import { Briefcase, Plus, Trash2, ShieldCheck, AlertCircle, ArrowRight, Layers } from "lucide-react";

const Form16Consolidator = () => {
  const isDemo = localStorage.getItem("fiscalaura_demo_mode") === "true";
  const [records, setRecords] = useState<Form16EmployerRecord[]>(
    isDemo ? DEMO_TAXPAYER.form16Records : []
  );
  const [result, setResult] = useState<ConsolidatedForm16Result | null>(null);
  const [regime, setRegime] = useState<"new" | "old">("new");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isDemo && records.length === 0) {
      setRecords(DEMO_TAXPAYER.form16Records);
    }
  }, [isDemo]);

  const fmt = (n: number) => `₹${(n || 0).toLocaleString("en-IN")}`;

  const handleConsolidate = async () => {
    if (records.length === 0) {
      toast({ title: "No Employers", description: "Add at least one Form 16 record to consolidate.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const data = await consolidateForm16s(records, "2025-26", regime);
      setResult(data);
      toast({ title: "Consolidation Complete", description: `Deduplicated standard deduction across ${records.length} employer(s).` });
    } catch {
      // Deterministic client-side fallback (mirrors Go taxengine logic)
      const stdDedCap = 75000;
      let totalGross = 0, totalExempt = 0, totalPT = 0, totalTDS = 0, totalVIA = 0, claimedStd = 0;

      records.forEach((r) => {
        totalGross += r.gross_salary;
        totalExempt += r.exempt_allowances;
        totalPT += r.professional_tax;
        totalTDS += r.tds_deducted;
        totalVIA += r.chapter_via_deductions;
        claimedStd += r.standard_deduction;
      });

      const actualStd = Math.min(totalGross, stdDedCap);
      const duplicateCaught = Math.max(0, claimedStd - actualStd);
      const netSalary = Math.max(0, totalGross - totalExempt - actualStd - totalPT);
      const deductionsApplied = regime === "old" ? Math.min(150000, totalVIA) : 0;
      const taxableIncome = Math.max(0, netSalary - deductionsApplied);

      let tax = 0;
      if (taxableIncome > 300000) {
        if (taxableIncome <= 700000) tax = (taxableIncome - 300000) * 0.05;
        else if (taxableIncome <= 1000000) tax = 20000 + (taxableIncome - 700000) * 0.10;
        else if (taxableIncome <= 1200000) tax = 50000 + (taxableIncome - 1000000) * 0.15;
        else if (taxableIncome <= 1500000) tax = 80000 + (taxableIncome - 1200000) * 0.20;
        else tax = 140000 + (taxableIncome - 1500000) * 0.30;
      }
      if (taxableIncome <= 700000) tax = 0; // 87A rebate
      const cess = Math.round(tax * 0.04);
      const totalTax = tax + cess;
      const tdsDiff = totalTax - totalTDS;

      const warnings: string[] = [];
      if (records.length > 1) {
        warnings.push(`Consolidated ${records.length} employers. Standard deduction was applied exactly once (₹${actualStd.toLocaleString("en-IN")}) instead of sum of individual deductions (₹${claimedStd.toLocaleString("en-IN")}).`);
        if (tdsDiff > 5000) {
          warnings.push(`Estimated tax shortfall of ₹${tdsDiff.toLocaleString("en-IN")} detected. Pay self-assessment tax before July 31 to prevent Section 234B interest.`);
        }
      }

      setResult({
        employer_count: records.length,
        employers: records,
        total_gross_salary: totalGross,
        total_exempt_allowances: totalExempt,
        standard_deduction_applied: actualStd,
        total_professional_tax: totalPT,
        total_chapter_via_deductions: deductionsApplied,
        consolidated_taxable_salary: taxableIncome,
        total_tds_deducted: totalTDS,
        estimated_tax_on_combined: totalTax,
        tds_shortfall_or_surplus: tdsDiff,
        duplicate_deduction_caught: duplicateCaught,
        warnings,
      });
      toast({ title: "Consolidation Complete (Offline)", description: `Calculated locally across ${records.length} employer(s).` });
    }
    setLoading(false);
  };

  const handleAddEmployer = () => {
    const newRecord: Form16EmployerRecord = {
      id: `emp-${Date.now()}`,
      employer_name: `Employer ${records.length + 1}`,
      employer_tan: "NEWT00000X",
      period_from: "01-Apr-2024",
      period_to: "31-Mar-2025",
      gross_salary: 500000,
      exempt_allowances: 0,
      standard_deduction: 75000,
      professional_tax: 2500,
      chapter_via_deductions: 50000,
      taxable_salary: 400000,
      tds_deducted: 10000,
    };
    setRecords([...records, newRecord]);
  };

  const handleRemoveEmployer = (index: number) => {
    setRecords(records.filter((_, i) => i !== index));
  };

  const handleFieldChange = (index: number, field: keyof Form16EmployerRecord, val: any) => {
    const updated = [...records];
    (updated[index] as any)[field] = val;
    setRecords(updated);
  };

  return (
    <div className="min-h-screen bg-slate-50/50">
      <DashboardNav />
      <main className="container max-w-7xl py-8 space-y-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline" className="text-primary border-primary/30 bg-primary/5 font-semibold text-xs">
                <Briefcase className="h-3 w-3 mr-1" /> Job-Switcher Multi-Employer Intelligence
              </Badge>
              <Badge className="bg-emerald-100 text-emerald-800 text-[10px] font-semibold">
                Deduplication Active
              </Badge>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Multiple Form 16 Consolidation</h1>
            <p className="text-sm text-slate-500 mt-1 max-w-3xl">
              Changed jobs during the financial year? Consolidate multiple Form 16s, deduplicate overlapping standard deductions (Section 16(ia)), and compute your true consolidated tax liability.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex border border-slate-200 rounded-lg overflow-hidden text-xs">
              {(["new", "old"] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setRegime(r)}
                  className={`px-3 py-1.5 font-semibold transition-all ${regime === r ? "bg-primary text-white" : "text-slate-600 hover:bg-slate-50"}`}
                >
                  {r.toUpperCase()} Regime
                </button>
              ))}
            </div>
            <Button
              onClick={handleConsolidate}
              disabled={loading || records.length === 0}
              className="bg-primary hover:bg-primary/90 text-white font-medium text-xs h-9 px-4"
            >
              {loading ? "Calculating..." : "Consolidate Now"} <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
            </Button>
          </div>
        </div>

        {/* Employer Records Grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <Layers className="h-4 w-4 text-primary" />
              Employer Form 16 Entries ({records.length})
            </h2>
            <Button variant="outline" size="sm" onClick={handleAddEmployer} className="text-xs font-medium h-8">
              <Plus className="h-3.5 w-3.5 mr-1" /> Add Another Employer
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {records.length === 0 ? (
              <div className="col-span-full p-8 text-center border border-dashed border-slate-300 rounded-lg bg-white space-y-3">
                <Briefcase className="h-8 w-8 text-slate-400 mx-auto" />
                <div>
                  <p className="text-sm font-semibold text-slate-800">No Form 16 Records Added Yet</p>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto mt-0.5">
                    Click 'Add Employer' to input details from Part B of your Form 16s, or preview sample switcher data.
                  </p>
                </div>
                <div className="flex justify-center gap-2 pt-2">
                  <Button size="sm" onClick={handleAddEmployer} className="text-xs font-medium">
                    <Plus className="h-3.5 w-3.5 mr-1" /> Add Employer
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setRecords(DEMO_TAXPAYER.form16Records)} className="text-xs font-medium text-primary border-primary/20">
                    Preview Sample Switcher Data
                  </Button>
                </div>
              </div>
            ) : (
              records.map((emp, i) => (
                <Card key={emp.id} className="shadow-sm border-slate-200 bg-white">
                  <CardHeader className="pb-3 border-b flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-sm font-semibold text-slate-900">Employer #{i + 1}</CardTitle>
                      <CardDescription className="text-xs">{emp.employer_tan || "TAN Pending"}</CardDescription>
                    </div>
                    {records.length > 1 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveEmployer(i)}
                        className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </CardHeader>
                  <CardContent className="pt-4 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-[11px] font-semibold text-slate-700">Company Name</Label>
                        <Input
                          value={emp.employer_name}
                          onChange={(e) => handleFieldChange(i, "employer_name", e.target.value)}
                          className="h-8 text-xs font-medium"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[11px] font-semibold text-slate-700">Employer TAN</Label>
                        <Input
                          value={emp.employer_tan}
                          onChange={(e) => handleFieldChange(i, "employer_tan", e.target.value)}
                          className="h-8 text-xs font-mono uppercase"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-[11px] font-semibold text-slate-700">Gross Salary (₹)</Label>
                        <Input
                          type="number"
                          value={emp.gross_salary}
                          onChange={(e) => handleFieldChange(i, "gross_salary", parseFloat(e.target.value) || 0)}
                          className="h-8 text-xs font-semibold"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[11px] font-semibold text-slate-700">TDS Deducted (₹)</Label>
                        <Input
                          type="number"
                          value={emp.tds_deducted}
                          onChange={(e) => handleFieldChange(i, "tds_deducted", parseFloat(e.target.value) || 0)}
                          className="h-8 text-xs font-semibold text-emerald-700"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-[11px] font-semibold text-slate-700">Std Deduction Claimed (₹)</Label>
                        <Input
                          type="number"
                          value={emp.standard_deduction}
                          onChange={(e) => handleFieldChange(i, "standard_deduction", parseFloat(e.target.value) || 0)}
                          className="h-8 text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[11px] font-semibold text-slate-700">Chapter VI-A (₹)</Label>
                        <Input
                          type="number"
                          value={emp.chapter_via_deductions}
                          onChange={(e) => handleFieldChange(i, "chapter_via_deductions", parseFloat(e.target.value) || 0)}
                          className="h-8 text-xs"
                        />
                      </div>
                    </div>

                    <div className="pt-1 border-t text-[11px] text-slate-500 flex gap-4">
                      <span>Period: <strong className="text-slate-700">{emp.period_from} → {emp.period_to}</strong></span>
                      <span>Prof Tax: <strong className="text-slate-700">{fmt(emp.professional_tax)}</strong></span>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>

        {/* Consolidated Results */}
        {result && (
          <div className="space-y-6 pt-4">
            {result.warnings.map((w, i) => (
              <Alert key={i} className="border-amber-200 bg-amber-50/70">
                <AlertCircle className="h-4 w-4 text-amber-700" />
                <AlertTitle className="text-xs font-semibold text-amber-900">Job Switcher Compliance Alert</AlertTitle>
                <AlertDescription className="text-xs text-amber-800 mt-0.5">{w}</AlertDescription>
              </Alert>
            ))}

            <Card className="shadow-sm border-slate-200 bg-white">
              <CardHeader className="pb-3 border-b">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <CardTitle className="text-base font-semibold text-slate-900">
                      Consolidated Tax Assessment ({result.employer_count} Employer{result.employer_count !== 1 ? "s" : ""})
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Unified computation under the {regime.toUpperCase()} Tax Regime — FY 2025-26 (AY 2026-27)
                    </CardDescription>
                  </div>
                  {result.duplicate_deduction_caught > 0 && (
                    <Badge variant="outline" className="text-xs font-semibold text-primary bg-primary/5">
                      <ShieldCheck className="h-3 w-3 mr-1" />
                      Deduplication Saved: {fmt(result.duplicate_deduction_caught)} excess claim
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="pt-5 space-y-6">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
                    <span className="text-[11px] font-semibold text-slate-500 uppercase">Combined Gross Salary</span>
                    <p className="text-xl font-bold text-slate-900 mt-1">{fmt(result.total_gross_salary)}</p>
                  </div>
                  <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200">
                    <span className="text-[11px] font-semibold text-emerald-700 uppercase">Deduplicated Std Deduction</span>
                    <p className="text-xl font-bold text-emerald-800 mt-1">{fmt(result.standard_deduction_applied)}</p>
                    <span className="text-[10px] text-emerald-600">Applied once per IT Act Sec 16(ia)</span>
                  </div>
                  <div className="p-3.5 rounded-lg bg-blue-50 border border-blue-200">
                    <span className="text-[11px] font-semibold text-blue-700 uppercase">Total TDS Paid</span>
                    <p className="text-xl font-bold text-blue-900 mt-1">{fmt(result.total_tds_deducted)}</p>
                    <span className="text-[10px] text-blue-600">Summed from all Form 16s</span>
                  </div>
                  <div className={`p-3.5 rounded-lg border ${result.tds_shortfall_or_surplus > 0 ? "bg-rose-50 border-rose-200" : "bg-emerald-50 border-emerald-200"}`}>
                    <span className={`text-[11px] font-semibold uppercase ${result.tds_shortfall_or_surplus > 0 ? "text-rose-700" : "text-emerald-700"}`}>
                      {result.tds_shortfall_or_surplus > 0 ? "Tax Shortfall Due" : "Estimated Refund"}
                    </span>
                    <p className={`text-xl font-bold mt-1 ${result.tds_shortfall_or_surplus > 0 ? "text-rose-900" : "text-emerald-900"}`}>
                      {fmt(Math.abs(result.tds_shortfall_or_surplus))}
                    </p>
                    <span className={`text-[10px] ${result.tds_shortfall_or_surplus > 0 ? "text-rose-600" : "text-emerald-600"}`}>
                      {result.tds_shortfall_or_surplus > 0 ? "Self-assessment tax payable" : "Excess TDS will be refunded"}
                    </span>
                  </div>
                </div>

                {/* Summary Row */}
                <div className="grid grid-cols-3 gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs">
                  <div>
                    <span className="text-slate-500">Taxable Salary</span>
                    <p className="font-bold text-slate-900 mt-0.5">{fmt(result.consolidated_taxable_salary)}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Tax Liability + Cess</span>
                    <p className="font-bold text-primary mt-0.5">{fmt(result.estimated_tax_on_combined)}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Total Exempt Allowances</span>
                    <p className="font-bold text-slate-700 mt-0.5">{fmt(result.total_exempt_allowances)}</p>
                  </div>
                </div>

                {/* Employer-by-Employer Ledger */}
                <div className="space-y-2">
                  <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Employer-by-Employer Ledger</h3>
                  <div className="rounded-lg border border-slate-200 overflow-hidden">
                    <Table>
                      <TableHeader className="bg-slate-50">
                        <TableRow>
                          <TableHead className="text-xs font-semibold">Employer</TableHead>
                          <TableHead className="text-xs font-semibold text-right">Gross Salary</TableHead>
                          <TableHead className="text-xs font-semibold text-right">Exempt Allow.</TableHead>
                          <TableHead className="text-xs font-semibold text-right">Std Ded Claimed</TableHead>
                          <TableHead className="text-xs font-semibold text-right">TDS Paid</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {result.employers.map((e, idx) => (
                          <TableRow key={idx}>
                            <TableCell className="text-xs font-medium text-slate-900">
                              <div>{e.employer_name}</div>
                              <div className="text-[10px] text-slate-400 font-mono">{e.employer_tan}</div>
                            </TableCell>
                            <TableCell className="text-xs text-right font-medium">{fmt(e.gross_salary)}</TableCell>
                            <TableCell className="text-xs text-right text-slate-600">{fmt(e.exempt_allowances)}</TableCell>
                            <TableCell className="text-xs text-right text-slate-600">{fmt(e.standard_deduction)}</TableCell>
                            <TableCell className="text-xs text-right font-semibold text-emerald-700">{fmt(e.tds_deducted)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
};

export default Form16Consolidator;
