import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { mockLogin } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, ArrowLeft, ShieldCheck } from "lucide-react";

const IS_MOCK = import.meta.env.VITE_MOCK_SUPABASE === "true";

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
    // Mock mode: check localStorage for an existing mock session
    if (IS_MOCK) {
      if (localStorage.getItem("mock_access_token")) {
        navigate("/dashboard");
      }
      return;
    }
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
      if (IS_MOCK) {
        // Mock mode: authenticate against local backend, store token in localStorage
        const data = await mockLogin(email, password);
        localStorage.setItem("mock_access_token", data.access_token);
        localStorage.setItem("mock_user", JSON.stringify(data.user));
        navigate("/dashboard");
        return;
      }

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
    <div className="min-h-screen flex items-center justify-center px-4 bg-background">
      <div className="w-full max-w-md py-12">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-white shadow-sm">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <span className="font-bold text-2xl tracking-tight text-foreground">FiscalAura</span>
          </Link>
          <p className="text-xs text-muted-foreground mt-2">Official Tax Computation & e-Filing Portal</p>
        </div>

        <Card className="border border-border bg-card shadow-md">
          <CardHeader className="text-center pb-4 pt-6">
            <CardTitle className="text-2xl font-bold tracking-tight text-foreground">
              {forgotPassword ? "Reset Your Password" : isSignUp ? "Create Your Account" : "Sign In to Your Account"}
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground mt-1.5">
              {forgotPassword
                ? "Enter your email address and we'll send a password reset link."
                : isSignUp
                  ? "Get started with automated ITR preparation and deduction tracking."
                  : "Access your saved Form 16, tax computations, and filings."}
            </CardDescription>
          </CardHeader>

          <CardContent className="p-6">
            <form onSubmit={handleAuth} className="space-y-4">
              {isSignUp && !forgotPassword && (
                <div className="space-y-1.5">
                  <Label htmlFor="name" className="text-xs font-semibold text-foreground">Full Name</Label>
                  <Input
                    id="name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Rajesh Kumar"
                    required
                    className="h-10 text-sm"
                  />
                </div>
              )}
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-semibold text-foreground">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  required
                  className="h-10 text-sm"
                />
              </div>
              {!forgotPassword && (
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="password" className="text-xs font-semibold text-foreground">Password</Label>
                    <button
                      type="button"
                      onClick={() => setForgotPassword(true)}
                      className="text-xs font-medium text-primary hover:underline"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      minLength={6}
                      className="h-10 text-sm pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-10 font-semibold text-sm bg-primary hover:bg-primary/90 text-white mt-2"
                disabled={loading}
              >
                {loading ? "Processing..." : forgotPassword ? "Send Reset Link" : isSignUp ? "Create Free Account" : "Sign In"}
              </Button>
            </form>

            <div className="mt-6 pt-4 border-t border-border text-center">
              {forgotPassword ? (
                <button
                  onClick={() => setForgotPassword(false)}
                  className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1.5"
                >
                  <ArrowLeft className="h-3.5 w-3.5" /> Back to sign in
                </button>
              ) : (
                <p className="text-xs text-muted-foreground">
                  {isSignUp ? "Already have an account?" : "Don't have an account yet?"}{" "}
                  <button
                    onClick={() => setIsSignUp(!isSignUp)}
                    className="text-primary hover:underline font-semibold ml-1"
                  >
                    {isSignUp ? "Sign In" : "Register Now"}
                  </button>
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-[11px] text-muted-foreground mt-8">
          Secured with 256-bit SSL encryption. All calculations compliant with CBDT rules.
        </p>
      </div>
    </div>
  );
};

export default Auth;
