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

/**
 * Nettoie un nom de fichier pour un usage sûr comme clé Supabase Storage,
 * tout en restant aussi proche que possible du nom d'origine : Supabase
 * rejette les caractères accentués et quelques symboles ([ ] { } ~ \), mais
 * accepte les espaces, parenthèses et la plupart des autres ponctuations —
 * on ne transforme donc que ce qui est réellement invalide.
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

/**
 * Si un fichier du même nom existe déjà pour ce client, ajoute un suffixe
 * " (2)", " (3)"... pour éviter d'écraser un document existant.
 */
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

/**
 * Dépose un fichier client dans Supabase Storage sous
 * documents/{userId}/{nom-original-du-fichier}, en conservant le nom réel
 * (avec dédoublonnage si un fichier du même nom existe déjà).
 */
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
 * Génère une URL Supabase signée et temporaire pour accéder à un document
 * (le bucket est privé : pas d'accès public direct).
 */
export async function getSignedDownloadUrl(storagePath: string) {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase.storage
    .from(DOCUMENTS_BUCKET)
    .createSignedUrl(storagePath, SIGNED_URL_TTL);

  if (error || !data) {
    throw new Error(
      `Échec de génération de l'URL signée : ${error?.message ?? "inconnue"}`
    );
  }

  return data.signedUrl;
}

/**
 * Télécharge le contenu d'un document directement depuis Supabase Storage.
 * Utilisé pour renvoyer le fichier avec le nom d'origine exact (accents
 * compris) dans l'en-tête Content-Disposition, construit nous-mêmes — évite
 * un double encodage observé avec l'option `download` des URL signées
 * lorsque le nom contient des caractères non-ASCII.
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
