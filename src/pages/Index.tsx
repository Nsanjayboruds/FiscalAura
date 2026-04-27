import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion, useScroll, useSpring } from "framer-motion";
import { ArrowRight, BarChart3, Shield, Zap, Globe, Sparkles, MousePointer2 } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { TiltCard } from "@/components/AdvancedUI/TiltCard";
import { Magnetic } from "@/components/AdvancedUI/Magnetic";

const Index = () => {
  const navigate = useNavigate();
  const { scrollYProgress } = useScroll();
  const scaleProgress = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });

  const textVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.1,
        duration: 0.8,
        ease: [0.215, 0.61, 0.355, 1],
      } as any,
    }),
  };

  return (
    <div className="min-h-screen bg-background selection:bg-primary/30 overflow-x-hidden">
      {/* Cinematic Mesh Gradient Background */}
      <div className="fixed inset-0 mesh-gradient opacity-[0.03] pointer-events-none -z-20" />
      <div className="fixed inset-0 glow-spot top-[-10%] right-[-10%] -z-10" style={{ "--glow-color": "hsl(var(--primary) / 0.15)" } as React.CSSProperties} />
      <div className="fixed inset-0 glow-spot bottom-[-10%] left-[-10%] -z-10" style={{ "--glow-color": "hsl(var(--secondary) / 0.1)" } as React.CSSProperties} />

      {/* Navigation */}
      <motion.nav 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 100, damping: 20 }}
        className="fixed top-0 left-0 right-0 z-50 px-6 py-4"
      >
        <div className="max-w-7xl mx-auto glass rounded-full px-8 py-3 flex items-center justify-between border-white/10 shadow-2xl backdrop-blur-2xl">
          <div
            className="flex items-center gap-2 group cursor-pointer"
            onClick={() => {
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          >
            <div className="p-2 rounded-xl bg-primary shadow-lg shadow-primary/30 group-hover:rotate-12 transition-transform">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <span className="font-display font-black text-2xl tracking-tighter text-foreground">FiscalAura</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            {["Services", "About", "Pricing", "Testimonials"].map((item) => (
              <NavLink key={item} to={`#${item.toLowerCase()}`} className="text-sm font-bold uppercase tracking-widest opacity-60 hover:opacity-100 transition-opacity">
                {item}
              </NavLink>
            ))}
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate("/auth")} className="font-bold hover:bg-white/5 rounded-full px-6">Login</Button>
            <Magnetic>
              <Button 
                onClick={() => navigate("/auth")}
                style={{ background: "var(--gradient-primary)" }}
                className="rounded-full px-8 font-black shadow-xl shadow-primary/25 hover:shadow-primary/40 transition-all border-0 h-11"
              >
                Join Now <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Magnetic>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section className="relative pt-44 pb-32 px-6">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          <motion.div initial="hidden" animate="visible" className="space-y-8">
            <motion.div variants={textVariants} custom={0} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 backdrop-blur-sm">
              <Zap className="h-4 w-4 text-primary animate-pulse" />
              <span className="text-xs font-black uppercase tracking-[0.2em] text-primary">Next-Gen Fiscal Intelligence</span>
            </motion.div>
            
            <motion.h1 variants={textVariants} custom={1} className="font-display text-7xl lg:text-8xl font-black leading-[0.9] tracking-tighter">
              The Radiant Future of <br />
              <span className="text-gradient">Tax Strategy.</span>
            </motion.h1>
            
            <motion.p variants={textVariants} custom={2} className="text-xl text-muted-foreground leading-relaxed max-w-lg font-medium">
              FiscalAura isn't just software. It's an autonomous financial partner engineered to find your path to absolute wealth optimization.
            </motion.p>
            
            <motion.div variants={textVariants} custom={3} className="flex flex-col sm:flex-row gap-6">
              <Magnetic strength={0.3}>
                <Button 
                  size="lg" 
                  onClick={() => navigate("/auth")}
                  style={{ background: "var(--gradient-primary)" }}
                  className="rounded-2xl px-10 h-16 font-black text-lg shadow-2xl shadow-primary/30 hover:scale-105 transition-transform"
                >
                  Enter the Aura <ArrowRight className="ml-3 h-5 w-5" />
                </Button>
              </Magnetic>
              <Button size="lg" variant="outline" className="rounded-2xl px-10 h-16 font-black text-lg border-2 hover:bg-white/5">
                Watch Philosophy
              </Button>
            </motion.div>

            <motion.div variants={textVariants} custom={4} className="flex items-center gap-12 pt-12 border-t border-white/5">
              {[["50k+", "Users"], ["₹10Cr+", "Saved"], ["4.9/5", "Rating"]].map(([val, label]) => (
                <div key={label}>
                  <div className="text-2xl font-black text-foreground">{val}</div>
                  <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{label}</div>
                </div>
              ))}
            </motion.div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className="relative hidden lg:block"
          >
            <TiltCard className="relative z-10">
              <div className="glass-darker p-8 rounded-[3rem] border-white/5 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 blur-3xl -z-10 group-hover:bg-primary/40 transition-colors" />
                <div className="flex items-center justify-between mb-8">
                  <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-xl">
                    <BarChart3 className="text-white h-6 w-6" />
                  </div>
                  <div className="text-xs font-black uppercase tracking-widest text-muted-foreground">Portfolio Alpha</div>
                </div>
                <div className="space-y-4">
                  <div className="h-6 w-1/2 bg-white/5 rounded-full" />
                  <div className="h-32 rounded-3xl bg-gradient-to-t from-primary/10 to-transparent border border-white/5 flex items-end p-4">
                    <div className="flex gap-2 w-full h-full items-end">
                      {[40, 70, 45, 90, 65, 80, 55].map((h, i) => (
                        <motion.div 
                          key={i} 
                          initial={{ height: 0 }}
                          animate={{ height: `${h}%` }}
                          transition={{ delay: 1 + (i * 0.1), duration: 1 }}
                          className="flex-1 bg-primary/40 rounded-t-lg" 
                        />
                      ))}
                    </div>
                  </div>
                  <div className="flex justify-between items-center text-sm font-bold pt-4">
                    <span className="text-muted-foreground">Optimization Yield</span>
                    <span className="text-secondary">+23.4%</span>
                  </div>
                </div>
              </div>
            </TiltCard>

            {/* Floating Accents */}
            <motion.div 
              animate={{ y: [0, -20, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -top-10 -right-10 glass p-6 rounded-3xl border-white/5 shadow-2xl z-20"
            >
              <Shield className="h-8 w-8 text-secondary" />
            </motion.div>
            <motion.div 
              animate={{ y: [0, 20, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              className="absolute -bottom-10 -left-10 glass p-6 rounded-3xl border-white/5 shadow-2xl z-20"
            >
              <Globe className="h-8 w-8 text-accent" />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Philosophy Section */}
      <section id="services" className="py-32 px-6 relative overflow-hidden bg-white/5">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-primary/5 blur-[200px] rounded-full -z-10" />
        <div className="max-w-7xl mx-auto text-center space-y-24">
          <div className="max-w-2xl mx-auto space-y-6">
            <h2 className="font-display text-5xl font-black tracking-tight">Engineered for Excellence.</h2>
            <p className="text-xl text-muted-foreground font-medium italic">"Taxes are the price we pay for a civilized society, but overpaying is the cost of poor strategy."</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Zap, title: "Autonomous Speed", desc: "Strategy generation that happens in milliseconds, not months." },
              { icon: Shield, title: "Ironclad Security", desc: "Bank-grade encryption protecting your most sensitive financial data." },
              { icon: MousePointer2, title: "Seamless UI", desc: "An interface so intuitive, tax planning finally feels effortless." }
            ].map((feature, i) => (
              <TiltCard key={i}>
                <div className="glass p-10 rounded-[2.5rem] border-white/5 text-left h-full hover:bg-white/5 transition-colors group">
                  <div className="p-4 rounded-2xl bg-primary/10 w-fit mb-8 group-hover:scale-110 transition-transform">
                    <feature.icon className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-2xl font-black mb-4">{feature.title}</h3>
                  <p className="text-muted-foreground font-medium leading-relaxed">{feature.desc}</p>
                </div>
              </TiltCard>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 px-6">
        <TiltCard className="max-w-6xl mx-auto shadow-[0_100px_100px_-50px_hsla(262,83%,58%,0.3)]">
          <div className="mesh-gradient rounded-[4rem] p-24 text-center space-y-12 relative overflow-hidden">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-3xl -z-10" />
            <div className="space-y-6">
              <h2 className="font-display text-4xl lg:text-7xl font-black text-white tracking-tighter leading-none">
                Ready to Rewrite Your <br />
                Financial Future?
              </h2>
              <p className="text-2xl text-white/70 font-medium max-w-2xl mx-auto">
                Join 50,000+ pioneers optimizing their wealth with FiscalAura.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <Magnetic>
                <Button 
                  size="lg" 
                  onClick={() => navigate("/auth")}
                  className="bg-white text-primary rounded-2xl px-12 h-20 font-black text-2xl hover:scale-105 transition-transform"
                >
                  Get Started Free
                </Button>
              </Magnetic>
              <Button size="lg" variant="outline" className="text-white border-white/20 bg-white/5 rounded-2xl px-12 h-20 font-black text-2xl hover:bg-white/10">
                Contact Alpha
              </Button>
            </div>
          </div>
        </TiltCard>
      </section>

      <footer className="py-20 text-center border-t border-white/5 px-6">
        <div className="mb-8 font-display font-black text-3xl opacity-20 tracking-tighter">FiscalAura.</div>
        <p className="text-muted-foreground font-bold uppercase tracking-[0.5em] text-[10px]">Optimized for FY 2025-26 • Engineered in India</p>
      </footer>
    </div>
  );
};

export default Index;
