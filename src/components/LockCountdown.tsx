"use client";

import { useEffect, useState } from "react";

/**
 * Bannière rouge avec compte à rebours en temps réel jusqu'à `until` (timestamp ms).
 * Appelle `onExpire` quand le délai est écoulé.
 */
export function LockCountdown({
  until,
  variant,
  onExpire,
}: {
  until: number;
  variant: "client" | "admin";
  onExpire: () => void;
}) {
  const [remaining, setRemaining] = useState(() => until - Date.now());

  useEffect(() => {
    setRemaining(until - Date.now());
    const id = setInterval(() => {
      const r = until - Date.now();
      if (r <= 0) {
        clearInterval(id);
        setRemaining(0);
        onExpire();
      } else {
        setRemaining(r);
      }
    }, 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [until]);

  const totalSeconds = Math.max(0, Math.ceil(remaining / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const delay = `${minutes} minute${minutes > 1 ? "s" : ""} et ${seconds} seconde${
    seconds > 1 ? "s" : ""
  }`;

  const dark = variant === "admin";

  return (
    <div
      role="alert"
      className={`flex items-start gap-3 rounded-sm border-l-4 border-red-500 px-4 py-3.5 text-sm ${
        dark ? "bg-red-500/10 text-red-200" : "bg-red-50 text-red-700"
      }`}
    >
      <span className="mt-0.5 text-lg leading-none">🔒</span>
      <div className="min-w-0">
        {dark ? (
          <p className="font-semibold">
            Compte administrateur verrouillé. Tentative suspecte détectée.
          </p>
        ) : (
          <p className="font-semibold">
            Votre compte est temporairement verrouillé suite à plusieurs
            tentatives échouées.
          </p>
        )}
        <p className={`mt-1 ${dark ? "text-red-300" : "text-red-600"}`}>
          {dark ? "Déblocage dans " : "Veuillez réessayer dans "}
          <span className="font-bold tabular-nums">{delay}</span>.
        </p>
      </div>
    </div>
  );
}
