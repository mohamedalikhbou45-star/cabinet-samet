import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { hashToken, validatePassword } from "@/lib/password";
import { sendPasswordChangedEmail } from "@/lib/mail";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const token = typeof body.token === "string" ? body.token : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!token) {
    return NextResponse.json({ error: "Lien invalide." }, { status: 400 });
  }

  const policyError = validatePassword(password);
  if (policyError) {
    return NextResponse.json({ error: policyError }, { status: 400 });
  }

  const record = await prisma.passwordResetToken.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: true },
  });

  if (!record || record.usedAt || record.expiresAt < new Date()) {
    return NextResponse.json(
      { error: "Ce lien de réinitialisation est invalide ou expiré." },
      { status: 400 }
    );
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: record.userId },
      data: {
        password: hashedPassword,
        // La réinitialisation débloque le compte.
        failedAttempts: 0,
        lockedUntil: null,
        lockedAt: null,
        locked: false,
      },
    }),
    prisma.passwordResetToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    }),
    // Invalide les autres tokens actifs de cet utilisateur.
    prisma.passwordResetToken.updateMany({
      where: { userId: record.userId, usedAt: null },
      data: { usedAt: new Date() },
    }),
  ]);

  await sendPasswordChangedEmail({
    to: record.user.email,
    name: record.user.name,
  });

  return NextResponse.json({ ok: true });
}
