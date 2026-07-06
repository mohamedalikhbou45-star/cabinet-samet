import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { downloadDocumentFile } from "@/lib/storage";

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
    const bytes = await downloadDocumentFile(document.storagePath);
    // Encodage RFC 5987 en une seule passe : restitue le nom d'origine
    // exact (accents compris) sans le double encodage vu avec les URL
    // signées Supabase pour les noms non-ASCII.
    const encodedName = encodeURIComponent(document.originalName);

    return new NextResponse(bytes, {
      status: 200,
      headers: {
        "Content-Type": document.mimeType || "application/octet-stream",
        "Content-Disposition": `attachment; filename*=UTF-8''${encodedName}`,
        "Content-Length": String(bytes.length),
      },
    });
  } catch (error) {
    console.error("Échec du téléchargement du document :", error);
    return NextResponse.json(
      { error: "Échec de la récupération du fichier." },
      { status: 502 }
    );
  }
}
