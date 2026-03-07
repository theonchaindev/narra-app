import { NextRequest, NextResponse } from "next/server";
import { runScan } from "@/lib/scanner";
import { scorePendingPosts } from "@/lib/scorer";
import { generatePendingNarratives } from "@/lib/narrative";

// Vercel cron: add to vercel.json:
// { "crons": [{ "path": "/api/cron", "schedule": "0 */4 * * *" }] }

export async function GET(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const scanStats = await runScan();
  const scored = await scorePendingPosts();
  const narrativesGenerated = await generatePendingNarratives();

  return NextResponse.json({
    ok: true,
    scanned: scanStats.scanned,
    newPosts: scanStats.newPosts,
    scored,
    narrativesGenerated,
  });
}
