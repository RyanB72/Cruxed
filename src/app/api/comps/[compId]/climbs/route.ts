import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { assertCompAdmin, AuthError } from "@/lib/admin-auth";
import { createClimbSchema } from "@/lib/validations";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ compId: string }> }
) {
  try {
    const { compId } = await params;

    const climbs = await prisma.climb.findMany({
      where: { compId },
      orderBy: { sortOrder: "asc" },
    });

    return NextResponse.json(climbs);
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ compId: string }> }
) {
  try {
    const { compId } = await params;
    await assertCompAdmin(compId);

    const body = await req.json();
    const parsed = createClimbSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const climb = await prisma.climb.create({
      data: {
        compId,
        name: parsed.data.name,
        gradeName: parsed.data.gradeName ?? null,
        climbNumber: parsed.data.climbNumber,
        sortOrder: parsed.data.sortOrder ?? 0,
        pointConfig: parsed.data.pointConfig,
      },
    });

    return NextResponse.json(climb, { status: 201 });
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
