import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendTwoFactorCodeEmail } from "@/lib/mail";
import { canResendToken, createTwoFactorToken } from "@/lib/twoFactor";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const allowed = await canResendToken(session.user.id);
  if (!allowed) {
    return NextResponse.json(
      { error: "Merci de patienter avant de demander un nouveau code." },
      { status: 429 }
    );
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) {
    return NextResponse.json({ error: "Utilisateur introuvable." }, { status: 404 });
  }

  const code = await createTwoFactorToken(user.id);
  await sendTwoFactorCodeEmail({ to: user.email, name: user.name, code });

  return NextResponse.json({ ok: true });
}
