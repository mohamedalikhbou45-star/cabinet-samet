import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/mobileAuth";
import { prisma } from "@/lib/prisma";
import { sendStatusChangeEmail } from "@/lib/mail";

const ALLOWED_STATUSES = ["EN_ATTENTE", "EN_TRAITEMENT", "TRAITE"];

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const status = body.status as string | undefined;

  if (!status || !ALLOWED_STATUSES.includes(status)) {
    return NextResponse.json({ error: "Statut invalide." }, { status: 400 });
  }

  const document = await prisma.document.findUnique({
    where: { id: params.id },
    include: { user: true },
  });

  if (!document || document.userId !== user.id) {
    return NextResponse.json({ error: "Document introuvable." }, { status: 404 });
  }

  if (document.status === status) {
    return NextResponse.json({ document });
  }

  const updated = await prisma.document.update({
    where: { id: document.id },
    data: { status: status as never },
  });

  // Notification par email au client à chaque changement de statut.
  await sendStatusChangeEmail({
    to: document.user.email,
    clientName: document.user.name,
    documentName: document.originalName,
    status,
  });

  return NextResponse.json({ document: updated });
}
