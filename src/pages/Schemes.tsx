import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { getSchemes, getPersonalizedSchemes } from "@/lib/api";
import DashboardNav from "@/components/DashboardNav";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Landmark, Brain, Loader2, ArrowUpRight, Coins, ShieldCheck, CheckCircle2 } from "lucide-react";

interface Scheme {
  name: string;
  type: string;
  tax_benefit: string;
  description: string;
  eligibility?: string;
  how_to_apply?: string;
}

const STATIC_SCHEMES: Scheme[] = [
  { 
    name: "Public Provident Fund (PPF)", 
    type: "Fixed Income", 
    tax_benefit: "Section 80C - Up to ₹1.5L deduction (EEE status)", 
    description: "Sovereign-guaranteed long-term retirement savings scheme with a 15-year tenure. Returns and maturity proceeds are completely tax-free.", 
    eligibility: "Resident Indian Individuals", 
    how_to_apply: "Open via post office or participating bank portal" 
  },
  { 
    name: "Equity Linked Savings Scheme (ELSS)", 
    type: "Market Linked Equity", 
    tax_benefit: "Section 80C - Up to ₹1.5L deduction", 
    description: "Tax-saving mutual funds holding a diversified equity portfolio with the shortest lock-in period (3 years) across all 80C options.", 
    eligibility: "All Individual Taxpayers", 
    how_to_apply: "Invest through registered mutual fund platforms" 
  },
  { 
    name: "National Pension System (NPS Tier-I)", 
    type: "Pension Scheme", 
    tax_benefit: "Section 80CCD(1B) - Extra ₹50,000 deduction", 
    description: "Government-sponsored retirement pension scheme providing an exclusive ₹50,000 deduction over and above the ₹1.5L 80C ceiling.", 
    eligibility: "Citizens aged 18 to 70", 
    how_to_apply: "eNPS portal or Point of Presence (PoP) bank" 
  },
  { 
    name: "Senior Citizens Savings Scheme (SCSS)", 
    type: "Government Savings", 
    tax_benefit: "Section 80C - Up to ₹1.5L deduction", 
    description: "High-yielding government backed scheme designed for senior citizens, paying quarterly interest directly into savings accounts.", 
    eligibility: "Individuals aged 60+ (or 55+ with VRS)", 
    how_to_apply: "Authorized commercial bank branches or post office" 
  },
  { 
    name: "Sukanya Samriddhi Yojana (SSY)", 
    type: "Government Savings", 
    tax_benefit: "Section 80C - Triple Tax Exemption (EEE)", 
    description: "Dedicated welfare savings scheme for the girl child offering sovereign returns, compound interest, and fully tax-exempt maturity value.", 
    eligibility: "Parents/Guardians of girl child under 10", 
    how_to_apply: "Post office or designated public sector banks" 
  },
  { 
    name: "Section 80D Health Insurance Premium", 
    type: "Health Protection", 
    tax_benefit: "Section 80D - Up to ₹75,000 deduction", 
    description: "Deduction on medical insurance premiums: ₹25,000 for self/family, plus up to ₹50,000 for senior citizen parents, including preventive checks.", 
    eligibility: "Individual Taxpayers and HUFs", 
    how_to_apply: "Direct purchase from IRDAI-registered insurers" 
  }
];

const Schemes = () => {
  const { user, loading: authLoading } = useAuth();
  const [personalizedSchemes, setPersonalizedSchemes] = useState<Scheme[] | null>(null);
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
      // Default to static schemes
    }
  };

  const handleGetPersonalized = async () => {
    setLoading(true);
    try {
      const data = await getPersonalizedSchemes();
      if (data.schemes) {
        setPersonalizedSchemes(data.schemes);
        toast({ title: "Recommendations Updated", description: "Personalized tax deduction schemes tailored to your profile." });
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
    setLoading(false);
  };

  if (authLoading) return null;

  const schemesToDisplay = personalizedSchemes || STATIC_SCHEMES;

  return (
    <div className="min-h-screen bg-slate-50/50">
      <DashboardNav />
      <main className="container max-w-7xl py-6 sm:py-8 space-y-6 px-4 sm:px-6 lg:px-8 pb-24 lg:pb-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-5">
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <Badge variant="outline" className="text-primary border-primary/30 bg-primary/5 font-semibold text-xs">
                <Landmark className="h-3 w-3 mr-1" /> Chapter VI-A Deductions
              </Badge>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">Tax Saving Investment Schemes</h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
              Official tax-saving instruments under Section 80C, 80CCD, and 80D to legally minimize your liability under the Old Tax Regime.
            </p>
          </div>
          
          <Button 
            onClick={handleGetPersonalized} 
            disabled={loading}
            className="bg-primary hover:bg-primary/90 text-white font-medium shadow-sm shrink-0 w-full sm:w-auto"
          >
            {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Brain className="h-4 w-4 mr-2" />}
            Generate Personalized Advice
          </Button>
        </div>

        {personalizedSchemes && (
          <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs font-medium text-emerald-800 flex items-center gap-2.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>Showing personalized investment allocations tailored to your declared income and regime profile.</span>
          </div>
        )}

        {/* Schemes Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {schemesToDisplay.map((scheme, i) => (
            <Card key={i} className="flex flex-col justify-between shadow-sm border-slate-200 hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <Badge variant="secondary" className="text-[11px] font-medium text-slate-600 mb-1.5">
                      {scheme.type}
                    </Badge>
                    <CardTitle className="text-base font-semibold text-slate-900 leading-snug">
                      {scheme.name}
                    </CardTitle>
                  </div>
                  <div className="p-2 rounded-lg bg-blue-50 text-primary border border-blue-100 shrink-0">
                    <Coins className="h-4 w-4" />
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-3.5 flex-1">
                <p className="text-xs text-slate-600 leading-relaxed">
                  {scheme.description}
                </p>
                
                <div className="p-2.5 rounded-md bg-emerald-50/70 border border-emerald-200/80 flex items-start gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span className="text-xs font-semibold text-emerald-800">
                    {scheme.tax_benefit}
                  </span>
                </div>

                <div className="space-y-1.5 pt-1 text-xs">
                  {scheme.eligibility && (
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <span className="font-medium text-slate-700">Eligibility:</span>
                      <span>{scheme.eligibility}</span>
                    </div>
                  )}
                  {scheme.how_to_apply && (
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <span className="font-medium text-slate-700">How to Apply:</span>
                      <span>{scheme.how_to_apply}</span>
                    </div>
                  )}
                </div>
              </CardContent>

              <CardFooter className="pt-3 border-t bg-slate-50/50 flex justify-end">
                <Button variant="ghost" size="sm" className="text-xs text-primary font-medium hover:text-primary hover:bg-primary/5">
                  Learn More <ArrowUpRight className="h-3 w-3 ml-1" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
};

export default Schemes;
