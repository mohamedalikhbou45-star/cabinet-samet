import { prisma } from "@/lib/prisma";

/**
 * Adresses à notifier pour les alertes admin. Priorité à
 * `ADMIN_NOTIFICATION_EMAIL` (boîte de test/réception dédiée, ex. en sandbox
 * Resend où seul le compte propriétaire peut recevoir des emails) ; sinon,
 * les comptes ADMIN en base.
 */
export async function getAdminNotificationEmails(): Promise<string[]> {
  const envValue = process.env.ADMIN_NOTIFICATION_EMAIL;
  if (envValue) {
    return envValue
      .split(",")
      .map((e) => e.trim())
      .filter(Boolean);
  }

  const admins = await prisma.user.findMany({
    where: { role: "ADMIN" },
    select: { email: true },
  });
  return admins.map((a) => a.email);
}
