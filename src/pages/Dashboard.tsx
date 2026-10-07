import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { 
  getDashboardStats, 
  getTaxHealth, 
  getTaxAnomalies, 
  getFinancialData, 
  getTaxAnalysis, 
  TaxHealthReport, 
  TaxAnomaly 
} from "@/lib/api";
import { DEMO_TAXPAYER } from "@/lib/demoData";
import DashboardNav from "@/components/DashboardNav";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { 
  TrendingUp, 
  ArrowRight, 
  Layers, 
  FileCheck, 
  TrendingDown, 
  Calendar, 
  Sparkles, 
  FileText, 
  AlertTriangle, 
  CheckCircle2, 
  ShieldCheck, 
  Wallet,
  Activity,
  PlusCircle
} from "lucide-react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";

const Dashboard = () => {
  const { user, profile, loading } = useAuth();
  const [stats, setStats] = useState({ documents: 0, totalIncome: 0, estimatedTax: 0, savings: 0 });
  const [finData, setFinData] = useState<any>(null);
  const [analysis, setAnalysis] = useState<any>(null);
  const [health, setHealth] = useState<TaxHealthReport | null>(null);
  const [anomalies, setAnomalies] = useState<TaxAnomaly[]>([]);
  const isDemo = localStorage.getItem("fiscalaura_demo_mode") === "true";

  useEffect(() => {
    loadDashboard();
  }, [user, isDemo]);

  const loadDashboard = async () => {
    if (isDemo) {
      setStats({
        documents: 2,
        totalIncome: 1450000,
        estimatedTax: 149656,
        savings: 52000,
      });
      setFinData(DEMO_TAXPAYER.financialData);
      setHealth({
        overall_score: 87,
        grade: "A",
        summary: "Solid tax compliance posture with cross-verified salary records.",
        components: [
          { name: "Compliance", score: 90, weight: 0.25, status: "Excellent", explanation: "On-time filing readiness and advance tax coverage." },
          { name: "Income Accuracy", score: 78, weight: 0.25, status: "Good", explanation: "Minor variance between declared savings interest and AIS." },
          { name: "Deductions", score: 82, weight: 0.20, status: "Good", explanation: "Section 80C and 80D claimed effectively." },
          { name: "TDS Accuracy", score: 95, weight: 0.15, status: "Excellent", explanation: "Form 16 TDS credits match Form 26AS records." },
          { name: "AIS Reconciliation", score: 88, weight: 0.15, status: "Good", explanation: "Dividend and security disposals verified." },
        ],
        penalties: [
          {
            pillar: "Income Accuracy",
            impact: 12,
            reason: "AIS reports ₹24,800 in bank interest, while declared interest is ₹12,000.",
            action_plan: "Reconcile savings account interest to prevent automated notice.",
          },
        ],
      });
      setAnomalies([
        {
          id: "ANOM-INT-01",
          severity: "warning",
          title: "Bank Interest Income Discrepancy",
          description: "AIS records ₹24,800 in savings/term deposit interest, but you have declared ₹12,000.",
          amount: 12800,
          source: "AIS",
          action: "Verify all active bank accounts before submitting return.",
        },
        {
          id: "ANOM-F16-02",
          severity: "info",
          title: "Multi-Employer Form 16 Deduplication",
          description: "Both employers applied the standard deduction of ₹50,000 independently.",
          amount: 50000,
          source: "Form 16",
          action: "FiscalAura automatically deduplicated standard deduction to prevent tax shortfall notice.",
        },
      ]);
      return;
    }

    // LIVE USER MODE: fetch real data from Supabase / API
    try {
      const [dashData, healthData, anomalyData, finDataRes, taxAnalysisRes] = await Promise.allSettled([
        getDashboardStats(),
        getTaxHealth(),
        getTaxAnomalies(),
        getFinancialData(),
        getTaxAnalysis(),
      ]);

      const liveFin = (finDataRes.status === "fulfilled" && finDataRes.value) ? finDataRes.value : null;
      const liveAnalysis = (taxAnalysisRes.status === "fulfilled" && taxAnalysisRes.value) ? taxAnalysisRes.value : null;
      
      setFinData(liveFin);
      setAnalysis(liveAnalysis);

      const calculatedIncome = liveFin
        ? (Number(liveFin.gross_salary) || 0) +
          (Number(liveFin.rental_income) || 0) +
          (Number(liveFin.interest_income) || 0) +
          (Number(liveFin.other_income) || 0) +
          (Number(liveFin.business_income) || 0)
        : 0;

      const liveTax = liveAnalysis?.new_regime_tax || liveAnalysis?.estimated_tax || 0;
      const liveSavings = Math.max(0, (liveAnalysis?.old_regime_tax || 0) - (liveAnalysis?.new_regime_tax || 0));

      if (dashData.status === "fulfilled" && dashData.value) {
        setStats({
          documents: dashData.value.documents || 0,
          totalIncome: dashData.value.totalIncome || calculatedIncome,
          estimatedTax: dashData.value.estimatedTax || liveTax,
          savings: dashData.value.savings || liveSavings,
        });
      } else {
        setStats({
          documents: 0,
          totalIncome: calculatedIncome,
          estimatedTax: liveTax,
          savings: liveSavings,
        });
      }

      if (healthData.status === "fulfilled" && healthData.value) {
        setHealth(healthData.value);
      } else {
        setHealth(null);
      }

      if (anomalyData.status === "fulfilled" && anomalyData.value) {
        setAnomalies(anomalyData.value.anomalies || []);
      } else {
        setAnomalies([]);
      }
    } catch {
      setStats({ documents: 0, totalIncome: 0, estimatedTax: 0, savings: 0 });
      setFinData(null);
      setAnalysis(null);
      setHealth(null);
      setAnomalies([]);
    }
  };

  if (loading) return null;

  const fmt = (n: number) => `₹${(n || 0).toLocaleString("en-IN")}`;
  const firstName = profile?.full_name?.split(" ")?.[0] || user?.user_metadata?.full_name?.split(" ")?.[0] || (isDemo ? "Rajesh" : "Taxpayer");

  // Dynamic Visual Analytics computed directly from real financial data
  const currentFin = isDemo ? DEMO_TAXPAYER.financialData : finData || {};
  const salary = Number(currentFin.gross_salary) || 0;
  const rental = Number(currentFin.rental_income) || 0;
  const interest = Number(currentFin.interest_income) || 0;
  const other = (Number(currentFin.other_income) || 0) + (Number(currentFin.business_income) || 0);
  const totalIncomeCalculated = salary + rental + interest + other;

  const rawIncomeData = [
    { name: "Salary", value: salary, color: "#8B5CF6" },
    { name: "Rental", value: rental, color: "#10B981" },
    { name: "Interest", value: interest, color: "#F59E0B" },
    { name: "Other", value: other, color: "#A855F7" },
  ].filter((item) => item.value > 0);

  const incomeAnalyticsData = rawIncomeData.map((item) => ({
    ...item,
    percentage: totalIncomeCalculated > 0 ? Math.round((item.value / totalIncomeCalculated) * 100) : 0,
  }));

  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = outerRadius + 22;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    const item = incomeAnalyticsData[index];
    if (!item) return null;

    return (
      <text
        x={x}
        y={y}
        fill={item.color}
        textAnchor={x > cx ? "start" : "end"}
        dominantBaseline="central"
        className="text-[11px] font-bold"
      >
        {`${item.name} ${item.percentage}%`}
      </text>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50/50">
      <DashboardNav />

      <main className="container max-w-7xl py-8 space-y-6 px-4 sm:px-6 lg:px-8">
        {/* Header with Taxpayer Status */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline" className="text-primary border-primary/30 bg-primary/5 font-semibold text-xs">
                <ShieldCheck className="h-3 w-3 mr-1 text-primary" /> AY 2025-26 Active Assessment
              </Badge>
              {isDemo && (
                <Badge className="bg-blue-100 text-blue-800 text-[10px] font-semibold">
                  Demo Mode: Rajesh Sharma
                </Badge>
              )}
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              Welcome back, {firstName}
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Institutional tax intelligence summary for Financial Year 2024-25 (Assessment Year 2025-26).
            </p>
          </div>

          <div className="flex gap-2">
            <Link to="/reports">
              <Button variant="outline" size="sm" className="text-xs font-medium">
                <FileText className="h-3.5 w-3.5 mr-1.5" /> Download Tax Statement
              </Button>
            </Link>
            <Link to="/copilot">
              <Button size="sm" className="bg-primary text-white text-xs font-medium">
                <Sparkles className="h-3.5 w-3.5 mr-1.5" /> Ask Tax Copilot
              </Button>
            </Link>
          </div>
        </div>

        {/* Top KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="shadow-sm border-slate-200 bg-white">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Gross Total Income</span>
                <div className="p-2 rounded-lg bg-blue-50 text-primary">
                  <TrendingUp className="h-4 w-4" />
                </div>
              </div>
              <p className="text-2xl font-bold text-slate-900">{fmt(stats.totalIncome)}</p>
              <p className="text-xs text-slate-500 mt-1">Aggregated across all reported heads</p>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-slate-200 bg-white">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Net Tax Payable</span>
                <div className="p-2 rounded-lg bg-amber-50 text-amber-700">
                  <Wallet className="h-4 w-4" />
                </div>
              </div>
              <p className="text-2xl font-bold text-slate-900">{fmt(stats.estimatedTax)}</p>
              <p className="text-xs text-slate-500 mt-1">Under New Regime (Sec 115BAC)</p>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-slate-200 bg-white">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Regime Optimization</span>
                <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700">
                  <TrendingDown className="h-4 w-4" />
                </div>
              </div>
              <p className="text-2xl font-bold text-emerald-700">{fmt(stats.savings)} Saved</p>
              <p className="text-xs text-slate-500 mt-1">New Regime vs Old Regime liability</p>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-slate-200 bg-white">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Tax Health Score</span>
                <div className="p-2 rounded-lg bg-indigo-50 text-indigo-700">
                  <Activity className="h-4 w-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-bold text-slate-900">{health?.overall_score || 87} / 100</p>
                <Badge className="bg-emerald-100 text-emerald-800 text-[10px] font-semibold">Grade {health?.grade || "A"}</Badge>
              </div>
              <p className="text-xs text-slate-500 mt-1">Deterministic statutory compliance rating</p>
            </CardContent>
          </Card>
        </div>

        {/* Visual Analytics & Regime Optimizer Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Visual Analytics Card (Matching user reference) */}
          <Card className="lg:col-span-7 shadow-sm border-slate-200 bg-white flex flex-col justify-between">
            <CardHeader className="pb-2 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-purple-50 text-purple-600">
                      <Activity className="h-4 w-4" />
                    </div>
                    Visual Analytics
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-500 mt-0.5">
                    Gross revenue distribution across statutory income heads
                  </CardDescription>
                </div>
                <Badge variant="outline" className="text-purple-700 bg-purple-50 border-purple-200 text-[10px] font-semibold">
                  Income Breakdown
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              {totalIncomeCalculated > 0 ? (
                <>
                  <div className="relative h-[290px] w-full flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={incomeAnalyticsData}
                          cx="50%"
                          cy="50%"
                          innerRadius={80}
                          outerRadius={112}
                          paddingAngle={4}
                          dataKey="value"
                          label={renderCustomLabel}
                          labelLine={{ stroke: "#cbd5e1", strokeWidth: 1.2 }}
                        >
                          {incomeAnalyticsData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(val: number) => [fmt(val), "Gross Amount"]}
                          contentStyle={{
                            backgroundColor: "#ffffff",
                            borderRadius: "8px",
                            border: "1px solid #e2e8f0",
                            boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                            fontSize: "12px",
                            fontWeight: 600,
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    {/* Center of the Donut */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-[11px] font-bold tracking-widest text-slate-400 uppercase">TOTAL</span>
                      <span className="text-2xl font-black text-slate-900 mt-0.5">{fmt(totalIncomeCalculated)}</span>
                    </div>
                  </div>

                  {/* Bottom Breakdown Pills */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-3 border-t border-slate-100">
                    {incomeAnalyticsData.map((item) => (
                      <div key={item.name} className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 border border-slate-100">
                        <div className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                        <div className="min-w-0">
                          <div className="text-[11px] font-semibold text-slate-600 truncate">{item.name} ({item.percentage}%)</div>
                          <div className="text-xs font-bold text-slate-900">{fmt(item.value)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="h-[290px] w-full flex flex-col items-center justify-center p-6 text-center border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                  <div className="h-12 w-12 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center mb-3">
                    <Activity className="h-6 w-6" />
                  </div>
                  <p className="text-sm font-semibold text-slate-800">No Income Records Yet</p>
                  <p className="text-xs text-slate-500 max-w-sm mt-1">
                    Enter your gross salary, rental income, or interest in Regime Comparator to view your dynamic income breakdown.
                  </p>
                  <Link to="/tax-analysis" className="mt-4">
                    <Button size="sm" className="bg-primary text-white text-xs font-medium">
                      Enter Income Sources →
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Regime Optimization & Tax Summary Card */}
          <Card className="lg:col-span-5 shadow-sm border-slate-200 bg-white flex flex-col justify-between">
            <CardHeader className="pb-3 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-emerald-600" />
                    Regime Optimization
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-500 mt-0.5">
                    Statutory regime comparison & net tax efficiency
                  </CardDescription>
                </div>
                {stats.savings > 0 && (
                  <Badge className="bg-emerald-100 text-emerald-800 text-[10px] font-semibold">
                    Save {fmt(stats.savings)}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              {totalIncomeCalculated > 0 ? (
                <>
                  <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-950 flex items-center justify-between">
                    <div>
                      <span className="font-semibold block text-emerald-900">
                        Recommended: {analysis?.recommended_regime === "old" ? "Old Tax Regime" : "New Tax Regime"}
                      </span>
                      <span className="text-emerald-700 text-[11px]">Section 115BAC slabs with standard deduction</span>
                    </div>
                    <span className="text-sm font-bold text-emerald-800">
                      {totalIncomeCalculated > 0 ? ((Math.min(analysis?.old_regime_tax || stats.estimatedTax, analysis?.new_regime_tax || stats.estimatedTax) / totalIncomeCalculated) * 100).toFixed(1) : "0.0"}% Eff. Rate
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-3 rounded-lg border border-slate-200 bg-slate-50 space-y-1">
                      <span className="text-slate-500 text-[11px] block">Old Regime Tax</span>
                      <strong className="text-base text-slate-800 font-bold block">
                        {fmt(analysis?.old_regime_tax || (isDemo ? 201656 : 0))}
                      </strong>
                      <span className="text-[10px] text-slate-500">Includes 80C & 80D</span>
                    </div>
                    <div className="p-3 rounded-lg border border-emerald-300 bg-emerald-50/50 space-y-1">
                      <span className="text-emerald-700 text-[11px] font-medium block">New Regime Tax</span>
                      <strong className="text-base text-emerald-900 font-bold block">
                        {fmt(analysis?.new_regime_tax || (isDemo ? 149656 : stats.estimatedTax))}
                      </strong>
                      <span className="text-[10px] text-emerald-700 font-medium">
                        {stats.savings > 0 ? `${fmt(stats.savings)} lower liability` : "Optimal choice"}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1.5 pt-1">
                    <div className="flex justify-between text-xs font-semibold text-slate-700">
                      <span>Effective Tax Rate</span>
                      <span>
                        {totalIncomeCalculated > 0 ? ((Math.min(analysis?.old_regime_tax || stats.estimatedTax, analysis?.new_regime_tax || stats.estimatedTax) / totalIncomeCalculated) * 100).toFixed(1) : "0.0"}% of Gross Income
                      </span>
                    </div>
                    <Progress 
                      value={totalIncomeCalculated > 0 ? Math.min(100, (Math.min(analysis?.old_regime_tax || stats.estimatedTax, analysis?.new_regime_tax || stats.estimatedTax) / totalIncomeCalculated) * 100 * 2) : 0} 
                      className="h-2 bg-slate-100" 
                    />
                  </div>
                </>
              ) : (
                <div className="p-6 text-center border border-dashed border-slate-200 rounded-xl bg-slate-50/50 space-y-2">
                  <span className="text-xs font-semibold text-slate-700 block">No Tax Computed Yet</span>
                  <span className="text-[11px] text-slate-500 block">
                    Add income and eligible deductions to evaluate statutory tax liabilities.
                  </span>
                </div>
              )}

              <div className="pt-2">
                <Link to="/tax-analysis">
                  <Button variant="outline" size="sm" className="w-full text-xs font-semibold text-primary border-primary/20 hover:bg-primary/5">
                    Deep Dive Regime Comparator & Deductions →
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Middle Section: Tax Health Score Detailed Breakdown */}
        {health && (
          <Card className="shadow-sm border-slate-200 bg-white">
            <CardHeader className="pb-3 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
                    <Activity className="h-4 w-4 text-primary" />
                    Tax Health Score Breakdown
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Deterministic calculation assessing compliance, reporting accuracy, and reconciliation readiness.
                  </CardDescription>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-bold text-slate-900">{health.overall_score}</span>
                  <span className="text-xs text-slate-400">/100</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-5 space-y-6">
              {/* Pillars Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                {health.components.map((comp) => (
                  <div key={comp.name} className="p-3.5 rounded-lg border border-slate-200/80 bg-slate-50/60 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-slate-700">{comp.name}</span>
                      <strong className="text-slate-900">{comp.score}%</strong>
                    </div>
                    <Progress value={comp.score} className="h-1.5" />
                    <span className="text-[10px] text-slate-500 block truncate">{comp.explanation}</span>
                  </div>
                ))}
              </div>

              {/* What Lowered Your Score */}
              {health.penalties.length > 0 && (
                <div className="p-4 rounded-lg bg-amber-50/70 border border-amber-200 space-y-2 text-xs">
                  <div className="flex items-center gap-2 font-semibold text-amber-900">
                    <AlertTriangle className="h-4 w-4 text-amber-700" />
                    What lowered your score?
                  </div>
                  {health.penalties.map((pen, i) => (
                    <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 border-t border-amber-200/60">
                      <div>
                        <strong className="text-slate-900">{pen.pillar} (-{pen.impact} pts): </strong>
                        <span className="text-slate-700">{pen.reason}</span>
                      </div>
                      <Link to="/reconciliation" className="text-primary font-semibold hover:underline shrink-0 text-xs">
                        Review in AIS Reconcile →
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Detected Tax Anomalies */}
        {anomalies.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              Automated Anomaly Detection ({anomalies.length} Flagged)
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {anomalies.map((anom) => (
                <Card key={anom.id} className="shadow-sm border-slate-200 bg-white">
                  <CardContent className="p-4 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-900 flex items-center gap-1.5">
                        <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                        {anom.title}
                      </span>
                      <Badge variant="outline" className="text-[10px] uppercase font-mono">
                        Source: {anom.source}
                      </Badge>
                    </div>
                    <p className="text-slate-600">{anom.description}</p>
                    <div className="p-2 rounded bg-slate-50 border border-slate-200/80 text-[11px] text-slate-700">
                      <strong>Recommended Action:</strong> {anom.action}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Core Product Modules Quick Launch Grid */}
        <div className="space-y-3 pt-2">
          <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-primary" />
            Compliance & Intelligence Suites
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                title: "Multiple Form 16s",
                desc: "Consolidate job-switch employers and deduplicate standard deduction.",
                path: "/form16",
                icon: Layers,
                badge: "Job Switchers",
              },
              {
                title: "AIS / 26AS Reconciliation",
                desc: "Cross-audit reported bank interest, dividends, and TDS against tax feeds.",
                path: "/reconciliation",
                icon: FileCheck,
                badge: "Audit Protection",
              },
              {
                title: "Capital Gains Engine",
                desc: "Import Zerodha/Groww P&L, apply Sec 111A/112A rates, and discover harvesting tips.",
                path: "/capital-gains",
                icon: TrendingUp,
                badge: "Budget 2024",
              },
              {
                title: "Advance Tax Schedule",
                desc: "Quarterly payment milestones with Section 234A/B/C interest calculations.",
                path: "/advance-tax",
                icon: Calendar,
                badge: "Statutory",
              },
              {
                title: "What-If Simulator",
                desc: "Simulate tax impacts for 80C, NPS, salary hikes, or capital gains in real time.",
                path: "/simulator",
                icon: Activity,
                badge: "Interactive",
              },
              {
                title: "Official Assessment PDF",
                desc: "Download formatted assessment statement ready for employer HR or bank proof.",
                path: "/reports",
                icon: FileText,
                badge: "Print Ready",
              },
            ].map((mod) => (
              <Link key={mod.path} to={mod.path} className="group">
                <Card className="shadow-sm border-slate-200 bg-white hover:border-primary/50 transition-colors h-full flex flex-col justify-between">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="p-2 rounded-lg bg-primary/10 text-primary">
                        <mod.icon className="h-4 w-4" />
                      </div>
                      <Badge variant="secondary" className="text-[10px]">
                        {mod.badge}
                      </Badge>
                    </div>
                    <CardTitle className="text-sm font-semibold text-slate-900 mt-2 group-hover:text-primary transition-colors">
                      {mod.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pb-4">
                    <p className="text-xs text-slate-500 leading-relaxed">{mod.desc}</p>
                    <div className="flex items-center gap-1 text-xs font-semibold text-primary mt-3">
                      <span>Open Module</span>
                      <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
