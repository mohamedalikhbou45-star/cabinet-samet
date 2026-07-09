import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/mobileAuth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const [documents, messages] = await Promise.all([
    prisma.document.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    }),
    prisma.message.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  if (messages.some((m) => !m.read)) {
    await prisma.message.updateMany({
      where: { userId: user.id, read: false },
      data: { read: true },
    });
  }

  const stats = {
    total: documents.length,
    enAttente: documents.filter((d) => d.status === "EN_ATTENTE").length,
    enTraitement: documents.filter((d) => d.status === "EN_TRAITEMENT").length,
    traite: documents.filter((d) => d.status === "TRAITE").length,
  };

  return NextResponse.json({
    stats,
    recentDocuments: documents.slice(0, 6),
    recentMessages: messages.slice(0, 4),
  });
}
