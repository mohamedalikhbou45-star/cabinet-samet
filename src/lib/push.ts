import { prisma } from "@/lib/prisma";

/** Envoie une notification push Expo à tous les appareils enregistrés d'un client. */
export async function sendPushToUser(
  userId: string,
  title: string,
  body: string
) {
  const tokens = await prisma.pushToken.findMany({ where: { userId } });
  if (tokens.length === 0) return;

  const messages = tokens.map((t) => ({
    to: t.token,
    sound: "default",
    title,
    body,
  }));

  try {
    await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(messages),
    });
  } catch (error) {
    console.error("Échec de l'envoi de la notification push :", error);
  }
}
