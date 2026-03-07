import { NextResponse } from "next/server";
import { prisma } from "@bags-scout/db";

export async function GET() {
  const config = await prisma.config.findUnique({ where: { key: "walletPublicKey" } });
  return NextResponse.json({ publicKey: config?.value ?? null });
}

export async function POST(req: Request) {
  const body = await req.json();
  const { publicKey } = body as { publicKey?: string };

  if (!publicKey || typeof publicKey !== "string") {
    return NextResponse.json({ error: "publicKey required" }, { status: 400 });
  }

  await prisma.config.upsert({
    where: { key: "walletPublicKey" },
    update: { value: publicKey },
    create: { key: "walletPublicKey", value: publicKey },
  });

  return NextResponse.json({ success: true });
}
