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
import { TiltCard } from "@/components/AdvancedUI/TiltCard";
import { Magnetic } from "@/components/AdvancedUI/Magnetic";

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
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="fixed inset-0 mesh-gradient opacity-[0.03] pointer-events-none -z-20" />
      <div className="absolute top-[-10%] right-[-10%] glow-spot -z-10" style={{ "--glow-color": "hsl(var(--primary) / 0.1)" } as any} />
      
      <DashboardNav />
      <div className="container py-12 relative z-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-primary/10 border border-primary/20 text-primary">
                  <Brain className="h-5 w-5" />
                </div>
                <span className="text-xs font-black uppercase tracking-[0.2em] text-primary">Intelligence Engine</span>
              </div>
              <h1 className="font-display text-5xl font-black text-foreground tracking-tight">Tax Synthesis</h1>
              <p className="text-muted-foreground text-xl font-medium max-w-2xl">Execute deep multi-regime analysis on your capital distribution.</p>
            </div>
            
            <div className="flex flex-wrap gap-4">
              <Link to="/taxbuddy">
                <Magnetic>
                  <Button variant="outline" className="h-14 px-8 rounded-2xl font-black gap-2 glass border-white/10 hover:bg-white/10 transition-all">
                    <Sparkles className="h-4 w-4 text-primary" />
                    Autonomous Buddy
                  </Button>
                </Magnetic>
              </Link>
            </div>
          </div>
        </motion.div>

        <div className="grid gap-12 lg:grid-cols-2">
          {/* Input Form */}
          <div className="space-y-12">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
              <TiltCard>
                <Card className="glass border-white/5 shadow-2xl relative group overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-3xl -z-10" />
                  <CardHeader>
                    <CardTitle className="font-display text-2xl font-black flex items-center gap-3">
                      <IndianRupee className="h-6 w-6 text-primary" />
                      Inflow Channels
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                      {incomeFields.map((f) => (
                        <div key={f.key} className="space-y-2 group/field">
                          <Label htmlFor={f.key} className="text-[10px] font-black uppercase tracking-widest text-muted-foreground group-focus-within/field:text-primary transition-colors">{f.label}</Label>
                          <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-black opacity-50">₹</span>
                            <Input
                              id={f.key}
                              type="number"
                              value={financialData[f.key] || ""}
                              onChange={(e) => handleFieldChange(f.key, e.target.value)}
                              placeholder="0"
                              className="h-12 pl-8 bg-white/5 border-white/10 rounded-xl font-bold focus:ring-2 ring-primary/20 focus:border-primary transition-all"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TiltCard>
            </motion.div>

            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
              <TiltCard>
                <Card className="glass border-white/5 shadow-2xl relative group overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/10 blur-3xl -z-10" />
                  <CardHeader>
                    <CardTitle className="font-display text-2xl font-black flex items-center gap-3">
                      <TrendingDown className="h-6 w-6 text-secondary" />
                      Efficiency Deductions
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                      {deductionFields.map((f) => (
                        <div key={f.key} className="space-y-2 group/field">
                          <Label htmlFor={f.key} className="text-[10px] font-black uppercase tracking-widest text-muted-foreground group-focus-within/field:text-secondary transition-colors line-clamp-1">{f.label}</Label>
                          <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-black opacity-50">₹</span>
                            <Input
                              id={f.key}
                              type="number"
                              value={financialData[f.key] || ""}
                              onChange={(e) => handleFieldChange(f.key, e.target.value)}
                              placeholder="0"
                              className="h-12 pl-8 bg-white/5 border-white/10 rounded-xl font-bold focus:ring-2 ring-secondary/20 focus:border-secondary transition-all"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TiltCard>
            </motion.div>

            <div className="flex gap-4 pt-4">
              <Magnetic>
                <Button 
                  onClick={handleSave} 
                  disabled={saving} 
                  variant="outline"
                  className="h-16 px-10 rounded-2xl font-black text-lg glass border-white/10 hover:bg-white/10 transition-all flex-1"
                >
                  {saving ? <Loader2 className="h-6 w-6 mr-3 animate-spin" /> : <Save className="h-6 w-6 mr-3" />}
                  Archive State
                </Button>
              </Magnetic>
              <Magnetic>
                <Button 
                  onClick={handleAnalyze} 
                  disabled={analyzing}
                  className="h-16 px-10 rounded-2xl font-black text-lg transition-all shadow-xl shadow-primary/20 flex-1 border-0"
                  style={{ background: "var(--gradient-primary)" }}
                >
                  {analyzing ? <Loader2 className="h-6 w-6 mr-3 animate-spin" /> : <Brain className="h-6 w-6 mr-3" />}
                  {analyzing ? "Synthesizing..." : "Execute Analysis"}
                </Button>
              </Magnetic>
            </div>
          </div>

          {/* Analysis Results */}
          <div className="space-y-8">
            <AnimatePresence mode="wait">
              {analysis ? (
                <motion.div 
                  key="results"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="space-y-8"
                >
                  <Card className="glass border-white/5 shadow-2xl overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 blur-[100px] pointer-events-none -z-10" />
                    <CardHeader>
                      <CardTitle className="font-display text-2xl font-black flex items-center gap-3">
                        <Activity className="h-6 w-6 text-primary" />
                        Regime Performance
                      </CardTitle>
                      <CardDescription className="font-bold text-muted-foreground uppercase tracking-widest text-[10px]">Comparative engine metrics</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-8">
                      <div className="grid grid-cols-2 gap-6">
                        <div className={`p-6 rounded-3xl transition-all duration-500 relative overflow-hidden ${analysis.recommended_regime === "old" ? "bg-primary/10 ring-2 ring-primary/30" : "bg-white/5 border border-white/5 opacity-60"}`}>
                          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-2">Old Architecture</p>
                          <p className="text-3xl font-black font-display text-foreground leading-none">{fmt(analysis.old_regime_tax)}</p>
                          {analysis.recommended_regime === "old" && (
                            <div className="mt-4 flex items-center gap-2 text-primary font-black text-[10px] uppercase tracking-widest bg-primary/20 px-3 py-1.5 rounded-full w-fit">
                              <CheckCircle className="h-3 w-3" /> Optimum Choice
                            </div>
                          )}
                        </div>
                        <div className={`p-6 rounded-3xl transition-all duration-500 relative overflow-hidden ${analysis.recommended_regime === "new" ? "bg-primary/10 ring-2 ring-primary/30" : "bg-white/5 border border-white/5 opacity-60"}`}>
                          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-2">New Architecture</p>
                          <p className="text-3xl font-black font-display text-foreground leading-none">{fmt(analysis.new_regime_tax)}</p>
                          {analysis.recommended_regime === "new" && (
                            <div className="mt-4 flex items-center gap-2 text-primary font-black text-[10px] uppercase tracking-widest bg-primary/20 px-3 py-1.5 rounded-full w-fit">
                              <CheckCircle className="h-3 w-3" /> Optimum Choice
                            </div>
                          )}
                        </div>
                      </div>

                      {analysis.analysis_summary && (
                        <div className="p-6 rounded-[2rem] bg-indigo-500/[0.03] border border-white/5 relative group">
                          <div className="absolute top-4 left-4 h-4 w-4 text-indigo-400 opacity-20"><Fingerprint className="h-full w-full" /></div>
                          <p className="text-sm font-medium text-muted-foreground leading-relaxed pl-6 italic">
                            "{analysis.analysis_summary}"
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {analysis.deduction_suggestions?.length > 0 && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                      <Card className="glass border-white/5 shadow-2xl relative overflow-hidden">
                        <CardHeader>
                          <CardTitle className="font-display text-2xl font-black flex items-center gap-3">
                            <Sparkles className="h-6 w-6 text-amber-500" />
                            Optimization Clusters
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {analysis.deduction_suggestions.map((s: any, i: number) => (
                            <div key={i} className="p-6 rounded-3xl glass border-white/5 hover:border-white/10 hover:bg-white/5 transition-all group overflow-hidden">
                              <div className="flex justify-between items-start mb-3">
                                <p className="font-black text-lg text-foreground group-hover:text-primary transition-colors">{s.title}</p>
                                <span className="text-[10px] font-black uppercase tracking-widest bg-primary/10 text-primary px-3 py-1 rounded-lg border border-primary/20">{s.section}</span>
                              </div>
                              <p className="text-sm font-medium text-muted-foreground leading-relaxed mb-4">{s.description}</p>
                              {s.potential_saving > 0 && (
                                <div className="flex items-center gap-2 text-green-600 dark:text-green-400 font-bold text-sm bg-green-500/10 px-4 py-2 rounded-xl w-fit">
                                  <PieChart className="h-4 w-4" />
                                  Delta Gain: {fmt(s.potential_saving)}
                                </div>
                              )}
                            </div>
                          ))}
                        </CardContent>
                      </Card>
                    </motion.div>
                  )}
                </motion.div>
              ) : (
                <motion.div 
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="h-full"
                >
                  <Card className="glass border-white/5 shadow-2xl h-full flex flex-col items-center justify-center p-20 text-center relative overflow-hidden border-dashed">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary/5 blur-[100px] pointer-events-none" />
                    <div className="relative mb-8">
                      <div className="absolute inset-0 bg-primary/20 blur-2xl animate-pulse" />
                      <div className="relative h-24 w-24 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                        <Brain className="h-12 w-12 text-primary opacity-50" />
                      </div>
                    </div>
                    <CardTitle className="font-display text-3xl font-black mb-4">Neural Engine Offline</CardTitle>
                    <p className="text-muted-foreground text-lg font-medium max-w-sm mb-0">
                      Synchronize your financial signals and initiate a synthesis cycle to generate intelligence reports.
                    </p>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaxAnalysis;
