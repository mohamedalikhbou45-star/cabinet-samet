import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { randomUUID } from "crypto";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  sendDocumentUploadConfirmationEmail,
  sendAdminNewDocumentEmail,
} from "@/lib/mail";
import { getAdminNotificationEmails } from "@/lib/notify";

const UPLOAD_DIR = path.join(process.cwd(), "uploads");
const MAX_SIZE = 15 * 1024 * 1024; // 15 Mo
const ALLOWED_TYPES = ["FACTURE", "LEASING", "RELEVE_BANCAIRE", "AUTRE"];

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const documents = await prisma.document.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ documents });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
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
  const extension = path.extname(file.name);
  const storedName = `${randomUUID()}${extension}`;

  await mkdir(UPLOAD_DIR, { recursive: true });
  await writeFile(path.join(UPLOAD_DIR, storedName), bytes);

  const document = await prisma.document.create({
    data: {
      originalName: file.name,
      storedName,
      mimeType: file.type || "application/octet-stream",
      size: file.size,
      type: documentType as never,
      userId: session.user.id,
    },
  });

  const uploader = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, email: true },
  });

  if (uploader) {
    // 2. Confirmation de dépôt au client.
    await sendDocumentUploadConfirmationEmail({
      to: uploader.email,
      clientName: uploader.name,
      documentName: document.originalName,
    });

    // 8. Alerte aux administrateurs : document reçu.
    const admins = await getAdminNotificationEmails();
    await Promise.all(
      admins.map((email) =>
        sendAdminNewDocumentEmail({
          to: email,
          clientName: uploader.name,
          documentName: document.originalName,
        })
      )
    );
  }

  return NextResponse.json({ document }, { status: 201 });
}
