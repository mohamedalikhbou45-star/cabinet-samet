import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendTwoFactorCodeEmail } from "@/lib/mail";
import { canResendToken, createTwoFactorToken } from "@/lib/twoFactor";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const userId = typeof body.userId === "string" ? body.userId : "";

  if (!userId) {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    return NextResponse.json({ error: "Utilisateur introuvable." }, { status: 404 });
  }

  const allowed = await canResendToken(userId);
  if (!allowed) {
    return NextResponse.json(
      { error: "Merci de patienter avant de demander un nouveau code." },
      { status: 429 }
    );
  }

  const code = await createTwoFactorToken(userId);
  await sendTwoFactorCodeEmail({ to: user.email, name: user.name, code });

  return NextResponse.json({ ok: true });
}
