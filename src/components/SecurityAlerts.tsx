"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

type LockedAccount = {
  id: string;
  name: string;
  email: string;
  failedAttempts: number;
  lockedAt: string | null;
  lockedUntil: string | null;
  permanent: boolean;
};

const POLL_MS = 10_000;

export function SecurityAlerts({
  initialAccounts,
}: {
  initialAccounts: LockedAccount[];
}) {
  const [accounts, setAccounts] = useState<LockedAccount[]>(initialAccounts);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [toast, setToast] = useState("");
  const knownIds = useRef<Set<string>>(
    new Set(initialAccounts.map((a) => a.id))
  );

  useEffect(() => {
    let active = true;

    async function poll() {
      try {
        const res = await fetch("/api/admin/security/locked", {
          cache: "no-store",
        });
        if (!res.ok) return;
        const data = await res.json();
        if (!active) return;

        const list: LockedAccount[] = data.accounts ?? [];

        // Détection en temps réel d'un nouveau compte verrouillé.
        const fresh = list.filter((a) => !knownIds.current.has(a.id));
        if (fresh.length > 0) {
          setToast(
            fresh.length === 1
              ? `⚠️ Nouveau compte verrouillé : ${fresh[0].name}`
              : `⚠️ ${fresh.length} nouveaux comptes verrouillés`
          );
        }
        knownIds.current = new Set(list.map((a) => a.id));
        setAccounts(list);
      } catch {
        // silencieux : le polling reprendra au prochain tick
      }
    }

    const id = setInterval(poll, POLL_MS);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, []);

  async function unlock(id: string) {
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/clients/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ unlock: true }),
      });
      if (res.ok) {
        knownIds.current.delete(id);
        setAccounts((prev) => prev.filter((a) => a.id !== id));
        setToast("Compte débloqué.");
      }
    } finally {
      setBusyId(null);
    }
  }

  const formatTime = (iso: string | null) =>
    iso
      ? new Date(iso).toLocaleString("fr-FR", {
          day: "2-digit",
          month: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "—";

  return (
    <section
      className={`rounded-md border ${
        accounts.length > 0
          ? "border-red-200 bg-red-50/60"
          : "border-neutral-100 bg-white"
      }`}
    >
      <div className="flex items-center justify-between gap-3 border-b border-neutral-100/70 px-6 py-4">
        <div className="flex items-center gap-2.5">
          <h2 className="text-lg font-bold tracking-tight text-ink">
            Alertes de sécurité
          </h2>
          {accounts.length > 0 && (
            <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-red-600 px-2 text-xs font-bold text-white">
              {accounts.length}
            </span>
          )}
        </div>
        <span className="flex items-center gap-1.5 text-xs font-medium text-neutral-400">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          Surveillance en direct
        </span>
      </div>

      {toast && (
        <div className="mx-6 mt-4 rounded-sm border-l-2 border-red-500 bg-white px-4 py-2.5 text-sm font-medium text-red-700">
          {toast}
        </div>
      )}

      {accounts.length === 0 ? (
        <p className="px-6 py-8 text-center text-sm text-neutral-500">
          Aucun compte verrouillé. Tout est normal.
        </p>
      ) : (
        <ul className="divide-y divide-red-100">
          {accounts.map((a) => (
            <li
              key={a.id}
              className="flex flex-wrap items-center justify-between gap-4 px-6 py-4"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm">🔒</span>
                  <Link
                    href={`/admin/clients/${a.id}`}
                    className="truncate text-sm font-bold text-ink hover:underline"
                  >
                    {a.name}
                  </Link>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                      a.permanent
                        ? "bg-red-100 text-red-800"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {a.permanent ? "Bloqué" : "Verrou temporaire"}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-neutral-500">
                  {a.email} · verrouillé le {formatTime(a.lockedAt)} ·{" "}
                  <span className="font-semibold text-red-600">
                    {a.failedAttempts} tentative{a.failedAttempts > 1 ? "s" : ""}
                  </span>
                </p>
              </div>
              <button
                onClick={() => unlock(a.id)}
                disabled={busyId === a.id}
                className="shrink-0 rounded-sm bg-ink px-4 py-2 text-xs font-semibold text-white transition hover:bg-neutral-800 disabled:opacity-50"
              >
                {busyId === a.id ? "..." : "Débloquer maintenant"}
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
