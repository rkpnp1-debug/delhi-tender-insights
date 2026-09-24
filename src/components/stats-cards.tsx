"use client";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import type { AnalyticsSummary } from "@/types/tender";
import { FileText, IndianRupee, Clock, Sparkles, AlertTriangle, TrendingUp } from "lucide-react";

export function StatsCards({ analytics }: { analytics: AnalyticsSummary }) {
  const items = [
    { label: "Active Tenders", value: analytics.totalTenders.toLocaleString("en-IN"), icon: FileText, color: "text-sky-600 dark:text-sky-400", bg: "bg-sky-50 dark:bg-sky-950/40" },
    { label: "Total Est. Value", value: formatCurrency(analytics.totalEstimatedValue), icon: IndianRupee, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-950/40" },
    { label: "Closing in 7 days", value: analytics.closingIn7Days.toString(), icon: Clock, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-950/40" },
    { label: "New this week", value: analytics.newThisWeek.toString(), icon: Sparkles, color: "text-violet-600 dark:text-violet-400", bg: "bg-violet-50 dark:bg-violet-950/40" },
    { label: "With Corrigendum", value: analytics.withCorrigendum.toString(), icon: AlertTriangle, color: "text-rose-600 dark:text-rose-400", bg: "bg-rose-50 dark:bg-rose-950/40" },
    { label: "Closing in 30 days", value: analytics.closingIn30Days.toString(), icon: TrendingUp, color: "text-saffron-600 dark:text-saffron-400", bg: "bg-saffron-50 dark:bg-saffron-950/30" },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
      {items.map((item) => (
        <Card key={item.label} className="overflow-hidden border-0 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-4 flex flex-col gap-2">
            <div className={`w-9 h-9 rounded-lg ${item.bg} flex items-center justify-center`}>
              <item.icon className={`h-4 w-4 ${item.color}`} />
            </div>
            <div>
              <p className="text-2xl font-bold tracking-tight">{item.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{item.label}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
