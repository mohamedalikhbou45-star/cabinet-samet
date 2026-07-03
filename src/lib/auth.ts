import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { computeLock } from "@/lib/lockout";
import {
  sendAccountLockedEmail,
  sendAdminLockAlertEmail,
  sendAdminSuspiciousLoginEmail,
} from "@/lib/mail";
import { getAdminNotificationEmails } from "@/lib/notify";
import type { User as PrismaUser } from "@prisma/client";

function extractIp(req?: { headers?: Record<string, string | undefined> }) {
  const xff = req?.headers?.["x-forwarded-for"];
  if (typeof xff === "string" && xff.length) return xff.split(",")[0].trim();
  const real = req?.headers?.["x-real-ip"];
  if (typeof real === "string" && real.length) return real;
  return "127.0.0.1";
}

async function logAttempt(
  email: string,
  ip: string,
  success: boolean,
  userId?: string
) {
  try {
    await prisma.loginAttempt.create({
      data: { email, ip, success, userId: userId ?? null },
    });
  } catch {
    // Le journal ne doit jamais bloquer l'authentification.
  }
}

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "Identifiants",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Mot de passe", type: "password" },
      },
      async authorize(credentials, req) {
        const ip = extractIp(req as never);
        const email = credentials?.email?.toLowerCase();

        if (!email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({ where: { email } });

        // Utilisateur inconnu : on journalise sans révéler l'existence du compte.
        if (!user) {
          await logAttempt(email, ip, false);
          return null;
        }

        // Compte bloqué définitivement (déblocage admin requis).
        if (user.locked) {
          await logAttempt(email, ip, false, user.id);
          throw new Error(
            "Votre compte est bloqué. Contactez le cabinet pour le débloquer."
          );
        }

        // Verrouillage temporaire encore actif.
        if (user.lockedUntil && user.lockedUntil > new Date()) {
          await logAttempt(email, ip, false, user.id);
          const mins = Math.max(
            1,
            Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60_000)
          );
          throw new Error(
            `Trop de tentatives. Réessayez dans ${mins} minute(s).`
          );
        }

        // Compte désactivé par l'administrateur.
        if (!user.active) {
          await logAttempt(email, ip, false, user.id);
          throw new Error("Ce compte a été désactivé. Contactez le cabinet.");
        }

        const valid = await bcrypt.compare(credentials.password, user.password);

        if (!valid) {
          await handleFailedAttempt(user, ip);
          return null;
        }

        // Succès : réinitialisation des compteurs de sécurité.
        await prisma.user.update({
          where: { id: user.id },
          data: { failedAttempts: 0, lockedUntil: null, lockedAt: null },
        });
        await logAttempt(email, ip, true, user.id);

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
      }
      return session;
    },
  },
};

/** Incrémente le compteur d'échecs, applique le verrouillage et notifie si blocage. */
async function handleFailedAttempt(user: PrismaUser, ip: string) {
  const failedAttempts = user.failedAttempts + 1;
  const lock = computeLock(failedAttempts);
  const applyingLock = lock.permanent || lock.lockedUntil !== null;

  await prisma.user.update({
    where: { id: user.id },
    data: {
      failedAttempts,
      lockedUntil: lock.lockedUntil,
      locked: lock.permanent ? true : user.locked,
      // Enregistre l'heure du verrouillage (temporaire ou définitif).
      lockedAt: applyingLock ? new Date() : user.lockedAt,
    },
  });
  await logAttempt(user.email, ip, false, user.id);

  // Alerte email dès 3 tentatives échouées sur un compte administrateur.
  if (user.role === "ADMIN" && failedAttempts === 3) {
    const admins = await getAdminNotificationEmails();
    await Promise.all(
      admins.map((email) =>
        sendAdminSuspiciousLoginEmail({
          to: email,
          adminName: user.name,
          attempts: failedAttempts,
          ip,
        })
      )
    );
  }

  if (lock.permanent) {
    await sendAccountLockedEmail({ to: user.email, name: user.name });
    const admins = await getAdminNotificationEmails();
    await Promise.all(
      admins.map((email) =>
        sendAdminLockAlertEmail({
          to: email,
          clientName: user.name,
          clientEmail: user.email,
        })
      )
    );
    throw new Error(
      "Compte bloqué après 5 tentatives échouées. Contactez le cabinet."
    );
  }

  if (lock.lockedUntil) {
    throw new Error(
      `Identifiants incorrects. Compte verrouillé ${lock.minutes} minute(s).`
    );
  }
}
