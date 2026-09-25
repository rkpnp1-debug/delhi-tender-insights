export type TenderStatus =
  | "active"
  | "closing_soon"
  | "extended"
  | "corrigendum"
  | "closed"
  | "awarded";

export type TenderCategory =
  | "Civil Works"
  | "Electrical"
  | "Water & Sewerage"
  | "Roads"
  | "Buildings"
  | "Consultancy"
  | "Goods"
  | "Services"
  | "IT & Electronics"
  | "Mechanical"
  | "Horticulture"
  | "Others";

export type DelhiZone =
  | "North"
  | "South"
  | "East"
  | "West"
  | "Central"
  | "New Delhi"
  | "North-East"
  | "North-West"
  | "South-East"
  | "South-West"
  | "Shahdara"
  | "Unknown";

export interface Tender {
  id: string;
  tenderId: string;
  referenceNo: string;
  title: string;
  organisation: string;
  department: string;
  organisationChain: string;
  closingDate: string;
  bidOpeningDate: string;
  publishedDate: string;
  estimatedValue: number | null;
  location: string;
  zone: DelhiZone;
  category: TenderCategory;
  tenderType: string;
  formOfContract: string;
  productCategory: string;
  status: TenderStatus;
  numberOfBids: number | null;
  hasCorrigendum: boolean;
  corrigendumCount: number;
  detailUrl: string;
  nitUrl: string | null;
  documents: { name: string; url: string }[];
  emdAmount: number | null;
  tenderFee: number | null;
  bidValidityDays: number | null;
  description?: string;
  isNew: boolean;
  isClosingSoon: boolean;
  stateCode: string;
  stateName: string;
  paymentMode?: string;
  noOfCovers?: string;
  emdPayableTo?: string;
  withdrawalAllowed?: string;
  subCategory?: string;
  detailPath?: string;
  enriched?: boolean;
}

export interface TenderFilters {
  search?: string;
  departments?: string[];
  zones?: DelhiZone[];
  categories?: TenderCategory[];
  states?: string[];
  valueMin?: number;
  valueMax?: number;
  closingFrom?: string;
  closingTo?: string;
  status?: TenderStatus[];
  hasCorrigendum?: boolean;
}

export interface AnalyticsSummary {
  totalTenders: number;
  totalEstimatedValue: number;
  closingIn7Days: number;
  closingIn15Days: number;
  closingIn30Days: number;
  newThisWeek: number;
  withCorrigendum: number;
  byDepartment: { name: string; count: number; value: number }[];
  byZone: { name: string; count: number; value: number }[];
  byCategory: { name: string; count: number; value: number }[];
  byValueRange: { range: string; count: number; value: number }[];
  byState?: { name: string; count: number; value: number }[];
  lastUpdated: string;
  dataSource: "live" | "cached" | "sample";
}

export interface TenderResponse {
  tenders: Tender[];
  analytics: AnalyticsSummary;
  lastUpdated: string;
  source: "live" | "cached" | "sample";
  total: number;
  portalsScraped?: string[];
}
