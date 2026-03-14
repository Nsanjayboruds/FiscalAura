import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { getFinancialData, getTaxAnalysis } from "@/lib/api";
import DashboardNav from "@/components/DashboardNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import { IndianRupee, TrendingUp, TrendingDown, FileText, CheckCircle, Calculator, PieChart, Layers, ShieldCheck, Wallet } from "lucide-react";
import { TiltCard } from "@/components/AdvancedUI/TiltCard";

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
      // Not available yet
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
    { label: "Rental Income", value: financialData?.rental_income || 0 },
    { label: "Interest Income", value: financialData?.interest_income || 0 },
    { label: "Other Income", value: financialData?.other_income || 0 },
    { label: "Business Income", value: financialData?.business_income || 0 },
  ].filter((i) => i.value > 0);

  const deductionItems = [
    { label: "Section 80C", value: financialData?.deductions_80c || 0 },
    { label: "Section 80D (Health)", value: financialData?.deductions_80d || 0 },
    { label: "Section 80E (Education)", value: financialData?.deductions_80e || 0 },
    { label: "Section 80G (Donations)", value: financialData?.deductions_80g || 0 },
    { label: "NPS (80CCD)", value: financialData?.deductions_nps || 0 },
    { label: "HRA Exemption", value: financialData?.deductions_hra || 0 },
    { label: "LTA Exemption", value: financialData?.deductions_lta || 0 },
    { label: "Other Deductions", value: financialData?.other_deductions || 0 },
  ].filter((i) => i.value > 0);

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="fixed inset-0 mesh-gradient opacity-[0.03] pointer-events-none -z-20" />
      <div className="absolute top-[-5%] left-[-5%] glow-spot -z-10" style={{ "--glow-color": "hsl(var(--primary) / 0.1)" } as any} />
      
      <DashboardNav />
      <div className="container py-12 max-w-4xl relative z-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-xl bg-primary/10 border border-primary/20 text-primary">
              <Calculator className="h-5 w-5" />
            </div>
            <span className="text-xs font-black uppercase tracking-[0.2em] text-primary">Consolidated View</span>
          </div>
          <h1 className="font-display text-5xl font-black text-foreground mb-3 tracking-tight">Fiscal Summary</h1>
          <p className="text-muted-foreground text-xl mb-12 font-medium">High-level architectural audit of your financial state for FY 2025-26.</p>
        </motion.div>

        {!financialData && !analysis ? (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
            <Card className="glass border-white/5 shadow-2xl p-20 text-center relative overflow-hidden border-dashed">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary/5 blur-[100px] pointer-events-none" />
              <FileText className="h-16 w-16 mx-auto mb-6 text-primary opacity-30" />
              <CardTitle className="font-display text-3xl font-black mb-4">No Signal Detected</CardTitle>
              <p className="text-muted-foreground text-lg font-medium max-w-sm mx-auto">
                Initiate a data ingestion cycle in the Analysis hub to populate your fiscal summary.
              </p>
            </Card>
          </motion.div>
        ) : (
          <div className="space-y-12">
            {/* Total summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { label: "Liquid Inflow", value: totalIncome, icon: TrendingUp, color: "secondary" },
                { label: "Exemption Delta", value: totalDeductions, icon: TrendingDown, color: "primary" },
                { label: "Net Tax Liability", value: analysis ? Math.min(analysis.old_regime_tax || 0, analysis.new_regime_tax || 0) : 0, icon: Wallet, color: "accent" }
              ].map((stat, i) => (
                <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + (i * 0.1) }}>
                  <TiltCard>
                    <Card className="glass border-white/5 shadow-xl group overflow-hidden">
                      <div className={`absolute top-0 right-0 w-24 h-24 bg-${stat.color}/10 blur-3xl -z-10 group-hover:bg-${stat.color}/20 transition-colors`} />
                      <CardContent className="p-8 text-center">
                        <stat.icon className={`h-8 w-8 text-${stat.color} mx-auto mb-4 group-hover:scale-110 transition-transform`} />
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2">{stat.label}</p>
                        <p className="text-3xl font-black font-display text-foreground">{stat.value === 0 && stat.label.includes("Tax") ? "—" : fmt(stat.value)}</p>
                      </CardContent>
                    </Card>
                  </TiltCard>
                </motion.div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Income breakdown */}
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}>
                <Card className="glass border-white/5 shadow-2xl h-full overflow-hidden relative">
                  <div className="absolute top-0 left-0 w-32 h-32 bg-secondary/5 blur-3xl" />
                  <CardHeader>
                    <CardTitle className="font-display text-2xl font-black flex items-center gap-3">
                      <PieChart className="h-6 w-6 text-secondary" />
                      Inflow Segments
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      {incomeItems.map((item, i) => (
                        <motion.div 
                          key={item.label} 
                          initial={{ opacity: 0, x: -10 }} 
                          animate={{ opacity: 1, x: 0 }} 
                          transition={{ delay: 0.5 + (i * 0.05) }}
                          className="flex justify-between items-center p-3 rounded-2xl bg-white/5 border border-white/5 group hover:bg-white/10 transition-colors"
                        >
                          <span className="text-sm font-bold text-muted-foreground group-hover:text-foreground transition-colors">{item.label}</span>
                          <span className="text-sm font-black text-foreground">{fmt(item.value)}</span>
                        </motion.div>
                      ))}
                      <div className="flex justify-between items-center p-4 mt-6 rounded-2xl border-2 border-primary/20 bg-primary/5">
                        <span className="text-sm font-black uppercase tracking-widest text-primary">Aggregate Total</span>
                        <span className="text-lg font-black text-primary font-display">{fmt(totalIncome)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Deductions breakdown */}
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }}>
                <Card className="glass border-white/5 shadow-2xl h-full overflow-hidden relative">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl" />
                  <CardHeader>
                    <CardTitle className="font-display text-2xl font-black flex items-center gap-3">
                      <Layers className="h-6 w-6 text-primary" />
                      Efficiency Clusters
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      {deductionItems.length > 0 ? (
                        deductionItems.map((item, i) => (
                          <motion.div 
                            key={item.label} 
                            initial={{ opacity: 0, x: 10 }} 
                            animate={{ opacity: 1, x: 0 }} 
                            transition={{ delay: 0.6 + (i * 0.05) }}
                            className="flex justify-between items-center p-3 rounded-2xl bg-white/5 border border-white/5 group hover:bg-white/10 transition-colors"
                          >
                            <span className="text-sm font-bold text-muted-foreground group-hover:text-foreground transition-colors">{item.label}</span>
                            <span className="text-sm font-black text-foreground">{fmt(item.value)}</span>
                          </motion.div>
                        ))
                      ) : (
                        <p className="text-center py-8 text-sm font-bold text-muted-foreground italic opacity-50">No efficiency vectors indexed.</p>
                      )}
                      <div className="flex justify-between items-center p-4 mt-6 rounded-2xl border-2 border-secondary/20 bg-secondary/5">
                        <span className="text-sm font-black uppercase tracking-widest text-secondary">Aggregate Savings</span>
                        <span className="text-lg font-black text-secondary font-display">{fmt(totalDeductions)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Regime comparison */}
            {analysis && (
              <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>
                <Card className="glass border-primary/20 shadow-2xl overflow-hidden relative">
                  <div className="absolute inset-0 bg-primary/[0.02] pointer-events-none" />
                  <CardHeader>
                    <CardTitle className="font-display text-2xl font-black flex items-center gap-3">
                      <ShieldCheck className="h-6 w-6 text-primary" />
                      Optimal Regime Protocol
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-8">
                    <div className="grid grid-cols-2 gap-8">
                      <div className={`p-8 rounded-[2.5rem] transition-all duration-700 relative overflow-hidden ${analysis.recommended_regime === "old" ? "bg-primary/10 ring-2 ring-primary/40" : "bg-white/5 border border-white/5 opacity-40 grayscale"}`}>
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] mb-3">Legacy Framework</p>
                        <p className="text-4xl font-black font-display text-foreground">{fmt(analysis.old_regime_tax)}</p>
                        {analysis.recommended_regime === "old" && (
                          <div className="mt-6 flex items-center gap-2 text-primary font-black text-[10px] uppercase tracking-widest bg-primary/20 px-4 py-2 rounded-full w-fit">
                            <CheckCircle className="h-3.3 w-3.3" /> System Recommended
                          </div>
                        )}
                      </div>
                      <div className={`p-8 rounded-[2.5rem] transition-all duration-700 relative overflow-hidden ${analysis.recommended_regime === "new" ? "bg-primary/10 ring-2 ring-primary/40" : "bg-white/5 border border-white/5 opacity-40 grayscale"}`}>
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] mb-3">Next-Gen Architecture</p>
                        <p className="text-4xl font-black font-display text-foreground">{fmt(analysis.new_regime_tax)}</p>
                        {analysis.recommended_regime === "new" && (
                          <div className="mt-6 flex items-center gap-2 text-primary font-black text-[10px] uppercase tracking-widest bg-primary/20 px-4 py-2 rounded-full w-fit">
                            <CheckCircle className="h-3.3 w-3.3" /> System Recommended
                          </div>
                        )}
                      </div>
                    </div>

                    {analysis.analysis_summary && (
                      <div className="p-8 rounded-[2.5rem] bg-indigo-500/[0.03] border border-white/5 relative group">
                        <div className="absolute top-6 left-6 h-5 w-5 text-indigo-400 opacity-20"><ShieldCheck className="h-full w-full" /></div>
                        <p className="text-base font-medium text-muted-foreground leading-relaxed pl-8 italic">
                          "{analysis.analysis_summary}"
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TaxSummary;
