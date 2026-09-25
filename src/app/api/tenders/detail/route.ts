import { NextRequest, NextResponse } from "next/server";
import { getTenderDetail, getTenders } from "@/lib/scraper";
import type { Tender } from "@/types/tender";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { tender?: Tender; id?: string };
    let tender = body.tender;
    if (!tender && body.id) {
      const data = await getTenders(false);
      tender = data.tenders.find((t) => t.id === body.id);
    }
    if (!tender) {
      return NextResponse.json({ error: "Tender not found" }, { status: 404 });
    }
    const enriched = await getTenderDetail(tender);
    return NextResponse.json({ tender: enriched });
  } catch (err) {
    console.error("Detail API error:", err);
    return NextResponse.json(
      { error: "Failed to load tender detail", message: String(err) },
      { status: 500 }
    );
  }
}
