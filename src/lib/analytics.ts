import type { Tender, AnalyticsSummary, TenderFilters } from "@/types/tender";
import { daysUntil } from "./utils";

export function computeAnalytics(
  tenders: Tender[],
  source: "live" | "cached" | "sample" = "sample"
): AnalyticsSummary {
  const byDeptMap = new Map<string, { count: number; value: number }>();
  const byZoneMap = new Map<string, { count: number; value: number }>();
  const byCatMap = new Map<string, { count: number; value: number }>();
  const valueRanges = [
    { range: "< ₹10L", min: 0, max: 10_00_000 },
    { range: "₹10L–50L", min: 10_00_000, max: 50_00_000 },
    { range: "₹50L–1Cr", min: 50_00_000, max: 1_00_00_000 },
    { range: "₹1Cr–5Cr", min: 1_00_00_000, max: 5_00_00_000 },
    { range: "> ₹5Cr", min: 5_00_00_000, max: Infinity },
  ];
  const byValueMap = new Map(valueRanges.map((r) => [r.range, { count: 0, value: 0 }]));

  let totalValue = 0, closingIn7 = 0, closingIn15 = 0, closingIn30 = 0, newThisWeek = 0, withCorrigendum = 0;

  for (const t of tenders) {
    const val = t.estimatedValue || 0;
    totalValue += val;
    const d = daysUntil(t.closingDate);
    if (d >= 0 && d <= 7) closingIn7++;
    if (d >= 0 && d <= 15) closingIn15++;
    if (d >= 0 && d <= 30) closingIn30++;
    if (t.isNew) newThisWeek++;
    if (t.hasCorrigendum) withCorrigendum++;

    const prevD = byDeptMap.get(t.organisation) || { count: 0, value: 0 };
    byDeptMap.set(t.organisation, { count: prevD.count + 1, value: prevD.value + val });

    const prevZ = byZoneMap.get(t.zone) || { count: 0, value: 0 };
    byZoneMap.set(t.zone, { count: prevZ.count + 1, value: prevZ.value + val });

    const prevC = byCatMap.get(t.category) || { count: 0, value: 0 };
    byCatMap.set(t.category, { count: prevC.count + 1, value: prevC.value + val });

    for (const r of valueRanges) {
      if (val >= r.min && val < r.max) {
        const prev = byValueMap.get(r.range)!;
        byValueMap.set(r.range, { count: prev.count + 1, value: prev.value + val });
        break;
      }
    }
  }

  const sortByCount = (a: { count: number }, b: { count: number }) => b.count - a.count;

  return {
    totalTenders: tenders.length,
    totalEstimatedValue: totalValue,
    closingIn7Days: closingIn7,
    closingIn15Days: closingIn15,
    closingIn30Days: closingIn30,
    newThisWeek,
    withCorrigendum,
    byDepartment: Array.from(byDeptMap.entries()).map(([name, v]) => ({ name, ...v })).sort(sortByCount),
    byZone: Array.from(byZoneMap.entries()).map(([name, v]) => ({ name, ...v })).sort(sortByCount),
    byCategory: Array.from(byCatMap.entries()).map(([name, v]) => ({ name, ...v })).sort(sortByCount),
    byValueRange: valueRanges.map((r) => ({
      range: r.range,
      count: byValueMap.get(r.range)?.count || 0,
      value: byValueMap.get(r.range)?.value || 0,
    })),
    lastUpdated: new Date().toISOString(),
    dataSource: source,
  };
}

export function filterTenders(tenders: Tender[], filters: TenderFilters): Tender[] {
  return tenders.filter((t) => {
    if (filters.search) {
      const q = filters.search.toLowerCase();
      const hay = `${t.title} ${t.referenceNo} ${t.tenderId} ${t.organisation} ${t.location}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    if (filters.departments?.length && !filters.departments.includes(t.organisation)) return false;
    if (filters.zones?.length && !filters.zones.includes(t.zone)) return false;
    if (filters.categories?.length && !filters.categories.includes(t.category)) return false;
    if (filters.states?.length && !filters.states.includes(t.stateCode)) return false;
    if (filters.valueMin != null && (t.estimatedValue ?? 0) < filters.valueMin) return false;
    if (filters.valueMax != null && (t.estimatedValue ?? Infinity) > filters.valueMax) return false;
    if (filters.closingFrom && new Date(t.closingDate) < new Date(filters.closingFrom)) return false;
    if (filters.closingTo && new Date(t.closingDate) > new Date(filters.closingTo)) return false;
    if (filters.status?.length && !filters.status.includes(t.status)) return false;
    if (filters.hasCorrigendum === true && !t.hasCorrigendum) return false;
    return true;
  });
}
