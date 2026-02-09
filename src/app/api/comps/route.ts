import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createCompSchema } from "@/lib/validations";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;

    const comps = await prisma.comp.findMany({
      where: {
        OR: [
          { ownerId: userId },
          { coAdmins: { some: { userId } } },
        ],
      },
      include: {
        _count: { select: { climbs: true, participants: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(comps);
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

const CODE_CHARS = "ABCDEFGHIJKLMNPQRSTUVWXYZ123456789";

async function generateUniqueCode(): Promise<string> {
  for (let i = 0; i < 10; i++) {
    let code = "";
    for (let j = 0; j < 3; j++) {
      code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
    }
    const existing = await prisma.comp.findUnique({ where: { code } });
    if (!existing) return code;
  }
  throw new Error("Failed to generate unique code");
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;

    const body = await req.json();
    const parsed = createCompSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const code = await generateUniqueCode();

    const defaultPointConfig = parsed.data.defaultPointConfig ?? {
      flash: 1000,
      attempts: { "2": 800, "3": 600, "4": 500 },
      maxAttempts: 10,
      minPoints: 100,
    };

    const categoryNames = parsed.data.categories ?? ["Open A Male", "Open A Female"];

    const comp = await prisma.$transaction(async (tx) => {
      const c = await tx.comp.create({
        data: {
          name: parsed.data.name,
          code,
          ownerId: userId,
          defaultPointConfig,
          closesAt: parsed.data.closesAt ?? null,
        },
      });

      await tx.category.createMany({
        data: categoryNames.map((name, i) => ({
          compId: c.id,
          name,
          sortOrder: i,
        })),
      });

      // Add co-admins if provided
      if (parsed.data.coAdminEmails?.length) {
        for (const email of parsed.data.coAdminEmails) {
          const user = await tx.user.findUnique({ where: { email } });
          if (user && user.id !== userId) {
            await tx.coAdmin.create({
              data: { compId: c.id, userId: user.id },
            }).catch(() => {}); // ignore duplicates
          }
        }
      }

      return tx.comp.findUniqueOrThrow({
        where: { id: c.id },
        include: {
          _count: { select: { climbs: true, participants: true } },
        },
      });
    });

    return NextResponse.json(comp, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
