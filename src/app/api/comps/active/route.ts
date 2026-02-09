import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const comps = await prisma.comp.findMany({
      where: { status: "ACTIVE" },
      select: { id: true, name: true, code: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(comps);
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
