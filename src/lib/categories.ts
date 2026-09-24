import type { TenderCategory } from "@/types/tender";

const CATEGORY_RULES: { category: TenderCategory; keywords: string[] }[] = [
  { category: "Water & Sewerage", keywords: ["water", "sewer", "sewerage", "jal", "pipeline", "drainage", "pump"] },
  { category: "Roads", keywords: ["road", "highway", "bridge", "flyover", "pavement", "asphalt", "malba"] },
  { category: "Electrical", keywords: ["electrical", "electric", "lift", "elevator", "transformer", "cable", "lighting", "street light"] },
  { category: "Buildings", keywords: ["building", "construction of", "renovation", "quarter", "hostel"] },
  { category: "Civil Works", keywords: ["civil", "earthwork", "concrete", "foundation"] },
  { category: "Consultancy", keywords: ["consultancy", "consultant", "pmc", "project management", "advisory"] },
  { category: "IT & Electronics", keywords: ["computer", "software", "it ", "network", "server", "laptop", "cctv"] },
  { category: "Mechanical", keywords: ["mechanical", "hvac", "chiller", "boiler", "generator", "dg set"] },
  { category: "Horticulture", keywords: ["horticulture", "plantation", "garden", "park", "tree", "forest"] },
  { category: "Goods", keywords: ["supply of", "procurement of", "purchase of", "furniture"] },
  { category: "Services", keywords: ["maintenance", "amc", "housekeeping", "security", "manpower", "cleaning"] },
];

export function detectCategory(title: string, productCategory?: string): TenderCategory {
  const text = `${title} ${productCategory || ""}`.toLowerCase();
  for (const rule of CATEGORY_RULES) {
    if (rule.keywords.some((kw) => text.includes(kw))) return rule.category;
  }
  return "Others";
}

export const ALL_CATEGORIES: TenderCategory[] = [
  "Civil Works", "Electrical", "Water & Sewerage", "Roads", "Buildings",
  "Consultancy", "Goods", "Services", "IT & Electronics", "Mechanical", "Horticulture", "Others",
];
