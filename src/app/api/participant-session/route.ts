import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const sessionSchema = z.object({
  deviceId: z.string().uuid(),
  compCode: z.string().min(1),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = sessionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { deviceId, compCode } = parsed.data;

    const comp = await prisma.comp.findUnique({
      where: { code: compCode.toUpperCase() },
      select: { id: true, name: true, status: true },
    });

    if (!comp) {
      return NextResponse.json({ error: "Competition not found" }, { status: 404 });
    }

    if (comp.status !== "ACTIVE") {
      return NextResponse.json({ error: "Competition is not active" }, { status: 400 });
    }

    const participant = await prisma.participant.findUnique({
      where: { compId_deviceId: { compId: comp.id, deviceId } },
      select: { id: true, displayName: true },
    });

    return NextResponse.json({
      comp,
      participant: participant || null,
    });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
