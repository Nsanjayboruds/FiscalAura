import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { getFinancialData } from "@/lib/api";
import DashboardNav from "@/components/DashboardNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { Activity, ShieldCheck, TrendingDown } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid, Cell } from "recharts";
import { TiltCard } from "@/components/AdvancedUI/TiltCard";

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
  // Standard deduction
  const taxable = Math.max(0, income - 50000);
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
  const [baseIncome, setBaseIncome] = useState(0);
  const [baseDeductions, setBaseDeductions] = useState(0);
  
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
        setBaseIncome(income);
        setBaseDeductions(deductions);
      }
    } catch {
      // Failed to load
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
      fill: "hsl(var(--primary))"
    },
    {
      name: "New Regime",
      tax: newTax,
      fill: "hsl(var(--secondary))"
    }
  ];

  const fmt = (n: number) => `₹${n.toLocaleString("en-IN")}`;

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="fixed inset-0 mesh-gradient opacity-[0.03] pointer-events-none -z-20" />
      <div className="absolute top-[-5%] left-[-5%] glow-spot -z-10" style={{ "--glow-color": "hsl(var(--primary) / 0.1)" } as React.CSSProperties} />
      
      <DashboardNav />
      
      <div className="container py-12 max-w-6xl relative z-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-xl bg-primary/10 border border-primary/20 text-primary">
              <Activity className="h-5 w-5" />
            </div>
            <span className="text-xs font-black uppercase tracking-[0.2em] text-primary">Simulation Hub</span>
          </div>
          <h1 className="font-display text-5xl font-black text-foreground mb-3 tracking-tight">Interactive What-If Simulator</h1>
          <p className="text-muted-foreground text-xl mb-12 font-medium">Model potential tax savings by adjusting your planned investments in real-time.</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-8">
          {/* Main Chart Area */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
            <Card className="glass border-white/5 shadow-2xl h-full relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5 pointer-events-none opacity-50" />
              <CardHeader>
                <CardTitle className="font-display text-2xl font-black flex items-center gap-2">
                  <ShieldCheck className="h-6 w-6 text-primary" />
                  Tax Liability Comparison
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[400px] w-full mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                      <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" tick={{ fill: 'hsl(var(--foreground))', fontWeight: 700 }} />
                      <YAxis stroke="hsl(var(--muted-foreground))" tick={{ fill: 'hsl(var(--muted-foreground))' }} tickFormatter={(val) => `₹${val/1000}k`} />
                      <Tooltip 
                        cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                        contentStyle={{ 
                          backgroundColor: 'rgba(0, 0, 0, 0.8)', 
                          backdropFilter: 'blur(15px)',
                          borderRadius: '16px',
                          border: '1px solid rgba(255,255,255,0.1)',
                          color: '#fff'
                        }}
                        formatter={(val: number) => [fmt(val), "Estimated Tax"]}
                      />
                      <Bar dataKey="tax" radius={[8, 8, 0, 0]} maxBarSize={100}>
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="mt-8 grid grid-cols-2 gap-4">
                  <div className="p-6 rounded-3xl bg-primary/10 border border-primary/20">
                    <p className="text-xs uppercase tracking-widest text-muted-foreground font-bold mb-1">Old Regime</p>
                    <p className="text-3xl font-display font-black text-foreground">{fmt(oldTax)}</p>
                  </div>
                  <div className="p-6 rounded-3xl bg-secondary/10 border border-secondary/20">
                    <p className="text-xs uppercase tracking-widest text-muted-foreground font-bold mb-1">New Regime</p>
                    <p className="text-3xl font-display font-black text-foreground">{fmt(newTax)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Controls Area */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
            <Card className="glass border-white/5 shadow-2xl relative">
              <CardHeader>
                <CardTitle className="font-display text-2xl font-black flex items-center gap-2">
                  <TrendingDown className="h-6 w-6 text-secondary" />
                  Simulation Parameters
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-8">
                
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 mb-6">
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-bold text-muted-foreground">Base Gross Income</span>
                    <span className="text-sm font-black">{fmt(baseIncome)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-bold text-muted-foreground">Current Deductions</span>
                    <span className="text-sm font-black">{fmt(baseDeductions)}</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-end">
                    <Label className="text-sm font-bold">Additional 80C Investment</Label>
                    <span className="text-primary font-black">{fmt(sim80C)}</span>
                  </div>
                  <Slider 
                    defaultValue={[0]} 
                    max={150000} 
                    step={5000} 
                    value={[sim80C]} 
                    onValueChange={(val) => setSim80C(val[0])} 
                    className="cursor-pointer"
                  />
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">ELSS, PPF, LIC, EPF (Max ₹1.5L)</p>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-end">
                    <Label className="text-sm font-bold">Additional NPS (80CCD)</Label>
                    <span className="text-primary font-black">{fmt(simNPS)}</span>
                  </div>
                  <Slider 
                    defaultValue={[0]} 
                    max={50000} 
                    step={5000} 
                    value={[simNPS]} 
                    onValueChange={(val) => setSimNPS(val[0])} 
                    className="cursor-pointer"
                  />
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">National Pension System (Max ₹50k)</p>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-end">
                    <Label className="text-sm font-bold">Medical Insurance (80D)</Label>
                    <span className="text-primary font-black">{fmt(simMedical)}</span>
                  </div>
                  <Slider 
                    defaultValue={[0]} 
                    max={75000} 
                    step={5000} 
                    value={[simMedical]} 
                    onValueChange={(val) => setSimMedical(val[0])} 
                    className="cursor-pointer"
                  />
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Self + Parents (Max ₹75k)</p>
                </div>

                <div className="mt-8 pt-6 border-t border-white/10 flex justify-between items-center">
                  <span className="text-sm font-bold text-muted-foreground">Total Effective Deductions</span>
                  <span className="text-xl font-display font-black text-primary">{fmt(totalSimulatedDeductions)}</span>
                </div>

              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Simulator;
