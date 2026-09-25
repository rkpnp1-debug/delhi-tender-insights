import type { Tender } from "@/types/tender";
import { daysUntil } from "./utils";

/** Simple opportunity score 0–100 inspired by commercial match ranking. */
export function opportunityScore(t: Tender): number {
  let score = 40;
  const days = daysUntil(t.closingDate);
  if (days >= 0 && days <= 3) score += 25;
  else if (days <= 7) score += 18;
  else if (days <= 14) score += 10;
  else if (days <= 30) score += 5;
  if (t.estimatedValue != null) {
    if (t.estimatedValue >= 5_00_00_000) score += 20;
    else if (t.estimatedValue >= 1_00_00_000) score += 15;
    else if (t.estimatedValue >= 25_00_000) score += 10;
    else score += 5;
  }
  if (t.enriched) score += 8;
  if (t.hasCorrigendum) score += 5;
  if (t.isNew) score += 7;
  return Math.min(100, score);
}

export function scoreLabel(score: number): "Hot" | "Strong" | "Good" | "Watch" {
  if (score >= 80) return "Hot";
  if (score >= 65) return "Strong";
  if (score >= 50) return "Good";
  return "Watch";
}

export type SortKey = "closing" | "value_desc" | "value_asc" | "score" | "newest";

export function sortTenders(tenders: Tender[], key: SortKey): Tender[] {
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
    case "closing":
    default:
      return list.sort(
        (a, b) => new Date(a.closingDate).getTime() - new Date(b.closingDate).getTime()
      );
  }
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
];
