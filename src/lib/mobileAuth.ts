import crypto from "crypto";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { User } from "@prisma/client";

const SECRET = process.env.NEXTAUTH_SECRET ?? "";
const TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 jours, pour l'app mobile

function sign(payload: string) {
  return crypto.createHmac("sha256", SECRET).update(payload).digest("base64url");
}

/** Jeton signé (HMAC) transporté par l'app mobile dans l'en-tête Authorization. */
export function createMobileToken(userId: string) {
  const payload = JSON.stringify({ sub: userId, exp: Date.now() + TOKEN_TTL_MS });
  const encoded = Buffer.from(payload).toString("base64url");
  return `${encoded}.${sign(encoded)}`;
}

function verifyMobileToken(token: string): string | null {
  const [encoded, signature] = token.split(".");
  if (!encoded || !signature) return null;
  if (sign(encoded) !== signature) return null;

  try {
    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString());
    if (typeof payload.exp !== "number" || payload.exp < Date.now()) return null;
    return typeof payload.sub === "string" ? payload.sub : null;
  } catch {
    return null;
  }
}

/**
 * Authentifie une requête à la fois pour le site (cookie de session NextAuth)
 * et pour l'app mobile (en-tête `Authorization: Bearer <token>`).
 */
export async function getAuthUser(request: Request): Promise<User | null> {
  const authHeader = request.headers.get("authorization");

  if (authHeader?.startsWith("Bearer ")) {
    const userId = verifyMobileToken(authHeader.slice(7));
    if (!userId) return null;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.active || user.locked) return null;
    return user;
  }

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;
  return prisma.user.findUnique({ where: { id: session.user.id } });
}
