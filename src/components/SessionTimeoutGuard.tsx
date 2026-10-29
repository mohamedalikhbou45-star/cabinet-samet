"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { signOut } from "next-auth/react";

const INACTIVITY_MS = 30 * 60 * 1000; // 30 minutes
const WARNING_BEFORE_MS = 2 * 60 * 1000; // avertir 2 minutes avant expiration
const WARNING_AT_MS = INACTIVITY_MS - WARNING_BEFORE_MS;
const ACTIVITY_KEY = "cs_last_activity";
const ACTIVITY_EVENTS = ["click", "scroll", "keydown", "touchstart"] as const;

function formatCountdown(ms: number) {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/**
 * Déconnexion après 30 min d'inactivité (avertissement 2 min avant).
 * La dernière activité est stockée dans localStorage pour être partagée
 * entre les onglets.
 */
export function SessionTimeoutGuard({ logoutUrl }: { logoutUrl: string }) {
  const [showWarning, setShowWarning] = useState(false);
  const [remainingMs, setRemainingMs] = useState(WARNING_BEFORE_MS);
  const showWarningRef = useRef(false);
  const warnTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const logoutTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tickInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  const doLogout = useCallback(
    (expired: boolean) => {
      const url = expired ? `${logoutUrl}?expired=1` : logoutUrl;
      signOut({ callbackUrl: url });
    },
    [logoutUrl]
  );

  const clearAllTimers = useCallback(() => {
    if (warnTimer.current) clearTimeout(warnTimer.current);
    if (logoutTimer.current) clearTimeout(logoutTimer.current);
    if (tickInterval.current) clearInterval(tickInterval.current);
  }, []);

  const scheduleFromLastActivity = useCallback(
    (lastActivity: number) => {
      clearAllTimers();
      const elapsed = Date.now() - lastActivity;

      if (elapsed >= INACTIVITY_MS) {
        doLogout(true);
        return;
      }

      setShowWarning(false);

      const untilWarning = Math.max(0, WARNING_AT_MS - elapsed);
      const untilLogout = INACTIVITY_MS - elapsed;

      warnTimer.current = setTimeout(() => {
        setRemainingMs(WARNING_BEFORE_MS);
        setShowWarning(true);
        tickInterval.current = setInterval(() => {
          setRemainingMs((prev) => Math.max(0, prev - 1000));
        }, 1000);
      }, untilWarning);

      logoutTimer.current = setTimeout(() => doLogout(true), untilLogout);
    },
    [clearAllTimers, doLogout]
  );

  const recordActivity = useCallback(() => {
    const now = Date.now();
    localStorage.setItem(ACTIVITY_KEY, String(now));
    scheduleFromLastActivity(now);
  }, [scheduleFromLastActivity]);

  useEffect(() => {
    showWarningRef.current = showWarning;
  }, [showWarning]);

  useEffect(() => {
    // Le montage du composant (arrivée sur une page protégée, juste après
    // connexion ou rechargement) compte lui-même comme une activité : on ne
    // doit jamais faire confiance à un horodatage stocké qui pourrait dater
    // d'une session précédente vieille de plusieurs jours.
    recordActivity();

    function onActivity() {
      // Une fois l'avertissement affiché, seule une action explicite dans la
      // popup doit prolonger la session : on ignore le mouvement de fond.
      if (showWarningRef.current) return;
      recordActivity();
    }

    function onStorage(e: StorageEvent) {
      if (e.key === ACTIVITY_KEY && e.newValue) {
        scheduleFromLastActivity(Number(e.newValue));
      }
    }

    ACTIVITY_EVENTS.forEach((evt) =>
      window.addEventListener(evt, onActivity, { passive: true })
    );
    window.addEventListener("storage", onStorage);

    return () => {
      ACTIVITY_EVENTS.forEach((evt) => window.removeEventListener(evt, onActivity));
      window.removeEventListener("storage", onStorage);
      clearAllTimers();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!showWarning) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/50 backdrop-blur-sm animate-fade-in">
      <div className="mx-4 w-full max-w-sm rounded-md bg-white p-6 shadow-2xl animate-fade-up">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-amber-100 text-xl">
          ⏰
        </div>
        <h2 className="mt-4 text-lg font-bold text-ink">
          Votre session expire dans 2 minutes. Continuer ?
        </h2>
        <p className="mt-2 text-sm text-neutral-600">
          Temps restant : <span className="font-semibold text-ink">{formatCountdown(remainingMs)}</span>
        </p>
        <div className="mt-6 flex gap-3">
          <button
            onClick={() => doLogout(false)}
            className="flex-1 rounded-sm border border-neutral-200 px-4 py-2.5 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-50"
          >
            Se déconnecter
          </button>
          <button
            onClick={recordActivity}
            className="flex-1 rounded-sm bg-brand-500 px-4 py-2.5 text-sm font-semibold text-ink transition hover:bg-[#78a821]"
          >
            Continuer
          </button>
        </div>
      </div>
    </div>
  );
}
