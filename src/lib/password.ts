import { createHash, randomBytes } from "crypto";

/**
 * Politique de mot de passe : au moins 8 caractères, 1 majuscule, 1 chiffre.
 * Renvoie un message d'erreur en français, ou `null` si le mot de passe est valide.
 */
export function validatePassword(password: string): string | null {
  if (password.length < 8) {
    return "Le mot de passe doit contenir au moins 8 caractères.";
  }
  if (!/[A-Z]/.test(password)) {
    return "Le mot de passe doit contenir au moins une majuscule.";
  }
  if (!/[0-9]/.test(password)) {
    return "Le mot de passe doit contenir au moins un chiffre.";
  }
  return null;
}

export const PASSWORD_RULE_HINT =
  "Minimum 8 caractères, avec au moins une majuscule et un chiffre.";

/** Génère un token brut (envoyé par email) et son empreinte (stockée en base). */
export function generateResetToken() {
  const raw = randomBytes(32).toString("hex");
  const hash = hashToken(raw);
  return { raw, hash };
}

export function hashToken(raw: string) {
  return createHash("sha256").update(raw).digest("hex");
}
