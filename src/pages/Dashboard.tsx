import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { getDashboardStats } from "@/lib/api";
import DashboardNav from "@/components/DashboardNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Upload, Brain, Landmark, FileText, IndianRupee, TrendingUp, ArrowRight, Sparkles } from "lucide-react";
import { TiltCard } from "@/components/AdvancedUI/TiltCard";
import { Magnetic } from "@/components/AdvancedUI/Magnetic";

const COLORS = ["hsl(262, 83%, 58%)", "hsl(170, 70%, 45%)", "hsl(38, 92%, 50%)", "hsl(280, 80%, 55%)"];

const Dashboard = () => {
  const { user, profile, loading } = useAuth();
  const [stats, setStats] = useState({ documents: 0, totalIncome: 0, estimatedTax: 0, savings: 0 });
  const [incomeData, setIncomeData] = useState<any[]>([]);

  useEffect(() => {
    if (user) fetchDashboardData();
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      const data = await getDashboardStats();
      setStats({
        documents: data.documents || 0,
        totalIncome: data.totalIncome || 0,
        estimatedTax: data.estimatedTax || 0,
        savings: data.savings || 0,
      });
      if (data.incomeData) {
        setIncomeData(data.incomeData);
      }
    } catch {
      // Stats not available yet
    }
  };

  if (loading) return null;

  const fmt = (n: number) => `₹${n.toLocaleString("en-IN")}`;

  const quickActions = [
    { label: "Upload Documents", icon: Upload, path: "/documents", color: "bg-primary/10 text-primary" },
    { label: "Run Tax Analysis", icon: Brain, path: "/tax-analysis", color: "bg-secondary/10 text-secondary" },
    { label: "Explore Schemes", icon: Landmark, path: "/schemes", color: "bg-accent/10 text-accent" },
    { label: "View Summary", icon: FileText, path: "/tax-summary", color: "bg-primary/10 text-primary" },
  ];

  return (
    <div className="min-h-screen bg-background relative overflow-hidden selection:bg-primary/20">
      <div className="fixed inset-0 mesh-gradient opacity-[0.02] pointer-events-none -z-20" />
      <div className="absolute top-[-10%] right-[-5%] glow-spot -z-10" style={{ "--glow-color": "hsl(var(--primary) / 0.1)" } as any} />
      <div className="absolute bottom-[-10%] left-[-5%] glow-spot -z-10" style={{ "--glow-color": "hsl(var(--secondary) / 0.05)" } as any} />

      <DashboardNav />
      <div className="container py-12 relative z-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-xl bg-primary/10 border border-primary/20">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <span className="text-xs font-black uppercase tracking-[0.2em] text-primary">Intelligence Command</span>
          </div>
          <h1 className="font-display text-5xl font-black text-foreground mb-2 tracking-tight">
            Hi, {profile?.full_name?.split(' ')[0] || user?.user_metadata?.full_name?.split(' ')[0] || "Trader"}
          </h1>
          <p className="text-muted-foreground text-xl mb-12 font-medium">Your financial ecosystem is performing optimally.</p>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-4 mb-12">
          {[
            { label: "Gross Yield", value: fmt(stats.totalIncome), icon: TrendingUp, color: "text-secondary", border: "border-secondary/20" },
            { label: "Tax Liability", value: fmt(stats.estimatedTax), icon: IndianRupee, color: "text-accent", border: "border-accent/20" },
            { label: "Savings Alpha", value: fmt(stats.savings), icon: TrendingUp, color: "text-primary", border: "border-primary/20" },
            { label: "Vault Assets", value: String(stats.documents), icon: FileText, color: "text-muted-foreground", border: "border-muted/20" },
          ].map((stat, i) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1, duration: 0.5 }}>
              <TiltCard>
                <Card className={`glass border-white/5 shadow-xl group hover:bg-white/5 transition-colors`}>
                  <CardContent className="p-8">
                    <div className="flex items-center justify-between mb-6">
                      <div className={`p-4 rounded-2xl bg-card/40 border border-white/5 ${stat.color} group-hover:scale-110 transition-transform`}>
                        <stat.icon className="h-6 w-6" />
                      </div>
                      <div className="h-1 w-12 bg-muted rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ x: "-100%" }}
                          animate={{ x: "0%" }}
                          transition={{ delay: 0.5 + (i * 0.1), duration: 1 }}
                          className="h-full bg-primary" 
                        />
                      </div>
                    </div>
                    <p className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-2">{stat.label}</p>
                    <p className="text-4xl font-black font-display text-foreground leading-none">{stat.value}</p>
                  </CardContent>
                </Card>
              </TiltCard>
            </motion.div>
          ))}
        </div>

        <div className="grid gap-8 lg:grid-cols-[1fr_450px]">
          {/* Main Intelligence Card */}
          <Card className="glass border-white/5 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 blur-[100px] pointer-events-none -z-10 group-hover:bg-primary/20 transition-colors" />
            <CardHeader className="p-8">
              <CardTitle className="font-display text-3xl font-black flex items-center gap-3">
                <TrendingUp className="h-8 w-8 text-primary" /> Visual Analytics
              </CardTitle>
            </CardHeader>
            <CardContent className="px-8 pb-8">
              {incomeData.length > 0 ? (
                <div className="h-[350px] w-full mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie 
                        data={incomeData} 
                        cx="50%" 
                        cy="50%" 
                        innerRadius={90} 
                        outerRadius={140} 
                        paddingAngle={8}
                        dataKey="value" 
                        label={({ name }) => name}
                        stroke="none"
                      >
                        {incomeData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} className="hover:opacity-90 transition-opacity cursor-pointer" />)}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'rgba(255, 255, 255, 0.8)', 
                          backdropFilter: 'blur(15px)',
                          borderRadius: '24px',
                          border: '1px solid rgba(255,255,255,0.1)',
                          boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.2)',
                          padding: '16px'
                        }} 
                        itemStyle={{ fontWeight: '900', color: 'hsl(var(--foreground))' }}
                        formatter={(v: number) => [fmt(v), 'Yield']} 
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                  <div className="p-8 rounded-full bg-muted/20 mb-6">
                    <IndianRupee className="h-12 w-12 opacity-30" />
                  </div>
                  <p className="text-xl font-bold">Awaiting primary data signals</p>
                  <Button variant="link" asChild className="mt-4 text-primary font-black text-lg">
                    <Link to="/tax-analysis">Initialize Engine →</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Rapid Interaction Menu */}
          <div className="space-y-6">
            <h3 className="font-display text-2xl font-black px-2">Rapid Access</h3>
            <div className="grid gap-4">
              {quickActions.map((action, i) => (
                <motion.div key={action.path} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 + (i * 0.1) }}>
                  <Magnetic strength={0.2}>
                    <Link to={action.path} className="block group">
                      <div className="p-6 rounded-[2rem] glass border-white/5 flex items-center gap-6 hover:bg-white/5 hover:border-primary/30 transition-all duration-300">
                        <div className={`p-5 rounded-2xl ${action.color} group-hover:scale-110 group-hover:rotate-6 transition-all duration-500`}>
                          <action.icon className="h-7 w-7" />
                        </div>
                        <div className="flex-1">
                          <p className="text-xl font-black text-foreground group-hover:text-primary transition-colors leading-none mb-1">{action.label}</p>
                          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest opacity-60">Execute Flow</p>
                        </div>
                        <ArrowRight className="h-6 w-6 opacity-40 group-hover:opacity-100 group-hover:translate-x-1 transition-all text-primary" />
                      </div>
                    </Link>
                  </Magnetic>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
