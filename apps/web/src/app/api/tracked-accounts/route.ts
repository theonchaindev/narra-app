import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@bags-scout/db";

export async function GET() {
  const accounts = await prisma.trackedAccount.findMany({
    orderBy: { addedAt: "desc" },
  });
  return NextResponse.json({ accounts });
}

export async function POST(req: NextRequest) {
  const { username } = await req.json();
  if (!username || typeof username !== "string") {
    return NextResponse.json({ error: "username required" }, { status: 400 });
  }

  const clean = username.trim().replace(/^@/, "").toLowerCase();
  if (!clean) {
    return NextResponse.json({ error: "Invalid username" }, { status: 400 });
  }

  const existing = await prisma.trackedAccount.findUnique({ where: { username: clean } });
  if (existing) {
    return NextResponse.json({ account: existing });
  }

  const account = await prisma.trackedAccount.create({ data: { username: clean } });
  return NextResponse.json({ account });
}
