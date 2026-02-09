import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { assertCompAdmin, AuthError } from "@/lib/admin-auth";
import { updateClimbSchema } from "@/lib/validations";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ compId: string; climbId: string }> }
) {
  try {
    const { compId, climbId } = await params;
    await assertCompAdmin(compId);

    const body = await req.json();
    const parsed = updateClimbSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const climb = await prisma.climb.findFirst({
      where: { id: climbId, compId },
    });

    if (!climb) {
      return NextResponse.json({ error: "Climb not found" }, { status: 404 });
    }

    const updated = await prisma.climb.update({
      where: { id: climbId },
      data: parsed.data,
    });

    return NextResponse.json(updated);
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

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ compId: string; climbId: string }> }
) {
  try {
    const { compId, climbId } = await params;
    await assertCompAdmin(compId);

    const climb = await prisma.climb.findFirst({
      where: { id: climbId, compId },
    });

    if (!climb) {
      return NextResponse.json({ error: "Climb not found" }, { status: 404 });
    }

    await prisma.climb.delete({ where: { id: climbId } });

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
