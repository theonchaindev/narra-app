import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@bags-scout/db";
import { PAGE_SIZE } from "@bags-scout/shared";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;

  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const minScore = parseInt(searchParams.get("min") ?? "0", 10);
  const sort = searchParams.get("sort") === "recent" ? "createdAt" : "score";
  const q = searchParams.get("q") ?? "";

  const where = {
    score: { gte: minScore },
    status: { in: ["SCORED", "NARRATED", "LAUNCHED"] as ("SCORED" | "NARRATED" | "LAUNCHED")[] },
    ...(q
      ? {
          OR: [
            { builder: { username: { contains: q, mode: "insensitive" as const } } },
            { builder: { displayName: { contains: q, mode: "insensitive" as const } } },
            { post: { text: { contains: q, mode: "insensitive" as const } } },
          ],
        }
      : {}),
  };

  const [opportunities, total] = await Promise.all([
    prisma.opportunity.findMany({
      where,
      include: { builder: true, post: true, narrative: true },
      orderBy: sort === "score" ? { score: "desc" } : { createdAt: "desc" },
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE,
    }),
    prisma.opportunity.count({ where }),
  ]);

  return NextResponse.json({ opportunities, total, page, pageSize: PAGE_SIZE });
}
