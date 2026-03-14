import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import DashboardNav from "@/components/DashboardNav";
import { useAuth } from "@/hooks/useAuth";
import { getTaxBuddyStrategy } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "@/hooks/use-toast";
import { Brain, Loader2, ArrowLeft, ArrowRight, Shield, Sparkles, Fingerprint, Activity, Zap } from "lucide-react";
import { TiltCard } from "@/components/AdvancedUI/TiltCard";
import { Magnetic } from "@/components/AdvancedUI/Magnetic";

type TaxBuddyForm = {
  age: number;
  res_status: "Resident" | "NRI" | "RNOR";
  has_business: boolean;
  has_cap_gains: boolean;
  est_income: number;
  has_agri: boolean;
  is_director: boolean;
};

const steps = [
  { key: "age", label: "What is your age?", kind: "number" as const },
  { key: "res_status", label: "Residential Status?", kind: "choice" as const, options: ["Resident", "NRI", "RNOR"] },
  { key: "has_business", label: "Do you earn from Business/Freelancing?", kind: "choice" as const, options: ["Yes", "No"] },
  { key: "has_cap_gains", label: "Did you sell Stocks, MF, or Property?", kind: "choice" as const, options: ["Yes", "No"] },
  { key: "est_income", label: "Total Annual Income (Rough Est.)", kind: "number" as const },
  { key: "has_agri", label: "Do you have Agriculture Income?", kind: "choice" as const, options: ["Yes", "No"] },
  { key: "is_director", label: "Are you a Director in any company?", kind: "choice" as const, options: ["Yes", "No"] },
];

const TaxBuddy = () => {
  const { loading } = useAuth(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [strategy, setStrategy] = useState<string>("");

  const [form, setForm] = useState<TaxBuddyForm>({
    age: 0,
    res_status: "Resident",
    has_business: false,
    has_cap_gains: false,
    est_income: 0,
    has_agri: false,
    is_director: false,
  });

  if (loading) return null;

  const current = steps[stepIndex];

  const setBool = (key: "has_business" | "has_cap_gains" | "has_agri" | "is_director", value: string) => {
    setForm((prev) => ({ ...prev, [key]: value === "Yes" }));
  };

  const canGoNext = () => {
    switch (current.key) {
      case "age":
        return form.age > 0;
      case "est_income":
        return form.est_income >= 0;
      default:
        return true;
    }
  };

  const handleGenerate = async () => {
    setSubmitting(true);
    try {
      const res = await getTaxBuddyStrategy(form);
      setStrategy(res.data.strategy);
      toast({ title: "TaxBuddy Strategy Ready", description: "Generated your personalized strategy." });
    } catch (error: any) {
      toast({ title: "TaxBuddy failed", description: error.message, variant: "destructive" });
    }
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="fixed inset-0 mesh-gradient opacity-[0.03] pointer-events-none -z-20" />
      <div className="absolute top-[-10%] left-[-10%] glow-spot -z-10" style={{ "--glow-color": "hsl(var(--primary) / 0.1)" } as any} />
      
      <DashboardNav />
      <div className="container py-12 max-w-5xl relative z-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-xl bg-primary/10 border border-primary/20 text-primary">
              <Brain className="h-5 w-5" />
            </div>
            <span className="text-xs font-black uppercase tracking-[0.2em] text-primary">Neural Strategic Flow</span>
          </div>
          <h1 className="font-display text-5xl font-black text-foreground mb-3 tracking-tight">TaxBuddy Core</h1>
          <p className="text-muted-foreground text-xl mb-12 font-medium">Coordinate with our AI to architect your personalized fiscal optimal path.</p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-12 items-start">
          <div className="lg:col-span-2">
            <TiltCard>
              <Card className="glass border-white/5 shadow-2xl overflow-hidden pb-4 relative group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-[100px] -z-10 group-hover:bg-primary/10 transition-colors" />
                <CardHeader className="border-b border-white/5 bg-white/[0.02] p-8">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <CardTitle className="font-display flex items-center gap-3 text-2xl font-black">
                        <Activity className="h-6 w-6 text-primary" />
                        Strategy Synthesis
                      </CardTitle>
                      <CardDescription className="text-[10px] font-black uppercase tracking-widest mt-1">Session Active • Phase {stepIndex + 1} of {steps.length}</CardDescription>
                    </div>
                    <div className="h-12 w-12 rounded-full border-2 border-primary/20 flex items-center justify-center font-black text-primary text-sm bg-primary/5">
                      {Math.round(((stepIndex + 1) / steps.length) * 100)}%
                    </div>
                  </div>
                  {/* Progress Bar */}
                  <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-primary shadow-[0_0_15px_rgba(var(--primary),0.5)]"
                      initial={{ width: 0 }}
                      animate={{ width: `${((stepIndex + 1) / steps.length) * 100}%` }}
                      transition={{ type: "spring", stiffness: 50, damping: 15 }}
                    />
                  </div>
                </CardHeader>
                <CardContent className="space-y-12 pt-12 px-10">
                  <AnimatePresence mode="wait">
                    <motion.div 
                      key={current.key}
                      initial={{ opacity: 0, scale: 0.98, x: 20 }}
                      animate={{ opacity: 1, scale: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.98, x: -20 }}
                      transition={{ duration: 0.4 }}
                      className="space-y-8"
                    >
                      <Label className="text-3xl font-black tracking-tight text-foreground leading-tight block">{current.label}</Label>

                      <div className="min-h-[160px] flex items-center">
                        {current.kind === "number" && (
                          <div className="w-full relative group/input">
                            <span className="absolute left-6 top-1/2 -translate-y-1/2 text-muted-foreground font-black text-2xl opacity-50 group-focus-within/input:text-primary transition-colors">
                              {current.key === "est_income" ? "₹" : "#"}
                            </span>
                            <Input
                              type="number"
                              min={0}
                              autoFocus
                              value={form[current.key as keyof TaxBuddyForm] as number || ""}
                              onChange={(e) => setForm((prev) => ({ ...prev, [current.key]: Number(e.target.value) || 0 }))}
                              className="text-4xl h-24 border-white/5 bg-white/[0.03] rounded-[2rem] px-12 focus-visible:ring-primary/20 focus-visible:border-primary/50 font-black transition-all"
                              placeholder="0"
                            />
                            <div className="absolute right-6 top-1/2 -translate-y-1/2 text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-50 group-focus-within/input:opacity-100 transition-opacity">
                              {current.key === "est_income" ? "Annual Est." : "Identity Variable"}
                            </div>
                          </div>
                        )}

                        {current.kind === "choice" && current.key === "res_status" && (
                          <RadioGroup 
                            value={form.res_status} 
                            onValueChange={(v) => setForm((prev) => ({ ...prev, res_status: v as TaxBuddyForm["res_status"] }))}
                            className="grid grid-cols-1 sm:grid-cols-3 gap-6 w-full"
                          >
                            {current.options?.map((option) => (
                              <div key={option} className="relative group/choice">
                                <RadioGroupItem id={option} value={option} className="sr-only" />
                                <Label 
                                  htmlFor={option}
                                  className={`flex h-20 items-center justify-center rounded-[1.5rem] border-2 transition-all duration-500 cursor-pointer font-black text-lg uppercase tracking-widest
                                    ${form.res_status === option 
                                      ? "border-primary bg-primary/10 text-primary shadow-2xl shadow-primary/20 scale-[1.05]" 
                                      : "border-white/5 bg-white/[0.03] text-muted-foreground hover:bg-white/[0.06] hover:border-white/10"}`}
                                >
                                  {option}
                                </Label>
                              </div>
                            ))}
                          </RadioGroup>
                        )}

                        {current.kind === "choice" && current.key !== "res_status" && (
                          <RadioGroup
                            value={(form[current.key as keyof TaxBuddyForm] as boolean) ? "Yes" : "No"}
                            onValueChange={(v) => setBool(current.key as any, v)}
                            className="grid grid-cols-2 gap-8 w-full max-w-lg mx-auto"
                          >
                            {["Yes", "No"].map((option) => (
                              <div key={option} className="relative group/bool">
                                <RadioGroupItem id={`${current.key}-${option}`} value={option} className="sr-only" />
                                <Label 
                                  htmlFor={`${current.key}-${option}`}
                                  className={`flex h-24 items-center justify-center rounded-[2rem] border-2 transition-all duration-700 cursor-pointer font-black text-3xl uppercase tracking-tighter
                                    ${((form[current.key as keyof TaxBuddyForm] as boolean) && option === "Yes") || (!(form[current.key as keyof TaxBuddyForm] as boolean) && option === "No")
                                      ? "border-primary bg-primary/10 text-primary shadow-[0_20px_50px_rgba(var(--primary),0.3)] scale-[1.08] relative z-10" 
                                      : "border-white/5 bg-white/[0.03] text-muted-foreground hover:bg-white/[0.06] hover:border-white/10 opacity-60"}`}
                                >
                                  {option}
                                </Label>
                              </div>
                            ))}
                          </RadioGroup>
                        )}
                      </div>
                    </motion.div>
                  </AnimatePresence>

                  <div className="flex items-center justify-between pt-10 border-t border-white/5">
                    <Magnetic>
                      <Button 
                        variant="ghost" 
                        size="lg"
                        disabled={stepIndex === 0 || submitting} 
                        onClick={() => setStepIndex((s) => s - 1)}
                        className="rounded-2xl px-8 h-12 font-black uppercase tracking-widest hover:bg-white/5 text-muted-foreground hover:text-foreground transition-all"
                      >
                        <ArrowLeft className="h-5 w-5 mr-3" /> Back
                      </Button>
                    </Magnetic>

                    {stepIndex < steps.length - 1 ? (
                      <Magnetic>
                        <Button 
                          size="lg"
                          disabled={!canGoNext() || submitting} 
                          onClick={() => setStepIndex((s) => s + 1)}
                          className="rounded-2xl px-12 h-16 font-black text-lg transition-all shadow-2xl shadow-primary/20 hover:scale-105"
                          style={{ background: "var(--gradient-primary)" }}
                        >
                          Continue Protocol <ArrowRight className="h-5 w-5 ml-3" />
                        </Button>
                      </Magnetic>
                    ) : (
                      <Magnetic>
                        <Button 
                          size="lg"
                          onClick={handleGenerate} 
                          disabled={submitting}
                          className="rounded-2xl px-12 h-16 font-black text-lg transition-all shadow-2xl shadow-primary/20 hover:scale-105"
                          style={{ background: "var(--gradient-primary)" }}
                        >
                          {submitting ? <Loader2 className="h-6 w-6 mr-3 animate-spin" /> : <Zap className="h-6 w-6 mr-3" />}
                          Finalize Synthesis
                        </Button>
                      </Magnetic>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TiltCard>
          </div>

          <div className="space-y-8">
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
              <Card className="glass border-white/5 shadow-2xl p-8 rounded-[2rem] relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-32 h-32 bg-primary/5 blur-3xl -z-10 group-hover:bg-primary/10 transition-colors" />
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 rounded-xl bg-primary/10 text-primary">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <h4 className="font-display font-black text-lg uppercase tracking-widest">Inference Logic</h4>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed font-medium italic">
                  {current.key === 'age' && "Age signals determine seniority framework, unlocking elite exemption thresholds."}
                  {current.key === 'res_status' && "Geo-residency defines the architectural scope of your taxable liability across global vectors."}
                  {current.key === 'has_business' && "Professional inflow activates Section 44 presmutive logic for accelerated efficiency."}
                  {current.key === 'est_income' && "Annual delta helps the neural engine compare old vs next-gen liability architectures."}
                  {!['age', 'res_status', 'has_business', 'est_income'].includes(current.key) && "Every bit of granular data optimizes the final strategic output."}
                </p>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
              <div className="bg-primary/20 border border-primary/30 p-8 rounded-[2rem] relative overflow-hidden group">
                <div className="absolute top-[-20%] right-[-20%] w-32 h-32 bg-primary/20 blur-3xl rounded-full" />
                <div className="flex items-center gap-3 text-primary font-black mb-4 uppercase tracking-[0.2em] text-xs">
                  <Shield className="h-4 w-4" /> Hardened Context
                </div>
                <p className="text-xs text-primary/80 font-bold leading-relaxed">Neural inputs are transient and discarded post-synthesis. End-to-end encrypted session.</p>
              </div>
            </motion.div>
          </div>
        </div>

        {strategy && (
          <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, type: "spring" }}>
            <Card className="mt-16 glass border-0 shadow-[0_50px_100px_rgba(0,0,0,0.5)] relative overflow-hidden backdrop-blur-3xl lg:p-6 rounded-[3rem]">
              <div className="absolute top-0 left-0 w-3 h-full bg-gradient-to-b from-primary via-secondary to-accent" />
              <div className="absolute top-4 right-4 h-12 w-12 text-primary opacity-10"><Fingerprint className="h-full w-full" /></div>
              
              <CardHeader className="p-10 pb-4">
                <div className="flex items-center gap-3 mb-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Strategic Directive Alpha</span>
                </div>
                <CardTitle className="font-display text-4xl font-black text-foreground tracking-tight">Personalized Optimal State</CardTitle>
                <CardDescription className="font-bold uppercase tracking-widest text-xs opacity-60">Verified for Fiscal Matrix 2025-26</CardDescription>
              </CardHeader>
              <CardContent className="p-10 pt-0">
                <div className="bg-white/5 p-10 rounded-[2.5rem] border border-white/5 relative group">
                  <div className="absolute inset-0 bg-primary/[0.01] pointer-events-none" />
                  <div className="whitespace-pre-wrap text-xl leading-[1.8] text-foreground font-medium selection:bg-primary/30 relative z-10">
                    {strategy}
                  </div>
                </div>
                <div className="mt-12 flex flex-wrap justify-end gap-6 text-foreground">
                  <Magnetic>
                    <Button variant="outline" className="rounded-2xl px-10 h-14 font-black uppercase tracking-widest glass border-white/10 hover:bg-white/10 transition-all">
                      Export Report (PDF)
                    </Button>
                  </Magnetic>
                  <Magnetic>
                    <Button 
                      className="rounded-2xl px-12 h-14 font-black uppercase tracking-widest shadow-2xl shadow-primary/30 transition-all"
                      style={{ background: "var(--gradient-primary)" }}
                    >
                      Commit to Dashboard
                    </Button>
                  </Magnetic>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default TaxBuddy;
;
