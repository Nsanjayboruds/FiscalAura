import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, Key, ArrowRight } from "lucide-react";
import { TiltCard } from "@/components/AdvancedUI/TiltCard";
import { Magnetic } from "@/components/AdvancedUI/Magnetic";
import { motion } from "framer-motion";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const hash = window.location.hash;
    if (!hash.includes("type=recovery")) {
      navigate("/auth");
    }
  }, [navigate]);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast({ title: "Password updated!", description: "You can now sign in with your new password." });
      navigate("/auth");
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden bg-background">
      {/* Background Elements */}
      <div className="fixed inset-0 mesh-gradient opacity-[0.05] pointer-events-none -z-20" />
      <div className="fixed inset-0 glow-spot top-[-20%] right-[-10%] -z-10" style={{ "--glow-color": "hsl(var(--primary) / 0.15)" } as any} />

      <div className="w-full max-w-md relative z-10">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center mb-8"
        >
          <Link to="/" className="inline-flex items-center gap-3 justify-center group mb-8">
            <div className="p-2 rounded-xl bg-primary shadow-lg shadow-primary/30 group-hover:rotate-12 transition-transform">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <span className="font-display font-black text-2xl tracking-tighter text-foreground">FiscalAura</span>
          </Link>
        </motion.div>

        <TiltCard>
          <Card className="glass-darker border-white/10 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-32 h-32 bg-primary/10 blur-3xl -z-10 group-hover:bg-primary/20 transition-colors" />
            
            <CardHeader className="text-center pb-6">
              <div className="flex justify-center mb-4">
                <div className="p-4 rounded-[1.5rem] bg-primary/10 border border-primary/20">
                  <Key className="h-8 w-8 text-primary" />
                </div>
              </div>
              <CardTitle className="font-display text-3xl font-black tracking-tight text-foreground">Set Access Key</CardTitle>
              <CardDescription className="text-muted-foreground font-medium mt-2">Enter your new secure password below</CardDescription>
            </CardHeader>
            
            <CardContent>
              <form onSubmit={handleReset} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-xs font-black uppercase tracking-widest text-muted-foreground">New Access Key</Label>
                  <Input 
                    id="password" 
                    type="password" 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    placeholder="••••••••" 
                    required 
                    minLength={6} 
                    className="h-12 bg-white/5 border-white/10 rounded-xl focus:ring-primary focus:border-primary transition-all"
                  />
                </div>
                
                <Magnetic>
                  <Button 
                    type="submit" 
                    className="w-full rounded-xl h-14 font-black text-lg shadow-xl shadow-primary/20 hover:shadow-primary/40 transition-all border-0" 
                    style={{ background: "var(--gradient-primary)" }} 
                    disabled={loading}
                  >
                    {loading ? "Updating Shield..." : "Update access key"}
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Magnetic>
              </form>
            </CardContent>
          </Card>
        </TiltCard>
      </div>
    </div>
  );
};

export default ResetPassword;
