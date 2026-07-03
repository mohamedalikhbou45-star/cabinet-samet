import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const hasActive = typeof body.active === "boolean";
  const unlock = body.unlock === true;

  if (!hasActive && !unlock) {
    return NextResponse.json(
      { error: "Aucune action valide fournie ('active' ou 'unlock')." },
      { status: 400 }
    );
  }

  const client = await prisma.user.findUnique({ where: { id: params.id } });
  if (!client || client.role !== "CLIENT") {
    return NextResponse.json({ error: "Client introuvable." }, { status: 404 });
  }

  const data: {
    active?: boolean;
    locked?: boolean;
    lockedUntil?: null;
    lockedAt?: null;
    failedAttempts?: number;
  } = {};

  if (hasActive) data.active = body.active;
  if (unlock) {
    // Déblocage : lève le blocage définitif et le verrou temporaire, remet le compteur à zéro.
    data.locked = false;
    data.lockedUntil = null;
    data.lockedAt = null;
    data.failedAttempts = 0;
  }

  const updated = await prisma.user.update({
    where: { id: params.id },
    data,
    select: {
      id: true,
      active: true,
      locked: true,
      failedAttempts: true,
    },
  });

  return NextResponse.json({ client: updated });
}
