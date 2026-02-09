import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { assertCompAdmin, AuthError } from "@/lib/admin-auth";

type RouteParams = { params: Promise<{ compId: string; participantId: string }> };

export async function DELETE(
  _req: Request,
  { params }: RouteParams
) {
  try {
    const { compId, participantId } = await params;
    await assertCompAdmin(compId);

    const participant = await prisma.participant.findFirst({
      where: { id: participantId, compId },
    });

    if (!participant) {
      return NextResponse.json(
        { error: "Participant not found" },
        { status: 404 }
      );
    }

    await prisma.participant.delete({
      where: { id: participantId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: Request,
  { params }: RouteParams
) {
  try {
    const { compId, participantId } = await params;
    await assertCompAdmin(compId);

    const body = await req.json();
    const { displayName, categoryId } = body;

    const existing = await prisma.participant.findFirst({
      where: { id: participantId, compId },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Participant not found" },
        { status: 404 }
      );
    }

    const data: Record<string, unknown> = {};

    if (displayName && typeof displayName === "string" && displayName.trim().length > 0) {
      data.displayName = displayName.trim();
    }

    if (categoryId) {
      const category = await prisma.category.findFirst({
        where: { id: categoryId, compId },
      });
      if (!category) {
        return NextResponse.json({ error: "Invalid category" }, { status: 400 });
      }
      data.categoryId = categoryId;
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
    }

    const participant = await prisma.participant.update({
      where: { id: participantId },
      data,
      include: { category: { select: { id: true, name: true } } },
    });

    return NextResponse.json(participant);
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
