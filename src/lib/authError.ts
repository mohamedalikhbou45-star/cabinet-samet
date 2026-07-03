/**
 * Traduit l'erreur renvoyée par NextAuth (`result.error`) en message affichable
 * et indique s'il s'agit d'un verrouillage de compte (pour l'affichage dédié).
 */
export function parseAuthError(error: string): {
  message: string;
  locked: boolean;
} {
  // Échec générique (mauvais identifiants) : NextAuth renvoie ce code.
  if (!error || error === "CredentialsSignin") {
    return { message: "Email ou mot de passe incorrect.", locked: false };
  }

  const locked = /bloqu|tentative|verrouill/i.test(error);
  return { message: error, locked };
}
