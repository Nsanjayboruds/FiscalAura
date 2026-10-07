import { useState, useEffect, useRef } from "react";
import DashboardNav from "@/components/DashboardNav";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { askCopilot, getFinancialData, getTaxAnalysis } from "@/lib/api";
import { DEMO_TAXPAYER } from "@/lib/demoData";
import { Brain, Send, Loader2, Sparkles, User, ShieldCheck, ArrowRight, Lightbulb } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const Copilot = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hello! I am your FiscalAura AI Tax Copilot. I have loaded your deterministic tax computation, Form 16s, and AIS reconciliation. Ask me anything about your tax liability, optimal regime choice, or missing deductions.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [contextData, setContextData] = useState<any>(DEMO_TAXPAYER);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadUserContext();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadUserContext = async () => {
    try {
      const [fin, tax] = await Promise.all([getFinancialData(), getTaxAnalysis()]);
      if (fin && tax) {
        setContextData({ financialData: fin, taxAnalysis: tax });
      }
    } catch {
      // Use demo context
    }
  };

  const handleSend = async (textToSend?: string) => {
    const q = textToSend || input;
    if (!q.trim() || loading) return;

    const userMsg: Message = { role: "user", content: q };
    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput("");
    setLoading(true);

    try {
      const res = await askCopilot(q, contextData);
      setMessages((prev) => [...prev, { role: "assistant", content: res.reply }]);
    } catch (err: any) {
      toast({ title: "Copilot Error", description: err.message, variant: "destructive" });
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "I could not complete that request at the moment. Please verify backend connectivity.",
        },
      ]);
    }
    setLoading(false);
  };

  const QUICK_PROMPTS = [
    "Why is the New Regime recommended for me?",
    "Explain my Section 87A rebate calculation",
    "What happens if I invest ₹50,000 in NPS?",
    "Why does AIS show a ₹12,800 interest discrepancy?",
  ];

  return (
    <div className="min-h-screen bg-slate-50/50">
      <DashboardNav />
      <main className="container max-w-5xl py-8 space-y-6">
        {/* Header */}
        <div className="border-b pb-5">
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className="text-primary border-primary/30 bg-primary/5 font-semibold text-xs">
              <Brain className="h-3 w-3 mr-1" /> Context-Aware Tax Copilot
            </Badge>
            <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-semibold">
              Live Return Context Loaded
            </Badge>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">AI Tax Copilot</h1>
          <p className="text-sm text-slate-500 mt-1 max-w-3xl">
            Ask specific questions about your tax return. Copilot analyzes your exact figures, Form 16s, and AIS reconciliation to give legal, mathematically sound explanations.
          </p>
        </div>

        {/* Chat Card */}
        <Card className="shadow-sm border-slate-200 bg-white flex flex-col h-[600px]">
          <CardHeader className="py-3 px-6 border-b flex flex-row items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <Brain className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-sm font-semibold text-slate-900">FiscalAura Intelligence Consultant</CardTitle>
                <CardDescription className="text-[11px]">FY 2024-25 (AY 2025-26) Statutory Engine</CardDescription>
              </div>
            </div>
            <span className="text-[11px] text-slate-400 font-medium">Deterministic Context</span>
          </CardHeader>

          {/* Messages Feed */}
          <CardContent className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex gap-3 text-xs leading-relaxed ${
                  m.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {m.role === "assistant" && (
                  <div className="h-7 w-7 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                    <Brain className="h-4 w-4" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-xl p-4 ${
                    m.role === "user"
                      ? "bg-primary text-white font-medium"
                      : "bg-slate-100/90 text-slate-800 border border-slate-200/80 prose prose-slate prose-sm max-w-none"
                  }`}
                >
                  <ReactMarkdown>{m.content}</ReactMarkdown>
                </div>
                {m.role === "user" && (
                  <div className="h-7 w-7 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center shrink-0 mt-0.5">
                    <User className="h-4 w-4" />
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="flex gap-3 text-xs items-center text-slate-500">
                <div className="h-7 w-7 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
                <span>Analyzing your financial data with tax engine context...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </CardContent>

          {/* Quick Prompts & Input Footer */}
          <CardFooter className="flex flex-col gap-3 border-t p-4 bg-slate-50/50">
            <div className="flex flex-wrap gap-1.5 w-full">
              {QUICK_PROMPTS.map((prompt, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleSend(prompt)}
                  disabled={loading}
                  className="text-[11px] font-medium bg-white hover:bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full border border-slate-200 transition-colors text-left flex items-center gap-1"
                >
                  <Lightbulb className="h-3 w-3 text-amber-500" />
                  {prompt}
                </button>
              ))}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex gap-2 w-full"
            >
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about your taxes, deductions, Form 16, or regime comparison..."
                disabled={loading}
                className="text-xs h-10 bg-white"
              />
              <Button type="submit" disabled={loading || !input.trim()} className="h-10 px-4 bg-primary text-white text-xs">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </form>
          </CardFooter>
        </Card>
      </main>
    </div>
  );
};

export default Copilot;
