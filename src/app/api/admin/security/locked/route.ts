import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

/**
 * Liste des comptes clients actuellement verrouillés (blocage définitif OU
 * verrou temporaire encore actif). Consommé en polling par le tableau de bord.
 */
export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  }

  const now = new Date();
  const users = await prisma.user.findMany({
    where: {
      role: "CLIENT",
      OR: [{ locked: true }, { lockedUntil: { gt: now } }],
    },
    orderBy: { lockedAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      failedAttempts: true,
      lockedAt: true,
      lockedUntil: true,
      locked: true,
    },
  });

  const accounts = users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    failedAttempts: u.failedAttempts,
    lockedAt: u.lockedAt ? u.lockedAt.toISOString() : null,
    lockedUntil: u.lockedUntil ? u.lockedUntil.toISOString() : null,
    permanent: u.locked,
  }));

  return NextResponse.json({ accounts });
}
