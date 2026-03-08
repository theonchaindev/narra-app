import { NextResponse } from "next/server";
import { runScan } from "@/lib/scanner";
import { scorePendingPosts } from "@/lib/scorer";
import { generatePendingNarratives } from "@/lib/narrative";

export const maxDuration = 60;

export async function POST() {
  try {
    const scanStats = await runScan();
    const scored = await scorePendingPosts();
    const narrativesGenerated = await generatePendingNarratives();

    return NextResponse.json({
      success: true,
      scanned: scanStats.scanned,
      newPosts: scanStats.newPosts,
      newBuilders: scanStats.newBuilders,
      scored,
      narrativesGenerated,
      method: scanStats.method,
      error: scanStats.error,
    });
  } catch (err) {
    console.error("Scan failed:", err);
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Scan failed" },
      { status: 500 }
    );
  }
}
