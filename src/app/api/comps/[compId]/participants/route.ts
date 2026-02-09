import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { registerParticipantSchema } from "@/lib/validations";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ compId: string }> }
) {
  try {
    const { compId } = await params;
    const participants = await prisma.participant.findMany({
      where: { compId },
      include: {
        category: { select: { id: true, name: true } },
        _count: { select: { scores: true } },
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(participants);
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
    const parsed = registerParticipantSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { displayName, deviceId, categoryId } = parsed.data;

    const comp = await prisma.comp.findUnique({ where: { id: compId } });
    if (!comp) {
      return NextResponse.json({ error: "Competition not found" }, { status: 404 });
    }
    if (comp.status !== "ACTIVE") {
      return NextResponse.json({ error: "Competition is not active" }, { status: 400 });
    }

    // Validate category belongs to comp
    const category = await prisma.category.findFirst({
      where: { id: categoryId, compId },
    });
    if (!category) {
      return NextResponse.json({ error: "Invalid category" }, { status: 400 });
    }

    const participant = await prisma.participant.upsert({
      where: { compId_deviceId: { compId, deviceId } },
      update: { displayName },
      create: { compId, displayName, deviceId, categoryId },
      include: { category: { select: { id: true, name: true } } },
    });

    return NextResponse.json(participant, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
