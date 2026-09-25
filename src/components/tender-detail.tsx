"use client";
import { useEffect, useState } from "react";
import type { Tender } from "@/types/tender";
import { formatCurrency, formatDateTime, daysUntil } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  X, ExternalLink, Calendar, Building2, MapPin, IndianRupee, FileText,
  Clock, Hash, Layers, Loader2, CheckCircle2, Globe,
} from "lucide-react";

export function TenderDetail({
  tender,
  onClose,
}: {
  tender: Tender | null;
  onClose: () => void;
}) {
  const [detail, setDetail] = useState<Tender | null>(tender);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setDetail(tender);
    if (!tender) return;
    if (tender.enriched) return;
    let cancelled = false;
    setLoading(true);
    fetch("/api/tenders/detail", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tender }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled && data.tender) setDetail(data.tender);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [tender]);

  if (!detail) return null;
  const days = daysUntil(detail.closingDate);

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-xl bg-background shadow-2xl border-l flex flex-col animate-fade-in">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <h2 className="font-semibold text-lg">Tender Details</h2>
            {loading && (
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading full details…
              </span>
            )}
            {!loading && detail.enriched && (
              <span className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-3.5 w-3.5" /> Live data
              </span>
            )}
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          <div className="space-y-3">
            <div className="flex flex-wrap gap-1.5">
              <Badge variant="outline" className="gap-1">
                <Globe className="h-3 w-3" />
                {detail.stateName}
              </Badge>
              {detail.isNew && <Badge variant="success">New</Badge>}
              {detail.isClosingSoon && (
                <Badge variant={days <= 3 ? "danger" : "warning"}>
                  {days === 0 ? "Closes today" : `${days} days left`}
                </Badge>
              )}
              {detail.hasCorrigendum && (
                <Badge variant="saffron">
                  Corrigendum ×{detail.corrigendumCount || 1}
                </Badge>
              )}
              <Badge variant="outline">{detail.tenderType}</Badge>
            </div>
            <h3 className="text-xl font-bold leading-snug">{detail.title}</h3>
          </div>

          <div className="grid grid-cols-1 gap-1">
            <Row icon={Hash} label="Tender ID" value={detail.tenderId} mono />
            <Row icon={FileText} label="Reference No" value={detail.referenceNo} mono />
            <Row icon={Building2} label="Organisation" value={detail.organisation} />
            <Row icon={Layers} label="Organisation Chain" value={detail.organisationChain} />
            <Row
              icon={MapPin}
              label="Location / Zone"
              value={`${detail.location}${detail.zone !== "Unknown" ? ` · ${detail.zone}` : ""}`}
            />
            <Row icon={Layers} label="Category" value={detail.category} />
            {detail.productCategory && (
              <Row icon={Layers} label="Product Category" value={detail.productCategory} />
            )}
            {detail.subCategory && detail.subCategory !== "NA" && (
              <Row icon={Layers} label="Sub Category" value={detail.subCategory} />
            )}
            <Row
              icon={IndianRupee}
              label="Estimated / Tender Value"
              value={formatCurrency(detail.estimatedValue)}
              highlight
            />
            {detail.emdAmount != null && (
              <Row icon={IndianRupee} label="EMD Amount" value={formatCurrency(detail.emdAmount)} />
            )}
            {detail.tenderFee != null && (
              <Row icon={IndianRupee} label="Tender Fee" value={formatCurrency(detail.tenderFee)} />
            )}
            {detail.emdPayableTo && (
              <Row icon={Building2} label="EMD Payable To" value={detail.emdPayableTo} />
            )}
            {detail.paymentMode && (
              <Row icon={FileText} label="Payment Mode" value={detail.paymentMode} />
            )}
            {detail.formOfContract && (
              <Row icon={FileText} label="Form of Contract" value={detail.formOfContract} />
            )}
            {detail.noOfCovers && (
              <Row icon={FileText} label="No. of Covers" value={detail.noOfCovers} />
            )}
            <Row icon={Calendar} label="Published" value={formatDateTime(detail.publishedDate)} />
            <Row icon={Clock} label="Bid Submission Closes" value={formatDateTime(detail.closingDate)} />
            <Row icon={Clock} label="Bid Opening" value={formatDateTime(detail.bidOpeningDate)} />
          </div>

          <p className="text-[11px] text-muted-foreground leading-relaxed border-t pt-3">
            Data is scraped from the official GePNIC portal for convenience. Always
            verify critical numbers (value, EMD, dates) on the official site before bidding.
          </p>
        </div>

        <div className="p-4 border-t space-y-2">
          <Button asChild className="w-full gap-2" variant="saffron">
            <a href={detail.detailUrl} target="_blank" rel="noopener noreferrer">
              Verify on Official Portal <ExternalLink className="h-4 w-4" />
            </a>
          </Button>
        </div>
      </div>
    </>
  );
}

function Row({
  icon: Icon,
  label,
  value,
  mono,
  highlight,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  mono?: boolean;
  highlight?: boolean;
}) {
  if (!value || value === "—" || value === "null") return null;
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-border/50 last:border-0">
      <Icon className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">{label}</p>
        <p className={`text-sm mt-0.5 break-words ${mono ? "font-mono text-xs" : ""} ${highlight ? "font-semibold text-base" : ""}`}>
          {value}
        </p>
      </div>
    </div>
  );
}
