import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { updateProfile, getDocuments } from "@/lib/api";
import DashboardNav from "@/components/DashboardNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { Loader2, Save, FileText, User, Shield, Briefcase, Zap, Calendar } from "lucide-react";
import { TiltCard } from "@/components/AdvancedUI/TiltCard";
import { Magnetic } from "@/components/AdvancedUI/Magnetic";

const Profile = () => {
  const { user, profile, loading, refetchProfile } = useAuth();
  const [name, setName] = useState("");
  const [employment, setEmployment] = useState("");
  const [ageGroup, setAgeGroup] = useState("");
  const [taxRegime, setTaxRegime] = useState("");
  const [saving, setSaving] = useState(false);
  const [documents, setDocuments] = useState<any[]>([]);

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
      toast({ title: "Profile updated", description: "Your changes have been saved." });
      refetchProfile();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
    setSaving(false);
  };

  if (loading) return null;

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="fixed inset-0 mesh-gradient opacity-[0.03] pointer-events-none -z-20" />
      <div className="absolute top-[-10%] left-[-10%] glow-spot -z-10" style={{ "--glow-color": "hsl(var(--primary) / 0.1)" } as any} />
      
      <DashboardNav />
      <div className="container py-12 max-w-4xl relative z-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-xl bg-primary/10 border border-primary/20 text-primary">
              <User className="h-5 w-5" />
            </div>
            <span className="text-xs font-black uppercase tracking-[0.2em] text-primary">Identity Hub</span>
          </div>
          <h1 className="font-display text-5xl font-black text-foreground mb-3 tracking-tight">System Settings</h1>
          <p className="text-muted-foreground text-xl mb-12 font-medium">Configure your core profile and preferences for optimal tax intelligence.</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
              <TiltCard>
                <Card className="glass border-white/5 shadow-2xl overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-3xl -z-10 group-hover:bg-primary/20 transition-colors" />
                  <CardHeader>
                    <CardTitle className="font-display text-2xl font-black flex items-center gap-3">
                      <Shield className="h-6 w-6 text-primary" />
                      Personal Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6 pt-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-xs font-black uppercase tracking-widest text-muted-foreground">Registered Email</Label>
                        <Input id="email" value={user?.email || ""} disabled className="h-12 bg-white/5 border-white/5 rounded-xl font-bold text-muted-foreground" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="name" className="text-xs font-black uppercase tracking-widest text-muted-foreground">Full Name</Label>
                        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="h-12 bg-white/5 border-white/10 rounded-xl font-bold focus:ring-2 ring-primary/20 focus:border-primary transition-all" />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="employment" className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                          <Briefcase className="h-3 w-3" /> Employment Vector
                        </Label>
                        <Select value={employment} onValueChange={setEmployment}>
                          <SelectTrigger className="h-12 bg-white/5 border-white/10 rounded-xl font-bold">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent className="glass border-white/10">
                            <SelectItem value="salaried" className="font-bold">Salaried</SelectItem>
                            <SelectItem value="self-employed" className="font-bold">Self Employed</SelectItem>
                            <SelectItem value="business" className="font-bold">Business Owner</SelectItem>
                            <SelectItem value="freelancer" className="font-bold">Freelancer</SelectItem>
                            <SelectItem value="retired" className="font-bold">Retired</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="age" className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                          <Calendar className="h-3 w-3" /> Age Dimension
                        </Label>
                        <Select value={ageGroup} onValueChange={setAgeGroup}>
                          <SelectTrigger className="h-12 bg-white/5 border-white/10 rounded-xl font-bold">
                            <SelectValue placeholder="Select age group" />
                          </SelectTrigger>
                          <SelectContent className="glass border-white/10">
                            <SelectItem value="below-60" className="font-bold">Below 60 years</SelectItem>
                            <SelectItem value="60-80" className="font-bold">60 to 80 years</SelectItem>
                            <SelectItem value="above-80" className="font-bold">Above 80 years</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="regime" className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                        <Zap className="h-3 w-3" /> Tax Regime Preference
                      </Label>
                      <Select value={taxRegime} onValueChange={setTaxRegime}>
                        <SelectTrigger className="h-12 bg-white/5 border-white/10 rounded-xl font-bold">
                          <SelectValue placeholder="Select regime" />
                        </SelectTrigger>
                        <SelectContent className="glass border-white/10">
                          <SelectItem value="old" className="font-bold">Old Regime</SelectItem>
                          <SelectItem value="new" className="font-bold">New Regime</SelectItem>
                          <SelectItem value="not-sure" className="font-bold">Not Sure</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="pt-6 border-t border-white/5 flex justify-end">
                      <Magnetic>
                        <Button 
                          onClick={handleSave} 
                          disabled={saving}
                          className="px-10 h-14 rounded-2xl font-black text-lg transition-all shadow-xl shadow-primary/20 border-0"
                          style={{ background: "var(--gradient-primary)" }}
                        >
                          {saving ? <Loader2 className="h-5 w-5 mr-3 animate-spin" /> : <Save className="h-5 w-5 mr-3" />}
                          Update Identity
                        </Button>
                      </Magnetic>
                    </div>
                  </CardContent>
                </Card>
              </TiltCard>
            </motion.div>
          </div>

          <div className="space-y-8">
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}>
              <TiltCard>
                <Card className="glass border-white/5 shadow-2xl h-full group overflow-hidden">
                  <div className="absolute top-0 left-0 w-32 h-32 bg-secondary/10 blur-3xl -z-10 group-hover:bg-secondary/20 transition-colors" />
                  <CardHeader>
                    <CardTitle className="font-display text-xl font-black flex items-center gap-3">
                      <FileText className="h-5 w-5 text-secondary" />
                      Pulse Assets
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {documents.length === 0 ? (
                      <p className="text-muted-foreground text-sm font-bold italic py-8 text-center opacity-60">No primary documents indexed.</p>
                    ) : (
                      <div className="space-y-3">
                        {documents.map((doc, i) => (
                          <motion.div 
                            key={doc.id} 
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.5 + (i * 0.1) }}
                            className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 transition-all cursor-pointer group/item"
                          >
                            <div className="h-10 w-10 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary border border-secondary/20 group-hover/item:scale-110 transition-transform">
                              <FileText className="h-5 w-5" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-black text-foreground truncate">{doc.file_name}</p>
                              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-70">{doc.status}</p>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TiltCard>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
