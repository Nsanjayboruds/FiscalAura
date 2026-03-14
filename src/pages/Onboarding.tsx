import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { completeOnboarding } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, ArrowRight, ArrowLeft, CheckCircle, Sparkles, Wand2 } from "lucide-react";
import { TiltCard } from "@/components/AdvancedUI/TiltCard";
import { Magnetic } from "@/components/AdvancedUI/Magnetic";

const EMPLOYMENT_TYPES = [
  { value: "salaried", label: "Salaried" },
  { value: "self-employed", label: "Self Employed" },
  { value: "business", label: "Business Owner" },
  { value: "freelancer", label: "Freelancer" },
  { value: "retired", label: "Retired" },
];

const INCOME_SOURCES = ["Salary", "Rental Income", "Interest Income", "Capital Gains", "Business Income", "Other"];

const AGE_GROUPS = [
  { value: "below-60", label: "Below 60 years" },
  { value: "60-80", label: "60 to 80 years" },
  { value: "above-80", label: "Above 80 years" },
];

const TAX_REGIMES = [
  { value: "old", label: "Old Tax Regime", description: "With deductions under sections 80C, 80D, etc." },
  { value: "new", label: "New Tax Regime", description: "Lower tax rates, fewer deductions" },
  { value: "not-sure", label: "Not Sure", description: "We'll help you decide" },
];

const Onboarding = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [employment, setEmployment] = useState("");
  const [incomeSources, setIncomeSources] = useState<string[]>([]);
  const [ageGroup, setAgeGroup] = useState("");
  const [taxRegime, setTaxRegime] = useState("");
  const [saving, setSaving] = useState(false);

  const toggleIncomeSource = (src: string) => {
    setIncomeSources((prev) => prev.includes(src) ? prev.filter((s) => s !== src) : [...prev, src]);
  };

  const handleSave = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { navigate("/auth"); return; }

    setSaving(true);
    try {
      await completeOnboarding({
        employment_type: employment,
        income_sources: incomeSources,
        age_group: ageGroup,
        tax_regime: taxRegime,
      });
      toast({ title: "Profile complete!", description: "Let's get started with your tax planning." });
      navigate("/dashboard");
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
    setSaving(false);
  };

  const canProceed = (s: number) => {
    if (s === 1) return !!employment;
    if (s === 2) return incomeSources.length > 0;
    if (s === 3) return !!ageGroup;
    if (s === 4) return !!taxRegime;
    return false;
  };

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 100 : -100,
      opacity: 0,
      scale: 0.95,
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 100 : -100,
      opacity: 0,
      scale: 0.95,
    })
  };

  const [direction, setDirection] = useState(0);

  const nextStep = () => {
    setDirection(1);
    setStep(s => s + 1);
  };

  const prevStep = () => {
    setDirection(-1);
    setStep(s => s - 1);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6 relative overflow-hidden">
      {/* Background Decor */}
      <div className="fixed inset-0 mesh-gradient opacity-[0.05] pointer-events-none -z-20" />
      <div className="fixed inset-0 glow-spot top-[-10%] right-[-10%] -z-10" style={{ "--glow-color": "hsl(var(--primary) / 0.12)" } as any} />
      <div className="fixed inset-0 glow-spot bottom-[-10%] left-[-10%] -z-10" style={{ "--glow-color": "hsl(var(--secondary) / 0.08)" } as any} />
      
      <motion.div 
        initial={{ opacity: 0, y: 30 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ duration: 0.8 }}
        className="w-full max-w-xl relative z-10"
      >
        <div className="text-center mb-10">
          <div className="flex h-16 w-16 items-center justify-center rounded-[1.5rem] bg-primary text-white font-display font-black text-3xl mx-auto mb-6 shadow-2xl shadow-primary/30 rotate-3 hover:rotate-0 transition-transform cursor-default">
            <Sparkles className="h-8 w-8 text-white" />
          </div>
          <h1 className="font-display text-5xl font-black tracking-tight text-foreground mb-3 leading-tight">Architect Your Economy</h1>
          <p className="text-muted-foreground text-xl font-medium opacity-80">Sequence {step} of 4 • Establishing tax architecture</p>
          
          <div className="flex gap-3 mt-10 justify-center">
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className="relative w-14 h-2 rounded-full bg-muted overflow-hidden">
                {s <= step && (
                  <motion.div 
                    layoutId="progress-bar"
                    className="absolute inset-0 bg-primary"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 0.6, ease: "circOut" }}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        <TiltCard>
          <Card className="glass border-white/5 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl -z-10" />
            
            <CardContent className="p-10">
              <div className="relative overflow-hidden min-h-[380px]">
                <AnimatePresence mode="wait" custom={direction}>
                  <motion.div
                    key={step}
                    custom={direction}
                    variants={variants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.5, ease: [0.215, 0.61, 0.355, 1] }}
                    className="w-full"
                  >
                    {step === 1 && (
                      <div className="space-y-8">
                        <div className="space-y-3">
                          <CardTitle className="font-display text-4xl font-black tracking-tight text-foreground">Employment Domain</CardTitle>
                          <CardDescription className="text-lg font-medium text-muted-foreground">Define your primary professional vector.</CardDescription>
                        </div>
                        <RadioGroup value={employment} onValueChange={setEmployment} className="grid gap-3">
                          {EMPLOYMENT_TYPES.map((t) => (
                            <div key={t.value} className="relative group/item">
                              <RadioGroupItem value={t.value} id={t.value} className="sr-only" />
                              <Label 
                                htmlFor={t.value} 
                                className={`flex items-center gap-4 p-5 rounded-2xl border-2 transition-all cursor-pointer font-black text-lg
                                  ${employment === t.value 
                                    ? "border-primary bg-primary/10 text-primary shadow-xl scale-[1.02]" 
                                    : "border-white/5 bg-white/5 text-muted-foreground hover:bg-white/10"}`}
                              >
                                <div className={`h-6 w-6 rounded-full border-4 flex items-center justify-center ${employment === t.value ? "border-primary" : "border-muted"}`}>
                                  {employment === t.value && (
                                    <motion.div 
                                      layoutId="active-radio"
                                      className="h-2.5 w-2.5 rounded-full bg-primary shadow-[0_0_10px_rgba(var(--primary),0.5)]" 
                                    />
                                  )}
                                </div>
                                {t.label}
                              </Label>
                            </div>
                          ))}
                        </RadioGroup>
                      </div>
                    )}

                    {step === 2 && (
                      <div className="space-y-8">
                        <div className="space-y-3">
                          <CardTitle className="font-display text-4xl font-black tracking-tight text-foreground">Revenue Streams</CardTitle>
                          <CardDescription className="text-lg font-medium text-muted-foreground">Select all active channels of capital inflow.</CardDescription>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          {INCOME_SOURCES.map((src) => (
                            <button
                              key={src}
                              onClick={() => toggleIncomeSource(src)}
                              className={`flex items-center gap-3 px-6 py-5 rounded-3xl border-2 transition-all font-black text-sm text-left
                                ${incomeSources.includes(src) 
                                  ? "border-primary bg-primary/10 text-primary shadow-xl scale-[1.02]" 
                                  : "border-white/5 bg-white/5 text-muted-foreground hover:bg-white/10"}`}
                            >
                              <div className={`flex-shrink-0 h-6 w-6 rounded-lg border-2 flex items-center justify-center ${incomeSources.includes(src) ? "border-primary bg-primary" : "border-muted"}`}>
                                {incomeSources.includes(src) && <CheckCircle className="h-4 w-4 text-white" />}
                              </div>
                              {src}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {step === 3 && (
                      <div className="space-y-8">
                        <div className="space-y-3">
                          <CardTitle className="font-display text-4xl font-black tracking-tight text-foreground">Generational Tier</CardTitle>
                          <CardDescription className="text-lg font-medium text-muted-foreground">Determining baseline tax exemptions and rules.</CardDescription>
                        </div>
                        <RadioGroup value={ageGroup} onValueChange={setAgeGroup} className="grid gap-4">
                          {AGE_GROUPS.map((g) => (
                            <div key={g.value} className="relative">
                              <RadioGroupItem value={g.value} id={g.value} className="sr-only" />
                              <Label 
                                htmlFor={g.value} 
                                className={`flex h-24 items-center justify-center rounded-[2.5rem] border-2 transition-all cursor-pointer font-black text-2xl
                                  ${ageGroup === g.value 
                                    ? "border-primary bg-primary/10 text-primary shadow-2xl scale-[1.03]" 
                                    : "border-white/5 bg-white/5 text-muted-foreground hover:bg-white/10 hover:border-white/10"}`}
                              >
                                {g.label}
                              </Label>
                            </div>
                          ))}
                        </RadioGroup>
                      </div>
                    )}

                    {step === 4 && (
                      <div className="space-y-8">
                        <div className="space-y-3">
                          <CardTitle className="font-display text-4xl font-black tracking-tight text-foreground">Structural Protocol</CardTitle>
                          <CardDescription className="text-lg font-medium text-muted-foreground">Choose your primary operational tax regime.</CardDescription>
                        </div>
                        <RadioGroup value={taxRegime} onValueChange={setTaxRegime} className="grid gap-4">
                          {TAX_REGIMES.map((r) => (
                            <div key={r.value} className="relative">
                              <RadioGroupItem value={r.value} id={r.value} className="sr-only" />
                              <Label 
                                htmlFor={r.value} 
                                className={`flex flex-col gap-2 p-7 rounded-[2.5rem] border-2 transition-all cursor-pointer
                                  ${taxRegime === r.value 
                                    ? "border-primary bg-primary/10 shadow-2xl scale-[1.02]" 
                                    : "border-white/5 bg-white/5 hover:border-white/10 hover:bg-white/10"}`}
                              >
                                <div className="flex items-center justify-between">
                                  <span className={`font-black text-2xl ${taxRegime === r.value ? "text-primary" : "text-foreground"}`}>{r.label}</span>
                                  {taxRegime === r.value && <Wand2 className="h-6 w-6 text-primary animate-pulse" />}
                                </div>
                                <span className="text-base text-muted-foreground font-semibold leading-snug">{r.description}</span>
                              </Label>
                            </div>
                          ))}
                        </RadioGroup>
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>

              <div className="flex items-center justify-between mt-12 pt-8 border-t border-white/5">
                {step > 1 ? (
                  <Magnetic>
                    <Button 
                      variant="ghost" 
                      size="lg"
                      onClick={prevStep}
                      className="h-14 rounded-2xl px-8 font-black text-muted-foreground hover:text-foreground transition-all"
                    >
                      <ArrowLeft className="h-6 w-6 mr-3" /> Back
                    </Button>
                  </Magnetic>
                ) : <div />}
                
                {step < 4 ? (
                  <Magnetic>
                    <Button 
                      size="lg"
                      onClick={nextStep} 
                      disabled={!canProceed(step)}
                      className="h-14 rounded-2xl px-12 font-black transition-all shadow-xl shadow-primary/20 border-0"
                      style={{ background: "var(--gradient-primary)" }}
                    >
                      Continue Sequence <ArrowRight className="h-6 w-6 ml-3" />
                    </Button>
                  </Magnetic>
                ) : (
                  <Magnetic>
                    <Button 
                      size="lg"
                      onClick={handleSave} 
                      disabled={saving || !canProceed(4)}
                      className="h-14 rounded-2xl px-12 font-black transition-all shadow-xl shadow-primary/20 border-0"
                      style={{ background: "var(--gradient-primary)" }}
                    >
                      {saving ? <Loader2 className="h-6 w-6 mr-3 animate-spin" /> : <Sparkles className="h-6 w-6 mr-3" />}
                      Finalize Architecture
                    </Button>
                  </Magnetic>
                )}
              </div>
            </CardContent>
          </Card>
        </TiltCard>
        
        <div className="mt-12 text-center">
          <p className="text-sm text-muted-foreground font-black uppercase tracking-[0.5em] opacity-40">
            Absolute Shield • Privacy Reserved • FiscalAura Intelligence
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Onboarding;
