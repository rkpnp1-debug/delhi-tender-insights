"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/header";
import { StatsCards } from "@/components/stats-cards";
import { TenderFiltersBar } from "@/components/tender-filters";
import { TenderCard } from "@/components/tender-card";
import { TenderDetail } from "@/components/tender-detail";
import { AnalyticsCharts } from "@/components/charts/analytics-charts";
import type { Tender, TenderFilters, TenderResponse } from "@/types/tender";
import { filterTenders, computeAnalytics } from "@/lib/analytics";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LayoutGrid, BarChart3, RefreshCw, AlertCircle, Info } from "lucide-react";
import * as XLSX from "xlsx";

async function fetchTenders(): Promise<TenderResponse> {
  const res = await fetch("/api/tenders");
  if (!res.ok) throw new Error("Failed to load tenders");
  return res.json();
}

export default function HomePage() {
  const [filters, setFilters] = useState<TenderFilters>({});
  const [selected, setSelected] = useState<Tender | null>(null);
  const [view, setView] = useState<"list" | "analytics">("list");
  const [favourites, setFavourites] = useState<Set<string>>(new Set());

  useEffect(() => {
    try {
      const stored = localStorage.getItem("dti-favourites");
      if (stored) setFavourites(new Set(JSON.parse(stored)));
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

  const { data, isLoading, isError, isFetching, refetch } = useQuery({
    queryKey: ["tenders"],
    queryFn: fetchTenders,
    refetchInterval: 20 * 60 * 1000,
  });

  const filtered = useMemo(() => {
    if (!data?.tenders) return [];
    return filterTenders(data.tenders, filters);
  }, [data?.tenders, filters]);

  const analytics = useMemo(() => {
    if (!filtered.length && data?.analytics) return data.analytics;
    return computeAnalytics(filtered, data?.source || "sample");
  }, [filtered, data]);

  const departments = useMemo(() => {
    if (!data?.tenders) return [];
    return [...new Set(data.tenders.map((t) => t.organisation))].sort();
  }, [data?.tenders]);

  const handleExport = useCallback(() => {
    const rows = filtered.map((t) => ({
      "Tender ID": t.tenderId,
      "Reference No": t.referenceNo,
      Title: t.title,
      Organisation: t.organisation,
      Zone: t.zone,
      Category: t.category,
      "Estimated Value (INR)": t.estimatedValue,
      "Closing Date": t.closingDate,
      "Bid Opening Date": t.bidOpeningDate,
      Status: t.status,
      "Has Corrigendum": t.hasCorrigendum ? "Yes" : "No",
      "Detail URL": t.detailUrl,
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Tenders");
    XLSX.writeFile(wb, `delhi-tenders-${new Date().toISOString().slice(0, 10)}.xlsx`);
  }, [filtered]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header lastUpdated={data?.lastUpdated} />

      <main className="flex-1 container mx-auto px-4 sm:px-6 py-6 space-y-6">
        <section className="rounded-2xl bg-gradient-to-br from-navy-900 to-navy-800 text-white p-6 sm:p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-saffron/10 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl" />
          <div className="relative z-10 max-w-2xl">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Delhi Public Procurement, <span className="text-saffron">clarified</span>
            </h1>
            <p className="mt-2 text-navy-100 text-sm sm:text-base leading-relaxed">
              Explore every active tender from the official Delhi e-Procurement portal with department, zone, category and value analytics — built for contractors, vendors, journalists and citizens.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-navy-200">
              <Badge variant="secondary" className="bg-white/10 text-white border-0">Independent insight tool</Badge>
              <span>·</span>
              <span>
                Official source:{" "}
                <a href="https://govtprocurement.delhi.gov.in/nicgep/app" target="_blank" rel="noopener noreferrer" className="underline hover:text-saffron">
                  govtprocurement.delhi.gov.in
                </a>
              </span>
              {data?.source && (<><span>·</span><span className="capitalize">Data: {data.source}</span></>)}
            </div>
          </div>
        </section>

        {isError && (
          <div className="rounded-xl border border-destructive/50 bg-destructive/10 p-4 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-destructive">Could not load tender data</p>
              <p className="text-sm text-muted-foreground mt-1">Try refreshing.</p>
              <Button size="sm" variant="outline" className="mt-2" onClick={() => refetch()}>Retry</Button>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton h-28 rounded-xl" />)}
          </div>
        ) : analytics && <StatsCards analytics={analytics} />}

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1 p-1 rounded-lg bg-muted w-fit">
            <Button size="sm" variant={view === "list" ? "default" : "ghost"} className="gap-1.5" onClick={() => setView("list")}>
              <LayoutGrid className="h-4 w-4" /> Tenders
            </Button>
            <Button size="sm" variant={view === "analytics" ? "default" : "ghost"} className="gap-1.5" onClick={() => setView("analytics")}>
              <BarChart3 className="h-4 w-4" /> Analytics
            </Button>
          </div>
          <Button size="sm" variant="outline" className="gap-1.5 w-fit" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`} /> Refresh
          </Button>
        </div>

        <TenderFiltersBar filters={filters} onChange={setFilters} departments={departments} onExport={handleExport} resultCount={filtered.length} />

        {view === "analytics" && analytics && !isLoading && <AnalyticsCharts analytics={analytics} />}

        {view === "list" && (
          <section className="space-y-3">
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton h-32 rounded-xl" />)
            ) : filtered.length === 0 ? (
              <div className="rounded-2xl border border-dashed p-12 text-center">
                <Info className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                <h3 className="font-semibold text-lg">No tenders match your filters</h3>
                <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">Try clearing some filters or broadening your search.</p>
                <Button variant="outline" className="mt-4" onClick={() => setFilters({})}>Clear filters</Button>
              </div>
            ) : (
              <div className="grid gap-3">
                {filtered.map((t) => (
                  <TenderCard key={t.id} tender={t} onView={setSelected} isFavourite={favourites.has(t.id)} onToggleFavourite={toggleFavourite} />
                ))}
              </div>
            )}
          </section>
        )}
      </main>

      <footer className="border-t py-6 mt-8">
        <div className="container mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <p>
            Delhi Tender Insights is an independent tool. Always verify details on the{" "}
            <a href="https://govtprocurement.delhi.gov.in/nicgep/app" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">
              official e-Procurement portal
            </a>.
          </p>
          <p>Last data refresh: {data?.lastUpdated ? new Date(data.lastUpdated).toLocaleString("en-IN") : "—"}</p>
        </div>
      </footer>

      <TenderDetail tender={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
