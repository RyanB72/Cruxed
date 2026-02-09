import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ compId: string }> }
) {
  try {
    const { compId } = await params;
    const participantId = req.nextUrl.searchParams.get("participantId");

    const comp = await prisma.comp.findUnique({
      where: { id: compId },
      select: {
        id: true,
        name: true,
        code: true,
        status: true,
        closesAt: true,
        categories: {
          orderBy: { sortOrder: "asc" },
          select: { id: true, name: true },
        },
        climbs: {
          orderBy: { sortOrder: "asc" },
          select: {
            id: true,
            name: true,
            climbNumber: true,
            sortOrder: true,
            pointConfig: true,
          },
        },
      },
    });

    if (!comp) {
      return NextResponse.json({ error: "Comp not found" }, { status: 404 });
    }

    let scores: { climbId: string; points: number; attempts: number; topped: boolean }[] = [];
    if (participantId) {
      scores = await prisma.score.findMany({
        where: { participantId, climb: { compId } },
        select: { climbId: true, points: true, attempts: true, topped: true },
      });
    }

    return NextResponse.json({ ...comp, scores });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
