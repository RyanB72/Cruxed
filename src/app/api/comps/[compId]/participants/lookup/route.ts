import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ compId: string }> }
) {
  try {
    const { compId } = await params;
    const name = req.nextUrl.searchParams.get("name")?.trim();

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const participant = await prisma.participant.findFirst({
      where: {
        compId,
        displayName: { equals: name, mode: "insensitive" },
      },
      include: { category: { select: { id: true, name: true } } },
    });

    if (!participant) {
      return NextResponse.json(
        { error: "User does not exist in the competition" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: participant.id,
      displayName: participant.displayName,
      categoryId: participant.category.id,
      categoryName: participant.category.name,
    });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
