"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/header";
import { StatsCards } from "@/components/stats-cards";
import { TenderFiltersBar } from "@/components/tender-filters";
import { TenderCard } from "@/components/tender-card";
import { TenderDetail } from "@/components/tender-detail";
import { AnalyticsCharts } from "@/components/charts/analytics-charts";
import { OpportunityRail } from "@/components/opportunity-rail";
import type { Tender, TenderFilters, TenderResponse } from "@/types/tender";
import { filterTenders, computeAnalytics } from "@/lib/analytics";
import {
  sortTenders,
  opportunityScore,
  QUICK_KEYWORDS,
  type SortKey,
} from "@/lib/match";
import { daysUntil } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  LayoutGrid,
  BarChart3,
  RefreshCw,
  AlertCircle,
  Info,
  Flame,
  Clock,
  Star,
  ArrowUpDown,
} from "lucide-react";
import * as XLSX from "xlsx";

async function fetchTenders(): Promise<TenderResponse> {
  const res = await fetch("/api/tenders?refresh=0");
  if (!res.ok) throw new Error("Failed to load tenders");
  return res.json();
}

type TabKey = "all" | "closing" | "highvalue" | "saved";

export default function HomePage() {
  const [filters, setFilters] = useState<TenderFilters>({});
  const [selected, setSelected] = useState<Tender | null>(null);
  const [view, setView] = useState<"list" | "analytics">("list");
  const [tab, setTab] = useState<TabKey>("all");
  const [sortKey, setSortKey] = useState<SortKey>("closing");
  const [favourites, setFavourites] = useState<Set<string>>(new Set());

  useEffect(() => {
    try {
      const stored = localStorage.getItem("dti-favourites");
      if (stored) setFavourites(new Set(JSON.parse(stored)));
      const savedFilters = localStorage.getItem("dti-saved-filters");
      if (savedFilters) setFilters(JSON.parse(savedFilters));
    } catch {}
  }, []);

  const toggleFavourite = useCallback((id: string) => {
    setFavourites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      localStorage.setItem("dti-favourites", JSON.stringify([...next]));
      return next;
    });
  }, []);

  const saveFilters = useCallback(() => {
    localStorage.setItem("dti-saved-filters", JSON.stringify(filters));
  }, [filters]);

  const { data, isLoading, isError, isFetching, refetch } = useQuery({
    queryKey: ["tenders"],
    queryFn: fetchTenders,
    refetchInterval: 15 * 60 * 1000,
    staleTime: 5 * 60 * 1000,
  });

  const filtered = useMemo(() => {
    if (!data?.tenders) return [];
    return filterTenders(data.tenders, filters);
  }, [data?.tenders, filters]);

  const tabbed = useMemo(() => {
    switch (tab) {
      case "closing":
        return filtered.filter((t) => {
          const d = daysUntil(t.closingDate);
          return d >= 0 && d <= 7;
        });
      case "highvalue":
        return filtered.filter((t) => (t.estimatedValue ?? 0) >= 50_00_000);
      case "saved":
        return filtered.filter((t) => favourites.has(t.id));
      default:
        return filtered;
    }
  }, [filtered, tab, favourites]);

  const sorted = useMemo(() => sortTenders(tabbed, sortKey), [tabbed, sortKey]);

  const analytics = useMemo(() => {
    if (!filtered.length && data?.analytics) return data.analytics;
    return computeAnalytics(filtered, data?.source || "sample");
  }, [filtered, data]);

  const departments = useMemo(() => {
    if (!data?.tenders) return [];
    return [...new Set(data.tenders.map((t) => t.organisation))].sort();
  }, [data?.tenders]);

  const closingSoon = useMemo(
    () =>
      sortTenders(
        filtered.filter((t) => {
          const d = daysUntil(t.closingDate);
          return d >= 0 && d <= 7;
        }),
        "closing"
      ).slice(0, 8),
    [filtered]
  );

  const hotMatches = useMemo(
    () =>
      [...filtered]
        .sort((a, b) => opportunityScore(b) - opportunityScore(a))
        .slice(0, 8),
    [filtered]
  );

  const handleExport = useCallback(() => {
    const rows = sorted.map((t) => ({
      "Tender ID": t.tenderId,
      "Reference No": t.referenceNo,
      Title: t.title,
      State: t.stateName,
      Organisation: t.organisation,
      Zone: t.zone,
      Category: t.category,
      "Estimated Value (INR)": t.estimatedValue,
      EMD: t.emdAmount,
      "Closing Date": t.closingDate,
      "Bid Opening Date": t.bidOpeningDate,
      Status: t.status,
      "Detail URL": t.detailUrl,
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Tenders");
    XLSX.writeFile(wb, `tenders-${new Date().toISOString().slice(0, 10)}.xlsx`);
  }, [sorted]);

  const applyKeyword = (kw: string) => {
    setFilters((f) => ({ ...f, search: kw }));
    setTab("all");
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header lastUpdated={data?.lastUpdated} source={data?.source} />

      <main className="flex-1 container mx-auto px-4 sm:px-6 py-6 space-y-6">
        <section className="rounded-2xl bg-gradient-to-br from-navy-900 to-navy-800 text-white p-6 sm:p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-72 h-72 bg-saffron/10 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl" />
          <div className="relative z-10 max-w-2xl">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Find tenders worth bidding —{" "}
              <span className="text-saffron">fast</span>
            </h1>
            <p className="mt-2 text-navy-100 text-sm sm:text-base leading-relaxed">
              Live public tenders from Delhi and major state portals. Filter, prioritise,
              shortlist and export in one place.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-navy-200">
              <Badge variant="secondary" className="bg-white/10 text-white border-0">
                Free insight tool
              </Badge>
              <span>·</span>
              <span className="capitalize">Data: {data?.source || "…"}</span>
            </div>
          </div>
        </section>

        <div className="flex flex-wrap gap-2">
          {QUICK_KEYWORDS.map((kw) => (
            <button
              key={kw}
              onClick={() => applyKeyword(kw)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                filters.search === kw
                  ? "bg-navy-900 text-white border-navy-900 dark:bg-saffron dark:text-navy-900"
                  : "bg-background hover:bg-muted border-border"
              }`}
            >
              {kw}
            </button>
          ))}
        </div>

        {isError && (
          <div className="rounded-xl border border-destructive/50 bg-destructive/10 p-4 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-destructive">Could not load tender data</p>
              <Button size="sm" variant="outline" className="mt-2" onClick={() => refetch()}>
                Retry
              </Button>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="skeleton h-28 rounded-xl" />
            ))}
          </div>
        ) : (
          analytics && <StatsCards analytics={analytics} />
        )}

        {!isLoading && view === "list" && (
          <div className="space-y-5">
            <OpportunityRail
              title="Hot opportunities"
              icon="hot"
              tenders={hotMatches}
              onSelect={setSelected}
            />
            <OpportunityRail
              title="Closing within 7 days"
              icon="closing"
              tenders={closingSoon}
              onSelect={setSelected}
            />
          </div>
        )}

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1 p-1 rounded-lg bg-muted w-fit">
            <Button
              size="sm"
              variant={view === "list" ? "default" : "ghost"}
              className="gap-1.5"
              onClick={() => setView("list")}
            >
              <LayoutGrid className="h-4 w-4" /> Discover
            </Button>
            <Button
              size="sm"
              variant={view === "analytics" ? "default" : "ghost"}
              className="gap-1.5"
              onClick={() => setView("analytics")}
            >
              <BarChart3 className="h-4 w-4" /> Analytics
            </Button>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <ArrowUpDown className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <select
                className="h-9 pl-8 pr-8 rounded-md border bg-background text-xs font-medium appearance-none cursor-pointer"
                value={sortKey}
                onChange={(e) => setSortKey(e.target.value as SortKey)}
              >
                <option value="closing">Closing soon</option>
                <option value="score">Best match</option>
                <option value="value_desc">Highest value</option>
                <option value="value_asc">Lowest value</option>
                <option value="newest">Newest</option>
              </select>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5"
              onClick={() => refetch()}
              disabled={isFetching}
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>

        <TenderFiltersBar
          filters={filters}
          onChange={setFilters}
          departments={departments}
          onExport={handleExport}
          resultCount={sorted.length}
          onSaveFilters={saveFilters}
        />

        {view === "list" && (
          <div className="flex flex-wrap gap-1 p-1 rounded-lg bg-muted/80 w-fit">
            {(
              [
                { id: "all" as const, label: "All", icon: LayoutGrid },
                { id: "closing" as const, label: "Closing soon", icon: Clock },
                { id: "highvalue" as const, label: "High value", icon: Flame },
                { id: "saved" as const, label: "Saved", icon: Star },
              ]
            ).map((t) => (
              <Button
                key={t.id}
                size="sm"
                variant={tab === t.id ? "default" : "ghost"}
                className="gap-1.5 h-8 text-xs"
                onClick={() => setTab(t.id)}
              >
                <t.icon className="h-3.5 w-3.5" />
                {t.label}
              </Button>
            ))}
          </div>
        )}

        {view === "analytics" && analytics && !isLoading && (
          <AnalyticsCharts analytics={analytics} />
        )}

        {view === "list" && (
          <section className="space-y-3">
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="skeleton h-32 rounded-xl" />
              ))
            ) : sorted.length === 0 ? (
              <div className="rounded-2xl border border-dashed p-12 text-center">
                <Info className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                <h3 className="font-semibold text-lg">No tenders match</h3>
                <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
                  Try another keyword, clear filters, or switch tabs.
                </p>
                <Button variant="outline" className="mt-4" onClick={() => setFilters({})}>
                  Clear filters
                </Button>
              </div>
            ) : (
              <div className="grid gap-3">
                {sorted.map((t) => (
                  <TenderCard
                    key={t.id}
                    tender={t}
                    onView={setSelected}
                    isFavourite={favourites.has(t.id)}
                    onToggleFavourite={toggleFavourite}
                  />
                ))}
              </div>
            )}
          </section>
        )}
      </main>

      <footer className="border-t py-6 mt-8">
        <div className="container mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <p>
            Independent multi-state tool. Verify critical figures on the official GePNIC
            portal before bidding.
          </p>
          <p>
            Last refresh:{" "}
            {data?.lastUpdated
              ? new Date(data.lastUpdated).toLocaleString("en-IN")
              : "—"}
          </p>
        </div>
      </footer>

      <TenderDetail tender={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
