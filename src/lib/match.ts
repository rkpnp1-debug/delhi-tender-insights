import type { Tender } from "@/types/tender";
import { daysUntil } from "./utils";

/** Opportunity score 0–100 — inspired by commercial match ranking (Tender247 / BidAssist). */
export function opportunityScore(t: Tender): number {
  let score = 35;
  const days = daysUntil(t.closingDate);

  // Deadline urgency (sweet spot: enough time to prepare, not too far)
  if (days >= 0 && days <= 3) score += 22;
  else if (days <= 7) score += 18;
  else if (days <= 14) score += 12;
  else if (days <= 30) score += 6;
  else if (days < 0) score -= 30;

  // Value attractiveness
  if (t.estimatedValue != null) {
    if (t.estimatedValue >= 5_00_00_000) score += 18;
    else if (t.estimatedValue >= 1_00_00_000) score += 14;
    else if (t.estimatedValue >= 50_00_000) score += 10;
    else if (t.estimatedValue >= 10_00_000) score += 6;
    else score += 3;
  }

  // Data completeness & signals
  if (t.enriched) score += 8;
  if (t.hasCorrigendum) score += 4; // active interest / amendments
  if (t.isNew) score += 7;
  if (t.emdAmount != null && t.estimatedValue && t.emdAmount / t.estimatedValue < 0.02)
    score += 3; // relatively low EMD barrier
  if (t.documents?.length) score += 3;

  return Math.max(0, Math.min(100, score));
}

export function scoreLabel(score: number): "Hot" | "Strong" | "Good" | "Watch" {
  if (score >= 80) return "Hot";
  if (score >= 65) return "Strong";
  if (score >= 50) return "Good";
  return "Watch";
}

/** Quick risk / decision flags shown in detail drawer (Go / No-Go style). */
export function getRiskFlags(t: Tender): { label: string; tone: "good" | "warn" | "bad" | "info" }[] {
  const flags: { label: string; tone: "good" | "warn" | "bad" | "info" }[] = [];
  const days = daysUntil(t.closingDate);

  if (days < 0) flags.push({ label: "Closed", tone: "bad" });
  else if (days === 0) flags.push({ label: "Closes today", tone: "bad" });
  else if (days <= 3) flags.push({ label: "Very short window", tone: "warn" });
  else if (days <= 7) flags.push({ label: "Closing this week", tone: "warn" });
  else flags.push({ label: `${days} days to prepare`, tone: "good" });

  if (t.hasCorrigendum)
    flags.push({ label: `Corrigendum ×${t.corrigendumCount || 1}`, tone: "info" });

  if (t.emdAmount != null && t.estimatedValue && t.estimatedValue > 0) {
    const pct = (t.emdAmount / t.estimatedValue) * 100;
    if (pct >= 5) flags.push({ label: `High EMD (~${pct.toFixed(1)}%)`, tone: "warn" });
    else if (pct > 0) flags.push({ label: `EMD ~${pct.toFixed(1)}% of value`, tone: "info" });
  } else if (t.emdAmount != null) {
    flags.push({ label: "EMD specified", tone: "info" });
  }

  if (t.enriched) flags.push({ label: "Full details loaded", tone: "good" });
  else flags.push({ label: "Basic listing — open for full data", tone: "info" });

  if (t.isNew) flags.push({ label: "Newly published", tone: "good" });

  return flags;
}

export type SortKey = "closing" | "value_desc" | "value_asc" | "score" | "newest" | "relevance";

export function sortTenders(tenders: Tender[], key: SortKey, search?: string): Tender[] {
  const list = [...tenders];
  switch (key) {
    case "value_desc":
      return list.sort((a, b) => (b.estimatedValue ?? 0) - (a.estimatedValue ?? 0));
    case "value_asc":
      return list.sort((a, b) => (a.estimatedValue ?? 0) - (b.estimatedValue ?? 0));
    case "score":
      return list.sort((a, b) => opportunityScore(b) - opportunityScore(a));
    case "newest":
      return list.sort(
        (a, b) => new Date(b.publishedDate).getTime() - new Date(a.publishedDate).getTime()
      );
    case "relevance":
      if (search?.trim()) {
        const q = search.toLowerCase().trim();
        return list.sort((a, b) => relevanceScore(b, q) - relevanceScore(a, q));
      }
      return list.sort((a, b) => opportunityScore(b) - opportunityScore(a));
    case "closing":
    default:
      return list.sort(
        (a, b) => new Date(a.closingDate).getTime() - new Date(b.closingDate).getTime()
      );
  }
}

function relevanceScore(t: Tender, q: string): number {
  let s = 0;
  const title = (t.title || "").toLowerCase();
  const org = (t.organisation || "").toLowerCase();
  const ref = (t.referenceNo || "").toLowerCase();
  const cat = (t.category || "").toLowerCase();
  if (title.includes(q)) s += 50;
  if (title.startsWith(q)) s += 20;
  if (ref.includes(q)) s += 40;
  if (org.includes(q)) s += 15;
  if (cat.includes(q)) s += 10;
  const tokens = q.split(/\s+/).filter(Boolean);
  for (const tok of tokens) {
    if (title.includes(tok)) s += 8;
    if (org.includes(tok)) s += 3;
  }
  s += opportunityScore(t) * 0.15;
  return s;
}

export const QUICK_KEYWORDS = [
  "Road",
  "Electrical",
  "Water",
  "Building",
  "AMC",
  "Sewer",
  "CCTV",
  "Furniture",
  "Consultancy",
  "Lift",
  "Medical",
  "IT",
];

export const SEARCH_EXAMPLES = [
  "Road construction above 1 Cr",
  "Electrical AMC Delhi",
  "Water supply Kerala",
  "CCTV installation",
];
