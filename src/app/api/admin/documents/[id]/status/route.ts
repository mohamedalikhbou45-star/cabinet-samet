import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { sendStatusChangeEmail } from "@/lib/mail";
import { sendPushToUser } from "@/lib/push";
import { STATUS_LABELS } from "@/lib/labels";

const ALLOWED_STATUSES = ["EN_ATTENTE", "EN_TRAITEMENT", "TRAITE"];

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
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

  if (!document) {
    return NextResponse.json({ error: "Document introuvable." }, { status: 404 });
  }

  if (document.status === status) {
    return NextResponse.json({ document });
  }

  const updated = await prisma.document.update({
    where: { id: document.id },
    data: { status: status as never },
  });

  // Notification email au client à chaque changement de statut.
  await sendStatusChangeEmail({
    to: document.user.email,
    clientName: document.user.name,
    documentName: document.originalName,
    status,
  });

  // Notification push (app mobile) à chaque changement de statut.
  await sendPushToUser(
    document.userId,
    "Statut mis à jour",
    `${document.originalName} : ${STATUS_LABELS[status]}`
  );

  return NextResponse.json({ document: updated });
}
