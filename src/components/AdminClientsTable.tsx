"use client";

import { useState } from "react";
import Link from "next/link";

type Client = {
  id: string;
  name: string;
  email: string;
  company: string | null;
  createdAt: string;
  active: boolean;
  locked: boolean;
  failedAttempts: number;
  docCount: number;
};

export function AdminClientsTable({ clients }: { clients: Client[] }) {
  const [rows, setRows] = useState<Client[]>(clients);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [toast, setToast] = useState("");

  async function toggleActive(id: string, next: boolean) {
    setBusyId(id);
    setToast("");
    try {
      const res = await fetch(`/api/admin/clients/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: next }),
      });
      if (res.ok) {
        setRows((prev) =>
          prev.map((c) => (c.id === id ? { ...c, active: next } : c))
        );
        setToast(next ? "Compte réactivé." : "Compte désactivé.");
      }
    } finally {
      setBusyId(null);
    }
  }

  async function unlock(id: string) {
    setBusyId(id);
    setToast("");
    try {
      const res = await fetch(`/api/admin/clients/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ unlock: true }),
      });
      if (res.ok) {
        setRows((prev) =>
          prev.map((c) =>
            c.id === id ? { ...c, locked: false, failedAttempts: 0 } : c
          )
        );
        setToast("Compte débloqué et compteur de tentatives remis à zéro.");
      }
    } finally {
      setBusyId(null);
    }
  }

  async function resetPassword(id: string, name: string) {
    setBusyId(id);
    setToast("");
    try {
      const res = await fetch(`/api/admin/clients/${id}/reset-password`, {
        method: "POST",
      });
      if (res.ok) {
        setToast(`Email de réinitialisation envoyé à ${name}.`);
      } else {
        setToast("Échec de l'envoi du lien de réinitialisation.");
      }
    } finally {
      setBusyId(null);
    }
  }

  if (rows.length === 0) {
    return (
      <div className="rounded-md border border-neutral-100 bg-white px-6 py-16 text-center">
        <p className="text-sm text-neutral-500">Aucun client inscrit.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {toast && (
        <div className="rounded-sm border-l-2 border-brand-500 bg-brand-50 px-4 py-3 text-sm font-medium text-brand-900">
          {toast}
        </div>
      )}

      <div className="overflow-hidden rounded-md border border-neutral-100 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] text-left">
            <thead>
              <tr className="border-b border-neutral-100 bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500">
                <th className="px-6 py-3 font-medium">Client</th>
                <th className="px-6 py-3 font-medium">Inscrit le</th>
                <th className="px-6 py-3 text-center font-medium">Documents</th>
                <th className="px-6 py-3 text-center font-medium">Sécurité</th>
                <th className="px-6 py-3 text-center font-medium">Statut</th>
                <th className="px-6 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {rows.map((c) => (
                <tr key={c.id} className="text-sm align-top">
                  <td className="px-6 py-4">
                    <p className="font-semibold text-ink">{c.name}</p>
                    <p className="text-xs text-neutral-500">{c.email}</p>
                    {c.company && (
                      <p className="text-xs text-neutral-400">{c.company}</p>
                    )}
                  </td>
                  <td className="px-6 py-4 text-neutral-600">
                    {new Date(c.createdAt).toLocaleDateString("fr-FR")}
                  </td>
                  <td className="px-6 py-4 text-center font-semibold text-ink">
                    {c.docCount}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span
                      className={`text-sm font-semibold ${
                        c.failedAttempts > 0 ? "text-amber-600" : "text-neutral-400"
                      }`}
                    >
                      {c.failedAttempts} échec{c.failedAttempts > 1 ? "s" : ""}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex flex-col items-center gap-1">
                      {c.locked && (
                        <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-800 ring-1 ring-inset ring-red-600/20">
                          🔒 Bloqué
                        </span>
                      )}
                      {c.active ? (
                        <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-800 ring-1 ring-inset ring-emerald-600/20">
                          Actif
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-neutral-200 px-2.5 py-1 text-xs font-semibold text-neutral-700">
                          Désactivé
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col items-end gap-2">
                      <Link
                        href={`/admin/clients/${c.id}`}
                        className="text-sm font-semibold text-brand-600 hover:underline"
                      >
                        Voir le dossier
                      </Link>
                      <div className="flex flex-wrap justify-end gap-2">
                        <button
                          onClick={() => resetPassword(c.id, c.name)}
                          disabled={busyId === c.id}
                          className="rounded-sm border border-neutral-200 px-2.5 py-1.5 text-xs font-semibold text-neutral-600 transition hover:border-neutral-300 disabled:opacity-50"
                        >
                          Réinitialiser MDP
                        </button>
                        {c.locked && (
                          <button
                            onClick={() => unlock(c.id)}
                            disabled={busyId === c.id}
                            className="rounded-sm border border-amber-200 px-2.5 py-1.5 text-xs font-semibold text-amber-700 transition hover:bg-amber-50 disabled:opacity-50"
                          >
                            Débloquer
                          </button>
                        )}
                        <button
                          onClick={() => toggleActive(c.id, !c.active)}
                          disabled={busyId === c.id}
                          className={`rounded-sm border px-2.5 py-1.5 text-xs font-semibold transition disabled:opacity-50 ${
                            c.active
                              ? "border-red-200 text-red-600 hover:bg-red-50"
                              : "border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                          }`}
                        >
                          {c.active ? "Désactiver" : "Activer"}
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
