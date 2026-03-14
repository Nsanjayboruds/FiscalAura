import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { getDocuments, uploadDocument, deleteDocument, analyzeDocument } from "@/lib/api";
import DashboardNav from "@/components/DashboardNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, Trash2, FileText, Brain, Loader2, CheckCircle, AlertCircle, ChevronDown, ChevronUp, Eye, Sparkles } from "lucide-react";
import { TiltCard } from "@/components/AdvancedUI/TiltCard";
import { Magnetic } from "@/components/AdvancedUI/Magnetic";

const Documents = () => {
  const { user, loading: authLoading } = useAuth();
  const [documents, setDocuments] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState<string | null>(null);
  const [expandedDoc, setExpandedDoc] = useState<string | null>(null);

  useEffect(() => {
    if (user) fetchDocuments();
  }, [user]);

  const fetchDocuments = async () => {
    try {
      const data = await getDocuments();
      setDocuments(Array.isArray(data) ? data : []);
    } catch {
      toast({ title: "Error", description: "Failed to fetch documents", variant: "destructive" });
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    const allowedTypes = [
      "application/pdf", "image/jpeg", "image/png", "image/webp",
      "text/csv", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel", "text/plain",
    ];

    if (!allowedTypes.includes(file.type)) {
      toast({ title: "Invalid file type", description: "Please upload PDF, image, CSV, Excel, or text files.", variant: "destructive" });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "File too large", description: "Maximum file size is 10MB.", variant: "destructive" });
      return;
    }

    setUploading(true);
    try {
      await uploadDocument(file);
      toast({ title: "Uploaded!", description: `${file.name} has been uploaded successfully.` });
      fetchDocuments();
    } catch (error: any) {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
    }
    setUploading(false);
    e.target.value = "";
  };

  const handleAnalyze = async (doc: any) => {
    setAnalyzing(doc.id);
    try {
      await analyzeDocument(doc.id);
      toast({ title: "Analysis complete!", description: `${doc.file_name} has been analyzed.` });
      fetchDocuments();
    } catch (error: any) {
      toast({ title: "Analysis failed", description: error.message, variant: "destructive" });
    }
    setAnalyzing(null);
  };

  const handleDelete = async (doc: any) => {
    try {
      await deleteDocument(doc.id);
      toast({ title: "Deleted", description: `${doc.file_name} has been removed.` });
      fetchDocuments();
    } catch (error: any) {
      toast({ title: "Delete failed", description: error.message, variant: "destructive" });
    }
  };

  const toggleExpanded = (docId: string) => {
    setExpandedDoc((prev) => (prev === docId ? null : docId));
  };

  if (authLoading) return null;

  const statusIcon = (status: string) => {
    switch (status) {
      case "analyzed": return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "analyzing": return <Loader2 className="h-5 w-5 animate-spin text-primary" />;
      case "error": return <AlertCircle className="h-5 w-5 text-destructive" />;
      default: return <FileText className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const renderExtractedData = (doc: any) => {
    const data = doc.extracted_data;
    if (!data) return <p className="text-sm text-muted-foreground">No analysis data available.</p>;

    const fmt = (n: number) => `₹${(n || 0).toLocaleString("en-IN")}`;

    const incomeFields = [
      { key: "gross_salary", label: "Gross Salary" },
      { key: "hra_received", label: "HRA Received" },
      { key: "lta_received", label: "LTA Received" },
      { key: "other_income", label: "Other Income" },
    ].filter((f) => data[f.key] && data[f.key] > 0);

    const deductionFields = [
      { key: "deductions_80c", label: "Section 80C" },
      { key: "deductions_80d", label: "Section 80D (Health)" },
      { key: "deductions_80e", label: "Section 80E (Education)" },
      { key: "deductions_80g", label: "Section 80G (Donations)" },
      { key: "deductions_nps", label: "NPS (80CCD)" },
      { key: "professional_tax", label: "Professional Tax" },
    ].filter((f) => data[f.key] && data[f.key] > 0);

    const tdsDeducted = data.tds_deducted || 0;

    return (
      <div className="space-y-6 pt-2">
        {/* Document Info Tags */}
        <div className="flex flex-wrap gap-2 items-center">
          {data.document_type && (
            <span className="text-[10px] font-black uppercase tracking-widest bg-primary/10 text-primary px-3 py-1.5 rounded-lg border border-primary/20">
              {data.document_type}
            </span>
          )}
          {data.financial_year && (
            <span className="text-[10px] font-black uppercase tracking-widest bg-secondary/10 text-secondary px-3 py-1.5 rounded-lg border border-secondary/20">
              FY {data.financial_year}
            </span>
          )}
          {data.employer_name && (
            <span className="text-xs font-bold text-muted-foreground">Employer: <span className="text-foreground">{data.employer_name}</span></span>
          )}
        </div>

        {/* Income Breakdown */}
        {incomeFields.length > 0 && (
          <div className="space-y-3">
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Primary Revenue Signals</p>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {incomeFields.map((f) => (
                <div key={f.key} className="p-4 rounded-2xl glass border-white/5 bg-green-500/[0.02]">
                  <p className="text-xs font-bold text-muted-foreground mb-1">{f.label}</p>
                  <p className="text-xl font-black font-display text-green-600 dark:text-green-400">{fmt(data[f.key])}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Deductions Breakdown */}
        {deductionFields.length > 0 && (
          <div className="space-y-3">
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Efficiency Deductions</p>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
              {deductionFields.map((f) => (
                <div key={f.key} className="p-4 rounded-2xl glass border-white/5 bg-blue-500/[0.02]">
                  <p className="text-xs font-bold text-muted-foreground mb-1">{f.label}</p>
                  <p className="text-xl font-black font-display text-blue-600 dark:text-blue-400">{fmt(data[f.key])}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TDS Highlight */}
        {tdsDeducted > 0 && (
          <div className="p-5 rounded-2xl glass border-white/5 bg-amber-500/[0.03] flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-1">Pre-deducted TDS</p>
              <p className="text-3xl font-black font-display text-amber-600 dark:text-amber-400">{fmt(tdsDeducted)}</p>
            </div>
            <div className="h-12 w-12 rounded-full bg-amber-500/10 flex items-center justify-center">
              <Sparkles className="h-6 w-6 text-amber-500" />
            </div>
          </div>
        )}

        {/* Key Findings */}
        {data.key_findings && data.key_findings.length > 0 && (
          <div className="p-6 rounded-[2rem] glass border-white/5 bg-primary/[0.01]">
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-4">Intelligence Insights</p>
            <ul className="space-y-3">
              {data.key_findings.map((finding: string, i: number) => (
                <li key={i} className="text-sm font-medium text-foreground flex items-start gap-4">
                  <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_10px_rgba(var(--primary),0.5)]" />
                  <span>{finding}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="fixed inset-0 mesh-gradient opacity-[0.03] pointer-events-none -z-20" />
      <div className="absolute top-[-5%] right-[-5%] glow-spot -z-10" style={{ "--glow-color": "hsl(var(--primary) / 0.1)" } as any} />
      
      <DashboardNav />
      <div className="container py-12 relative z-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-xl bg-primary/10 border border-primary/20 text-primary">
              <FileText className="h-5 w-5" />
            </div>
            <span className="text-xs font-black uppercase tracking-[0.2em] text-primary">Data Repository</span>
          </div>
          <h1 className="font-display text-5xl font-black text-foreground mb-3 tracking-tight">Intelligence Vault</h1>
          <p className="text-muted-foreground text-xl mb-12 font-medium max-w-2xl">Manage and feed your tax engine with primary source documents for deep analysis.</p>
        </motion.div>

        {/* Upload area */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <TiltCard>
            <Card className="mb-12 glass border-white/5 shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 blur-[100px] pointer-events-none -z-10 group-hover:bg-primary/20 transition-colors" />
              <CardContent className="p-12 text-center">
                <div className="mx-auto w-20 h-20 rounded-3xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Upload className="h-10 w-10 text-primary" />
                </div>
                <h3 className="font-display font-black text-3xl text-foreground mb-3 tracking-tight">Submit New Signal</h3>
                <p className="text-muted-foreground text-lg mb-8 max-w-lg mx-auto font-medium">
                  Support for PDF, Images, CSV, or Excel. Ensure documents are clear for optimal engine extraction.
                </p>
                <label className="cursor-pointer relative z-10">
                  <Input
                    type="file"
                    className="hidden"
                    onChange={handleUpload}
                    disabled={uploading}
                    accept=".pdf,.jpg,.jpeg,.png,.webp,.csv,.xlsx,.xls,.txt"
                  />
                  <Magnetic>
                    <Button 
                      disabled={uploading} 
                      className="px-10 h-14 rounded-2xl font-black text-lg transition-all shadow-xl shadow-primary/20"
                      style={{ background: "var(--gradient-primary)" }}
                      asChild
                    >
                      <span>
                        {uploading ? <Loader2 className="h-5 w-5 mr-3 animate-spin" /> : <Upload className="h-5 w-5 mr-3" />}
                        {uploading ? "Ingesting..." : "Secure Upload"}
                      </span>
                    </Button>
                  </Magnetic>
                </label>
              </CardContent>
            </Card>
          </TiltCard>
        </motion.div>

        {/* Document list */}
        <div className="space-y-6">
          <h3 className="text-xs font-black uppercase tracking-[0.3em] text-muted-foreground/60 px-4">Active Assets</h3>
          <div className="grid gap-4">
            {documents.length === 0 ? (
              <Card className="glass border-white/5 border-dashed">
                <CardContent className="p-12 text-center text-muted-foreground font-bold">
                  The vault is currently empty. Initialize your first upload.
                </CardContent>
              </Card>
            ) : (
              documents.map((doc, i) => (
                <motion.div 
                  key={doc.id} 
                  initial={{ opacity: 0, x: -20 }} 
                  animate={{ opacity: 1, x: 0 }} 
                  transition={{ delay: 0.3 + (i * 0.05) }}
                >
                  <Card className={`glass border-white/5 transition-all duration-500 overflow-hidden ${expandedDoc === doc.id ? "ring-2 ring-primary/20 shadow-2xl" : "hover:bg-white/5"}`}>
                    <CardContent className="p-6">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex items-center gap-6">
                          <div className={`h-14 w-14 rounded-2xl flex items-center justify-center border border-white/10 ${doc.status === 'analyzed' ? 'bg-green-500/10' : 'bg-muted/10'}`}>
                            {statusIcon(doc.status)}
                          </div>
                          <div>
                            <p className="font-black text-foreground text-lg leading-tight mb-1">{doc.file_name}</p>
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{(doc.file_size / 1024).toFixed(1)} KB</span>
                              <div className="h-1 w-1 rounded-full bg-muted-foreground/30" />
                              <span className={`text-[10px] font-black uppercase tracking-widest ${doc.status === 'analyzed' ? 'text-green-500' : 'text-primary'}`}>{doc.status}</span>
                              {doc.extracted_data?.document_type && (
                                <>
                                  <div className="h-1 w-1 rounded-full bg-muted-foreground/30" />
                                  <span className="text-[10px] font-black uppercase tracking-widest text-secondary">{doc.extracted_data.document_type}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {doc.status === "analyzed" && doc.extracted_data && (
                            <Magnetic strength={0.2}>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => toggleExpanded(doc.id)}
                                className="h-11 rounded-xl px-6 font-bold gap-2 glass border-white/10 hover:bg-white/10 transition-all"
                              >
                                <Eye className="h-4 w-4" />
                                {expandedDoc === doc.id ? "Collapse" : "Review Summary"}
                                {expandedDoc === doc.id ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                              </Button>
                            </Magnetic>
                          )}
                          {doc.status === "uploaded" && (
                            <Magnetic strength={0.2}>
                              <Button
                                size="sm"
                                onClick={() => handleAnalyze(doc)}
                                disabled={analyzing === doc.id}
                                className="h-11 rounded-xl px-6 font-bold gap-2 shadow-lg shadow-primary/10"
                                style={{ background: "var(--gradient-primary)" }}
                              >
                                {analyzing === doc.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <><Brain className="h-4 w-4" /> Deep Analyze</>
                                )}
                              </Button>
                            </Magnetic>
                          )}
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            onClick={() => handleDelete(doc)}
                            className="h-11 w-11 rounded-xl hover:bg-destructive/10 group"
                          >
                            <Trash2 className="h-5 w-5 text-muted-foreground group-hover:text-destructive transition-colors" />
                          </Button>
                        </div>
                      </div>

                      {/* Expandable analysis summary */}
                      <AnimatePresence>
                        {expandedDoc === doc.id && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.4, ease: [0.215, 0.61, 0.355, 1] }}
                          >
                            <div className="mt-8 pt-8 border-t border-white/5">
                              {renderExtractedData(doc)}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Documents;
