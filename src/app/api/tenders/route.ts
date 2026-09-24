import { NextRequest, NextResponse } from "next/server";
import { getTenders } from "@/lib/scraper";
import { filterTenders, computeAnalytics } from "@/lib/analytics";
import type { TenderFilters, DelhiZone, TenderCategory, TenderStatus } from "@/types/tender";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const force = searchParams.get("refresh") === "1";
    const data = await getTenders(force);

    const filters: TenderFilters = {};
    const search = searchParams.get("search");
    if (search) filters.search = search;
    const depts = searchParams.get("departments");
    if (depts) filters.departments = depts.split(",").filter(Boolean);
    const zones = searchParams.get("zones");
    if (zones) filters.zones = zones.split(",").filter(Boolean) as DelhiZone[];
    const cats = searchParams.get("categories");
    if (cats) filters.categories = cats.split(",").filter(Boolean) as TenderCategory[];
    const status = searchParams.get("status");
    if (status) filters.status = status.split(",").filter(Boolean) as TenderStatus[];
    if (searchParams.get("corrigendum") === "1") filters.hasCorrigendum = true;
    const valueMin = searchParams.get("valueMin");
    if (valueMin) filters.valueMin = Number(valueMin);
    const valueMax = searchParams.get("valueMax");
    if (valueMax) filters.valueMax = Number(valueMax);

    const filtered = filterTenders(data.tenders, filters);
    const analytics = computeAnalytics(filtered, data.source);

    return NextResponse.json({
      tenders: filtered,
      analytics,
      lastUpdated: data.lastUpdated,
      source: data.source,
      total: filtered.length,
      unfilteredTotal: data.total,
    });
  } catch (err) {
    console.error("API error:", err);
    return NextResponse.json({ error: "Failed to fetch tenders", message: String(err) }, { status: 500 });
  }
}
