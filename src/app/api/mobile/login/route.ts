import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createMobileToken } from "@/lib/mobileAuth";
import { sendTwoFactorCodeEmail } from "@/lib/mail";
import { createTwoFactorToken, verifyRememberDeviceToken } from "@/lib/twoFactor";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const email = typeof body.email === "string" ? body.email.toLowerCase().trim() : "";
  const password = typeof body.password === "string" ? body.password : "";
  const deviceToken = typeof body.deviceToken === "string" ? body.deviceToken : undefined;

  if (!email || !password) {
    return NextResponse.json(
      { error: "Email et mot de passe requis." },
      { status: 400 }
    );
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return NextResponse.json({ error: "Identifiants incorrects." }, { status: 401 });
  }

  if (user.locked) {
    return NextResponse.json(
      { error: "Votre compte est bloqué. Contactez le cabinet pour le débloquer." },
      { status: 403 }
    );
  }

  if (user.lockedUntil && user.lockedUntil > new Date()) {
    return NextResponse.json(
      { error: "Trop de tentatives. Réessayez plus tard." },
      { status: 403 }
    );
  }

  if (!user.active) {
    return NextResponse.json(
      { error: "Ce compte a été désactivé. Contactez le cabinet." },
      { status: 403 }
    );
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    return NextResponse.json({ error: "Identifiants incorrects." }, { status: 401 });
  }

  const deviceRemembered = verifyRememberDeviceToken(deviceToken, user.id);

  if (!deviceRemembered) {
    const code = await createTwoFactorToken(user.id);
    await sendTwoFactorCodeEmail({ to: user.email, name: user.name, code });
    return NextResponse.json({ requires2FA: true, userId: user.id });
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
  });
}
