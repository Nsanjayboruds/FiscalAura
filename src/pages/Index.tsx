import { useNavigate } from "react-router-dom";
import { 
  ArrowRight, 
  ShieldCheck, 
  FileText, 
  Calculator, 
  Landmark, 
  CheckCircle2, 
  FileCheck, 
  HelpCircle, 
  Lock, 
  PieChart, 
  ChevronRight,
  TrendingDown,
  Info,
  Building2,
  Briefcase,
  UserCheck
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      
      {/* Top Compliance Notice Bar (shadcn Alert style) */}
      <div className="bg-slate-900 text-slate-100 text-xs py-2 px-4 border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Badge variant="default" className="bg-primary text-white text-[10px] px-1.5 py-0">
              Budget 2024-25
            </Badge>
            <span className="text-slate-300">
              Updated with revised standard deduction of ₹75,000 & 87A rebate up to ₹7,75,000 for New Tax Regime.
            </span>
          </div>
          <a href="#comparator" className="text-blue-400 hover:text-blue-300 underline font-medium inline-flex items-center">
            Compare Regimes <ChevronRight className="h-3 w-3" />
          </a>
        </div>
      </div>

      {/* Main Navigation Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Brand Logo */}
          <div 
            className="flex items-center gap-2.5 cursor-pointer"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground shadow-sm">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-lg text-foreground tracking-tight">FiscalAura</span>
              <Badge variant="outline" className="text-[10px] font-semibold text-primary border-primary/30 py-0 px-1.5">
                Tax
              </Badge>
            </div>
          </div>

          {/* Desktop Nav Items */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
            <a href="#services" className="hover:text-foreground transition-colors">Filing Services</a>
            <a href="#comparator" className="hover:text-foreground transition-colors">Regime Comparator</a>
            <a href="#slabs" className="hover:text-foreground transition-colors">Tax Slabs</a>
            <a href="#faq" className="hover:text-foreground transition-colors">FAQs</a>
          </nav>

          {/* User Auth Buttons */}
          <div className="flex items-center gap-2.5">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate("/auth")}
              className="text-sm font-medium"
            >
              Sign In
            </Button>
            <Button
              size="sm"
              onClick={() => navigate("/auth")}
              className="font-semibold text-sm px-4 shadow-sm"
            >
              Start Filing Free
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-12 pb-16 md:pt-16 md:pb-20 bg-muted/20 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-12 gap-10 items-center">
            
            {/* Left Column: Hero Copy */}
            <div className="lg:col-span-7 space-y-6">
              <div>
                <Badge variant="secondary" className="px-3 py-1 font-semibold text-xs gap-1.5 border border-border">
                  <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                  AI-Powered Tax Intelligence & Compliance Platform for India
                </Badge>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground leading-[1.12]">
                FiscalAura <br />
                <span className="text-primary">AI Tax Intelligence for India.</span>
              </h1>

              <p className="text-base sm:text-lg text-muted-foreground max-w-2xl leading-relaxed">
                Understand your taxes. Reconcile your financial data across Form 16, AIS, and Form 26AS. Find potential tax opportunities and make better financial decisions.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1">
                <Button
                  size="lg"
                  onClick={() => navigate("/auth")}
                  className="font-semibold px-6 shadow-sm gap-2"
                >
                  Get Started <ArrowRight className="h-4 w-4" />
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  onClick={() => {
                    localStorage.setItem("fiscalaura_demo_mode", "true");
                    navigate("/dashboard");
                  }}
                  className="font-medium px-5 gap-2"
                >
                  <Calculator className="h-4 w-4 text-muted-foreground" />
                  Explore Demo (Instant Access)
                </Button>
              </div>

              {/* Trust Badges */}
              <div className="grid grid-cols-3 gap-3 pt-6 border-t border-border text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                  <span>100% Calculation Guarantee</span>
                </div>
                <div className="flex items-center gap-2">
                  <Lock className="h-4 w-4 text-primary flex-shrink-0" />
                  <span>256-Bit Bank Encryption</span>
                </div>
                <div className="flex items-center gap-2">
                  <FileCheck className="h-4 w-4 text-blue-600 flex-shrink-0" />
                  <span>ITR-1, 2, 3 & 4 Supported</span>
                </div>
              </div>
            </div>

            {/* Right Column: shadcn Card with Interactive Tax Computation */}
            <div className="lg:col-span-5" id="comparator">
              <Card className="shadow-md border-border bg-card">
                <CardHeader className="pb-3 border-b border-border">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base font-bold text-foreground">Tax Computation Summary</CardTitle>
                      <CardDescription className="text-xs">Assessment Year 2025-26 (FY 2024-25)</CardDescription>
                    </div>
                    <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-300 font-semibold text-xs">
                      Optimized
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="pt-4 space-y-3">
                  {/* Income details */}
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Gross Salary (Form 16)</span>
                      <span className="font-semibold text-foreground">₹15,00,000</span>
                    </div>
                    <div className="flex justify-between items-center text-emerald-700 dark:text-emerald-400">
                      <span>Standard Deduction (Section 16ia)</span>
                      <span className="font-semibold">-₹75,000</span>
                    </div>
                    <div className="flex justify-between items-center text-emerald-700 dark:text-emerald-400">
                      <span>Deductions Claimed (80C, 80D, NPS)</span>
                      <span className="font-semibold">-₹2,00,000</span>
                    </div>
                  </div>

                  <Separator />

                  {/* Side-by-side Regime Cards */}
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    {/* Old Regime */}
                    <Card className="border-border bg-muted/30 shadow-none">
                      <CardContent className="p-3">
                        <span className="text-[11px] font-bold uppercase text-muted-foreground block mb-0.5">Old Regime</span>
                        <div className="text-[11px] text-muted-foreground mb-1">Net Taxable: ₹12.25L</div>
                        <div className="text-base font-bold text-foreground">₹1,82,000</div>
                        <span className="text-[10px] text-muted-foreground">Incl. 4% Cess</span>
                      </CardContent>
                    </Card>

                    {/* New Regime (Recommended) */}
                    <Card className="border-2 border-emerald-500 bg-emerald-50/40 shadow-none relative">
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="text-[11px] font-bold uppercase text-emerald-800 dark:text-emerald-300">New Regime</span>
                          <Badge className="bg-emerald-600 text-white text-[9px] px-1 py-0 font-bold uppercase hover:bg-emerald-600">
                            Best
                          </Badge>
                        </div>
                        <div className="text-[11px] text-muted-foreground mb-1">Net Taxable: ₹14.25L</div>
                        <div className="text-base font-bold text-emerald-700 dark:text-emerald-400">₹1,40,400</div>
                        <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold">Saves ₹41,600</span>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Alert Recommendation */}
                  <Alert className="bg-emerald-50 border-emerald-200 text-emerald-900 dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-200 py-2.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    <AlertTitle className="text-xs font-semibold">Regime Recommendation</AlertTitle>
                    <AlertDescription className="text-xs">
                      The New Tax Regime reduces your tax liability by <strong>₹41,600</strong> for your income profile.
                    </AlertDescription>
                  </Alert>
                </CardContent>

                <CardFooter className="pt-0">
                  <Button 
                    onClick={() => navigate("/auth")}
                    className="w-full text-xs font-semibold h-10 shadow-sm"
                  >
                    Upload Form 16 to Check Your Exact Savings
                  </Button>
                </CardFooter>
              </Card>
            </div>

          </div>
        </div>
      </section>

      {/* Key Stats Bar with shadcn Cards */}
      <section className="py-8 bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="shadow-none border-border">
              <CardContent className="p-4 text-center">
                <div className="text-2xl sm:text-3xl font-bold text-foreground">₹10+ Cr</div>
                <div className="text-xs text-muted-foreground mt-0.5">Tax Deductions Claimed</div>
              </CardContent>
            </Card>
            <Card className="shadow-none border-border">
              <CardContent className="p-4 text-center">
                <div className="text-2xl sm:text-3xl font-bold text-foreground">50,000+</div>
                <div className="text-xs text-muted-foreground mt-0.5">Returns Prepared Accurately</div>
              </CardContent>
            </Card>
            <Card className="shadow-none border-border">
              <CardContent className="p-4 text-center">
                <div className="text-2xl sm:text-3xl font-bold text-foreground">99.98%</div>
                <div className="text-xs text-muted-foreground mt-0.5">Calculation Accuracy Rate</div>
              </CardContent>
            </Card>
            <Card className="shadow-none border-border">
              <CardContent className="p-4 text-center">
                <div className="text-2xl sm:text-3xl font-bold text-foreground">4.9 / 5</div>
                <div className="text-xs text-muted-foreground mt-0.5">Rated by Salaried Taxpayers</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Core Tax Services (shadcn Cards Grid) */}
      <section id="services" className="py-16 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <Badge variant="outline" className="mb-2">Tax Preparation Tools</Badge>
            <h2 className="text-3xl font-bold tracking-tight text-foreground">
              Everything You Need for Accurate Tax Compliance
            </h2>
            <p className="text-muted-foreground text-sm mt-2">
              Compliant with the Income-tax Act, 1961, CBDT guidelines, and the revised Finance Act provisions.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <Card className="border-border shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="h-10 w-10 rounded-md bg-blue-50 border border-blue-100 flex items-center justify-center text-primary mb-2">
                  <FileText className="h-5 w-5" />
                </div>
                <CardTitle className="text-base font-bold">Automated Form 16 Parsing</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-xs leading-relaxed">
                  Upload your Form 16 PDF (Part A & B). The system automatically extracts salary breakdown, allowances (HRA, LTA), and TDS deductions without manual data entry.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-border shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="h-10 w-10 rounded-md bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 mb-2">
                  <Calculator className="h-5 w-5" />
                </div>
                <CardTitle className="text-base font-bold">Old vs New Regime Optimizer</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-xs leading-relaxed">
                  Instant side-by-side computation factoring in revised standard deduction (₹75,000 for New Regime), Section 87A rebate, and marginal relief calculations.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-border shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="h-10 w-10 rounded-md bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mb-2">
                  <Landmark className="h-5 w-5" />
                </div>
                <CardTitle className="text-base font-bold">Chapter VI-A Deductions</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-xs leading-relaxed">
                  Maximize legal deductions across Section 80C (PPF, ELSS, EPF up to ₹1.5L), 80D (Health Insurance for self & parents), and 80CCD(1B) NPS contributions.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-border shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="h-10 w-10 rounded-md bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 mb-2">
                  <PieChart className="h-5 w-5" />
                </div>
                <CardTitle className="text-base font-bold">Multi-Source Income</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-xs leading-relaxed">
                  Consolidate salary, house property rent, equity mutual fund capital gains (STCG/LTCG), and other sources like fixed deposit interest with ease.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-border shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="h-10 w-10 rounded-md bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600 mb-2">
                  <HelpCircle className="h-5 w-5" />
                </div>
                <CardTitle className="text-base font-bold">TaxBuddy AI Advisory</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-xs leading-relaxed">
                  Instant guidance on section exemptions, HRA calculations, Section 24b home loan interest limits, and required documentation for e-verification.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-border shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="h-10 w-10 rounded-md bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 mb-2">
                  <Lock className="h-5 w-5" />
                </div>
                <CardTitle className="text-base font-bold">Bank-Grade Data Privacy</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-xs leading-relaxed">
                  All uploaded documents and tax statements are encrypted using TLS 1.3 and 256-bit AES encryption. Your financial data is private, secure, and never sold.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Tax Slabs Comparison with shadcn Tabs & Table */}
      <section id="slabs" className="py-16 bg-muted/30 border-y border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-8">
            <Badge variant="outline" className="mb-2">Official IT Slabs</Badge>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Income Tax Slabs for FY 2024-25 (AY 2025-26)
            </h2>
            <p className="text-muted-foreground text-xs mt-1">
              Compare the tax rates between the default New Tax Regime and the Old Tax Regime.
            </p>
          </div>

          <Card className="border-border bg-card shadow-sm max-w-4xl mx-auto">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold">Slab Rate Structure</CardTitle>
              <CardDescription className="text-xs">
                Tax liability computed before applying 4% Health & Education Cess
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="new" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="new" className="text-xs font-semibold">
                    New Tax Regime (Default)
                  </TabsTrigger>
                  <TabsTrigger value="old" className="text-xs font-semibold">
                    Old Tax Regime
                  </TabsTrigger>
                </TabsList>

                {/* New Regime Slabs */}
                <TabsContent value="new">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs font-bold">Total Income Range</TableHead>
                        <TableHead className="text-xs font-bold">Tax Rate</TableHead>
                        <TableHead className="text-xs font-bold text-right">Applicable Rebate / Notes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell className="font-medium text-xs">Up to ₹3,00,000</TableCell>
                        <TableCell className="text-xs">Nil</TableCell>
                        <TableCell className="text-xs text-right text-muted-foreground">Basic Exemption Limit</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium text-xs">₹3,00,001 – ₹7,00,000</TableCell>
                        <TableCell className="text-xs">5%</TableCell>
                        <TableCell className="text-xs text-right text-emerald-600 font-medium">Rebate u/s 87A up to ₹7L (Tax = Nil)</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium text-xs">₹7,00,001 – ₹10,00,000</TableCell>
                        <TableCell className="text-xs">10%</TableCell>
                        <TableCell className="text-xs text-right text-muted-foreground">Marginal relief applicable</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium text-xs">₹10,00,001 – ₹12,00,000</TableCell>
                        <TableCell className="text-xs">15%</TableCell>
                        <TableCell className="text-xs text-right text-muted-foreground">Standard deduction ₹75,000</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium text-xs">₹12,00,001 – ₹15,00,000</TableCell>
                        <TableCell className="text-xs">20%</TableCell>
                        <TableCell className="text-xs text-right text-muted-foreground">Budget 2024 revised slab</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium text-xs">Above ₹15,00,000</TableCell>
                        <TableCell className="text-xs font-bold text-primary">30%</TableCell>
                        <TableCell className="text-xs text-right text-muted-foreground">Surcharge applicable if income &gt; ₹50L</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TabsContent>

                {/* Old Regime Slabs */}
                <TabsContent value="old">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs font-bold">Total Income Range</TableHead>
                        <TableHead className="text-xs font-bold">Tax Rate</TableHead>
                        <TableHead className="text-xs font-bold text-right">Applicable Deductions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell className="font-medium text-xs">Up to ₹2,50,000</TableCell>
                        <TableCell className="text-xs">Nil</TableCell>
                        <TableCell className="text-xs text-right text-muted-foreground">Basic Exemption Limit (Under 60 yrs)</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium text-xs">₹2,50,001 – ₹5,00,000</TableCell>
                        <TableCell className="text-xs">5%</TableCell>
                        <TableCell className="text-xs text-right text-emerald-600 font-medium">Rebate u/s 87A up to ₹5L (Tax = Nil)</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium text-xs">₹5,00,001 – ₹10,00,000</TableCell>
                        <TableCell className="text-xs">20%</TableCell>
                        <TableCell className="text-xs text-right text-muted-foreground">Eligible for 80C, 80D, HRA deductions</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium text-xs">Above ₹10,00,000</TableCell>
                        <TableCell className="text-xs font-bold text-primary">30%</TableCell>
                        <TableCell className="text-xs text-right text-muted-foreground">Home loan interest (Sec 24b) allowed</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Tax FAQs with shadcn Accordion */}
      <section id="faq" className="py-16 bg-background">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <Badge variant="outline" className="mb-2">Tax Help & FAQs</Badge>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Frequently Asked Questions
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              Common questions on ITR filing, Form 16, and tax regime optimization.
            </p>
          </div>

          <Accordion type="single" collapsible className="w-full space-y-2">
            <AccordionItem value="item-1" className="border rounded-lg px-4 bg-card">
              <AccordionTrigger className="text-sm font-semibold text-left">
                Which tax regime is better for salaried employees for FY 2024-25?
              </AccordionTrigger>
              <AccordionContent className="text-xs text-muted-foreground leading-relaxed">
                Under the revised New Tax Regime (Budget 2024-25), the standard deduction has been increased to ₹75,000, and taxable income up to ₹7,75,000 incurs zero tax due to Section 87A rebate. The New Regime is generally more beneficial for individuals who have deductions under ₹3.75 lakhs. If you have substantial investments in Section 80C, 80D, NPS, and home loan interest (Section 24b), our calculator instantly compares both to tell you which saves more money.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2" className="border rounded-lg px-4 bg-card">
              <AccordionTrigger className="text-sm font-semibold text-left">
                How does automated Form 16 upload work?
              </AccordionTrigger>
              <AccordionContent className="text-xs text-muted-foreground leading-relaxed">
                You can drag and drop your Form 16 PDF (issued by your employer). Our system extracts Part A (employer TAN, PAN, and TDS deducted) and Part B (salary breakdown, exemptions under Section 10, and deductions under Chapter VI-A). You can review every entry before submitting.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3" className="border rounded-lg px-4 bg-card">
              <AccordionTrigger className="text-sm font-semibold text-left">
                Can I switch between Old and New Tax Regimes every year?
              </AccordionTrigger>
              <AccordionContent className="text-xs text-muted-foreground leading-relaxed">
                Salaried individuals without business income can freely switch between the Old and New Tax Regimes every financial year at the time of filing their ITR (using Form 10-IEA if applicable). Taxpayers with business or professional income (ITR-3 / ITR-4) can switch only once in their lifetime.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-4" className="border rounded-lg px-4 bg-card">
              <AccordionTrigger className="text-sm font-semibold text-left">
                Is my financial and salary data safe on FiscalAura?
              </AccordionTrigger>
              <AccordionContent className="text-xs text-muted-foreground leading-relaxed">
                Yes. All communications are encrypted with TLS 1.3, and database records are protected with 256-bit AES encryption. We do not sell your personal or financial data to third-party lenders or insurance aggregators.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      {/* Final Call to Action with shadcn Card */}
      <section className="py-12 bg-muted/20 border-t border-border">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="bg-slate-900 text-white border-slate-800 shadow-md">
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-2xl sm:text-3xl font-bold tracking-tight">
                Ready to File Your Return with 100% Accuracy?
              </CardTitle>
              <CardDescription className="text-slate-300 text-xs mt-1">
                Join over 50,000 taxpayers who file with confidence and maximize their refund.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center pt-4">
              <Button 
                size="lg" 
                onClick={() => navigate("/auth")}
                className="bg-primary hover:bg-primary/90 text-white font-semibold text-sm px-8 shadow-sm"
              >
                Get Started for Free <ArrowRight className="h-4 w-4 ml-1.5" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto bg-slate-950 text-slate-400 text-xs border-t border-slate-900 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 text-white font-bold text-base mb-2">
                <ShieldCheck className="h-5 w-5 text-primary" />
                FiscalAura
              </div>
              <p className="text-slate-400 text-xs leading-relaxed">
                Modern income tax e-filing & regime comparison software for Indian taxpayers.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-2">Tax Tools</h4>
              <ul className="space-y-1.5 text-xs">
                <li><a href="#services" className="hover:text-white">Form 16 Parser</a></li>
                <li><a href="#comparator" className="hover:text-white">Regime Comparator</a></li>
                <li><a href="#slabs" className="hover:text-white">Tax Slabs</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-2">Resources</h4>
              <ul className="space-y-1.5 text-xs">
                <li><a href="#faq" className="hover:text-white">ITR Deadlines</a></li>
                <li><a href="#slabs" className="hover:text-white">Budget 2024 Amendments</a></li>
                <li><a href="#faq" className="hover:text-white">Section 87A Rules</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-2">Compliance</h4>
              <p className="text-slate-400 text-xs leading-relaxed">
                Calculations conform to the Income-tax Act, 1961 as amended for Assessment Year 2025-26.
              </p>
            </div>
          </div>
          <Separator className="bg-slate-900 mb-6" />
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-slate-500 text-xs">
            <div>© {new Date().getFullYear()} FiscalAura Tax Solutions. All rights reserved.</div>
            <div className="flex gap-4">
              <a href="#" className="hover:text-slate-300">Privacy Policy</a>
              <a href="#" className="hover:text-slate-300">Terms of Service</a>
              <a href="#" className="hover:text-slate-300">Disclaimer</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
