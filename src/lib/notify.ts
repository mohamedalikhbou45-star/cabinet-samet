import { prisma } from "@/lib/prisma";

/** Destinataires des alertes admin : ADMIN_NOTIFICATION_EMAIL, sinon les comptes ADMIN. */
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
