import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ShieldCheck, KeyRound, ArrowRight, Loader2 } from "lucide-react";

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
      toast({ title: "Password Updated", description: "You can now sign in with your new password." });
      navigate("/auth");
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-slate-50/50">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <Link to="/" className="inline-flex items-center gap-2 mb-4">
            <div className="p-2 rounded-lg bg-primary text-white">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <span className="font-bold text-xl tracking-tight text-slate-900">FiscalAura</span>
          </Link>
        </div>

        <Card className="shadow-sm border-slate-200 bg-white">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto w-10 h-10 rounded-full bg-blue-50 text-primary flex items-center justify-center mb-2">
              <KeyRound className="h-5 w-5" />
            </div>
            <CardTitle className="text-xl font-bold text-slate-900">Create New Password</CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Enter your new tax portal account password below
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleReset} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-xs font-semibold text-slate-700">New Password</Label>
                <Input 
                  id="password" 
                  type="password" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  placeholder="At least 6 characters" 
                  required 
                  minLength={6} 
                />
              </div>
              
              <Button 
                type="submit" 
                className="w-full bg-primary hover:bg-primary/90 text-white font-medium text-xs h-10" 
                disabled={loading}
              >
                {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                {loading ? "Updating Password..." : "Update Password"}
                {!loading && <ArrowRight className="ml-1.5 h-3.5 w-3.5" />}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ResetPassword;
