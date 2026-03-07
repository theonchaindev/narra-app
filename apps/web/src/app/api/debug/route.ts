import { NextResponse } from "next/server";

export async function GET() {
  try {
    const { prisma } = await import("@bags-scout/db");
    const count = await prisma.opportunity.count();
    return NextResponse.json({ ok: true, count });
  } catch (e: unknown) {
    const err = e as Error;
    return NextResponse.json({
      ok: false,
      error: err.message,
      stack: err.stack?.split("\n").slice(0, 8),
    }, { status: 500 });
  }
}
