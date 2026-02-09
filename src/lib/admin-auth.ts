import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function assertCompAdmin(compId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new AuthError("Unauthorized", 401);
  }
  const userId = session.user.id;

  const comp = await prisma.comp.findUnique({
    where: { id: compId },
    include: { coAdmins: { select: { userId: true } } },
  });

  if (!comp) {
    throw new AuthError("Comp not found", 404);
  }

  const isOwner = comp.ownerId === userId;
  const isCoAdmin = comp.coAdmins.some((ca) => ca.userId === userId);

  if (!isOwner && !isCoAdmin) {
    throw new AuthError("Forbidden", 403);
  }

  return { session, comp };
}

export class AuthError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}
