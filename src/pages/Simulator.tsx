import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { getFinancialData } from "@/lib/api";
import DashboardNav from "@/components/DashboardNav";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Activity, ShieldCheck, TrendingDown, ArrowRight } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from "recharts";

const calculateOldRegime = (income: number, deductions: number) => {
  const taxable = Math.max(0, income - deductions);
  let tax = 0;
  if (taxable <= 250000) return 0;
  
  if (taxable > 250000) tax += Math.min(250000, taxable - 250000) * 0.05;
  if (taxable > 500000) tax += Math.min(500000, taxable - 500000) * 0.20;
  if (taxable > 1000000) tax += (taxable - 1000000) * 0.30;
  
  // 87A rebate
  if (taxable <= 500000) tax = Math.max(0, tax - 12500);
  
  return tax * 1.04; // 4% Health & Education Cess
};

const calculateNewRegime = (income: number) => {
  // Standard deduction for FY 24-25
  const taxable = Math.max(0, income - 75000);
  let tax = 0;
  if (taxable <= 300000) return 0;
  
  if (taxable > 300000) tax += Math.min(300000, taxable - 300000) * 0.05;
  if (taxable > 600000) tax += Math.min(300000, taxable - 600000) * 0.10;
  if (taxable > 900000) tax += Math.min(300000, taxable - 900000) * 0.15;
  if (taxable > 1200000) tax += Math.min(300000, taxable - 1200000) * 0.20;
  if (taxable > 1500000) tax += (taxable - 1500000) * 0.30;
  
  // 87A rebate
  if (taxable <= 700000) tax = Math.max(0, tax - 25000);
  
  return tax * 1.04; // Cess
};

const Simulator = () => {
  const { user, loading: authLoading } = useAuth();
  const [baseIncome, setBaseIncome] = useState(1200000);
  const [baseDeductions, setBaseDeductions] = useState(50000);
  
  // Simulated additions
  const [sim80C, setSim80C] = useState(0);
  const [simNPS, setSimNPS] = useState(0);
  const [simMedical, setSimMedical] = useState(0);

  useEffect(() => {
    if (user) loadData();
  }, [user]);

  const loadData = async () => {
    try {
      const data = await getFinancialData();
      if (data) {
        const income = (data.gross_salary || 0) + (data.other_income || 0) + (data.business_income || 0);
        const deductions = (data.deductions_80c || 0) + (data.deductions_80d || 0) + (data.deductions_80e || 0) + (data.deductions_nps || 0);
        if (income > 0) setBaseIncome(income);
        if (deductions > 0) setBaseDeductions(deductions);
      }
    } catch {
      // Keep defaults
    }
  };

  if (authLoading) return null;

  const totalSimulatedDeductions = baseDeductions + sim80C + simNPS + simMedical;
  const oldTax = Math.round(calculateOldRegime(baseIncome, totalSimulatedDeductions));
  const newTax = Math.round(calculateNewRegime(baseIncome));

  const chartData = [
    {
      name: "Old Regime",
      tax: oldTax,
      fill: "#1D4ED8"
    },
    {
      name: "New Regime",
      tax: newTax,
      fill: "#059669"
    }
  ];

  const fmt = (n: number) => `₹${n.toLocaleString("en-IN")}`;

  return (
    <div className="min-h-screen bg-slate-50/50">
      <DashboardNav />
      <main className="container max-w-7xl py-6 sm:py-8 space-y-6 px-4 sm:px-6 lg:px-8 pb-24 lg:pb-8">
        {/* Header */}
        <div className="border-b pb-5">
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className="text-primary border-primary/30 bg-primary/5 font-semibold text-xs">
              <Activity className="h-3 w-3 mr-1" /> Tax Simulator
            </Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">Tax Regime & Savings Simulator</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
            Simulate your net tax liability in real time. Adjust your investments in 80C, 80CCD (NPS), and 80D to see whether the Old or New Regime saves more money.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Chart Card */}
          <div className="lg:col-span-7">
            <Card className="shadow-sm border-slate-200 bg-white h-full flex flex-col justify-between">
              <CardHeader className="border-b pb-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-primary" />
                      Net Tax Payable Comparison
                    </CardTitle>
                    <CardDescription className="text-xs">Based on simulated allowable deductions</CardDescription>
                  </div>
                  <Badge variant={oldTax <= newTax ? "default" : "secondary"} className="text-xs font-semibold self-start sm:self-auto">
                    {oldTax <= newTax ? "Old Regime Saves More" : "New Regime Saves More"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="h-[280px] sm:h-[320px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 20, right: 30, left: 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                      <XAxis dataKey="name" stroke="#64748B" tick={{ fill: '#334155', fontWeight: 600, fontSize: 13 }} />
                      <YAxis stroke="#64748B" tick={{ fill: '#64748B', fontSize: 12 }} tickFormatter={(val) => `₹${val/1000}k`} />
                      <Tooltip 
                        cursor={{ fill: 'rgba(0, 0, 0, 0.03)' }}
                        contentStyle={{ 
                          backgroundColor: '#ffffff', 
                          borderRadius: '8px',
                          border: '1px solid #CBD5E1',
                          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                          color: '#0F172A',
                          fontSize: '12px'
                        }}
                        formatter={(val: number) => [fmt(val), "Estimated Tax Liability"]}
                      />
                      <Bar dataKey="tax" radius={[6, 6, 0, 0]} maxBarSize={70}>
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className={`p-4 rounded-lg border ${oldTax <= newTax ? "bg-blue-50 border-blue-200" : "bg-slate-50 border-slate-200"}`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold uppercase text-slate-500">Old Tax Regime</span>
                      {oldTax <= newTax && <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded">Better</span>}
                    </div>
                    <p className="text-2xl font-bold text-slate-900">{fmt(oldTax)}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">With ₹{totalSimulatedDeductions.toLocaleString("en-IN")} deductions</p>
                  </div>

                  <div className={`p-4 rounded-lg border ${newTax < oldTax ? "bg-emerald-50 border-emerald-200" : "bg-slate-50 border-slate-200"}`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold uppercase text-slate-500">New Tax Regime</span>
                      {newTax < oldTax && <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">Better</span>}
                    </div>
                    <p className="text-2xl font-bold text-slate-900">{fmt(newTax)}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">With ₹75,000 standard deduction</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Controls Area */}
          <div className="lg:col-span-5">
            <Card className="shadow-sm border-slate-200 bg-white">
              <CardHeader className="border-b pb-3">
                <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
                  <TrendingDown className="h-4 w-4 text-emerald-600" />
                  Simulate Chapter VI-A Investments
                </CardTitle>
                <CardDescription className="text-xs">Adjust sliders to test tax deduction scenarios</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 pt-5">
                <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-medium text-slate-600">Base Gross Income:</span>
                    <span className="font-bold text-slate-900">{fmt(baseIncome)}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-medium text-slate-600">Initial Deductions:</span>
                    <span className="font-bold text-slate-900">{fmt(baseDeductions)}</span>
                  </div>
                </div>

                <div className="space-y-2.5">
                  <div className="flex justify-between items-center">
                    <Label className="text-xs font-semibold text-slate-700">Section 80C Addition (ELSS/PPF)</Label>
                    <span className="text-xs font-bold text-primary">{fmt(sim80C)}</span>
                  </div>
                  <Slider 
                    defaultValue={[0]} 
                    max={150000} 
                    step={5000} 
                    value={[sim80C]} 
                    onValueChange={(val) => setSim80C(val[0])} 
                  />
                  <p className="text-[11px] text-slate-400">Statutory limit: ₹1,50,000 per financial year</p>
                </div>

                <div className="space-y-2.5">
                  <div className="flex justify-between items-center">
                    <Label className="text-xs font-semibold text-slate-700">NPS Tier-1 (Section 80CCD 1B)</Label>
                    <span className="text-xs font-bold text-primary">{fmt(simNPS)}</span>
                  </div>
                  <Slider 
                    defaultValue={[0]} 
                    max={50000} 
                    step={5000} 
                    value={[simNPS]} 
                    onValueChange={(val) => setSimNPS(val[0])} 
                  />
                  <p className="text-[11px] text-slate-400">Exclusive additional deduction up to ₹50,000</p>
                </div>

                <div className="space-y-2.5">
                  <div className="flex justify-between items-center">
                    <Label className="text-xs font-semibold text-slate-700">Health Insurance (Section 80D)</Label>
                    <span className="text-xs font-bold text-primary">{fmt(simMedical)}</span>
                  </div>
                  <Slider 
                    defaultValue={[0]} 
                    max={75000} 
                    step={5000} 
                    value={[simMedical]} 
                    onValueChange={(val) => setSimMedical(val[0])} 
                  />
                  <p className="text-[11px] text-slate-400">Self, family & parents premium up to ₹75,000</p>
                </div>

                <Separator />

                <div className="flex justify-between items-center py-2 px-3 rounded-lg bg-emerald-50 border border-emerald-200">
                  <span className="text-xs font-semibold text-emerald-800">Total Effective Deductions:</span>
                  <span className="text-sm font-bold text-emerald-800">{fmt(totalSimulatedDeductions)}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Simulator;
