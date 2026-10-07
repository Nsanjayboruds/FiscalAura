import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import {
  LogOut,
  LayoutDashboard,
  Upload,
  Brain,
  FileCheck,
  TrendingUp,
  Calendar,
  Activity,
  FileText,
  User,
  ShieldCheck,
  Sparkles,
  Menu,
  X,
  Layers,
  Users,
} from "lucide-react";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";

export const FAMILY_PROFILES = [
  { id: "self", name: "Rajesh (Self)", relation: "Primary", pan: "ABCPS1234F" },
  { id: "spouse", name: "Priya (Spouse)", relation: "Consultant", pan: "XYZPS5678K" },
  { id: "parent", name: "Ramesh (Parent)", relation: "Senior Citizen", pan: "PQRPS9012M" },
];

const navItems = [
  { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { path: "/form16", label: "Form 16s", icon: Layers },
  { path: "/reconciliation", label: "AIS Reconcile", icon: FileCheck },
  { path: "/tax-analysis", label: "Regimes", icon: Brain },
  { path: "/capital-gains", label: "Capital Gains", icon: TrendingUp },
  { path: "/advance-tax", label: "Advance Tax", icon: Calendar },
  { path: "/simulator", label: "Simulator", icon: Activity },
  { path: "/copilot", label: "Copilot", icon: Sparkles },
  { path: "/reports", label: "Reports", icon: FileText },
];

const DashboardNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isDemo, setIsDemo] = useState(localStorage.getItem("fiscalaura_demo_mode") === "true");
  const [activeProfile, setActiveProfile] = useState(
    localStorage.getItem("fiscalaura_family_profile") || "self"
  );

  const switchProfile = (profileId: string) => {
    setActiveProfile(profileId);
    localStorage.setItem("fiscalaura_family_profile", profileId);
    const prof = FAMILY_PROFILES.find((p) => p.id === profileId);
    toast({
      title: `Switched Taxpayer Profile`,
      description: `Active Profile: ${prof?.name} (${prof?.relation}). All documents and calculations are isolated to this PAN.`,
    });
  };

  const toggleDemoMode = () => {
    const next = !isDemo;
    setIsDemo(next);
    localStorage.setItem("fiscalaura_demo_mode", String(next));
    if (next) {
      toast({
        title: "Demo Mode Enabled",
        description: "Loaded verified test records for Rajesh Sharma (Job Switcher + AIS Interest Discrepancy).",
      });
    } else {
      toast({
        title: "Live Mode Enabled",
        description: "Viewing your live taxpayer account data.",
      });
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  return (
    <>
      <nav className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
        <div className="container flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="flex items-center gap-6">
            {/* Logo */}
            <Link to="/dashboard" className="flex items-center gap-2 group">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white shadow-sm">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <span className="font-bold text-base text-slate-900 tracking-tight">FiscalAura</span>
            </Link>

            {/* Desktop Nav Items */}
            <div className="hidden lg:flex items-center gap-1 bg-slate-100/70 rounded-lg p-1 border border-slate-200/80">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link key={item.path} to={item.path}>
                    <Button
                      variant={isActive ? "default" : "ghost"}
                      size="sm"
                      className={`h-7 px-2.5 rounded-md text-xs font-medium ${
                        isActive
                          ? "bg-white text-primary shadow-sm hover:bg-white"
                          : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
                      }`}
                    >
                      <item.icon className="h-3.5 w-3.5 mr-1" />
                      <span>{item.label}</span>
                    </Button>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Right Action Items */}
          <div className="flex items-center gap-2">
            {/* Family Profile Switcher (Family Tax Hub) */}
            <div className="hidden sm:flex items-center">
              <select
                value={activeProfile}
                onChange={(e) => switchProfile(e.target.value)}
                className="text-[11px] font-semibold bg-slate-100 hover:bg-slate-200/80 text-slate-700 border border-slate-200 rounded-md px-2 py-1 outline-none cursor-pointer"
                title="Switch Taxpayer Profile (Family Tax Hub)"
              >
                {FAMILY_PROFILES.map((p) => (
                  <option key={p.id} value={p.id}>
                    👤 {p.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Demo Mode Switcher */}
            <button
              type="button"
              onClick={toggleDemoMode}
              className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border transition-colors flex items-center gap-1.5 ${
                isDemo
                  ? "bg-blue-50 border-blue-200 text-blue-700 shadow-sm"
                  : "bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200"
              }`}
            >
              <div className={`h-1.5 w-1.5 rounded-full ${isDemo ? "bg-blue-600" : "bg-slate-400"}`} />
              <span>{isDemo ? "Demo Active" : "Try Demo"}</span>
            </button>

            {/* Profile Link */}
            <Link to="/profile" className="hidden sm:inline-block">
              <Button
                variant={location.pathname === "/profile" ? "default" : "ghost"}
                size="sm"
                className="h-8 px-2 text-xs font-medium text-slate-600 hover:text-slate-900"
              >
                <User className="h-3.5 w-3.5 mr-1" /> Profile
              </Button>
            </Link>

            {/* Sign Out */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="hidden sm:flex h-8 px-2 text-xs font-medium text-slate-500 hover:text-red-600"
            >
              <LogOut className="h-3.5 w-3.5 mr-1" />
            </Button>

            {/* Mobile Hamburger */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden h-8 w-8 text-slate-600"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </nav>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-x-0 top-16 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 p-4 lg:hidden shadow-xl space-y-4 max-h-[calc(100vh-4rem)] overflow-y-auto">
          {/* Mobile Profile & Mode controls */}
          <div className="space-y-3 pb-3 border-b border-slate-100">
            <div>
              <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                Taxpayer Profile (Family Hub)
              </label>
              <select
                value={activeProfile}
                onChange={(e) => {
                  switchProfile(e.target.value);
                  setMobileOpen(false);
                }}
                className="w-full text-xs font-semibold bg-slate-50 text-slate-800 border border-slate-200 rounded-lg p-2 outline-none cursor-pointer"
              >
                {FAMILY_PROFILES.map((p) => (
                  <option key={p.id} value={p.id}>
                    👤 {p.name} — {p.pan} ({p.relation})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-xs text-slate-600 font-medium">Test & Simulation Scenario:</span>
              <button
                type="button"
                onClick={toggleDemoMode}
                className={`text-xs font-semibold px-3 py-1 rounded-full border transition-colors flex items-center gap-1.5 ${
                  isDemo
                    ? "bg-blue-50 border-blue-200 text-blue-700 shadow-sm"
                    : "bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200"
                }`}
              >
                <div className={`h-2 w-2 rounded-full ${isDemo ? "bg-blue-600" : "bg-slate-400"}`} />
                <span>{isDemo ? "Demo Active (Rajesh)" : "Enable Demo"}</span>
              </button>
            </div>
          </div>

          {/* Navigation Links Grid */}
          <div className="grid grid-cols-2 gap-2">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileOpen(false)}
                >
                  <div
                    className={`flex items-center gap-2 p-2.5 rounded-lg text-xs font-medium transition-colors ${
                      isActive
                        ? "bg-primary text-white font-semibold shadow-sm"
                        : "text-slate-700 bg-slate-50/70 hover:bg-slate-100"
                    }`}
                  >
                    <item.icon className="h-4 w-4 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Footer actions */}
          <div className="pt-3 border-t border-slate-100 flex justify-between items-center text-xs">
            <Link
              to="/profile"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-1.5 text-slate-700 font-semibold hover:text-primary p-1"
            >
              <User className="h-4 w-4" />
              <span>Taxpayer Profile</span>
            </Link>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                handleSignOut();
                setMobileOpen(false);
              }}
              className="text-xs text-red-600 hover:bg-red-50 hover:text-red-700 font-medium h-8"
            >
              <LogOut className="h-3.5 w-3.5 mr-1" /> Sign Out
            </Button>
          </div>
        </div>
      )}

      {/* Sleek Mobile Bottom Navigation Bar */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 py-1.5 px-3 flex justify-around items-center shadow-[0_-2px_10px_rgba(0,0,0,0.06)]">
        {[
          { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
          { path: "/form16", label: "Form 16", icon: Layers },
          { path: "/reconciliation", label: "AIS", icon: FileCheck },
          { path: "/capital-gains", label: "Cap Gains", icon: TrendingUp },
          { path: "/copilot", label: "Copilot", icon: Sparkles },
        ].map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setMobileOpen(false)}
              className="flex flex-col items-center justify-center py-1 px-2 rounded-md transition-colors"
            >
              <item.icon
                className={`h-4 w-4 transition-colors ${
                  isActive ? "text-primary" : "text-slate-500"
                }`}
              />
              <span
                className={`text-[10px] mt-0.5 tracking-tight ${
                  isActive ? "text-primary font-bold" : "text-slate-500 font-medium"
                }`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
        <button
          type="button"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="flex flex-col items-center justify-center py-1 px-2 rounded-md transition-colors text-slate-500 hover:text-slate-900"
        >
          <Menu className={`h-4 w-4 ${mobileOpen ? "text-primary" : "text-slate-500"}`} />
          <span className={`text-[10px] mt-0.5 font-medium ${mobileOpen ? "text-primary font-bold" : ""}`}>
            More
          </span>
        </button>
      </div>
    </>
  );
};

export default DashboardNav;
