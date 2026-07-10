import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createMobileToken } from "@/lib/mobileAuth";
import { sendTwoFactorCodeEmail } from "@/lib/mail";
import {
  createRememberDeviceToken,
  createTwoFactorToken,
  verifyTwoFactorToken,
} from "@/lib/twoFactor";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const userId = typeof body.userId === "string" ? body.userId : "";
  const code = typeof body.code === "string" ? body.code.trim() : "";
  const remember = body.remember === true;

  if (!userId || !/^\d{6}$/.test(code)) {
    return NextResponse.json({ error: "Code invalide." }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    return NextResponse.json({ error: "Utilisateur introuvable." }, { status: 404 });
  }

  const result = await verifyTwoFactorToken(userId, code);

  if (!result.ok) {
    if (result.reason === "resent") {
      const newCode = await createTwoFactorToken(userId);
      await sendTwoFactorCodeEmail({ to: user.email, name: user.name, code: newCode });
      return NextResponse.json(
        {
          error:
            "Trop de tentatives incorrectes. Un nouveau code vient de vous être envoyé.",
          resent: true,
        },
        { status: 400 }
      );
    }

    const messages: Record<string, string> = {
      not_found: "Aucun code en attente. Demandez-en un nouveau.",
      expired: "Ce code a expiré. Demandez-en un nouveau.",
      incorrect: "Code incorrect. Veuillez réessayer.",
    };
    return NextResponse.json(
      { error: messages[result.reason] ?? "Code incorrect." },
      { status: 400 }
    );
  }

  const token = createMobileToken(user.id);

  return NextResponse.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      company: user.company,
      role: user.role,
    },
    deviceToken: remember ? createRememberDeviceToken(user.id) : undefined,
  });
}
