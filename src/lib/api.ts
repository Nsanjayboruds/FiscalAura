import { supabase } from "@/integrations/supabase/client";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8080";
const IS_MOCK = import.meta.env.VITE_MOCK_SUPABASE === "true";

/**
 * Get the current access token for authenticating with the backend.
 * In mock mode, reads from localStorage instead of hitting Supabase.
 */
async function getToken(): Promise<string | null> {
    if (IS_MOCK) {
        return localStorage.getItem("mock_access_token");
    }
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token ?? null;
}

/**
 * Perform mock login against the local backend (only used when VITE_MOCK_SUPABASE=true).
 */
export async function mockLogin(email: string, password: string): Promise<{ access_token: string; user: { id: string; email: string } }> {
    const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Login failed" }));
        throw new Error(err.error || "Login failed");
    }
    return res.json();
}

/**
 * Clear mock session from localStorage.
 */
export function mockLogout() {
    localStorage.removeItem("mock_access_token");
    localStorage.removeItem("mock_user");
}

/**
 * Make an authenticated request to the Go backend.
 */
async function request<T = any>(
    path: string,
    options: RequestInit = {}
): Promise<T> {
    const token = await getToken();
    if (!token) {
        throw new Error("Not authenticated");
    }

    const headers: Record<string, string> = {
        Authorization: `Bearer ${token}`,
        ...(options.headers as Record<string, string> || {}),
    };

    // Don't set Content-Type for FormData (browser sets it automatically with boundary)
    if (!(options.body instanceof FormData)) {
        headers["Content-Type"] = "application/json";
    }

    const response = await fetch(`${API_BASE}${path}`, {
        ...options,
        headers,
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ error: response.statusText }));
        throw new Error(error.error || `Request failed: ${response.status}`);
    }

    const text = await response.text();
    if (!text || text === "null") return null as T;
    return JSON.parse(text);
}

// ---------- Profile ----------

export async function getProfile() {
    return request("/api/profile");
}

export async function updateProfile(data: {
    full_name?: string;
    employment_type?: string;
    age_group?: string;
    tax_regime?: string;
}) {
    return request("/api/profile", {
        method: "PUT",
        body: JSON.stringify(data),
    });
}

export async function completeOnboarding(data: {
    employment_type: string;
    income_sources: string[];
    age_group: string;
    tax_regime: string;
}) {
    return request("/api/onboarding/complete", {
        method: "POST",
        body: JSON.stringify(data),
    });
}

// ---------- Documents ----------

export async function getDocuments() {
    return request("/api/documents");
}

export async function uploadDocument(file: File) {
    const formData = new FormData();
    formData.append("file", file);
    return request("/api/documents/upload", {
        method: "POST",
        body: formData,
    });
}

export async function deleteDocument(id: string) {
    return request(`/api/documents/${id}`, { method: "DELETE" });
}

export async function analyzeDocument(id: string) {
    return request(`/api/documents/${id}/analyze`, { method: "POST" });
}

// ---------- Financial Data ----------

export async function getFinancialData() {
    return request("/api/financial-data");
}

export async function updateFinancialData(data: Record<string, any>) {
    return request("/api/financial-data", {
        method: "PUT",
        body: JSON.stringify(data),
    });
}

// ---------- Tax Analysis ----------

export async function getTaxAnalysis() {
    return request("/api/tax-analysis");
}

export async function runTaxAnalysis(financialData: Record<string, any>, profile: Record<string, any>) {
    return request("/api/tax-analysis/run", {
        method: "POST",
        body: JSON.stringify({ financialData, profile }),
    });
}

// ---------- Dashboard ----------

export async function getDashboardStats() {
    return request<{
        documents: number;
        totalIncome: number;
        estimatedTax: number;
        savings: number;
        incomeData: Array<{ name: string; value: number }> | null;
    }>("/api/dashboard/stats");
}

// ---------- Schemes ----------

export async function getSchemes() {
    return request<{ schemes: any[] | null }>("/api/schemes");
}

export async function getPersonalizedSchemes() {
    return request<{ schemes: any[]; data: any }>("/api/schemes/personalized", {
        method: "POST",
    });
}

// ---------- TaxBuddy (Standalone) ----------

export async function getTaxBuddyStrategy(data: {
    age: number;
    res_status: "Resident" | "NRI" | "RNOR";
    has_business: boolean;
    has_cap_gains: boolean;
    est_income: number;
    has_agri: boolean;
    is_director: boolean;
}) {
    return request<{
        success: boolean;
        data: {
            strategy: string;
            itr_form: string;
            primary_reason: string;
            smart_alerts: string;
        };
    }>("/api/taxbuddy/strategy", {
        method: "POST",
        body: JSON.stringify(data),
    });
}

// ---------- Advanced Fintech Modules ----------

export interface TaxHealthReport {
    overall_score: number;
    grade: string;
    summary: string;
    components: Array<{
        name: string;
        score: number;
        weight: number;
        status: string;
        explanation: string;
    }>;
    penalties: Array<{
        pillar: string;
        impact: number;
        reason: string;
        action_plan: string;
    }>;
}

export async function getTaxHealth(): Promise<TaxHealthReport> {
    return request<TaxHealthReport>("/api/tax/health");
}

export interface TaxAnomaly {
    id: string;
    severity: "info" | "warning" | "critical";
    title: string;
    description: string;
    amount: number;
    source: string;
    action: string;
}

export async function getTaxAnomalies(): Promise<{ anomalies: TaxAnomaly[] }> {
    return request<{ anomalies: TaxAnomaly[] }>("/api/tax/anomalies");
}

export interface Form16EmployerRecord {
    id: string;
    employer_name: string;
    employer_tan: string;
    period_from: string;
    period_to: string;
    gross_salary: number;
    exempt_allowances: number;
    standard_deduction: number;
    professional_tax: number;
    chapter_via_deductions: number;
    taxable_salary: number;
    tds_deducted: number;
}

export interface ConsolidatedForm16Result {
    employer_count: number;
    employers: Form16EmployerRecord[];
    total_gross_salary: number;
    total_exempt_allowances: number;
    standard_deduction_applied: number;
    total_professional_tax: number;
    total_chapter_via_deductions: number;
    consolidated_taxable_salary: number;
    total_tds_deducted: number;
    estimated_tax_on_combined: number;
    tds_shortfall_or_surplus: number;
    duplicate_deduction_caught: number;
    warnings: string[];
}

export async function consolidateForm16s(
    employers: Form16EmployerRecord[],
    financialYear: string = "2025-26",
    regime: string = "new"
): Promise<ConsolidatedForm16Result> {
    return request<ConsolidatedForm16Result>("/api/form16/consolidate", {
        method: "POST",
        body: JSON.stringify({ employers, financial_year: financialYear, regime }),
    });
}

export interface ReconciliationItem {
    category: string;
    declared_value: number;
    form16_value: number;
    ais_value: number;
    form26as_value: number;
    variance: number;
    status: "MATCHED" | "DIFFERENCE" | "MISSING";
    status_color: "green" | "yellow" | "red";
    suggested_action: string;
}

export interface FullReconciliationReport {
    overall_status: string;
    total_matched_count: number;
    total_discrepancies: number;
    net_income_variance: number;
    net_tds_variance: number;
    items: ReconciliationItem[];
    compliance_advisory: string;
}

export async function runReconciliationAudit(data?: any): Promise<FullReconciliationReport> {
    return request<FullReconciliationReport>("/api/reconciliation/run", {
        method: "POST",
        body: JSON.stringify(data || {}),
    });
}

export interface CapitalGainsReport {
    financial_year: string;
    total_realized_stcg: number;
    total_realized_ltcg: number;
    total_realized_loss: number;
    net_taxable_stcg: number;
    net_taxable_ltcg: number;
    ltcg_exemption_used: number;
    estimated_stcg_tax: number;
    estimated_ltcg_tax: number;
    total_capital_gain_tax: number;
    trades_count: number;
    trades?: any[];
    harvesting_insights: Array<{
        symbol: string;
        potential_loss_to_book: number;
        potential_tax_saved: number;
        asset_class: string;
        guidance: string;
    }>;
}

export async function analyzeCapitalGains(trades: any[], holdings: any[]): Promise<CapitalGainsReport> {
    return request<CapitalGainsReport>("/api/capital-gains/analyze", {
        method: "POST",
        body: JSON.stringify({ trades, holdings, financial_year: "2025-26" }),
    });
}

export interface AdvanceTaxReport {
    assessed_tax_liability: number;
    total_tds_credited: number;
    net_tax_subject_to_adv: number;
    is_advance_tax_required: boolean;
    installments: Array<{
        quarter_name: string;
        due_date: string;
        cumulative_percent: number;
        minimum_due_amount: number;
        amount_paid: number;
        shortfall: number;
        is_paid: boolean;
        section_234c_interest: number;
    }>;
    interest_234a: number;
    interest_234b: number;
    interest_234c: number;
    total_interest_payable: number;
    explanation_234a: string;
    explanation_234b: string;
    explanation_234c: string;
}

export async function calculateAdvanceTax(data: {
    assessed_tax: number;
    total_tds: number;
    paid_q1: number;
    paid_q2: number;
    paid_q3: number;
    paid_q4: number;
    filing_delay_months: number;
}): Promise<AdvanceTaxReport> {
    return request<AdvanceTaxReport>("/api/advance-tax/calculate", {
        method: "POST",
        body: JSON.stringify(data),
    });
}

export async function exportITR(formType: "ITR-1" | "ITR-2", taxpayer: any, input: any): Promise<any> {
    return request("/api/itr/export", {
        method: "POST",
        body: JSON.stringify({ form_type: formType, taxpayer, input }),
    });
}

export async function askCopilot(message: string, context: Record<string, any>): Promise<{ success: boolean; reply: string }> {
    return request<{ success: boolean; reply: string }>("/api/copilot/chat", {
        method: "POST",
        body: JSON.stringify({ message, context }),
    });
}

