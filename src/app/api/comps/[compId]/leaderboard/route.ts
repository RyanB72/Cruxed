import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ compId: string }> }
) {
  try {
    const { compId } = await params;
    const categoryId = req.nextUrl.searchParams.get("categoryId");

    const where: Record<string, unknown> = { compId };
    if (categoryId) where.categoryId = categoryId;

    const participants = await prisma.participant.findMany({
      where,
      include: {
        scores: {
          where: { topped: true },
          select: { points: true, attempts: true },
        },
      },
    });

    const leaderboard = participants
      .map((p) => {
        const totalPoints = p.scores.reduce((sum, s) => sum + s.points, 0);
        const climbsTopped = p.scores.length;
        const totalAttempts = p.scores.reduce((sum, s) => sum + s.attempts, 0);

        return {
          participantId: p.id,
          displayName: p.displayName,
          totalPoints,
          climbsTopped,
          totalAttempts,
        };
      })
      .sort((a, b) => {
        if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
        if (b.climbsTopped !== a.climbsTopped) return b.climbsTopped - a.climbsTopped;
        return a.totalAttempts - b.totalAttempts;
      })
      .map((entry, i) => ({ rank: i + 1, ...entry }));

    return NextResponse.json(leaderboard);
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
