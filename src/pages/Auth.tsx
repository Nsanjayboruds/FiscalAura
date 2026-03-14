import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, ArrowLeft, Sparkles, Zap } from "lucide-react";
import { TiltCard } from "@/components/AdvancedUI/TiltCard";
import { Magnetic } from "@/components/AdvancedUI/Magnetic";
import { motion } from "framer-motion";

const Auth = () => {
  const [searchParams] = useSearchParams();
  const [isSignUp, setIsSignUp] = useState(searchParams.get("tab") === "signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [forgotPassword, setForgotPassword] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN") {
        navigate("/dashboard");
      }
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate("/dashboard");
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (forgotPassword) {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        toast({ title: "Check your email", description: "We've sent you a password reset link." });
        setForgotPassword(false);
      } else if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName },
            emailRedirectTo: window.location.origin,
          },
        });
        if (error) throw error;
        toast({ title: "Account created!", description: "Please check your email to verify your account." });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
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
      <div className="fixed inset-0 glow-spot bottom-[-20%] left-[-10%] -z-10" style={{ "--glow-color": "hsl(var(--secondary) / 0.1)" } as any} />

      <div className="w-full max-w-md relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <Link to="/" className="inline-flex items-center gap-3 group">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-white shadow-lg shadow-primary/30 group-hover:rotate-12 transition-transform">
              <Sparkles className="h-6 w-6" />
            </div>
            <span className="font-display font-black text-3xl tracking-tighter text-foreground">FiscalAura</span>
          </Link>
        </motion.div>

        <TiltCard>
          <Card className="glass-darker border-white/10 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-3xl -z-10 group-hover:bg-primary/20 transition-colors" />
            
            <CardHeader className="text-center pb-6">
              <div className="flex justify-center mb-4">
                <div className="p-3 rounded-2xl bg-primary/10 border border-primary/20">
                  <Zap className="h-6 w-6 text-primary animate-pulse" />
                </div>
              </div>
              <CardTitle className="font-display text-3xl font-black tracking-tight text-foreground">
                {forgotPassword ? "Recover Access" : isSignUp ? "Join the Future" : "Welcome Back"}
              </CardTitle>
              <CardDescription className="text-base font-medium text-muted-foreground mt-2">
                {forgotPassword
                  ? "We'll send you a secure link to reset."
                  : isSignUp
                  ? "Start your autonomous tax journey."
                  : "Sign in to your financial ecosystem."}
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <form onSubmit={handleAuth} className="space-y-6">
                {isSignUp && !forgotPassword && (
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-xs font-black uppercase tracking-widest text-muted-foreground">Full Name</Label>
                    <Input 
                      id="name" 
                      value={fullName} 
                      onChange={(e) => setFullName(e.target.value)} 
                      placeholder="Rahul Sharma" 
                      required 
                      className="h-12 bg-white/5 border-white/10 rounded-xl focus:ring-primary focus:border-primary transition-all"
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-xs font-black uppercase tracking-widest text-muted-foreground">Email Domain</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    placeholder="you@example.com" 
                    required 
                    className="h-12 bg-white/5 border-white/10 rounded-xl focus:ring-primary focus:border-primary transition-all"
                  />
                </div>
                {!forgotPassword && (
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-xs font-black uppercase tracking-widest text-muted-foreground">Access Key</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        minLength={6}
                        className="h-12 bg-white/5 border-white/10 rounded-xl pr-12 focus:ring-primary focus:border-primary transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>
                )}

                <Magnetic>
                  <Button 
                    type="submit" 
                    className="w-full rounded-xl h-14 font-black text-lg shadow-xl shadow-primary/20 hover:shadow-primary/40 transition-all border-0" 
                    style={{ background: "var(--gradient-primary)" }} 
                    disabled={loading}
                  >
                    {loading ? "Authenticating..." : forgotPassword ? "Reset Access" : isSignUp ? "Initialize Account" : "Enter Dashboard"}
                  </Button>
                </Magnetic>
              </form>

              <div className="mt-8 space-y-4 text-center">
                {!forgotPassword && (
                  <button 
                    onClick={() => setForgotPassword(true)} 
                    className="text-sm font-bold text-primary/70 hover:text-primary transition-colors hover:underline"
                  >
                    Forgot access key?
                  </button>
                )}
                <div>
                  {forgotPassword ? (
                    <button 
                      onClick={() => setForgotPassword(false)} 
                      className="text-sm font-bold text-primary hover:underline inline-flex items-center gap-2"
                    >
                      <ArrowLeft className="h-4 w-4" /> Back to primary login
                    </button>
                  ) : (
                    <p className="text-sm font-medium text-muted-foreground">
                      {isSignUp ? "Already part of the ecosystem?" : "New to the intelligence?"}{" "}
                      <button 
                        onClick={() => setIsSignUp(!isSignUp)} 
                        className="text-primary hover:underline font-black ml-1"
                      >
                        {isSignUp ? "Sign In" : "Join Now"}
                      </button>
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TiltCard>
      </div>

      <footer className="absolute bottom-8 w-full text-center px-6">
        <p className="text-[10px] font-black uppercase tracking-[0.5em] text-muted-foreground/30">Standard Encryption • Privacy First Ecosystem</p>
      </footer>
    </div>
  );
};

export default Auth;
