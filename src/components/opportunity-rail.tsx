"use client";
import type { Tender } from "@/types/tender";
import { formatCurrency, daysUntil } from "@/lib/utils";
import { opportunityScore, scoreLabel } from "@/lib/match";
import { Badge } from "@/components/ui/badge";
import { Flame, Clock, IndianRupee, ChevronRight } from "lucide-react";

export function OpportunityRail({
  title,
  icon,
  tenders,
  onSelect,
}: {
  title: string;
  icon: "hot" | "closing";
  tenders: Tender[];
  onSelect: (t: Tender) => void;
}) {
  if (!tenders.length) return null;
  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        {icon === "hot" ? (
          <Flame className="h-4 w-4 text-orange-500" />
        ) : (
          <Clock className="h-4 w-4 text-amber-500" />
        )}
        <h2 className="text-sm font-semibold tracking-tight">{title}</h2>
        <Badge variant="outline" className="text-[10px] h-5">
          {tenders.length}
        </Badge>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 snap-x">
        {tenders.map((t) => {
          const days = daysUntil(t.closingDate);
          const score = opportunityScore(t);
          const label = scoreLabel(score);
          return (
            <button
              key={t.id}
              onClick={() => onSelect(t)}
              className="snap-start shrink-0 w-[280px] sm:w-[300px] text-left rounded-xl border bg-card p-4 hover:shadow-md hover:border-saffron/40 transition-all group"
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <Badge
                  variant={label === "Hot" ? "danger" : label === "Strong" ? "saffron" : "outline"}
                  className="text-[10px]"
                >
                  {label} · {score}
                </Badge>
                <span className="text-[11px] text-muted-foreground">
                  {days === 0 ? "Today" : days < 0 ? "Closed" : `${days}d left`}
                </span>
              </div>
              <p className="text-sm font-semibold leading-snug line-clamp-2 group-hover:text-navy-700 dark:group-hover:text-saffron">
                {t.title}
              </p>
              <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                <span className="truncate max-w-[140px]">{t.stateName || t.organisation}</span>
                {t.estimatedValue != null && (
                  <span className="inline-flex items-center gap-0.5 font-medium text-foreground">
                    <IndianRupee className="h-3 w-3" />
                    {formatCurrency(t.estimatedValue)}
                  </span>
                )}
              </div>
              <div className="mt-2 flex items-center text-[11px] text-saffron font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                View details <ChevronRight className="h-3 w-3" />
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
