import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { updateProfile, getDocuments } from "@/lib/api";
import DashboardNav from "@/components/DashboardNav";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Loader2, Save, FileText, User, ShieldCheck, Briefcase, Calendar, CheckCircle2, Mail } from "lucide-react";

const Profile = () => {
  const { user, profile, loading, refetchProfile } = useAuth();
  const [name, setName] = useState("");
  const [employment, setEmployment] = useState("");
  const [ageGroup, setAgeGroup] = useState("");
  const [taxRegime, setTaxRegime] = useState("");
  const [saving, setSaving] = useState(false);
  const [documents, setDocuments] = useState<Array<{ id: string; file_name: string; status: string }>>([]);

  useEffect(() => {
    if (profile) {
      setName(profile.full_name || "");
      setEmployment(profile.employment_type || "");
      setAgeGroup(profile.age_group || "");
      setTaxRegime(profile.tax_regime || "");
    }
  }, [profile]);

  useEffect(() => {
    if (user) {
      getDocuments().then((data) => {
        setDocuments(Array.isArray(data) ? data.slice(0, 5) : []);
      }).catch(() => { });
    }
  }, [user]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateProfile({
        full_name: name,
        employment_type: employment,
        age_group: ageGroup,
        tax_regime: taxRegime,
      });
      toast({ title: "Profile updated", description: "Your taxpayer profile changes have been saved." });
      refetchProfile();
    } catch (error: unknown) {
      const e = error as Error;
      toast({ title: "Error updating profile", description: e.message, variant: "destructive" });
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50">
      <DashboardNav />
      <main className="container max-w-5xl py-6 sm:py-8 space-y-6 px-4 sm:px-6 lg:px-8 pb-24 lg:pb-8">
        {/* Header */}
        <div className="border-b pb-5">
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className="text-primary border-primary/30 bg-primary/5 font-semibold text-xs">
              <ShieldCheck className="h-3 w-3 mr-1 text-primary" /> Taxpayer Profile
            </Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">Account & Filing Profile</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage your personal tax identity, employment parameters, and default tax regime settings.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Profile Form */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="shadow-sm border-slate-200">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  <div>
                    <CardTitle className="text-lg font-semibold">Taxpayer Details</CardTitle>
                    <CardDescription>Primary identification details used in Form 16 and ITR declarations</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="email" className="text-xs font-semibold text-slate-700">Registered Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                      <Input id="email" value={user?.email || ""} disabled className="pl-9 bg-slate-100 text-slate-600 font-medium" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="name" className="text-xs font-semibold text-slate-700">Full Legal Name</Label>
                    <Input 
                      id="name" 
                      placeholder="As per PAN card" 
                      value={name} 
                      onChange={(e) => setName(e.target.value)} 
                    />
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="employment" className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                      <Briefcase className="h-3.5 w-3.5 text-slate-500" /> Employment Category
                    </Label>
                    <Select value={employment} onValueChange={setEmployment}>
                      <SelectTrigger id="employment">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="salaried">Salaried Employee</SelectItem>
                        <SelectItem value="self-employed">Self Employed Professional</SelectItem>
                        <SelectItem value="business">Business Proprietor / Director</SelectItem>
                        <SelectItem value="freelancer">Freelancer / Independent Contractor</SelectItem>
                        <SelectItem value="retired">Pensioner / Retired</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="age" className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-slate-500" /> Age Group (Senior Citizen Bracket)
                    </Label>
                    <Select value={ageGroup} onValueChange={setAgeGroup}>
                      <SelectTrigger id="age">
                        <SelectValue placeholder="Select age bracket" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="below-60">Below 60 years (Standard Individual)</SelectItem>
                        <SelectItem value="60-80">60 to 80 years (Senior Citizen)</SelectItem>
                        <SelectItem value="above-80">Above 80 years (Super Senior Citizen)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="regime" className="text-xs font-semibold text-slate-700">Preferred Tax Regime</Label>
                  <Select value={taxRegime} onValueChange={setTaxRegime}>
                    <SelectTrigger id="regime">
                      <SelectValue placeholder="Select preferred regime" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">New Tax Regime (Section 115BAC - Default)</SelectItem>
                      <SelectItem value="old">Old Tax Regime (With Chapter VI-A Deductions)</SelectItem>
                      <SelectItem value="not-sure">Auto-Optimize (FiscalAura Recommendation)</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-slate-500">
                    The platform will evaluate both regimes during analysis and alert you if the other saves more tax.
                  </p>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end border-t bg-slate-50/50 py-3 px-6">
                <Button onClick={handleSave} disabled={saving} className="bg-primary hover:bg-primary/90 text-white font-medium">
                  {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                  Save Profile Changes
                </Button>
              </CardFooter>
            </Card>
          </div>

          {/* Sidebar / Recent Documents */}
          <div className="space-y-6">
            <Card className="shadow-sm border-slate-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  Uploaded Documents
                </CardTitle>
                <CardDescription>Recent Form 16 and investment records</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {documents.length === 0 ? (
                  <div className="text-center py-6 border border-dashed rounded-lg bg-slate-50">
                    <FileText className="h-8 w-8 mx-auto text-slate-300 mb-1" />
                    <p className="text-xs text-slate-500">No documents uploaded yet.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {documents.map((doc) => (
                      <div 
                        key={doc.id}
                        className="flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-colors"
                      >
                        <div className="flex items-center gap-2.5 overflow-hidden">
                          <FileText className="h-4 w-4 text-primary shrink-0" />
                          <div className="truncate">
                            <p className="text-xs font-medium text-slate-800 truncate">{doc.file_name}</p>
                            <span className="text-[11px] text-slate-400 capitalize">{doc.status}</span>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-[10px] text-emerald-700 bg-emerald-50 border-emerald-200 shrink-0">
                          <CheckCircle2 className="h-3 w-3 mr-1" /> Ready
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="shadow-sm border-slate-200 bg-blue-50/50">
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center gap-2 text-primary font-semibold text-sm">
                  <ShieldCheck className="h-4 w-4" />
                  CBDT & e-Filing Compliance
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Your tax profile data is encrypted at rest using AES-256 and transmitted under standard SSL.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Profile;
