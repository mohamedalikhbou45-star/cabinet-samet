import { createClient } from "@supabase/supabase-js";

const DOCUMENTS_BUCKET =
  process.env.SUPABASE_STORAGE_BUCKET ?? "documents";

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

/** Un dossier par client dans le bucket. */
function buildStoragePath(userId: string, storedName: string) {
  return `${userId}/${storedName}`;
}

/**
 * Supabase refuse les accents et les symboles [ ] { } ~ \ dans les clés :
 * on ne remplace que ces caractères pour garder un nom lisible.
 */
function sanitizeFilename(name: string): string {
  const base = name.split(/[\\/]/).pop() ?? name;

  const cleaned = base
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // retire les accents (é → e, à → a...)
    .replace(/[^\x00-\x7F]/g, "-") // tout autre caractère non-ASCII restant
    .replace(/[[\]{}~\\]/g, "-") // symboles refusés par Supabase Storage
    .replace(/\s+/g, " ")
    .trim();

  return cleaned || "fichier";
}

/** Ajoute " (2)", " (3)"... si le nom existe déjà, pour ne rien écraser. */
async function findAvailableStorageName(
  supabase: ReturnType<typeof getSupabaseClient>,
  userId: string,
  filename: string
): Promise<string> {
  const { data: existing } = await supabase.storage
    .from(DOCUMENTS_BUCKET)
    .list(userId, { limit: 1000 });

  const existingNames = new Set((existing ?? []).map((f) => f.name));
  if (!existingNames.has(filename)) return filename;

  const extMatch = filename.match(/\.[^.]+$/);
  const ext = extMatch ? extMatch[0] : "";
  const stem = ext ? filename.slice(0, -ext.length) : filename;

  let counter = 2;
  let candidate = `${stem} (${counter})${ext}`;
  while (existingNames.has(candidate)) {
    counter += 1;
    candidate = `${stem} (${counter})${ext}`;
  }
  return candidate;
}

/** Dépose un fichier sous documents/{userId}/{nom du fichier}. */
export async function uploadDocumentFile(params: {
  userId: string;
  originalName: string;
  buffer: Buffer;
  mimeType: string;
}) {
  const supabase = getSupabaseClient();
  const sanitized = sanitizeFilename(params.originalName);
  const storedName = await findAvailableStorageName(supabase, params.userId, sanitized);
  const path = buildStoragePath(params.userId, storedName);

  const { error } = await supabase.storage
    .from(DOCUMENTS_BUCKET)
    .upload(path, params.buffer, {
      contentType: params.mimeType,
      upsert: false,
    });

  if (error) {
    throw new Error(`Échec de l'upload Supabase Storage : ${error.message}`);
  }

  return { path, storedName };
}

/**
 * Télécharge le fichier côté serveur plutôt que via une URL signée : les URL
 * signées encodaient deux fois les noms avec accents.
 */
export async function downloadDocumentFile(storagePath: string) {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase.storage
    .from(DOCUMENTS_BUCKET)
    .download(storagePath);

  if (error || !data) {
    throw new Error(
      `Échec du téléchargement Supabase Storage : ${error?.message ?? "inconnue"}`
    );
  }

  return Buffer.from(await data.arrayBuffer());
}
