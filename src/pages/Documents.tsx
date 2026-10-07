import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { getDocuments, uploadDocument, deleteDocument, analyzeDocument } from "@/lib/api";
import DashboardNav from "@/components/DashboardNav";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import { Upload, Trash2, FileText, Brain, Loader2, CheckCircle2, AlertCircle, ChevronDown, ChevronUp, Eye, ShieldCheck, Download } from "lucide-react";

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
      toast({ title: "Error", description: "Failed to fetch tax documents", variant: "destructive" });
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
      toast({ title: "Invalid File Type", description: "Please upload PDF, JPG, PNG, CSV, or Excel files.", variant: "destructive" });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "File Too Large", description: "Maximum allowed document size is 10MB.", variant: "destructive" });
      return;
    }

    setUploading(true);
    try {
      await uploadDocument(file);
      toast({ title: "Uploaded Successfully", description: `${file.name} is ready for parsing.` });
      fetchDocuments();
    } catch (error: any) {
      toast({ title: "Upload Failed", description: error.message, variant: "destructive" });
    }
    setUploading(false);
    e.target.value = "";
  };

  const handleAnalyze = async (doc: any) => {
    setAnalyzing(doc.id);
    try {
      await analyzeDocument(doc.id);
      toast({ title: "Parsing Complete", description: `Tax parameters extracted from ${doc.file_name}.` });
      fetchDocuments();
    } catch (error: any) {
      toast({ title: "Analysis Failed", description: error.message, variant: "destructive" });
    }
    setAnalyzing(null);
  };

  const handleDelete = async (doc: any) => {
    try {
      await deleteDocument(doc.id);
      toast({ title: "Deleted", description: `${doc.file_name} removed from your tax vault.` });
      fetchDocuments();
    } catch (error: any) {
      toast({ title: "Delete Failed", description: error.message, variant: "destructive" });
    }
  };

  const toggleExpanded = (docId: string) => {
    setExpandedDoc((prev) => (prev === docId ? null : docId));
  };

  if (authLoading) return null;

  const fmt = (n: number) => `₹${(n || 0).toLocaleString("en-IN")}`;

  const renderExtractedData = (doc: any) => {
    const data = doc.extracted_data;
    if (!data) return <p className="text-xs text-slate-500 py-3">No extracted fields available for this file.</p>;

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
      <div className="space-y-4 pt-4 border-t border-slate-200">
        {/* Document Tags */}
        <div className="flex flex-wrap gap-2 items-center">
          {data.document_type && (
            <Badge variant="outline" className="text-primary bg-primary/5 border-primary/20 text-xs font-semibold">
              {data.document_type}
            </Badge>
          )}
          {data.financial_year && (
            <Badge variant="secondary" className="text-xs font-semibold">
              FY {data.financial_year}
            </Badge>
          )}
          {data.employer_name && (
            <span className="text-xs text-slate-600">
              Employer: <strong className="text-slate-900">{data.employer_name}</strong>
            </span>
          )}
        </div>

        {/* Income Breakdown */}
        {incomeFields.length > 0 && (
          <div className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Extracted Salary & Income</span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {incomeFields.map((f) => (
                <div key={f.key} className="p-3 rounded-lg border border-slate-200 bg-slate-50">
                  <p className="text-[11px] font-medium text-slate-500">{f.label}</p>
                  <p className="text-base font-bold text-slate-900 mt-0.5">{fmt(data[f.key])}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Deductions Breakdown */}
        {deductionFields.length > 0 && (
          <div className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Allowable Deductions</span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {deductionFields.map((f) => (
                <div key={f.key} className="p-3 rounded-lg border border-emerald-100 bg-emerald-50/50">
                  <p className="text-[11px] font-medium text-emerald-800">{f.label}</p>
                  <p className="text-base font-bold text-emerald-700 mt-0.5">{fmt(data[f.key])}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TDS */}
        {tdsDeducted > 0 && (
          <div className="p-3 rounded-lg border border-amber-200 bg-amber-50/60 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-amber-800">TDS Deducted by Employer (Form 26AS Match)</p>
              <p className="text-xl font-bold text-amber-900 mt-0.5">{fmt(tdsDeducted)}</p>
            </div>
          </div>
        )}

        {/* Findings */}
        {data.key_findings && data.key_findings.length > 0 && (
          <div className="p-4 rounded-lg bg-blue-50/60 border border-blue-100 space-y-2">
            <p className="text-xs font-semibold text-blue-900 uppercase">Verification Findings</p>
            <ul className="space-y-1.5 text-xs text-blue-800 list-disc list-inside">
              {data.key_findings.map((finding: string, i: number) => (
                <li key={i}>{finding}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50/50">
      <DashboardNav />
      <main className="container max-w-6xl py-6 sm:py-8 space-y-6 px-4 sm:px-6 lg:px-8 pb-24 lg:pb-8">
        {/* Header */}
        <div className="border-b pb-5">
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className="text-primary border-primary/30 bg-primary/5 font-semibold text-xs">
              <FileText className="h-3 w-3 mr-1" /> Form 16 & Tax Documents
            </Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">Tax Document Vault</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
            Upload Form 16 (Part A & B), monthly payslips, and investment receipts (80C, 80D, HRA) for automated extraction and tax regime comparison.
          </p>
        </div>

        {/* Upload Card */}
        <Card className="shadow-sm border-slate-200 bg-white">
          <CardContent className="p-5 sm:p-8 text-center space-y-4">
            <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <Upload className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900">Upload Form 16 or Tax Proofs</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                PDF (Form 16 Part A & B), Salary Slips, Premium Receipts, or Excel sheets. Files up to 10MB.
              </p>
            </div>
            <div>
              <label className="cursor-pointer inline-block">
                <Input
                  type="file"
                  className="hidden"
                  onChange={handleUpload}
                  disabled={uploading}
                  accept=".pdf,.jpg,.jpeg,.png,.webp,.csv,.xlsx,.xls,.txt"
                />
                <Button 
                  disabled={uploading} 
                  className="bg-primary hover:bg-primary/90 text-white font-medium text-xs px-5 h-9"
                  asChild
                >
                  <span>
                    {uploading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
                    {uploading ? "Uploading & Encrypting..." : "Choose File to Upload"}
                  </span>
                </Button>
              </label>
            </div>
          </CardContent>
        </Card>

        {/* Document List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between pb-1">
            <h3 className="text-base font-semibold text-slate-900">Uploaded Tax Documents ({documents.length})</h3>
            <span className="text-xs text-slate-500">FY 2024-25 Records</span>
          </div>

          {documents.length === 0 ? (
            <Card className="border-dashed border-slate-300 bg-white p-10 text-center">
              <FileText className="h-10 w-10 mx-auto text-slate-300 mb-2" />
              <p className="text-sm font-medium text-slate-700">No documents uploaded yet</p>
              <p className="text-xs text-slate-400 mt-1">Upload your Form 16 above to auto-populate your tax return fields.</p>
            </Card>
          ) : (
            documents.map((doc) => (
              <Card key={doc.id} className="shadow-sm border-slate-200 bg-white">
                <CardContent className="p-4 sm:p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                      <div className={`p-2.5 rounded-lg border shrink-0 ${doc.status === 'analyzed' ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'bg-slate-100 border-slate-200 text-slate-500'}`}>
                        {doc.status === 'analyzed' ? <CheckCircle2 className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900 truncate">{doc.file_name}</p>
                        <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500">
                          <span>{(doc.file_size / 1024).toFixed(1)} KB</span>
                          <span>•</span>
                          <span className="capitalize font-medium text-slate-700">{doc.status}</span>
                          {doc.extracted_data?.document_type && (
                            <>
                              <span>•</span>
                              <Badge variant="outline" className="text-[10px] py-0 px-1.5 font-normal">
                                {doc.extracted_data.document_type}
                              </Badge>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {doc.status === "analyzed" && doc.extracted_data && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => toggleExpanded(doc.id)}
                          className="text-xs font-medium h-8"
                        >
                          <Eye className="h-3.5 w-3.5 mr-1.5" />
                          {expandedDoc === doc.id ? "Hide Details" : "View Extracted Data"}
                          {expandedDoc === doc.id ? <ChevronUp className="h-3 w-3 ml-1" /> : <ChevronDown className="h-3 w-3 ml-1" />}
                        </Button>
                      )}

                      {doc.status === "uploaded" && (
                        <Button
                          size="sm"
                          onClick={() => handleAnalyze(doc)}
                          disabled={analyzing === doc.id}
                          className="bg-primary hover:bg-primary/90 text-white text-xs font-medium h-8"
                        >
                          {analyzing === doc.id ? (
                            <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                          ) : (
                            <Brain className="h-3.5 w-3.5 mr-1.5" />
                          )}
                          Extract Tax Data
                        </Button>
                      )}

                      <Button 
                        size="icon" 
                        variant="ghost" 
                        onClick={() => handleDelete(doc)}
                        className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {expandedDoc === doc.id && renderExtractedData(doc)}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </main>
    </div>
  );
};

export default Documents;
