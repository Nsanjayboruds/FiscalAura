import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { getFinancialData, getTaxAnalysis } from "@/lib/api";
import DashboardNav from "@/components/DashboardNav";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { TrendingUp, TrendingDown, FileText, CheckCircle2, Calculator, Wallet, ShieldCheck, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const TaxSummary = () => {
  const { user, loading: authLoading } = useAuth();
  const [financialData, setFinancialData] = useState<any>(null);
  const [analysis, setAnalysis] = useState<any>(null);

  useEffect(() => {
    if (user) loadData();
  }, [user]);

  const loadData = async () => {
    try {
      const [fin, tax] = await Promise.all([getFinancialData(), getTaxAnalysis()]);
      if (fin) setFinancialData(fin);
      if (tax) setAnalysis(tax);
    } catch {
      // Data not available yet
    }
  };

  if (authLoading) return null;

  const fmt = (n: number) => `₹${(n || 0).toLocaleString("en-IN")}`;

  const totalIncome = financialData
    ? (financialData.gross_salary || 0) +
      (financialData.other_income || 0) +
      (financialData.rental_income || 0) +
      (financialData.interest_income || 0) +
      (financialData.business_income || 0)
    : 0;

  const totalDeductions = financialData
    ? (financialData.deductions_80c || 0) +
      (financialData.deductions_80d || 0) +
      (financialData.deductions_80e || 0) +
      (financialData.deductions_80g || 0) +
      (financialData.deductions_nps || 0) +
      (financialData.deductions_hra || 0) +
      (financialData.deductions_lta || 0) +
      (financialData.other_deductions || 0)
    : 0;

  const incomeItems = [
    { label: "Gross Salary", value: financialData?.gross_salary || 0 },
    { label: "Rental / House Property Income", value: financialData?.rental_income || 0 },
    { label: "Bank Interest & Fixed Deposits", value: financialData?.interest_income || 0 },
    { label: "Business & Professional Receipts", value: financialData?.business_income || 0 },
    { label: "Other Source Income", value: financialData?.other_income || 0 },
  ].filter((i) => i.value > 0);

  const deductionItems = [
    { label: "Section 80C (PPF, ELSS, EPF, LIC)", value: financialData?.deductions_80c || 0 },
    { label: "Section 80D (Health Insurance)", value: financialData?.deductions_80d || 0 },
    { label: "Section 80CCD(1B) (NPS Extra)", value: financialData?.deductions_nps || 0 },
    { label: "Section 80E (Education Loan Interest)", value: financialData?.deductions_80e || 0 },
    { label: "Section 80G (Charitable Donations)", value: financialData?.deductions_80g || 0 },
    { label: "Section 10(13A) (HRA Exemption)", value: financialData?.deductions_hra || 0 },
    { label: "Section 10(5) (LTA Exemption)", value: financialData?.deductions_lta || 0 },
    { label: "Other Deductions & Professional Tax", value: financialData?.other_deductions || 0 },
  ].filter((i) => i.value > 0);

  return (
    <div className="min-h-screen bg-slate-50/50">
      <DashboardNav />
      <main className="container max-w-6xl py-6 sm:py-8 space-y-6 px-4 sm:px-6 lg:px-8 pb-24 lg:pb-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-5">
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <Badge variant="outline" className="text-primary border-primary/30 bg-primary/5 font-semibold text-xs">
                <Calculator className="h-3 w-3 mr-1" /> Assessment Statement
              </Badge>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">Consolidated Tax Summary</h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Official summary of reported gross income, allowable Chapter VI-A deductions, and net tax liability (FY 2024-25 / AY 2025-26).
            </p>
          </div>
          <div className="flex gap-2">
            <Link to="/tax-analysis" className="w-full sm:w-auto">
              <Button variant="outline" size="sm" className="w-full sm:w-auto font-medium text-xs">
                Edit Financial Data
              </Button>
            </Link>
          </div>
        </div>

        {!financialData && !analysis ? (
          <Card className="shadow-sm border-slate-200 p-12 text-center bg-white">
            <FileText className="h-12 w-12 mx-auto mb-3 text-slate-300" />
            <CardTitle className="text-lg font-bold text-slate-900 mb-1">No Tax Assessment Found</CardTitle>
            <p className="text-xs text-slate-500 max-w-md mx-auto mb-4">
              Enter your income and deduction details in the Tax Analysis section to generate your official tax summary statement.
            </p>
            <Link to="/analysis">
              <Button className="bg-primary hover:bg-primary/90 text-white font-medium text-xs">
                Go to Tax Analysis <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            </Link>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* KPI Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="shadow-sm border-slate-200 bg-white">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Gross Total Income</span>
                    <div className="p-2 rounded-md bg-blue-50 text-primary">
                      <TrendingUp className="h-4 w-4" />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-slate-900">{fmt(totalIncome)}</p>
                  <p className="text-xs text-slate-400 mt-1">Aggregate from all reported heads</p>
                </CardContent>
              </Card>

              <Card className="shadow-sm border-slate-200 bg-white">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Deductions Claimed</span>
                    <div className="p-2 rounded-md bg-emerald-50 text-emerald-600">
                      <TrendingDown className="h-4 w-4" />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-slate-900">{fmt(totalDeductions)}</p>
                  <p className="text-xs text-slate-400 mt-1">Chapter VI-A & Salary Exemptions</p>
                </CardContent>
              </Card>

              <Card className="shadow-sm border-slate-200 bg-white">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Estimated Tax Payable</span>
                    <div className="p-2 rounded-md bg-amber-50 text-amber-600">
                      <Wallet className="h-4 w-4" />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-slate-900">
                    {analysis ? fmt(Math.min(analysis.old_regime_tax || 0, analysis.new_regime_tax || 0)) : "—"}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    {analysis?.recommended_regime ? `Under ${analysis.recommended_regime.toUpperCase()} Tax Regime` : "Pending computation"}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Income & Deduction Breakdown Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Income Breakdown */}
              <Card className="shadow-sm border-slate-200 bg-white">
                <CardHeader className="pb-3 border-b">
                  <CardTitle className="text-base font-semibold text-slate-900">Gross Income Breakdown</CardTitle>
                  <CardDescription className="text-xs">Classification under Income Tax Act heads</CardDescription>
                </CardHeader>
                <CardContent className="pt-4 space-y-3">
                  {incomeItems.length > 0 ? (
                    <div className="space-y-2.5">
                      {incomeItems.map((item) => (
                        <div key={item.label} className="flex justify-between items-center py-2 px-3 rounded-md bg-slate-50 border border-slate-100 text-xs">
                          <span className="font-medium text-slate-700">{item.label}</span>
                          <span className="font-semibold text-slate-900">{fmt(item.value)}</span>
                        </div>
                      ))}
                      <div className="flex justify-between items-center p-3 rounded-md bg-blue-50/60 border border-blue-100 text-xs mt-3">
                        <span className="font-semibold text-slate-900">Gross Total Income</span>
                        <span className="font-bold text-primary text-sm">{fmt(totalIncome)}</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 py-6 text-center italic">No income entries reported yet.</p>
                  )}
                </CardContent>
              </Card>

              {/* Deductions Breakdown */}
              <Card className="shadow-sm border-slate-200 bg-white">
                <CardHeader className="pb-3 border-b">
                  <CardTitle className="text-base font-semibold text-slate-900">Deductions & Exemptions</CardTitle>
                  <CardDescription className="text-xs">Deductions applied under Old Tax Regime</CardDescription>
                </CardHeader>
                <CardContent className="pt-4 space-y-3">
                  {deductionItems.length > 0 ? (
                    <div className="space-y-2.5">
                      {deductionItems.map((item) => (
                        <div key={item.label} className="flex justify-between items-center py-2 px-3 rounded-md bg-slate-50 border border-slate-100 text-xs">
                          <span className="font-medium text-slate-700">{item.label}</span>
                          <span className="font-semibold text-emerald-700">{fmt(item.value)}</span>
                        </div>
                      ))}
                      <div className="flex justify-between items-center p-3 rounded-md bg-emerald-50/60 border border-emerald-100 text-xs mt-3">
                        <span className="font-semibold text-slate-900">Total Deductions Claimed</span>
                        <span className="font-bold text-emerald-700 text-sm">{fmt(totalDeductions)}</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 py-6 text-center italic">No deductions entered yet.</p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Regime Recommendation Card */}
            {analysis && (
              <Card className="shadow-sm border-slate-200 bg-white">
                <CardHeader className="pb-3 border-b">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
                        <ShieldCheck className="h-5 w-5 text-primary" />
                        Final Regime Recommendation
                      </CardTitle>
                      <CardDescription className="text-xs">Comparing Section 115BAC (New) vs Chapter VI-A (Old)</CardDescription>
                    </div>
                    <Badge className="bg-emerald-600 text-white font-semibold text-xs">
                      Saves ₹{Math.abs((analysis.old_regime_tax || 0) - (analysis.new_regime_tax || 0)).toLocaleString("en-IN")}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-5 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className={`p-4 rounded-lg border ${analysis.recommended_regime === "old" ? "border-emerald-500 bg-emerald-50/50" : "border-slate-200 bg-slate-50"}`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold text-slate-500 uppercase">Old Tax Regime</span>
                        {analysis.recommended_regime === "old" && (
                          <Badge className="bg-emerald-100 text-emerald-800 text-[10px]">
                            <CheckCircle2 className="h-3 w-3 mr-1" /> Recommended
                          </Badge>
                        )}
                      </div>
                      <p className="text-2xl font-bold text-slate-900">{fmt(analysis.old_regime_tax)}</p>
                      <p className="text-xs text-slate-500 mt-1">Includes 80C, 80D, HRA & other deductions</p>
                    </div>

                    <div className={`p-4 rounded-lg border ${analysis.recommended_regime === "new" ? "border-emerald-500 bg-emerald-50/50" : "border-slate-200 bg-slate-50"}`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold text-slate-500 uppercase">New Tax Regime (Sec 115BAC)</span>
                        {analysis.recommended_regime === "new" && (
                          <Badge className="bg-emerald-100 text-emerald-800 text-[10px]">
                            <CheckCircle2 className="h-3 w-3 mr-1" /> Recommended
                          </Badge>
                        )}
                      </div>
                      <p className="text-2xl font-bold text-slate-900">{fmt(analysis.new_regime_tax)}</p>
                      <p className="text-xs text-slate-500 mt-1">Includes standard deduction of ₹75,000</p>
                    </div>
                  </div>

                  {analysis.analysis_summary && (
                    <div className="p-3.5 rounded-lg bg-blue-50 border border-blue-200 text-xs text-blue-900 leading-relaxed">
                      <span className="font-semibold">Analysis Summary:</span> {analysis.analysis_summary}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default TaxSummary;
