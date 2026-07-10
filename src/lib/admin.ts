import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

/**
 * Renvoie la session si l'utilisateur est administrateur, sinon `null`.
 * Utilisé par les routes API d'administration.
 */
export async function getAdminSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") {
    return null;
  }
  // Une session avec 2FA en attente ne doit donner accès à aucune route admin.
  if (!session.user.twoFactorVerified) {
    return null;
  }
  return session;
}
