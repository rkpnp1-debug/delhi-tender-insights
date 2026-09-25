/**
 * Multi-state GePNIC scraper.
 * - Scrapes latest active tenders from portal homepages (no captcha)
 * - Session-aware detail enrichment for full fields
 * - Falls back to sample data if all portals fail
 */
import { SAMPLE_TENDERS } from "./sample-data";
import { computeAnalytics } from "./analytics";
import { detectZone } from "./zones";
import { detectCategory } from "./categories";
import { isClosingSoon, isNewTender } from "./utils";
import { PORTALS, getPortal, type PortalConfig } from "./portals";
import type { Tender, TenderResponse, TenderStatus } from "@/types/tender";

const CACHE_TTL_MS = 15 * 60 * 1000;
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";

let cache: { data: TenderResponse; expires: number } | null = null;
const detailCache = new Map<string, { tender: Tender; expires: number }>();

function stripHtml(s: string): string {
  return s
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#8377;/g, "₹")
    .replace(/&rsquo;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function parseInr(s: string | undefined | null): number | null {
  if (!s) return null;
  const cleaned = s.replace(/[^\d.]/g, "");
  if (!cleaned) return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

function parseGepnicDate(s: string): string {
  if (!s) return new Date().toISOString();
  try {
    const m = s.match(
      /(\d{1,2})-([A-Za-z]{3})-(\d{4})\s+(\d{1,2}):(\d{2})\s*(AM|PM)/i
    );
    if (!m) {
      const d = new Date(s);
      return Number.isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
    }
    const months: Record<string, number> = {
      Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
      Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11,
    };
    let hour = parseInt(m[4], 10);
    const min = parseInt(m[5], 10);
    const ap = m[6].toUpperCase();
    if (ap === "PM" && hour < 12) hour += 12;
    if (ap === "AM" && hour === 12) hour = 0;
    const local = new Date(
      parseInt(m[3], 10),
      months[m[2]] ?? 0,
      parseInt(m[1], 10),
      hour,
      min
    );
    return local.toISOString();
  } catch {
    return new Date().toISOString();
  }
}

function extractCaptionFields(html: string): Record<string, string> {
  const out: Record<string, string> = {};
  const re =
    /<td[^>]*class="[^"]*caption[^"]*"[^>]*>([\s\S]*?)<\/td>\s*<td[^>]*class="[^"]*field[^"]*"[^>]*>([\s\S]*?)<\/td>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    const lab = stripHtml(m[1]);
    const val = stripHtml(m[2]);
    if (lab && val) out[lab] = val;
  }
  return out;
}

function guessOrgFromRef(ref: string, title: string): string {
  const r = (ref + " " + title).toUpperCase();
  if (r.includes("PWD")) return "Public Works Department";
  if (r.includes("DJB") || r.includes("JAL")) return "Delhi Jal Board";
  if (r.includes("NDMC")) return "New Delhi Municipal Council";
  if (r.includes("DSIIDC")) return "DSIIDC";
  if (r.includes("DUSIB")) return "Delhi Urban Shelter Improvement Board";
  if (r.includes("DTC")) return "Delhi Transport Corporation";
  if (r.includes("I&FC") || r.includes("IRRIGATION")) return "Irrigation and Flood Control";
  return "Government Department";
}

async function fetchWithCookies(
  url: string,
  cookieJar: Map<string, string>
): Promise<{ html: string; ok: boolean }> {
  const cookieHeader = [...cookieJar.entries()].map(([k, v]) => `${k}=${v}`).join("; ");
  const res = await fetch(url, {
    headers: {
      "User-Agent": UA,
      Accept: "text/html,application/xhtml+xml",
      "Accept-Language": "en-IN,en;q=0.9",
      ...(cookieHeader ? { Cookie: cookieHeader } : {}),
    },
    signal: AbortSignal.timeout(12000),
    redirect: "follow",
  });
  const setCookie = typeof res.headers.getSetCookie === "function" ? res.headers.getSetCookie() : [];
  for (const c of setCookie) {
    const part = c.split(";")[0];
    const eq = part.indexOf("=");
    if (eq > 0) cookieJar.set(part.slice(0, eq), part.slice(eq + 1));
  }
  const single = res.headers.get("set-cookie");
  if (single && setCookie.length === 0) {
    const part = single.split(";")[0];
    const eq = part.indexOf("=");
    if (eq > 0) cookieJar.set(part.slice(0, eq), part.slice(eq + 1));
  }
  const html = await res.text();
  return { html, ok: res.ok };
}

interface ListItem {
  title: string;
  referenceNo: string;
  closingRaw: string;
  openingRaw: string;
  detailPath: string;
}

function parseHomepageList(html: string): ListItem[] {
  const items: ListItem[] = [];
  const re =
    /<tr[^>]*id="informal[^"]*"[^>]*>\s*<td[^>]*>\s*<a[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>\s*<\/td>\s*<td[^>]*>([\s\S]*?)<\/td>\s*<td[^>]*>([\s\S]*?)<\/td>\s*<td[^>]*>([\s\S]*?)<\/td>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    const path = m[1].replace(/&amp;/g, "&");
    const title = stripHtml(m[2]).replace(/^\d+\.\s*/, "");
    const referenceNo = stripHtml(m[3]);
    const closingRaw = stripHtml(m[4]);
    const openingRaw = stripHtml(m[5]);
    if (title.length < 5) continue;
    items.push({ title, referenceNo, closingRaw, openingRaw, detailPath: path });
  }
  return items;
}

function listItemToTender(item: ListItem, portal: PortalConfig, index: number): Tender {
  const closingDate = parseGepnicDate(item.closingRaw);
  const bidOpeningDate = parseGepnicDate(item.openingRaw);
  const org = guessOrgFromRef(item.referenceNo, item.title);
  const zone = detectZone(item.title, item.title, org);
  const category = detectCategory(item.title);
  const base = portal.baseUrl.replace(/\/nicgep\/app\/?$/, "");
  const detailUrl = item.detailPath.startsWith("http")
    ? item.detailPath
    : `${base}${item.detailPath}`;

  const tenderId =
    item.referenceNo.replace(/\s+/g, "_").slice(0, 40) ||
    `${portal.code}_${index}`;

  let status: TenderStatus = "active";
  if (isClosingSoon(closingDate, 7)) status = "closing_soon";

  const idSeed = `${portal.code}-${item.referenceNo}-${item.closingRaw}`.slice(0, 80);

  return {
    id: idSeed.replace(/[^a-zA-Z0-9_-]/g, "_"),
    tenderId,
    referenceNo: item.referenceNo,
    title: item.title,
    organisation: org,
    department: portal.shortName,
    organisationChain: org,
    closingDate,
    bidOpeningDate,
    publishedDate: new Date().toISOString(),
    estimatedValue: null,
    location: portal.name,
    zone,
    category,
    tenderType: "Open Tender",
    formOfContract: "Works",
    productCategory: category,
    status,
    numberOfBids: null,
    hasCorrigendum: /corrigendum|postponed|extend/i.test(item.title),
    corrigendumCount: 0,
    detailUrl,
    nitUrl: null,
    documents: [],
    emdAmount: null,
    tenderFee: null,
    bidValidityDays: null,
    description: item.title,
    isNew: true,
    isClosingSoon: isClosingSoon(closingDate, 7),
    stateCode: portal.code,
    stateName: portal.name,
    detailPath: item.detailPath,
    enriched: false,
  };
}

function applyDetailFields(tender: Tender, fields: Record<string, string>): Tender {
  const get = (...keys: string[]) => {
    for (const k of keys) {
      const found = Object.entries(fields).find(([lab]) =>
        lab.toLowerCase().includes(k.toLowerCase())
      );
      if (found?.[1]) return found[1];
    }
    return undefined;
  };

  const title = get("Work Description", "Tender Title") || tender.title;
  const tenderId = get("Tender ID") || tender.tenderId;
  const referenceNo = get("Tender Reference Number", "Tender Reference") || tender.referenceNo;
  const orgChain = get("Organisation Chain") || tender.organisationChain;
  const org = orgChain?.split("||")[0]?.trim() || tender.organisation;
  const value = parseInr(get("Tender Value"));
  const emd = parseInr(get("EMD Amount"));
  const fee = parseInr(get("Tender Fee"));
  const productCat = get("Product Category") || tender.productCategory;
  const tenderType = get("Tender Type") || tender.tenderType;
  const formOfContract = get("Form Of Contract") || tender.formOfContract;
  const paymentMode = get("Payment Mode");
  const noOfCovers = get("No. of Covers");
  const emdPayableTo = get("EMD Payable To");
  const withdrawalAllowed = get("Withdrawal Allowed");
  const subCategory = get("Sub category", "Sub Category");
  const location = get("Location") || tender.location;
  const closing = get("Bid Submission End Date") || get("Closing Date");
  const opening = get("Bid Opening Date");

  const category = detectCategory(title + " " + (productCat || ""));
  const zone = detectZone(location || "", title, org);
  const closingDate = closing ? parseGepnicDate(closing) : tender.closingDate;

  return {
    ...tender,
    title,
    tenderId,
    referenceNo,
    organisation: org,
    organisationChain: orgChain || org,
    estimatedValue: value ?? tender.estimatedValue,
    emdAmount: emd ?? tender.emdAmount,
    tenderFee: fee ?? tender.tenderFee,
    productCategory: productCat || tender.productCategory,
    category,
    zone,
    location: location || tender.location,
    tenderType,
    formOfContract,
    paymentMode,
    noOfCovers,
    emdPayableTo,
    withdrawalAllowed,
    subCategory,
    closingDate,
    bidOpeningDate: opening ? parseGepnicDate(opening) : tender.bidOpeningDate,
    description: title,
    documents: [{ name: "View on official portal", url: tender.detailUrl }],
    enriched: true,
    isClosingSoon: isClosingSoon(closingDate, 7),
    isNew: isNewTender(tender.publishedDate, 7),
  };
}

async function scrapePortalList(portal: PortalConfig): Promise<{
  tenders: Tender[];
  cookies: Map<string, string>;
}> {
  const cookies = new Map<string, string>();
  try {
    const { html, ok } = await fetchWithCookies(portal.baseUrl, cookies);
    if (!ok || html.includes("Stale Session")) return { tenders: [], cookies };
    const items = parseHomepageList(html);
    const tenders = items.map((it, i) => listItemToTender(it, portal, i));
    return { tenders, cookies };
  } catch (e) {
    console.error(`Scrape list failed ${portal.code}:`, e);
    return { tenders: [], cookies };
  }
}

async function enrichTenderDetail(
  tender: Tender,
  cookies: Map<string, string>,
  portal: PortalConfig
): Promise<Tender> {
  if (!tender.detailPath) return tender;
  const base = portal.baseUrl.replace(/\/nicgep\/app\/?$/, "");
  const url = tender.detailPath.startsWith("http")
    ? tender.detailPath
    : `${base}${tender.detailPath}`;
  try {
    const { html, ok } = await fetchWithCookies(url, cookies);
    if (!ok || html.includes("Stale Session") || html.length < 2000) return tender;
    const fields = extractCaptionFields(html);
    if (Object.keys(fields).length < 3) return tender;
    return applyDetailFields(tender, fields);
  } catch {
    return tender;
  }
}

export async function getTenders(forceRefresh = false): Promise<TenderResponse> {
  const now = Date.now();
  if (!forceRefresh && cache && cache.expires > now) {
    return { ...cache.data, source: "cached" };
  }

  const portalsScraped: string[] = [];
  const all: Tender[] = [];
  const cookieMap = new Map<string, Map<string, string>>();

  const results = await Promise.all(
    PORTALS.map(async (p) => {
      const r = await scrapePortalList(p);
      return { portal: p, ...r };
    })
  );

  for (const r of results) {
    if (r.tenders.length > 0) {
      portalsScraped.push(r.portal.code);
      cookieMap.set(r.portal.code, r.cookies);
      all.push(...r.tenders);
    }
  }

  const ENRICH_LIMIT = 18;
  const toEnrich = all.slice(0, ENRICH_LIMIT);
  const enriched = await Promise.all(
    toEnrich.map(async (t) => {
      const portal = getPortal(t.stateCode);
      const cookies = cookieMap.get(t.stateCode);
      if (!portal || !cookies) return t;
      return enrichTenderDetail(t, cookies, portal);
    })
  );
  for (let i = 0; i < enriched.length; i++) {
    all[i] = enriched[i];
  }

  let tenders = all;
  let source: "live" | "cached" | "sample" = "live";

  if (tenders.length === 0) {
    tenders = SAMPLE_TENDERS.map((t) => ({
      ...t,
      stateCode: (t as Tender).stateCode || "DL",
      stateName: (t as Tender).stateName || "Delhi (NCT)",
      enriched: false,
    }));
    source = "sample";
  }

  tenders.sort(
    (a, b) => new Date(a.closingDate).getTime() - new Date(b.closingDate).getTime()
  );

  const analytics = computeAnalytics(tenders, source);
  const byStateMap = new Map<string, { count: number; value: number }>();
  for (const t of tenders) {
    const prev = byStateMap.get(t.stateName) || { count: 0, value: 0 };
    byStateMap.set(t.stateName, {
      count: prev.count + 1,
      value: prev.value + (t.estimatedValue || 0),
    });
  }
  analytics.byState = Array.from(byStateMap.entries())
    .map(([name, v]) => ({ name, ...v }))
    .sort((a, b) => b.count - a.count);

  const response: TenderResponse = {
    tenders,
    analytics,
    lastUpdated: new Date().toISOString(),
    source,
    total: tenders.length,
    portalsScraped,
  };

  cache = { data: response, expires: now + CACHE_TTL_MS };
  return response;
}

export async function getTenderDetail(tender: Tender): Promise<Tender> {
  const cacheKey = tender.id;
  const hit = detailCache.get(cacheKey);
  if (hit && hit.expires > Date.now()) return hit.tender;

  const portal = getPortal(tender.stateCode);
  if (!portal || !tender.detailPath) return tender;

  const cookies = new Map<string, string>();
  await fetchWithCookies(portal.baseUrl, cookies);
  const enriched = await enrichTenderDetail(tender, cookies, portal);
  detailCache.set(cacheKey, { tender: enriched, expires: Date.now() + CACHE_TTL_MS });
  return enriched;
}

export function clearCache() {
  cache = null;
  detailCache.clear();
}
