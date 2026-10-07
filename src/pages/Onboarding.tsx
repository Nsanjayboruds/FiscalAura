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
import { Loader2, ArrowRight, ArrowLeft, CheckCircle, ShieldCheck } from "lucide-react";

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
    <div className="min-h-screen flex items-center justify-center bg-background p-4 sm:p-6">
      <div className="w-full max-w-xl py-8">
        <div className="text-center mb-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-white mx-auto mb-3 shadow-sm">
            <ShieldCheck className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground mb-1">Taxpayer Profile Setup</h1>
          <p className="text-xs text-muted-foreground">Step {step} of 4 • Help us tailor deductions and regime comparisons for you</p>
          
          <div className="flex gap-2 mt-6 justify-center">
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className="w-12 h-1.5 rounded-full bg-muted overflow-hidden">
                <div 
                  className={`h-full bg-primary transition-all duration-300 ${s <= step ? 'w-full' : 'w-0'}`}
                />
              </div>
            ))}
          </div>
        </div>

        <Card className="border border-border bg-card shadow-md">
          <CardContent className="p-6 sm:p-8">
            <div className="min-h-[300px]">
              {step === 1 && (
                <div className="space-y-6">
                  <div className="space-y-1">
                    <CardTitle className="text-xl font-bold text-foreground">Employment Type</CardTitle>
                    <CardDescription className="text-xs text-muted-foreground">Select your primary employment category for FY 2024-25.</CardDescription>
                  </div>
                  <RadioGroup value={employment} onValueChange={setEmployment} className="grid gap-2.5">
                    {EMPLOYMENT_TYPES.map((t) => (
                      <div key={t.value} className="relative">
                        <RadioGroupItem value={t.value} id={t.value} className="sr-only" />
                        <Label 
                          htmlFor={t.value} 
                          className={`flex items-center gap-3 p-3.5 rounded-lg border transition-all cursor-pointer font-semibold text-sm
                            ${employment === t.value 
                              ? "border-primary bg-primary/5 text-primary" 
                              : "border-border text-foreground hover:bg-muted/50"}`}
                        >
                          <div className={`h-4 w-4 rounded-full border flex items-center justify-center ${employment === t.value ? "border-primary" : "border-muted-foreground/40"}`}>
                            {employment === t.value && (
                              <div className="h-2 w-2 rounded-full bg-primary" />
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
                <div className="space-y-6">
                  <div className="space-y-1">
                    <CardTitle className="text-xl font-bold text-foreground">Sources of Income</CardTitle>
                    <CardDescription className="text-xs text-muted-foreground">Select all income heads that apply to your tax return.</CardDescription>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {INCOME_SOURCES.map((src) => (
                      <button
                        type="button"
                        key={src}
                        onClick={() => toggleIncomeSource(src)}
                        className={`flex items-center gap-2.5 p-3 rounded-lg border transition-all font-semibold text-xs text-left
                          ${incomeSources.includes(src) 
                            ? "border-primary bg-primary/5 text-primary" 
                            : "border-border text-foreground hover:bg-muted/50"}`}
                      >
                        <div className={`flex-shrink-0 h-4 w-4 rounded border flex items-center justify-center ${incomeSources.includes(src) ? "border-primary bg-primary" : "border-muted-foreground/40"}`}>
                          {incomeSources.includes(src) && <CheckCircle className="h-3 w-3 text-white" />}
                        </div>
                        {src}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-6">
                  <div className="space-y-1">
                    <CardTitle className="text-xl font-bold text-foreground">Taxpayer Age Category</CardTitle>
                    <CardDescription className="text-xs text-muted-foreground">Determines basic exemption limits under the Old Tax Regime.</CardDescription>
                  </div>
                  <RadioGroup value={ageGroup} onValueChange={setAgeGroup} className="grid gap-2.5">
                    {AGE_GROUPS.map((g) => (
                      <div key={g.value} className="relative">
                        <RadioGroupItem value={g.value} id={g.value} className="sr-only" />
                        <Label 
                          htmlFor={g.value} 
                          className={`flex p-4 items-center justify-between rounded-lg border transition-all cursor-pointer font-semibold text-sm
                            ${ageGroup === g.value 
                              ? "border-primary bg-primary/5 text-primary" 
                              : "border-border text-foreground hover:bg-muted/50"}`}
                        >
                          <span>{g.label}</span>
                          {ageGroup === g.value && (
                            <span className="text-xs font-semibold text-primary">Selected</span>
                          )}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              )}

              {step === 4 && (
                <div className="space-y-6">
                  <div className="space-y-1">
                    <CardTitle className="text-xl font-bold text-foreground">Preferred Default Regime</CardTitle>
                    <CardDescription className="text-xs text-muted-foreground">Choose a default regime. We will still calculate and show you both.</CardDescription>
                  </div>
                  <RadioGroup value={taxRegime} onValueChange={setTaxRegime} className="grid gap-3">
                    {TAX_REGIMES.map((r) => (
                      <div key={r.value} className="relative">
                        <RadioGroupItem value={r.value} id={r.value} className="sr-only" />
                        <Label 
                          htmlFor={r.value} 
                          className={`flex flex-col gap-1 p-4 rounded-lg border transition-all cursor-pointer
                            ${taxRegime === r.value 
                              ? "border-primary bg-primary/5 border-2" 
                              : "border-border hover:bg-muted/50"}`}
                        >
                          <div className="flex items-center justify-between">
                            <span className={`font-bold text-sm ${taxRegime === r.value ? "text-primary" : "text-foreground"}`}>{r.label}</span>
                            {taxRegime === r.value && <CheckCircle className="h-4 w-4 text-primary" />}
                          </div>
                          <span className="text-xs text-muted-foreground leading-relaxed">{r.description}</span>
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
              {step > 1 ? (
                <Button 
                  variant="outline" 
                  onClick={prevStep}
                  className="h-10 rounded-md px-4 font-semibold text-xs border-border hover:bg-muted"
                >
                  <ArrowLeft className="h-4 w-4 mr-1.5" /> Back
                </Button>
              ) : <div />}
              
              {step < 4 ? (
                <Button 
                  onClick={nextStep} 
                  disabled={!canProceed(step)}
                  className="h-10 rounded-md px-6 font-semibold text-xs bg-primary hover:bg-primary/90 text-white shadow-sm"
                >
                  Continue <ArrowRight className="h-4 w-4 ml-1.5" />
                </Button>
              ) : (
                <Button 
                  onClick={handleSave} 
                  disabled={saving || !canProceed(4)}
                  className="h-10 rounded-md px-6 font-semibold text-xs bg-primary hover:bg-primary/90 text-white shadow-sm"
                >
                  {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <ShieldCheck className="h-4 w-4 mr-2" />}
                  Save & Go to Dashboard
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Onboarding;
