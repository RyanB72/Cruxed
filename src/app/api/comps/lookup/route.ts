import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");

    if (!code) {
      return NextResponse.json(
        { error: "Code query parameter is required" },
        { status: 400 }
      );
    }

    const comp = await prisma.comp.findUnique({
      where: { code: code.toUpperCase() },
      select: { id: true, name: true, status: true },
    });

    if (!comp || comp.status !== "ACTIVE") {
      return NextResponse.json({ error: "Comp not found" }, { status: 404 });
    }

    return NextResponse.json(comp);
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
