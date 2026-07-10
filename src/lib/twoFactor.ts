import crypto from "crypto";
import { prisma } from "@/lib/prisma";

const CODE_TTL_MS = 10 * 60 * 1000; // 10 minutes
const RESEND_THROTTLE_MS = 60 * 1000; // 60 secondes
const MAX_ATTEMPTS = 3;
const REMEMBER_DEVICE_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 jours
export const REMEMBER_DEVICE_COOKIE = "cs_remember_device";

const SECRET = process.env.NEXTAUTH_SECRET ?? "";

function sign(payload: string) {
  return crypto.createHmac("sha256", SECRET).update(payload).digest("base64url");
}

/** Génère un code à 6 chiffres aléatoire (000000–999999). */
function generateCode() {
  return crypto.randomInt(0, 1_000_000).toString().padStart(6, "0");
}

/** Crée (et remplace) le code 2FA d'un utilisateur, et renvoie le code en clair à envoyer par email. */
export async function createTwoFactorToken(userId: string) {
  await prisma.twoFactorToken.deleteMany({ where: { userId } });
  const token = generateCode();
  await prisma.twoFactorToken.create({
    data: { userId, token, expiresAt: new Date(Date.now() + CODE_TTL_MS) },
  });
  return token;
}

export type VerifyResult =
  | { ok: true }
  | { ok: false; reason: "not_found" | "expired" | "incorrect" | "resent" };

/**
 * Vérifie le code fourni. En cas d'erreur, incrémente le compteur de
 * tentatives ; après 3 échecs, supprime le code et en génère un nouveau
 * (renvoyé au besoin par l'appelant).
 */
export async function verifyTwoFactorToken(
  userId: string,
  code: string
): Promise<VerifyResult> {
  const record = await prisma.twoFactorToken.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  if (!record) return { ok: false, reason: "not_found" };

  if (record.expiresAt < new Date()) {
    await prisma.twoFactorToken.delete({ where: { id: record.id } });
    return { ok: false, reason: "expired" };
  }

  if (record.token !== code) {
    const attempts = record.attempts + 1;
    if (attempts >= MAX_ATTEMPTS) {
      // Trop d'échecs : on supprime le code périmé, un nouveau sera généré par l'appelant.
      await prisma.twoFactorToken.delete({ where: { id: record.id } });
      return { ok: false, reason: "resent" };
    }
    await prisma.twoFactorToken.update({
      where: { id: record.id },
      data: { attempts },
    });
    return { ok: false, reason: "incorrect" };
  }

  await prisma.twoFactorToken.delete({ where: { id: record.id } });
  return { ok: true };
}

/** Empêche le renvoi d'un code plus d'une fois toutes les 60 secondes. */
export async function canResendToken(userId: string) {
  const record = await prisma.twoFactorToken.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
  if (!record) return true;
  return Date.now() - record.createdAt.getTime() > RESEND_THROTTLE_MS;
}

/** Jeton signé "se souvenir de cet appareil", stocké dans un cookie sécurisé 30 jours. */
export function createRememberDeviceToken(userId: string) {
  const payload = JSON.stringify({
    sub: userId,
    exp: Date.now() + REMEMBER_DEVICE_TTL_MS,
  });
  const encoded = Buffer.from(payload).toString("base64url");
  return `${encoded}.${sign(encoded)}`;
}

export function verifyRememberDeviceToken(
  token: string | undefined,
  userId: string
): boolean {
  if (!token) return false;
  const [encoded, signature] = token.split(".");
  if (!encoded || !signature) return false;
  if (sign(encoded) !== signature) return false;

  try {
    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString());
    if (typeof payload.exp !== "number" || payload.exp < Date.now()) return false;
    return payload.sub === userId;
  } catch {
    return false;
  }
}
