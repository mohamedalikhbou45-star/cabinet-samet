import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { sendWelcomeEmail, sendAdminNewClientEmail } from "@/lib/mail";
import { getAdminNotificationEmails } from "@/lib/notify";

const registerSchema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères."),
  email: z.string().email("Adresse email invalide."),
  company: z.string().optional(),
  password: z
    .string()
    .min(6, "Le mot de passe doit contenir au moins 6 caractères."),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Données invalides." },
        { status: 400 }
      );
    }

    const { name, email, company, password } = parsed.data;
    const normalizedEmail = email.toLowerCase();

    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Un compte existe déjà avec cette adresse email." },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.create({
      data: {
        name,
        email: normalizedEmail,
        company: company || null,
        password: hashedPassword,
      },
    });

    // 1. Email de bienvenue au client.
    await sendWelcomeEmail({ to: normalizedEmail, name });

    // 7. Alerte aux administrateurs : nouveau client inscrit.
    const admins = await getAdminNotificationEmails();
    await Promise.all(
      admins.map((email) =>
        sendAdminNewClientEmail({
          to: email,
          clientName: name,
          clientEmail: normalizedEmail,
        })
      )
    );

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error("Erreur d'inscription :", error);
    return NextResponse.json(
      { error: "Une erreur est survenue. Veuillez réessayer." },
      { status: 500 }
    );
  }
}
