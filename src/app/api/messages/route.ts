import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/mobileAuth";
import { prisma } from "@/lib/prisma";
import { sendAdminClientReplyEmail } from "@/lib/mail";
import { getAdminNotificationEmails } from "@/lib/notify";

export async function GET(request: Request) {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const messages = await prisma.message.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  if (messages.some((m) => !m.read)) {
    await prisma.message.updateMany({
      where: { userId: user.id, read: false },
      data: { read: true },
    });
  }

  return NextResponse.json({ messages });
}

export async function POST(request: Request) {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const text = typeof body.body === "string" ? body.body.trim() : "";

  if (!text) {
    return NextResponse.json({ error: "Message vide." }, { status: 400 });
  }

  const created = await prisma.message.create({
    data: { userId: user.id, body: text, sender: "CLIENT", read: true },
  });

  const admins = await getAdminNotificationEmails();
  await Promise.all(
    admins.map((email) =>
      sendAdminClientReplyEmail({
        to: email,
        clientName: user.name,
        messageBody: text,
      })
    )
  );

  return NextResponse.json({ message: created }, { status: 201 });
}
