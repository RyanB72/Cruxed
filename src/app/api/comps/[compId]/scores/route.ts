import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logScoreSchema } from "@/lib/validations";
import { calculatePoints, type PointConfig } from "@/lib/scoring";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ compId: string }> }
) {
  try {
    const { compId } = await params;
    const participantId = req.nextUrl.searchParams.get("participantId");

    const where: Record<string, unknown> = { climb: { compId } };
    if (participantId) where.participantId = participantId;

    const scores = await prisma.score.findMany({
      where,
      include: {
        climb: { select: { name: true, climbNumber: true } },
        participant: { select: { displayName: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(scores);
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ compId: string }> }
) {
  try {
    const { compId } = await params;
    const body = await req.json();
    const parsed = logScoreSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { participantId, climbId, attempts, topped } = parsed.data;

    // Check if comp logging is closed
    const comp = await prisma.comp.findUnique({
      where: { id: compId },
      select: { closesAt: true },
    });
    if (comp?.closesAt && new Date() > new Date(comp.closesAt)) {
      return NextResponse.json(
        { error: "Logging has closed for this competition" },
        { status: 403 }
      );
    }

    // Verify climb belongs to comp
    const climb = await prisma.climb.findFirst({
      where: { id: climbId, compId },
    });
    if (!climb) {
      return NextResponse.json({ error: "Climb not found" }, { status: 404 });
    }

    // Verify participant belongs to comp
    const participant = await prisma.participant.findFirst({
      where: { id: participantId, compId },
    });
    if (!participant) {
      return NextResponse.json({ error: "Participant not found" }, { status: 404 });
    }

    // Verify device ownership
    const deviceId = req.headers.get("x-device-id");
    if (deviceId && participant.deviceId !== deviceId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const points = topped
      ? calculatePoints(climb.pointConfig as PointConfig, attempts)
      : 0;

    const score = await prisma.score.upsert({
      where: {
        participantId_climbId: { participantId, climbId },
      },
      update: { attempts, topped, points },
      create: { participantId, climbId, attempts, topped, points },
    });

    return NextResponse.json(score);
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
