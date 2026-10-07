import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { getFinancialData, updateFinancialData, getTaxAnalysis, runTaxAnalysis } from "@/lib/api";
import DashboardNav from "@/components/DashboardNav";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Save, Brain, IndianRupee, TrendingDown, CheckCircle, Sparkles, PieChart, Activity, Fingerprint } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

const incomeFields = [
  { key: "gross_salary", label: "Gross Salary" },
  { key: "hra_received", label: "HRA Received" },
  { key: "lta_received", label: "LTA Received" },
  { key: "other_income", label: "Other Income" },
  { key: "rental_income", label: "Rental Income" },
  { key: "interest_income", label: "Interest Income" },
  { key: "business_income", label: "Business Income" },
];

const deductionFields = [
  { key: "deductions_80c", label: "Section 80C (PPF, ELSS, LIC, etc.)" },
  { key: "deductions_80d", label: "Section 80D (Health Insurance)" },
  { key: "deductions_80e", label: "Section 80E (Education Loan Interest)" },
  { key: "deductions_80g", label: "Section 80G (Donations)" },
  { key: "deductions_nps", label: "NPS Contribution (80CCD)" },
  { key: "deductions_hra", label: "HRA Exemption" },
  { key: "deductions_lta", label: "LTA Exemption" },
  { key: "other_deductions", label: "Other Deductions (incl. Professional Tax)" },
];

const TaxAnalysis = () => {
  const { user, profile, loading: authLoading } = useAuth();
  const [financialData, setFinancialData] = useState<any>({});
  const [analysis, setAnalysis] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);

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

  const handleFieldChange = (key: string, value: string) => {
    setFinancialData((prev: any) => ({ ...prev, [key]: parseFloat(value) || 0 }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateFinancialData(financialData);
      toast({ title: "Saved!", description: "Financial data saved." });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
    setSaving(false);
  };

  const handleAnalyze = async () => {
    setAnalyzing(true);
    try {
      const result = await runTaxAnalysis(financialData, profile || {});
      setAnalysis(result.data);
      toast({ title: "Analysis Complete!", description: "Your tax analysis is ready." });
    } catch (error: any) {
      toast({ title: "Analysis failed", description: error.message, variant: "destructive" });
    }
    setAnalyzing(false);
  };

  if (authLoading) return null;

  const fmt = (n: number) => `₹${(n || 0).toLocaleString("en-IN")}`;

  return (
    <div className="min-h-screen bg-background">
      <DashboardNav />
      <div className="container py-6 sm:py-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24 lg:pb-8">
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-primary uppercase tracking-wide mb-1">
                <Brain className="h-4 w-4" />
                <span>Regime Computation & Optimization</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                Tax Regime Analysis & Deductions
              </h1>
              <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
                Compare your tax liability under the Old and New Tax Regimes (FY 2024-25 / AY 2025-26) and optimize eligible deductions.
              </p>
            </div>
            
            <div className="flex flex-wrap gap-3">
              <Link to="/taxbuddy">
                <Button variant="outline" className="h-9 px-4 rounded-md font-semibold text-xs gap-2 border-border hover:bg-muted">
                  <Brain className="h-3.5 w-3.5 text-primary" />
                  Ask TaxBuddy AI
                </Button>
              </Link>
            </div>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Input Form */}
          <div className="space-y-6">
            <Card className="border border-border bg-card shadow-sm">
              <CardHeader className="pb-3 border-b border-border">
                <CardTitle className="text-base font-bold flex items-center gap-2 text-foreground">
                  <IndianRupee className="h-4 w-4 text-primary" />
                  Gross Income Sources
                </CardTitle>
                <CardDescription className="text-xs">Enter your gross earnings for FY 2024-25</CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {incomeFields.map((f) => (
                    <div key={f.key} className="space-y-1">
                      <Label htmlFor={f.key} className="text-xs font-semibold text-foreground">{f.label}</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold text-xs">₹</span>
                        <Input
                          id={f.key}
                          type="number"
                          value={financialData[f.key] || ""}
                          onChange={(e) => handleFieldChange(f.key, e.target.value)}
                          placeholder="0"
                          className="h-9 pl-7 text-xs"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border border-border bg-card shadow-sm">
              <CardHeader className="pb-3 border-b border-border">
                <CardTitle className="text-base font-bold flex items-center gap-2 text-foreground">
                  <TrendingDown className="h-4 w-4 text-emerald-600" />
                  Allowable Deductions & Exemptions
                </CardTitle>
                <CardDescription className="text-xs">Deductions under Section 80C, 80D, 80CCD, etc. (Old Regime)</CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {deductionFields.map((f) => (
                    <div key={f.key} className="space-y-1">
                      <Label htmlFor={f.key} className="text-xs font-semibold text-foreground line-clamp-1">{f.label}</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold text-xs">₹</span>
                        <Input
                          id={f.key}
                          type="number"
                          value={financialData[f.key] || ""}
                          onChange={(e) => handleFieldChange(f.key, e.target.value)}
                          placeholder="0"
                          className="h-9 pl-7 text-xs"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-3 pt-2">
              <Button 
                onClick={handleSave} 
                disabled={saving} 
                variant="outline"
                className="h-10 px-5 rounded-md font-semibold text-xs border-border hover:bg-muted flex-1"
              >
                {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                Save Financial Data
              </Button>
              <Button 
                onClick={handleAnalyze} 
                disabled={analyzing}
                className="h-10 px-5 rounded-md font-semibold text-xs bg-primary hover:bg-primary/90 text-white shadow-sm flex-1"
              >
                {analyzing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Brain className="h-4 w-4 mr-2" />}
                {analyzing ? "Computing Taxes..." : "Compare Regimes Now"}
              </Button>
            </div>
          </div>

          {/* Analysis Results */}
          <div className="space-y-6">
            <AnimatePresence mode="wait">
              {analysis ? (
                <div className="space-y-6">
                  <Card className="border border-border bg-card shadow-sm">
                    <CardHeader className="pb-3 border-b border-border">
                      <CardTitle className="text-base font-bold flex items-center gap-2 text-foreground">
                        <Activity className="h-4 w-4 text-primary" />
                        Tax Regime Comparison
                      </CardTitle>
                      <CardDescription className="text-xs">Assessment Year 2025-26 computation</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-5 space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className={`p-4 rounded-lg border ${analysis.recommended_regime === "old" ? "border-emerald-500 bg-emerald-50/50" : "border-border bg-muted/20"}`}>
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Old Tax Regime</p>
                          <p className="text-xl font-bold text-foreground">{fmt(analysis.old_regime_tax)}</p>
                          {analysis.recommended_regime === "old" && (
                            <span className="mt-2 inline-flex items-center gap-1 text-emerald-700 font-semibold text-[11px] bg-emerald-100 px-2 py-0.5 rounded">
                              <CheckCircle className="h-3 w-3" /> Recommended Choice
                            </span>
                          )}
                        </div>
                        <div className={`p-4 rounded-lg border ${analysis.recommended_regime === "new" ? "border-emerald-500 bg-emerald-50/50" : "border-border bg-muted/20"}`}>
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">New Tax Regime</p>
                          <p className="text-xl font-bold text-foreground">{fmt(analysis.new_regime_tax)}</p>
                          {analysis.recommended_regime === "new" && (
                            <span className="mt-2 inline-flex items-center gap-1 text-emerald-700 font-semibold text-[11px] bg-emerald-100 px-2 py-0.5 rounded">
                              <CheckCircle className="h-3 w-3" /> Recommended Choice
                            </span>
                          )}
                        </div>
                      </div>

                      {analysis.analysis_summary && (
                        <div className="p-3.5 rounded-lg bg-blue-50 border border-blue-200 text-xs text-blue-900 leading-relaxed">
                          <span className="font-bold">Regime Assessment:</span> {analysis.analysis_summary}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {analysis.deduction_suggestions?.length > 0 && (
                    <Card className="border border-border bg-card shadow-sm">
                      <CardHeader className="pb-3 border-b border-border">
                        <CardTitle className="text-base font-bold flex items-center gap-2 text-foreground">
                          <Sparkles className="h-4 w-4 text-primary" />
                          Recommended Tax Deductions
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-4 space-y-3">
                        {analysis.deduction_suggestions.map((s: any, i: number) => (
                          <div key={i} className="p-3 rounded-lg border border-border bg-muted/10">
                            <div className="flex justify-between items-start mb-1">
                              <p className="font-semibold text-xs text-foreground">{s.title}</p>
                              <span className="text-[10px] font-semibold bg-primary/10 text-primary px-2 py-0.5 rounded">{s.section}</span>
                            </div>
                            <p className="text-xs text-muted-foreground mb-2">{s.description}</p>
                            {s.potential_saving > 0 && (
                              <div className="text-emerald-700 font-semibold text-xs bg-emerald-50 px-2 py-0.5 rounded w-fit">
                                Estimated Tax Saved: {fmt(s.potential_saving)}
                              </div>
                            )}
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  )}
                </div>
              ) : (
                <Card className="border border-border/80 border-dashed bg-muted/20 h-full flex flex-col items-center justify-center p-12 text-center">
                  <Brain className="h-10 w-10 text-muted-foreground mb-3 opacity-60" />
                  <CardTitle className="text-base font-bold mb-1 text-foreground">No Computation Yet</CardTitle>
                  <p className="text-xs text-muted-foreground max-w-sm">
                    Enter your gross income and deduction amounts on the left and click "Compare Regimes Now" to see side-by-side results.
                  </p>
                </Card>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaxAnalysis;
