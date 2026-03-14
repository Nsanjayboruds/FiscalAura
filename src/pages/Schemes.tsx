import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { getSchemes, getPersonalizedSchemes } from "@/lib/api";
import DashboardNav from "@/components/DashboardNav";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { Landmark, Brain, Loader2, ArrowUpRight, Sparkles, Coins, TrendingUp, ShieldCheck } from "lucide-react";
import { TiltCard } from "@/components/AdvancedUI/TiltCard";
import { Magnetic } from "@/components/AdvancedUI/Magnetic";

const STATIC_SCHEMES = [
  { name: "Public Provident Fund (PPF)", type: "Investment", tax_benefit: "Section 80C - up to ₹1.5L deduction", description: "Long-term savings with guaranteed returns. 15-year lock-in. Current interest: ~7.1% p.a." },
  { name: "Equity Linked Savings Scheme (ELSS)", type: "Investment", tax_benefit: "Section 80C - up to ₹1.5L deduction", description: "Tax-saving mutual funds with the shortest lock-in (3 years) among 80C options." },
  { name: "National Pension System (NPS)", type: "Pension", tax_benefit: "Section 80CCD(1B) - additional ₹50K deduction", description: "Retirement savings with tax benefits over and above 80C limit." },
  { name: "Sukanya Samriddhi Yojana", type: "Savings", tax_benefit: "Section 80C - Triple exempt (EEE)", description: "For girl child education/marriage. High interest rate, government backed." },
  { name: "Senior Citizens Savings Scheme", type: "Savings", tax_benefit: "Section 80C - up to ₹1.5L deduction", description: "For citizens above 60. Quarterly interest payout. 5-year tenure." },
];

const Schemes = () => {
  const { user, loading: authLoading } = useAuth();
  const [personalizedSchemes, setPersonalizedSchemes] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) loadSchemes();
  }, [user]);

  const loadSchemes = async () => {
    try {
      const data = await getSchemes();
      if (data.schemes) {
        setPersonalizedSchemes(data.schemes);
      }
    } catch {
      // No personalized schemes yet
    }
  };

  const handleGetPersonalized = async () => {
    setLoading(true);
    try {
      const data = await getPersonalizedSchemes();
      if (data.schemes) {
        setPersonalizedSchemes(data.schemes);
        toast({ title: "Schemes updated!", description: "Personalized recommendations are ready." });
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
    setLoading(false);
  };

  if (authLoading) return null;

  const schemesToDisplay = personalizedSchemes || STATIC_SCHEMES;

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="fixed inset-0 mesh-gradient opacity-[0.03] pointer-events-none -z-20" />
      <div className="absolute top-[-5%] right-[-5%] glow-spot -z-10" style={{ "--glow-color": "hsl(var(--primary) / 0.1)" } as any} />
      
      <DashboardNav />
      <div className="container py-12 relative z-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-primary/10 border border-primary/20 text-primary">
                  <Landmark className="h-5 w-5" />
                </div>
                <span className="text-xs font-black uppercase tracking-[0.2em] text-primary">Strategy Engine</span>
              </div>
              <h1 className="font-display text-5xl font-black text-foreground tracking-tight">Tax-Saving Protocoals</h1>
              <p className="text-muted-foreground text-xl font-medium max-w-2xl">Deploy capital into high-efficiency government vectors to maximize your net liquidity.</p>
            </div>
            
            <Magnetic>
              <Button 
                onClick={handleGetPersonalized} 
                disabled={loading}
                className="h-14 px-8 rounded-2xl font-black text-lg transition-all shadow-xl shadow-primary/20"
                style={{ background: "var(--gradient-primary)" }}
              >
                {loading ? <Loader2 className="h-5 w-5 mr-3 animate-spin" /> : <Brain className="h-5 w-5 mr-3" />}
                Sync Personalized
              </Button>
            </Magnetic>
          </div>
        </motion.div>

        <AnimatePresence>
          {personalizedSchemes && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-8"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
                <Sparkles className="h-4 w-4 text-primary animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-widest text-primary">AI-Personalized Recommendations Enabled</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid gap-6 md:grid-cols-2">
          {schemesToDisplay.map((scheme: any, i: number) => (
            <motion.div 
              key={i} 
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ delay: 0.1 + (i * 0.05) }}
            >
              <TiltCard>
                <Card className={`h-full glass border-white/5 shadow-2xl transition-all duration-500 overflow-hidden group ${personalizedSchemes ? 'ring-2 ring-primary/10' : ''}`}>
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl -z-10 group-hover:bg-primary/10 transition-colors" />
                  
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 group-hover:scale-110 transition-transform">
                          <Coins className="h-6 w-6" />
                        </div>
                        <div>
                          <CardTitle className="font-display text-xl font-black leading-tight">{scheme.name}</CardTitle>
                          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">{scheme.type}</span>
                        </div>
                      </div>
                      {personalizedSchemes && (
                        <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
                          <TrendingUp className="h-4 w-4 text-primary" />
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-6">
                    <p className="text-sm font-medium text-muted-foreground leading-relaxed line-clamp-3 group-hover:line-clamp-none transition-all">
                      {scheme.description}
                    </p>
                    
                    <div className="p-4 rounded-2xl bg-green-500/[0.03] border border-green-500/10 flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-green-500/10 flex items-center justify-center text-green-500">
                        <ShieldCheck className="h-5 w-5" />
                      </div>
                      <span className="text-xs font-black text-green-600 dark:text-green-400 uppercase tracking-wider">{scheme.tax_benefit}</span>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {scheme.eligibility && (
                        <div className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                          {scheme.eligibility}
                        </div>
                      )}
                      {scheme.how_to_apply && (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary/10 border border-secondary/10 text-[10px] font-black uppercase tracking-widest text-secondary">
                          <ArrowUpRight className="h-3.3 w-3" />
                          {scheme.how_to_apply}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TiltCard>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Schemes;
