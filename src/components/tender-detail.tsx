"use client";
import type { Tender } from "@/types/tender";
import { formatCurrency, formatDateTime, daysUntil } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X, ExternalLink, Calendar, Building2, MapPin, IndianRupee, FileText, Clock, Hash, Layers } from "lucide-react";

export function TenderDetail({ tender, onClose }: { tender: Tender | null; onClose: () => void }) {
  if (!tender) return null;
  const days = daysUntil(tender.closingDate);

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-lg bg-background shadow-2xl border-l flex flex-col animate-fade-in">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="font-semibold text-lg">Tender Details</h2>
          <Button variant="ghost" size="icon" onClick={onClose}><X className="h-5 w-5" /></Button>
        </div>
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          <div className="space-y-3">
            <div className="flex flex-wrap gap-1.5">
              {tender.isNew && <Badge variant="success">New</Badge>}
              {tender.isClosingSoon && (
                <Badge variant={days <= 3 ? "danger" : "warning"}>
                  {days === 0 ? "Closes today" : `${days} days left`}
                </Badge>
              )}
              {tender.hasCorrigendum && <Badge variant="saffron">Corrigendum ×{tender.corrigendumCount}</Badge>}
              <Badge variant="outline">{tender.tenderType}</Badge>
            </div>
            <h3 className="text-xl font-bold leading-snug">{tender.title}</h3>
          </div>
          <div className="grid grid-cols-1 gap-3">
            <Row icon={Hash} label="Tender ID" value={tender.tenderId} mono />
            <Row icon={FileText} label="Reference No" value={tender.referenceNo} mono />
            <Row icon={Building2} label="Organisation" value={tender.organisation} />
            <Row icon={Layers} label="Organisation Chain" value={tender.organisationChain} />
            <Row icon={MapPin} label="Location / Zone" value={`${tender.location} · ${tender.zone}`} />
            <Row icon={Layers} label="Category" value={tender.category} />
            <Row icon={IndianRupee} label="Estimated Value" value={formatCurrency(tender.estimatedValue)} highlight />
            {tender.emdAmount != null && <Row icon={IndianRupee} label="EMD Amount" value={formatCurrency(tender.emdAmount)} />}
            <Row icon={Calendar} label="Published" value={formatDateTime(tender.publishedDate)} />
            <Row icon={Clock} label="Bid Submission Closes" value={formatDateTime(tender.closingDate)} />
            <Row icon={Clock} label="Bid Opening" value={formatDateTime(tender.bidOpeningDate)} />
            {tender.numberOfBids != null && <Row icon={FileText} label="Bids Received" value={String(tender.numberOfBids)} />}
          </div>
          {tender.documents.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold mb-2">Documents</h4>
              <ul className="space-y-1.5">
                {tender.documents.map((doc, i) => (
                  <li key={i}>
                    <a href={doc.url} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm text-sky-600 dark:text-sky-400 hover:underline">
                      <FileText className="h-3.5 w-3.5" />{doc.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        <div className="p-4 border-t">
          <Button asChild className="w-full gap-2" variant="saffron">
            <a href={tender.detailUrl} target="_blank" rel="noopener noreferrer">
              View on Official Portal <ExternalLink className="h-4 w-4" />
            </a>
          </Button>
        </div>
      </div>
    </>
  );
}

function Row({ icon: Icon, label, value, mono, highlight }: {
  icon: React.ElementType; label: string; value: string; mono?: boolean; highlight?: boolean;
}) {
  return (
    <div className="flex items-start gap-3 py-2 border-b border-border/50 last:border-0">
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
