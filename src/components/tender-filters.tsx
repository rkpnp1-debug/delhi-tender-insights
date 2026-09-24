"use client";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { TenderFilters, DelhiZone, TenderCategory } from "@/types/tender";
import { ALL_ZONES } from "@/lib/zones";
import { ALL_CATEGORIES } from "@/lib/categories";
import { Search, X, Filter, Download } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  filters: TenderFilters;
  onChange: (f: TenderFilters) => void;
  departments: string[];
  onExport: () => void;
  resultCount: number;
}

export function TenderFiltersBar({ filters, onChange, departments, onExport, resultCount }: Props) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const toggleArray = <T extends string>(key: keyof TenderFilters, value: T) => {
    const current = (filters[key] as T[] | undefined) || [];
    const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
    onChange({ ...filters, [key]: next.length ? next : undefined });
  };

  const activeFilterCount =
    (filters.departments?.length || 0) + (filters.zones?.length || 0) +
    (filters.categories?.length || 0) + (filters.hasCorrigendum ? 1 : 0);

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search title, reference no, department, location..."
            className="pl-10 h-11"
            value={filters.search || ""}
            onChange={(e) => onChange({ ...filters, search: e.target.value || undefined })}
          />
          {filters.search && (
            <button className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              onClick={() => onChange({ ...filters, search: undefined })}>
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant={showAdvanced || activeFilterCount > 0 ? "default" : "outline"} className="h-11 gap-2"
            onClick={() => setShowAdvanced(!showAdvanced)}>
            <Filter className="h-4 w-4" /> Filters
            {activeFilterCount > 0 && <Badge variant="saffron" className="ml-1 h-5 min-w-5 px-1.5">{activeFilterCount}</Badge>}
          </Button>
          <Button variant="outline" className="h-11 gap-2" onClick={onExport}>
            <Download className="h-4 w-4" /> <span className="hidden sm:inline">Export</span>
          </Button>
        </div>
      </div>

      {showAdvanced && (
        <div className="rounded-xl border bg-card p-4 space-y-4 animate-fade-in shadow-sm">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Department</p>
            <div className="flex flex-wrap gap-1.5">
              {departments.slice(0, 12).map((d) => (
                <button key={d} onClick={() => toggleArray("departments", d)}
                  className={cn("px-2.5 py-1 rounded-full text-xs font-medium border transition-colors",
                    filters.departments?.includes(d)
                      ? "bg-navy-900 text-white border-navy-900 dark:bg-saffron dark:text-navy-900 dark:border-saffron"
                      : "bg-background hover:bg-muted border-border")}>
                  {d.replace("Public Works Department", "PWD").replace("Delhi Jal Board", "DJB").replace("New Delhi Municipal Council", "NDMC")}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Zone / Area</p>
            <div className="flex flex-wrap gap-1.5">
              {ALL_ZONES.filter((z) => z !== "Unknown").map((z) => (
                <button key={z} onClick={() => toggleArray("zones", z as DelhiZone)}
                  className={cn("px-2.5 py-1 rounded-full text-xs font-medium border transition-colors",
                    filters.zones?.includes(z)
                      ? "bg-navy-900 text-white border-navy-900 dark:bg-saffron dark:text-navy-900 dark:border-saffron"
                      : "bg-background hover:bg-muted border-border")}>
                  {z}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Category</p>
            <div className="flex flex-wrap gap-1.5">
              {ALL_CATEGORIES.map((c) => (
                <button key={c} onClick={() => toggleArray("categories", c as TenderCategory)}
                  className={cn("px-2.5 py-1 rounded-full text-xs font-medium border transition-colors",
                    filters.categories?.includes(c)
                      ? "bg-navy-900 text-white border-navy-900 dark:bg-saffron dark:text-navy-900 dark:border-saffron"
                      : "bg-background hover:bg-muted border-border")}>
                  {c}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button onClick={() => onChange({ ...filters, hasCorrigendum: filters.hasCorrigendum ? undefined : true })}
              className={cn("px-2.5 py-1 rounded-full text-xs font-medium border transition-colors",
                filters.hasCorrigendum ? "bg-amber-500 text-white border-amber-500" : "bg-background hover:bg-muted border-border")}>
              Has Corrigendum
            </button>
            <Button variant="ghost" size="sm" className="text-xs" onClick={() => onChange({})}>Clear all</Button>
            <span className="text-xs text-muted-foreground ml-auto">{resultCount} tender{resultCount !== 1 ? "s" : ""} match</span>
          </div>
        </div>
      )}
    </div>
  );
}
