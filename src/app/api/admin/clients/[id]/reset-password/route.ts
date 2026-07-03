import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { generateResetToken } from "@/lib/password";
import { sendPasswordResetEmail } from "@/lib/mail";

const TOKEN_TTL_MS = 60 * 60 * 1000; // 1 heure

export async function POST(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  }

  const client = await prisma.user.findUnique({ where: { id: params.id } });
  if (!client || client.role !== "CLIENT") {
    return NextResponse.json({ error: "Client introuvable." }, { status: 404 });
  }

  const { raw, hash } = generateResetToken();
  await prisma.passwordResetToken.create({
    data: {
      tokenHash: hash,
      userId: client.id,
      expiresAt: new Date(Date.now() + TOKEN_TTL_MS),
    },
  });

  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const resetUrl = `${base}/reset-password?token=${raw}`;
  await sendPasswordResetEmail({ to: client.email, name: client.name, resetUrl });

  return NextResponse.json({ ok: true });
}
