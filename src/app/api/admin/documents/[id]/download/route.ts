import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { getSignedDownloadUrl } from "@/lib/storage";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  }

  const document = await prisma.document.findUnique({
    where: { id: params.id },
  });
  if (!document) {
    return NextResponse.json({ error: "Document introuvable." }, { status: 404 });
  }
  if (!document.storagePath) {
    return NextResponse.json(
      { error: "Fichier introuvable dans le stockage." },
      { status: 404 }
    );
  }

  try {
    // URL Supabase signée et temporaire : le bucket "documents" est privé.
    const signedUrl = await getSignedDownloadUrl(
      document.storagePath,
      document.originalName
    );
    return NextResponse.redirect(signedUrl);
  } catch (error) {
    console.error("Échec de génération de l'URL de téléchargement :", error);
    return NextResponse.json(
      { error: "Échec de la génération du lien de téléchargement." },
      { status: 502 }
    );
  }
}
