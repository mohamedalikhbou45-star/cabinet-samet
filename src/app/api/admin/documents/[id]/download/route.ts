import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import { getAdminSession } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

const UPLOAD_DIR = path.join(process.cwd(), "uploads");

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

  try {
    const filePath = path.join(UPLOAD_DIR, document.storedName);
    const data = await readFile(filePath);
    const encodedName = encodeURIComponent(document.originalName);

    return new NextResponse(data, {
      status: 200,
      headers: {
        "Content-Type": document.mimeType || "application/octet-stream",
        "Content-Disposition": `attachment; filename*=UTF-8''${encodedName}`,
        "Content-Length": String(data.length),
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Fichier introuvable sur le serveur." },
      { status: 404 }
    );
  }
}
