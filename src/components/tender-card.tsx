"use client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Tender } from "@/types/tender";
import { formatCurrency, formatDate, daysUntil, cn } from "@/lib/utils";
import { opportunityScore, scoreLabel } from "@/lib/match";
import {
  Calendar,
  MapPin,
  Building2,
  IndianRupee,
  FileText,
  Star,
  Flame,
} from "lucide-react";

interface Props {
  tender: Tender;
  onView: (t: Tender) => void;
  isFavourite?: boolean;
  onToggleFavourite?: (id: string) => void;
}

export function TenderCard({
  tender,
  onView,
  isFavourite,
  onToggleFavourite,
}: Props) {
  const days = daysUntil(tender.closingDate);
  const urgent = days >= 0 && days <= 3;
  const soon = days > 3 && days <= 7;
  const score = opportunityScore(tender);
  const label = scoreLabel(score);

  return (
    <Card
      className={cn(
        "group overflow-hidden transition-all duration-200 hover:shadow-lg hover:border-navy-300 dark:hover:border-saffron/40 cursor-pointer",
        urgent && "border-l-4 border-l-red-500",
        soon && "border-l-4 border-l-amber-500",
        label === "Hot" && !urgent && "border-l-4 border-l-orange-400"
      )}
      onClick={() => onView(tender)}
    >
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-1.5">
              <Badge variant="outline" className="text-[10px]">
                {tender.stateName || tender.stateCode}
              </Badge>
              {tender.isNew && <Badge variant="success">New</Badge>}
              {days >= 0 && days <= 7 && (
                <Badge variant={urgent ? "danger" : "warning"}>
                  {days === 0 ? "Closes today" : `${days}d left`}
                </Badge>
              )}
              {tender.hasCorrigendum && (
                <Badge variant="saffron">
                  Corrigendum ×{tender.corrigendumCount}
                </Badge>
              )}
              {tender.status === "extended" && (
                <Badge variant="info">Extended</Badge>
              )}
            </div>
            <h3 className="font-semibold text-[15px] leading-snug line-clamp-2 group-hover:text-navy-700 dark:group-hover:text-saffron transition-colors">
              {tender.title}
            </h3>
            <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <Building2 className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate max-w-[180px]">
                  {tender.organisation}
                </span>
              </span>
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                {tender.zone}
              </span>
              <span className="inline-flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5 shrink-0" />
                Closes {formatDate(tender.closingDate)}
              </span>
              {tender.estimatedValue != null && (
                <span className="inline-flex items-center gap-1 font-medium text-foreground">
                  <IndianRupee className="h-3.5 w-3.5 shrink-0" />
                  {formatCurrency(tender.estimatedValue)}
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <Badge variant="outline" className="text-[10px] font-normal">
                {tender.category}
              </Badge>
              <span className="text-[11px] text-muted-foreground font-mono">
                {tender.referenceNo}
              </span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2 shrink-0">
            {onToggleFavourite && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleFavourite(tender.id);
                }}
                className="p-1.5 rounded-md hover:bg-muted transition-colors"
                aria-label="Favourite"
              >
                <Star
                  className={cn(
                    "h-4 w-4",
                    isFavourite
                      ? "fill-saffron text-saffron"
                      : "text-muted-foreground"
                  )}
                />
              </button>
            )}
            <div
              className={cn(
                "flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold border",
                label === "Hot" &&
                  "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-800",
                label === "Strong" &&
                  "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800",
                label === "Good" &&
                  "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
                label === "Watch" &&
                  "bg-muted text-muted-foreground border-border"
              )}
              title="Opportunity score based on deadline, value & data quality"
            >
              {label === "Hot" && <Flame className="h-3 w-3" />}
              {label} · {score}
            </div>
            <Button
              size="sm"
              variant="outline"
              className="opacity-0 group-hover:opacity-100 transition-opacity hidden sm:flex gap-1"
              onClick={(e) => {
                e.stopPropagation();
                onView(tender);
              }}
            >
              <FileText className="h-3.5 w-3.5" /> Details
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
