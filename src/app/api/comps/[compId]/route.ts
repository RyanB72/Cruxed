import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { assertCompAdmin, AuthError } from "@/lib/admin-auth";
import { updateCompSchema } from "@/lib/validations";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ compId: string }> }
) {
  try {
    const { compId } = await params;
    await assertCompAdmin(compId);

    const comp = await prisma.comp.findUnique({
      where: { id: compId },
      include: {
        _count: { select: { climbs: true, participants: true } },
      },
    });

    return NextResponse.json(comp);
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
  { params }: { params: Promise<{ compId: string }> }
) {
  try {
    const { compId } = await params;
    await assertCompAdmin(compId);

    const body = await req.json();
    const parsed = updateCompSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const comp = await prisma.comp.update({
      where: { id: compId },
      data: parsed.data,
      include: {
        _count: { select: { climbs: true, participants: true } },
      },
    });

    return NextResponse.json(comp);
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
  { params }: { params: Promise<{ compId: string }> }
) {
  try {
    const { compId } = await params;
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const comp = await prisma.comp.findUnique({ where: { id: compId } });
    if (!comp) {
      return NextResponse.json({ error: "Comp not found" }, { status: 404 });
    }

    if (comp.ownerId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.comp.delete({ where: { id: compId } });

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
