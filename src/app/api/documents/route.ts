import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/mobileAuth";
import { prisma } from "@/lib/prisma";
import { uploadDocumentFile } from "@/lib/storage";
import {
  sendDocumentUploadConfirmationEmail,
  sendAdminNewDocumentEmail,
} from "@/lib/mail";
import { getAdminNotificationEmails } from "@/lib/notify";

const MAX_SIZE = 15 * 1024 * 1024; // 15 Mo
const ALLOWED_TYPES = ["FACTURE", "LEASING", "RELEVE_BANCAIRE", "AUTRE"];

export async function GET(request: Request) {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const documents = await prisma.document.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ documents });
}

export async function POST(request: Request) {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const type = (formData.get("type") as string | null) ?? "AUTRE";

  if (!file) {
    return NextResponse.json(
      { error: "Aucun fichier fourni." },
      { status: 400 }
    );
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json(
      { error: "Le fichier dépasse la taille maximale de 15 Mo." },
      { status: 400 }
    );
  }

  const documentType = ALLOWED_TYPES.includes(type) ? type : "AUTRE";

  const bytes = Buffer.from(await file.arrayBuffer());

  let storagePath: string;
  let storedName: string;
  try {
    // Upload dans Supabase Storage, dans un dossier dédié au client, en
    // conservant le nom original : documents/{userId}/{nom-original}
    const uploaded = await uploadDocumentFile({
      userId: user.id,
      originalName: file.name,
      buffer: bytes,
      mimeType: file.type || "application/octet-stream",
    });
    storagePath = uploaded.path;
    storedName = uploaded.storedName;
  } catch (error) {
    console.error("Échec de l'upload vers Supabase Storage :", error);
    return NextResponse.json(
      { error: "Échec de l'envoi du fichier. Veuillez réessayer." },
      { status: 502 }
    );
  }

  const document = await prisma.document.create({
    data: {
      originalName: file.name,
      storedName,
      storagePath,
      mimeType: file.type || "application/octet-stream",
      size: file.size,
      type: documentType as never,
      userId: user.id,
    },
  });

  // 2. Confirmation de dépôt au client.
  await sendDocumentUploadConfirmationEmail({
    to: user.email,
    clientName: user.name,
    documentName: document.originalName,
  });

  // 8. Alerte aux administrateurs : document reçu.
  const admins = await getAdminNotificationEmails();
  await Promise.all(
    admins.map((email) =>
      sendAdminNewDocumentEmail({
        to: email,
        clientName: user.name,
        documentName: document.originalName,
      })
    )
  );

  return NextResponse.json({ document }, { status: 201 });
}
