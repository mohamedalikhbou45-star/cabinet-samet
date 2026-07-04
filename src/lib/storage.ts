import { createClient } from "@supabase/supabase-js";

export const DOCUMENTS_BUCKET =
  process.env.SUPABASE_STORAGE_BUCKET ?? "documents";

/** Durée de validité des URL signées de téléchargement (secondes). */
const SIGNED_URL_TTL = 60;

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error(
      "Supabase Storage n'est pas configuré : NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY sont requis."
    );
  }

  return createClient(url, key, {
    auth: { persistSession: false },
  });
}

/**
 * Chemin de stockage d'un document : un dossier par client, pour isoler
 * les fichiers de chaque compte dans le bucket "documents".
 */
export function buildStoragePath(userId: string, storedName: string) {
  return `${userId}/${storedName}`;
}

/** Dépose un fichier client dans Supabase Storage sous documents/{userId}/{filename}. */
export async function uploadDocumentFile(params: {
  userId: string;
  storedName: string;
  buffer: Buffer;
  mimeType: string;
}) {
  const supabase = getSupabaseClient();
  const path = buildStoragePath(params.userId, params.storedName);

  const { error } = await supabase.storage
    .from(DOCUMENTS_BUCKET)
    .upload(path, params.buffer, {
      contentType: params.mimeType,
      upsert: false,
    });

  if (error) {
    throw new Error(`Échec de l'upload Supabase Storage : ${error.message}`);
  }

  return path;
}

/**
 * Génère une URL Supabase signée et temporaire pour télécharger un document
 * (le bucket est privé : pas d'accès public direct). Le nom de fichier
 * d'origine est restauré au téléchargement via l'option `download`.
 */
export async function getSignedDownloadUrl(
  storagePath: string,
  downloadFilename?: string
) {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase.storage
    .from(DOCUMENTS_BUCKET)
    .createSignedUrl(storagePath, SIGNED_URL_TTL, {
      download: downloadFilename ?? true,
    });

  if (error || !data) {
    throw new Error(
      `Échec de génération de l'URL signée : ${error?.message ?? "inconnue"}`
    );
  }

  return data.signedUrl;
}

/** Supprime un fichier du bucket (utilisé si un document est retiré). */
export async function deleteDocumentFile(storagePath: string) {
  const supabase = getSupabaseClient();
  const { error } = await supabase.storage
    .from(DOCUMENTS_BUCKET)
    .remove([storagePath]);

  if (error) {
    console.error(`Échec de suppression Supabase Storage (${storagePath}) :`, error.message);
  }
}
