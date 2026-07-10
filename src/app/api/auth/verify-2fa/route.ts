import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendTwoFactorCodeEmail } from "@/lib/mail";
import {
  createTwoFactorToken,
  createRememberDeviceToken,
  verifyTwoFactorToken,
  REMEMBER_DEVICE_COOKIE,
} from "@/lib/twoFactor";

const REMEMBER_DEVICE_MAX_AGE = 30 * 24 * 60 * 60; // 30 jours, en secondes

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const code = typeof body.code === "string" ? body.code.trim() : "";
  const remember = body.remember === true;

  if (!/^\d{6}$/.test(code)) {
    return NextResponse.json({ error: "Code invalide." }, { status: 400 });
  }

  const result = await verifyTwoFactorToken(session.user.id, code);

  if (!result.ok) {
    if (result.reason === "resent") {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
      });
      if (user) {
        const newCode = await createTwoFactorToken(user.id);
        await sendTwoFactorCodeEmail({
          to: user.email,
          name: user.name,
          code: newCode,
        });
      }
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

  const response = NextResponse.json({ ok: true });

  if (remember) {
    response.cookies.set(
      REMEMBER_DEVICE_COOKIE,
      createRememberDeviceToken(session.user.id),
      {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: REMEMBER_DEVICE_MAX_AGE,
        path: "/",
      }
    );
  }

  return response;
}
