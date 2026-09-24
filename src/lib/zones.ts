import type { DelhiZone } from "@/types/tender";

const ZONE_KEYWORDS: Record<DelhiZone, string[]> = {
  North: ["north", "rohini", "model town", "civil lines", "narela"],
  South: ["south", "saket", "hauz khas", "mehrauli", "vasant", "lajpat"],
  East: ["east", "mayur vihar", "preet vihar", "laxmi nagar", "geeta colony"],
  West: ["west", "janakpuri", "punjabi bagh", "tilak nagar", "rajouri", "uttam nagar"],
  Central: ["central", "karol bagh", "paharganj", "daryaganj", "chandni chowk"],
  "New Delhi": ["new delhi", "ndmc", "connaught", "chanakyapuri", "lodhi", "khan market"],
  "North-East": ["north east", "north-east", "seemapuri", "gokalpuri", "karawal"],
  "North-West": ["north west", "north-west", "pitampura", "shakur", "mangolpuri"],
  "South-East": ["south east", "south-east", "kalkaji", "okhla", "sarita vihar", "badarpur"],
  "South-West": ["south west", "south-west", "dwarka", "najafgarh", "palam"],
  Shahdara: ["shahdara", "vivek vihar", "dilshad", "nand nagri"],
  Unknown: [],
};

export function detectZone(location: string, title: string, organisation: string): DelhiZone {
  const text = `${location} ${title} ${organisation}`.toLowerCase();
  for (const [zone, keywords] of Object.entries(ZONE_KEYWORDS) as [DelhiZone, string[]][]) {
    if (zone === "Unknown") continue;
    if (keywords.some((kw) => text.includes(kw))) return zone;
  }
  return "Unknown";
}

export const ALL_ZONES: DelhiZone[] = [
  "North", "South", "East", "West", "Central", "New Delhi",
  "North-East", "North-West", "South-East", "South-West", "Shahdara", "Unknown",
];
