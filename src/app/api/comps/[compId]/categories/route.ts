import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { assertCompAdmin, AuthError } from "@/lib/admin-auth";
import { createCategorySchema } from "@/lib/validations";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ compId: string }> }
) {
  try {
    const { compId } = await params;

    const categories = await prisma.category.findMany({
      where: { compId },
      include: { _count: { select: { participants: true } } },
      orderBy: { sortOrder: "asc" },
    });

    return NextResponse.json(categories);
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
    await assertCompAdmin(compId);

    const body = await req.json();
    const parsed = createCategorySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    // Check for duplicate name
    const existing = await prisma.category.findUnique({
      where: { compId_name: { compId, name: parsed.data.name } },
    });
    if (existing) {
      return NextResponse.json(
        { error: "Category already exists" },
        { status: 409 }
      );
    }

    // Auto sortOrder
    const maxSort = await prisma.category.findFirst({
      where: { compId },
      orderBy: { sortOrder: "desc" },
      select: { sortOrder: true },
    });

    const category = await prisma.category.create({
      data: {
        compId,
        name: parsed.data.name,
        sortOrder: (maxSort?.sortOrder ?? -1) + 1,
      },
      include: { _count: { select: { participants: true } } },
    });

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ compId: string }> }
) {
  try {
    const { compId } = await params;
    await assertCompAdmin(compId);

    const body = await req.json();
    const { categoryId } = body;

    if (!categoryId) {
      return NextResponse.json({ error: "categoryId is required" }, { status: 400 });
    }

    const category = await prisma.category.findFirst({
      where: { id: categoryId, compId },
      include: { _count: { select: { participants: true } } },
    });

    if (!category) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    if (category._count.participants > 0) {
      return NextResponse.json(
        { error: `Cannot delete: ${category._count.participants} participant(s) assigned` },
        { status: 409 }
      );
    }

    await prisma.category.delete({ where: { id: categoryId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
