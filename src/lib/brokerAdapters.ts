/**
 * BrokerAdapter System - FiscalAura Capital Gains Module
 */

export interface CapitalGainsTrade {
  symbol: string;
  isin?: string;
  quantity: number;
  buy_date: string;
  sell_date: string;
  buy_price: number;
  sell_price: number;
  gain_loss: number;
  is_long_term: boolean;
  asset_type: "equity" | "mutual_fund" | "debt_fund" | "other";
  broker: string;
}

export interface AdapterResult {
  trades: CapitalGainsTrade[];
  warnings: string[];
  broker: string;
  parsed_count: number;
  skipped_count: number;
}

function parseIndianDate(raw: string): string | null {
  if (!raw) return null;
  const trim = raw.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trim)) return trim;
  const dmy = trim.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  if (dmy) {
    const [, d, m, y] = dmy;
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  const MONTHS: Record<string, string> = {
    jan: "01", feb: "02", mar: "03", apr: "04", may: "05", jun: "06",
    jul: "07", aug: "08", sep: "09", oct: "10", nov: "11", dec: "12",
  };
  const dMonY = trim.match(/^(\d{1,2})\s+([A-Za-z]{3})\s+(\d{4})$/);
  if (dMonY) {
    const [, d, mon, y] = dMonY;
    const m = MONTHS[mon.toLowerCase()];
    if (m) return `${y}-${m}-${d.padStart(2, "0")}`;
  }
  const monDY = trim.match(/^([A-Za-z]{3})\s+(\d{1,2})[,\s]\s*(\d{4})$/);
  if (monDY) {
    const [, mon, d, y] = monDY;
    const m = MONTHS[mon.toLowerCase()];
    if (m) return `${y}-${m}-${d.padStart(2, "0")}`;
  }
  return null;
}

function holdingMonths(buyDate: string, sellDate: string): number {
  const buy = new Date(buyDate);
  const sell = new Date(sellDate);
  return (sell.getFullYear() - buy.getFullYear()) * 12 + (sell.getMonth() - buy.getMonth());
}

function isLongTermFn(buyDate: string, sellDate: string, assetType: string): boolean {
  const months = holdingMonths(buyDate, sellDate);
  if (assetType === "equity" || assetType === "mutual_fund") return months > 12;
  if (assetType === "debt_fund") return months > 36;
  return months > 12;
}

function parseCsv(text: string): { headers: string[]; rows: Record<string, string>[] } {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return { headers: [], rows: [] };
  const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, "").toLowerCase());
  const rows: Record<string, string>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",").map((c) => c.trim().replace(/^"|"$/g, ""));
    if (cols.length < headers.length / 2) continue;
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => { row[h] = cols[idx] ?? ""; });
    rows.push(row);
  }
  return { headers, rows };
}

function safeFloat(val: string | undefined): number {
  if (!val) return 0;
  const cleaned = val.replace(/[₹,\s]/g, "");
  const n = parseFloat(cleaned);
  return isNaN(n) ? 0 : n;
}

export const ZerodhaAdapter = {
  name: "Zerodha" as const,
  detect(headers: string[]): boolean {
    const h = headers.join(" ");
    return h.includes("buy_date") || h.includes("buy date") || h.includes("trade_type") || (h.includes("symbol") && h.includes("net_profit"));
  },
  parse(text: string): AdapterResult {
    const { rows } = parseCsv(text);
    const trades: CapitalGainsTrade[] = [];
    const warnings: string[] = [];
    let skipped = 0;
    for (const r of rows) {
      const symbol = r["symbol"] || r["scrip"] || r["instrument"] || r["stock"] || "";
      const isin = r["isin"] || undefined;
      const quantity = safeFloat(r["quantity"] || r["qty"] || r["shares"]);
      const buyDateRaw = r["buy_date"] || r["buy date"] || r["purchase_date"] || r["date of purchase"] || "";
      const sellDateRaw = r["sell_date"] || r["sell date"] || r["sale_date"] || r["date of sale"] || "";
      const buyDate = parseIndianDate(buyDateRaw);
      const sellDate = parseIndianDate(sellDateRaw);
      if (!symbol || !buyDate || !sellDate || quantity === 0) {
        skipped++;
        if (symbol) warnings.push(`Skipped ${symbol}: missing date or quantity`);
        continue;
      }
      const buyPrice = safeFloat(r["buy_price"] || r["buy price"] || r["average buy price"] || r["cost price"] || "0");
      const sellPrice = safeFloat(r["sell_price"] || r["sell price"] || r["average sell price"] || r["sale price"] || "0");
      const gainLoss = safeFloat(r["net_profit"] || r["profit/loss"] || r["gain/loss"] || "0") || (sellPrice - buyPrice) * quantity;
      const assetType: CapitalGainsTrade["asset_type"] =
        (r["type"] || r["instrument type"] || "").toLowerCase().includes("mf") ||
        (r["type"] || "").toLowerCase().includes("mutual fund") ? "mutual_fund" : "equity";
      const lt = isLongTermFn(buyDate, sellDate, assetType);
      trades.push({ symbol: symbol.toUpperCase(), isin, quantity, buy_date: buyDate, sell_date: sellDate, buy_price: buyPrice, sell_price: sellPrice, gain_loss: gainLoss, is_long_term: lt, asset_type: assetType, broker: "Zerodha" });
    }
    return { trades, warnings, broker: "Zerodha", parsed_count: trades.length, skipped_count: skipped };
  },
};

export const GrowwAdapter = {
  name: "Groww" as const,
  detect(headers: string[]): boolean {
    const h = headers.join(" ");
    return h.includes("fund name") || h.includes("stock name") || (h.includes("purchase date") && h.includes("redemption date"));
  },
  parse(text: string): AdapterResult {
    const { rows } = parseCsv(text);
    const trades: CapitalGainsTrade[] = [];
    const warnings: string[] = [];
    let skipped = 0;
    for (const r of rows) {
      const symbol = r["fund name"] || r["stock name"] || r["name"] || r["symbol"] || "";
      const quantity = safeFloat(r["units"] || r["quantity"] || r["qty"] || "1");
      const buyDate = parseIndianDate(r["purchase date"] || r["buy date"] || r["date of purchase"] || "");
      const sellDate = parseIndianDate(r["redemption date"] || r["sell date"] || r["date of sale"] || "");
      if (!symbol || !buyDate || !sellDate) { skipped++; if (symbol) warnings.push(`Skipped ${symbol}: missing dates`); continue; }
      const invested = safeFloat(r["amount invested"] || r["cost"] || "0");
      const redeemed = safeFloat(r["amount redeemed"] || r["proceeds"] || "0");
      const gainLoss = safeFloat(r["gain/loss"] || r["profit/loss"] || "0") || (redeemed - invested);
      const buyPrice = quantity > 0 ? invested / quantity : 0;
      const sellPrice = quantity > 0 ? redeemed / quantity : 0;
      const typeStr = (r["type"] || r["asset type"] || "").toLowerCase();
      const assetType: CapitalGainsTrade["asset_type"] =
        typeStr.includes("mutual") || typeStr.includes("mf") || typeStr.includes("fund") ? "mutual_fund" :
        typeStr.includes("debt") || typeStr.includes("bond") ? "debt_fund" : "equity";
      const lt = isLongTermFn(buyDate, sellDate, assetType);
      trades.push({ symbol, quantity, buy_date: buyDate, sell_date: sellDate, buy_price: buyPrice, sell_price: sellPrice, gain_loss: gainLoss, is_long_term: lt, asset_type: assetType, broker: "Groww" });
    }
    return { trades, warnings, broker: "Groww", parsed_count: trades.length, skipped_count: skipped };
  },
};

export const UpstoxAdapter = {
  name: "Upstox" as const,
  detect(headers: string[]): boolean {
    const h = headers.join(" ");
    return h.includes("trading symbol") || h.includes("trade value") || (h.includes("transaction type") && h.includes("exchange"));
  },
  parse(text: string): AdapterResult {
    const { rows } = parseCsv(text);
    const warnings: string[] = [];
    let skipped = 0;
    const bySymbol: Record<string, { buys: Record<string, string>[]; sells: Record<string, string>[] }> = {};
    for (const r of rows) {
      const symbol = r["trading symbol"] || r["scrip name"] || r["symbol"] || "";
      const txType = (r["transaction type"] || r["trade type"] || "").toLowerCase();
      if (!symbol) { skipped++; continue; }
      if (!bySymbol[symbol]) bySymbol[symbol] = { buys: [], sells: [] };
      if (txType === "buy" || txType === "b") bySymbol[symbol].buys.push(r);
      else if (txType === "sell" || txType === "s") bySymbol[symbol].sells.push(r);
    }
    const trades: CapitalGainsTrade[] = [];
    for (const [symbol, { buys, sells }] of Object.entries(bySymbol)) {
      for (const sell of sells) {
        const sellDate = parseIndianDate(sell["trade date"] || sell["date"] || sell["settlement date"] || "");
        const sellQty = safeFloat(sell["quantity"] || sell["qty"] || "0");
        const sellPrice = safeFloat(sell["price"] || sell["average price"] || "0");
        if (!sellDate || sellQty === 0) { skipped++; continue; }
        const buyRow = buys.find((b) => { const bDate = parseIndianDate(b["trade date"] || b["date"] || ""); return bDate && bDate <= sellDate!; }) || buys[0];
        if (!buyRow) { warnings.push(`${symbol}: no matching buy found`); skipped++; continue; }
        const buyDate = parseIndianDate(buyRow["trade date"] || buyRow["date"] || "") || sellDate;
        const buyPrice = safeFloat(buyRow["price"] || buyRow["average price"] || "0");
        const gainLoss = (sellPrice - buyPrice) * sellQty;
        const isin = sell["isin"] || buyRow["isin"] || undefined;
        const lt = isLongTermFn(buyDate, sellDate, "equity");
        trades.push({ symbol: symbol.toUpperCase(), isin, quantity: sellQty, buy_date: buyDate, sell_date: sellDate, buy_price: buyPrice, sell_price: sellPrice, gain_loss: gainLoss, is_long_term: lt, asset_type: "equity", broker: "Upstox" });
      }
    }
    return { trades, warnings, broker: "Upstox", parsed_count: trades.length, skipped_count: skipped };
  },
};

export const GenericAdapter = {
  name: "Generic" as const,
  detect(_headers: string[]): boolean { return true; },
  parse(text: string): AdapterResult {
    const { headers, rows } = parseCsv(text);
    const trades: CapitalGainsTrade[] = [];
    const warnings: string[] = [];
    let skipped = 0;
    const symbolCol = headers.find((h) => ["symbol", "stock", "scrip", "security", "fund", "name", "instrument"].some((k) => h.includes(k)));
    const buyDateCol = headers.find((h) => ["buy date", "purchase date", "buy_date", "date of purchase"].some((k) => h.includes(k)));
    const sellDateCol = headers.find((h) => ["sell date", "sale date", "redemption date", "sell_date"].some((k) => h.includes(k)));
    const buyPriceCol = headers.find((h) => ["buy price", "purchase price", "cost price", "buy_price", "avg buy"].some((k) => h.includes(k)));
    const sellPriceCol = headers.find((h) => ["sell price", "sale price", "redemption price", "sell_price", "avg sell"].some((k) => h.includes(k)));
    const qtyCol = headers.find((h) => ["quantity", "qty", "units", "shares", "volume"].some((k) => h.includes(k)));
    const gainCol = headers.find((h) => ["gain", "profit", "pnl", "net"].some((k) => h.includes(k)));
    if (!symbolCol) return { trades: [], warnings: ["Could not detect a symbol column."], broker: "Generic", parsed_count: 0, skipped_count: rows.length };
    for (const r of rows) {
      const symbol = r[symbolCol] || "";
      if (!symbol) { skipped++; continue; }
      const buyDate = parseIndianDate(r[buyDateCol || ""] || "");
      const sellDate = parseIndianDate(r[sellDateCol || ""] || "");
      const quantity = safeFloat(r[qtyCol || ""] || "1");
      const buyPrice = safeFloat(r[buyPriceCol || ""] || "0");
      const sellPrice = safeFloat(r[sellPriceCol || ""] || "0");
      const gainLoss = gainCol ? safeFloat(r[gainCol] || "0") : (sellPrice - buyPrice) * quantity;
      if (!buyDate || !sellDate) { skipped++; warnings.push(`Skipped ${symbol}: cannot parse dates`); continue; }
      const lt = isLongTermFn(buyDate, sellDate, "equity");
      trades.push({ symbol: symbol.toUpperCase(), quantity, buy_date: buyDate, sell_date: sellDate, buy_price: buyPrice, sell_price: sellPrice, gain_loss: gainLoss, is_long_term: lt, asset_type: "equity", broker: "Generic" });
    }
    return { trades, warnings, broker: "Generic", parsed_count: trades.length, skipped_count: skipped };
  },
};

export type BrokerKey = "zerodha" | "groww" | "upstox" | "generic";

const ADAPTERS = { zerodha: ZerodhaAdapter, groww: GrowwAdapter, upstox: UpstoxAdapter, generic: GenericAdapter };

export async function parseBrokerFile(file: File, broker: BrokerKey): Promise<AdapterResult> {
  const text = await file.text();
  const { headers } = parseCsv(text);
  if (broker !== "generic") return ADAPTERS[broker].parse(text);
  for (const key of ["zerodha", "groww", "upstox"] as BrokerKey[]) {
    if (ADAPTERS[key].detect(headers)) return ADAPTERS[key].parse(text);
  }
  return GenericAdapter.parse(text);
}

export function summarizeTrades(trades: CapitalGainsTrade[]) {
  const totalSTCG = trades.filter((t) => !t.is_long_term && t.gain_loss > 0).reduce((s, t) => s + t.gain_loss, 0);
  const totalLTCG = trades.filter((t) => t.is_long_term && t.gain_loss > 0).reduce((s, t) => s + t.gain_loss, 0);
  const stcgLoss = Math.abs(trades.filter((t) => !t.is_long_term && t.gain_loss < 0).reduce((s, t) => s + t.gain_loss, 0));
  const ltcgLoss = Math.abs(trades.filter((t) => t.is_long_term && t.gain_loss < 0).reduce((s, t) => s + t.gain_loss, 0));
  const totalLoss = stcgLoss + ltcgLoss;
  const ltcgExemption = Math.min(125000, totalLTCG);
  const netLTCG = Math.max(0, totalLTCG - ltcgExemption);
  const netTaxableSTCG = Math.max(0, totalSTCG - stcgLoss);
  const netTaxableLTCG = Math.max(0, netLTCG - ltcgLoss);
  const stcgTax = Math.round(netTaxableSTCG * 0.20);
  const ltcgTax = Math.round(netTaxableLTCG * 0.125);
  return { totalSTCG, totalLTCG, totalLoss, ltcgExemption, netTaxableSTCG, netTaxableLTCG, stcgTax, ltcgTax, totalTax: stcgTax + ltcgTax, tradesCount: trades.length };
}
