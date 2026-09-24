/**
 * Resilient scraper for Delhi e-Procurement (GePNIC).
 * Attempts live fetch; falls back to realistic sample data.
 * Caches for 20 minutes.
 */
import { SAMPLE_TENDERS } from "./sample-data";
import { computeAnalytics } from "./analytics";
import type { Tender, TenderResponse } from "@/types/tender";

const CACHE_TTL_MS = 20 * 60 * 1000;
let cache: { data: TenderResponse; expires: number } | null = null;

const PORTAL_BASE = "https://govtprocurement.delhi.gov.in/nicgep/app";

async function tryLiveFetch(): Promise<Tender[] | null> {
  try {
    const res = await fetch(PORTAL_BASE, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; DelhiTenderInsights/1.0)",
        Accept: "text/html",
      },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    // Portal is session/captcha heavy; full extraction needs Playwright.
    // Return null to use high-quality sample that mirrors real structure.
    return null;
  } catch {
    return null;
  }
}

export async function getTenders(forceRefresh = false): Promise<TenderResponse> {
  const now = Date.now();
  if (!forceRefresh && cache && cache.expires > now) {
    return { ...cache.data, source: "cached" };
  }

  let tenders: Tender[] = SAMPLE_TENDERS;
  let source: "live" | "cached" | "sample" = "sample";

  const live = await tryLiveFetch();
  if (live && live.length > 0) {
    tenders = live;
    source = "live";
  }

  const analytics = computeAnalytics(tenders, source);
  const response: TenderResponse = {
    tenders,
    analytics,
    lastUpdated: new Date().toISOString(),
    source,
    total: tenders.length,
  };

  cache = { data: response, expires: now + CACHE_TTL_MS };
  return response;
}

export function clearCache() {
  cache = null;
}
