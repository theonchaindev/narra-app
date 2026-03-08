import { NextResponse } from "next/server";
import { generatePendingNarratives } from "@/lib/narrative";

export const maxDuration = 60;

export async function POST() {
  try {
    const generated = await generatePendingNarratives(5);
    return NextResponse.json({ success: true, generated });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Failed" },
      { status: 500 }
    );
  }
}
