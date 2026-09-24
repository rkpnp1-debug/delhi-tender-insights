"use client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AnalyticsSummary } from "@/types/tender";
import { formatCurrency } from "@/lib/utils";

const COLORS = ["#0B1D36", "#FF9933", "#138808", "#3B82F6", "#8B5CF6", "#EC4899", "#14B8A6", "#F59E0B"];

export function AnalyticsCharts({ analytics }: { analytics: AnalyticsSummary }) {
  const deptData = analytics.byDepartment.slice(0, 8).map((d) => ({
    name: d.name.replace("Public Works Department", "PWD").replace("Delhi Jal Board", "DJB")
      .replace("New Delhi Municipal Council", "NDMC").replace("Delhi Urban Shelter Improvement Board", "DUSIB")
      .replace("Irrigation and Flood Control", "I&FC").replace("Delhi Transport Infrastructure Development Corp Ltd", "DTIDC").slice(0, 18),
    count: d.count, value: d.value,
  }));
  const zoneData = analytics.byZone.filter((z) => z.name !== "Unknown").slice(0, 10).map((z) => ({ name: z.name, count: z.count }));
  const catData = analytics.byCategory.slice(0, 8).map((c) => ({ name: c.name, count: c.count }));
  const valueData = analytics.byValueRange.map((v) => ({ name: v.range, count: v.count }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">Tenders by Department</CardTitle></CardHeader>
        <CardContent className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={deptData} layout="vertical" margin={{ left: 10, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} className="stroke-border" />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis dataKey="name" type="category" width={90} tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--border))" }}
                formatter={(value: number, name: string) => name === "count" ? [value, "Tenders"] : [formatCurrency(value), "Value"]} />
              <Bar dataKey="count" fill="#0B1D36" radius={[0, 4, 4, 0]} name="count" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">Zone-wise Distribution</CardTitle></CardHeader>
        <CardContent className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={zoneData} margin={{ left: 0, right: 10 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-25} textAnchor="end" height={60} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--border))" }} />
              <Bar dataKey="count" fill="#FF9933" radius={[4, 4, 0, 0]} name="Tenders" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">Category Breakdown</CardTitle></CardHeader>
        <CardContent className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={catData} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={90} innerRadius={45} paddingAngle={2}
                label={({ name, percent }) => (percent > 0.06 ? `${name.slice(0, 10)} ${(percent * 100).toFixed(0)}%` : "")} labelLine={false}>
                {catData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--border))" }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">Value Distribution</CardTitle></CardHeader>
        <CardContent className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={valueData} margin={{ left: 0, right: 10 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--border))" }} />
              <Bar dataKey="count" fill="#138808" radius={[4, 4, 0, 0]} name="Tenders" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
