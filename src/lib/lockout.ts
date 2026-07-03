/**
 * Politique de verrouillage progressif.
 *
 * À chaque échec de connexion, `failedAttempts` est incrémenté :
 *   - 2e échec  → verrouillage temporaire 1 minute
 *   - 3e échec  → verrouillage temporaire 5 minutes
 *   - 4e échec  → verrouillage temporaire 15 minutes
 *   - 5e échec  → compte bloqué (déverrouillage par un administrateur requis)
 *
 * Un verrouillage temporaire expiré laisse le compteur en place : l'échec
 * suivant applique le palier supérieur. Une connexion réussie remet tout à zéro.
 */
export const MAX_ATTEMPTS = 5;

const TEMP_LOCK_MINUTES: Record<number, number> = {
  2: 1,
  3: 5,
  4: 15,
};

export type LockResult = {
  lockedUntil: Date | null;
  permanent: boolean;
  /** Nombre de minutes du verrou temporaire éventuel (pour les messages). */
  minutes: number | null;
};

export function computeLock(failedAttempts: number): LockResult {
  if (failedAttempts >= MAX_ATTEMPTS) {
    return { lockedUntil: null, permanent: true, minutes: null };
  }
  const minutes = TEMP_LOCK_MINUTES[failedAttempts];
  if (minutes) {
    return {
      lockedUntil: new Date(Date.now() + minutes * 60_000),
      permanent: false,
      minutes,
    };
  }
  return { lockedUntil: null, permanent: false, minutes: null };
}
