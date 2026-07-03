import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Renvoie l'état de verrouillage d'un compte pour alimenter le compte à rebours
 * de la page de connexion. `state` :
 *   - "none"    : pas de verrou (identifiants simplement incorrects)
 *   - "temp"    : verrou temporaire, avec `lockedUntil` (ISO)
 *   - "blocked" : compte bloqué définitivement (déblocage admin requis)
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = (searchParams.get("email") ?? "").toLowerCase().trim();

  const none = NextResponse.json({ state: "none" });
  if (!email) return none;

  const user = await prisma.user.findUnique({
    where: { email },
    select: { locked: true, lockedUntil: true },
  });
  if (!user) return none;

  if (user.locked) {
    return NextResponse.json({ state: "blocked" });
  }
  if (user.lockedUntil && user.lockedUntil > new Date()) {
    return NextResponse.json({
      state: "temp",
      lockedUntil: user.lockedUntil.toISOString(),
    });
  }
  return none;
}
