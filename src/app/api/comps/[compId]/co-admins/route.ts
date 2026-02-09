import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { assertCompAdmin, AuthError } from "@/lib/admin-auth";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ compId: string }> }
) {
  try {
    const { compId } = await params;
    await assertCompAdmin(compId);

    const coAdmins = await prisma.coAdmin.findMany({
      where: { compId },
      include: {
        user: { select: { id: true, email: true, name: true } },
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(coAdmins);
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

export async function POST(
  req: Request,
  { params }: { params: Promise<{ compId: string }> }
) {
  try {
    const { compId } = await params;
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Owner only
    const comp = await prisma.comp.findUnique({ where: { id: compId } });
    if (!comp) {
      return NextResponse.json({ error: "Comp not found" }, { status: 404 });
    }
    if (comp.ownerId !== session.user.id) {
      return NextResponse.json({ error: "Only the owner can add co-admins" }, { status: 403 });
    }

    const body = await req.json();
    const { email } = body;

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.id === comp.ownerId) {
      return NextResponse.json(
        { error: "Owner is already an admin" },
        { status: 400 }
      );
    }

    // Check if already a co-admin
    const existing = await prisma.coAdmin.findUnique({
      where: { userId_compId: { userId: user.id, compId } },
    });
    if (existing) {
      return NextResponse.json(
        { error: "User is already a co-admin" },
        { status: 400 }
      );
    }

    const coAdmin = await prisma.coAdmin.create({
      data: { userId: user.id, compId },
      include: {
        user: { select: { id: true, email: true, name: true } },
      },
    });

    return NextResponse.json(coAdmin, { status: 201 });
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
  req: Request,
  { params }: { params: Promise<{ compId: string }> }
) {
  try {
    const { compId } = await params;
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Owner only
    const comp = await prisma.comp.findUnique({ where: { id: compId } });
    if (!comp) {
      return NextResponse.json({ error: "Comp not found" }, { status: 404 });
    }
    if (comp.ownerId !== session.user.id) {
      return NextResponse.json({ error: "Only the owner can remove co-admins" }, { status: 403 });
    }

    const body = await req.json();
    const { userId } = body;

    if (!userId || typeof userId !== "string") {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    const coAdmin = await prisma.coAdmin.findUnique({
      where: { userId_compId: { userId, compId } },
    });
    if (!coAdmin) {
      return NextResponse.json({ error: "Co-admin not found" }, { status: 404 });
    }

    await prisma.coAdmin.delete({
      where: { id: coAdmin.id },
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
