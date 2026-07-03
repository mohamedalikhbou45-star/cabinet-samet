import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { sendAdminMessageNotificationEmail } from "@/lib/mail";

export async function POST(request: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const userId = typeof body.userId === "string" ? body.userId : "";
  const message = typeof body.body === "string" ? body.body.trim() : "";

  if (!userId || !message) {
    return NextResponse.json(
      { error: "Destinataire et message requis." },
      { status: 400 }
    );
  }

  const client = await prisma.user.findUnique({ where: { id: userId } });
  if (!client || client.role !== "CLIENT") {
    return NextResponse.json({ error: "Client introuvable." }, { status: 404 });
  }

  const created = await prisma.message.create({
    data: { userId, body: message },
  });

  // 6. Notification par email au client.
  await sendAdminMessageNotificationEmail({
    to: client.email,
    clientName: client.name,
    messageBody: message,
  });

  return NextResponse.json({ message: created }, { status: 201 });
}
