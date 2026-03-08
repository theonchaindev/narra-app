import { NextResponse } from "next/server";
import { prisma } from "@bags-scout/db";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;
  await prisma.trackedAccount.deleteMany({ where: { username } });
  return NextResponse.json({ success: true });
}
