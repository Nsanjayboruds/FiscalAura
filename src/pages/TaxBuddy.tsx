import { useState } from "react";
import { useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import DashboardNav from "@/components/DashboardNav";
import { useAuth } from "@/hooks/useAuth";
import { getTaxBuddyStrategy } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "@/hooks/use-toast";
import { Brain, Loader2, ArrowLeft, ArrowRight, ShieldCheck, CheckCircle2, Lock, HelpCircle } from "lucide-react";

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
  { 
    key: "age", 
    label: "What is your current age?", 
    helper: "Age determines basic exemption limits under the Old Regime (₹2.5L standard, ₹3L for 60+, ₹5L for 80+).", 
    kind: "number" as const 
  },
  { 
    key: "res_status", 
    label: "What is your Residential Status?", 
    helper: "Resident taxpayers are taxed on global income; Non-Residents (NRI) only on income earned or received in India.", 
    kind: "choice" as const, 
    options: ["Resident", "NRI", "RNOR"] 
  },
  { 
    key: "has_business", 
    label: "Do you earn from Business, Profession, or Freelancing?", 
    helper: "Helps determine presumptive taxation eligibility under Section 44AD / 44ADA.", 
    kind: "choice" as const, 
    options: ["Yes", "No"] 
  },
  { 
    key: "has_cap_gains", 
    label: "Did you sell Stocks, Mutual Funds, or Real Estate in FY 24-25?", 
    helper: "Capital gains are taxed at special rates (12.5% for LTCG above ₹1.25L, 20% for STCG under Finance Act 2024).", 
    kind: "choice" as const, 
    options: ["Yes", "No"] 
  },
  { 
    key: "est_income", 
    label: "Estimated Total Annual Income (in INR)", 
    helper: "Approximate aggregate income from all sources (Salary, Interest, Rental, etc.) before deductions.", 
    kind: "number" as const 
  },
  { 
    key: "has_agri", 
    label: "Do you have Agricultural Income?", 
    helper: "Agricultural income is exempt but integrated with non-agricultural income for slab rate determination if > ₹5,000.", 
    kind: "choice" as const, 
    options: ["Yes", "No"] 
  },
  { 
    key: "is_director", 
    label: "Are you a Director in any Indian or Foreign company?", 
    helper: "Company directors must mandatory file Form ITR-2 or ITR-3 regardless of income level.", 
    kind: "choice" as const, 
    options: ["Yes", "No"] 
  },
];

const TaxBuddy = () => {
  const navigate = useNavigate();
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
  const progressPercent = Math.round(((stepIndex + 1) / steps.length) * 100);

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
      toast({ title: "Tax Strategy Generated", description: "Personalized return guidance ready." });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-slate-50/50">
      <DashboardNav />
      <main className="container max-w-4xl py-8 space-y-6">
        {/* Header */}
        <div className="border-b pb-5">
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className="text-primary border-primary/30 bg-primary/5 font-semibold text-xs">
              <Brain className="h-3 w-3 mr-1 text-primary" /> Tax Advisory Assistant
            </Badge>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">TaxBuddy Advisor</h1>
          <p className="text-sm text-slate-500 mt-1">
            Answer a few quick questions to identify eligible tax deductions, confirm your optimal tax regime, and prepare your ITR filing.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Main Assessment Card */}
          <div className="lg:col-span-2">
            <Card className="shadow-sm border-slate-200 bg-white">
              <CardHeader className="pb-4 border-b">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Question {stepIndex + 1} of {steps.length}
                  </span>
                  <span className="text-xs font-bold text-primary">{progressPercent}% Completed</span>
                </div>
                <Progress value={progressPercent} className="h-1.5" />
              </CardHeader>

              <CardContent className="pt-6 space-y-6">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 leading-snug">{current.label}</h2>
                  <p className="text-xs text-slate-500 mt-1">{current.helper}</p>
                </div>

                <div className="py-2">
                  {current.kind === "number" && (
                    <div className="space-y-2">
                      <Label htmlFor={current.key} className="text-xs font-semibold text-slate-700">
                        {current.key === "est_income" ? "Annual Gross Amount (₹)" : "Age in completed years"}
                      </Label>
                      <div className="relative">
                        <span className="absolute left-3 top-2.5 text-slate-400 font-semibold text-sm">
                          {current.key === "est_income" ? "₹" : "#"}
                        </span>
                        <Input
                          id={current.key}
                          type="number"
                          min={0}
                          autoFocus
                          value={form[current.key as keyof TaxBuddyForm] as number || ""}
                          onChange={(e) => setForm((prev) => ({ ...prev, [current.key]: Number(e.target.value) || 0 }))}
                          className="pl-8 text-base font-semibold text-slate-900 h-11"
                          placeholder="0"
                        />
                      </div>
                    </div>
                  )}

                  {current.kind === "choice" && current.key === "res_status" && (
                    <RadioGroup 
                      value={form.res_status} 
                      onValueChange={(v) => setForm((prev) => ({ ...prev, res_status: v as TaxBuddyForm["res_status"] }))}
                      className="grid grid-cols-1 sm:grid-cols-3 gap-3"
                    >
                      {current.options?.map((option) => (
                        <div key={option} className="flex items-center">
                          <RadioGroupItem id={option} value={option} className="peer sr-only" />
                          <Label 
                            htmlFor={option}
                            className={`flex flex-1 items-center justify-center p-3.5 rounded-lg border text-xs font-semibold cursor-pointer transition-all ${
                              form.res_status === option 
                                ? "border-primary bg-primary/5 text-primary ring-1 ring-primary" 
                                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                            }`}
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
                      className="grid grid-cols-2 gap-4 max-w-sm mx-auto"
                    >
                      {["Yes", "No"].map((option) => {
                        const isSelected = ((form[current.key as keyof TaxBuddyForm] as boolean) && option === "Yes") ||
                                          (!(form[current.key as keyof TaxBuddyForm] as boolean) && option === "No");
                        return (
                          <div key={option} className="flex items-center">
                            <RadioGroupItem id={`${current.key}-${option}`} value={option} className="peer sr-only" />
                            <Label 
                              htmlFor={`${current.key}-${option}`}
                              className={`flex flex-1 items-center justify-center py-4 rounded-lg border text-sm font-semibold cursor-pointer transition-all ${
                                isSelected 
                                  ? "border-primary bg-primary/5 text-primary ring-1 ring-primary" 
                                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                              }`}
                            >
                              {option}
                            </Label>
                          </div>
                        );
                      })}
                    </RadioGroup>
                  )}
                </div>
              </CardContent>

              <CardFooter className="flex justify-between border-t bg-slate-50/50 py-3.5 px-6">
                <Button 
                  variant="outline" 
                  size="sm"
                  disabled={stepIndex === 0 || submitting} 
                  onClick={() => setStepIndex((s) => s - 1)}
                  className="text-xs font-medium"
                >
                  <ArrowLeft className="h-3.5 w-3.5 mr-1.5" /> Back
                </Button>

                {stepIndex < steps.length - 1 ? (
                  <Button 
                    size="sm"
                    disabled={!canGoNext() || submitting} 
                    onClick={() => setStepIndex((s) => s + 1)}
                    className="bg-primary hover:bg-primary/90 text-white font-medium text-xs px-5"
                  >
                    Next Question <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                  </Button>
                ) : (
                  <Button 
                    size="sm"
                    onClick={handleGenerate} 
                    disabled={submitting}
                    className="bg-primary hover:bg-primary/90 text-white font-medium text-xs px-5"
                  >
                    {submitting ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <ShieldCheck className="h-3.5 w-3.5 mr-1.5" />}
                    Generate Strategy Report
                  </Button>
                )}
              </CardFooter>
            </Card>
          </div>

          {/* Context / Information Card */}
          <div className="space-y-4">
            <Card className="shadow-sm border-slate-200 bg-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                  <HelpCircle className="h-4 w-4 text-primary" />
                  Tax Law Context
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-slate-600 leading-relaxed space-y-2">
                <p>
                  Our tax algorithms follow official Central Board of Direct Taxes (CBDT) notifications for Financial Year 2024-25 (Assessment Year 2025-26).
                </p>
                <div className="p-2.5 rounded bg-blue-50 border border-blue-100 text-blue-900 text-[11px]">
                  <strong>ITR Form Selection:</strong> Salaried individuals with capital gains require ITR-2; business turnover requires ITR-3 or ITR-4 (Sugam).
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm border-slate-200 bg-slate-50">
              <CardContent className="p-4 flex items-center gap-2.5 text-xs text-slate-500">
                <Lock className="h-4 w-4 text-slate-400 shrink-0" />
                <span>Your inputs are encrypted and stored in compliance with IT Act privacy guidelines.</span>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Strategy Output */}
        {strategy && (
          <Card className="shadow-sm border-slate-200 bg-white">
            <CardHeader className="border-b pb-4">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <Badge variant="outline" className="text-emerald-700 bg-emerald-50 border-emerald-200 text-xs">
                  Advisory Complete
                </Badge>
              </div>
              <CardTitle className="text-xl font-bold text-slate-900">Your Personalized Tax Strategy</CardTitle>
              <CardDescription className="text-xs">Based on your declared parameters for FY 2024-25</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="bg-slate-50 p-5 rounded-lg border border-slate-200 text-slate-800 text-xs leading-relaxed prose prose-slate max-w-none">
                <ReactMarkdown>{strategy}</ReactMarkdown>
              </div>
              <div className="mt-5 flex justify-end gap-3">
                <Button 
                  onClick={() => navigate("/dashboard")}
                  className="bg-primary hover:bg-primary/90 text-white font-medium text-xs px-5 h-9"
                >
                  Return to Tax Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default TaxBuddy;
