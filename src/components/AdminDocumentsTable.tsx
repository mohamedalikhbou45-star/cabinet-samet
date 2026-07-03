"use client";

import { Fragment, useMemo, useState } from "react";
import {
  DOCUMENT_TYPE_LABELS,
  STATUS_LABELS,
  STATUS_STYLES,
  formatBytes,
} from "@/lib/labels";

type AdminDoc = {
  id: string;
  originalName: string;
  type: string;
  status: string;
  size: number;
  note: string | null;
  createdAt: string;
  clientName: string;
  clientCompany: string | null;
};

const STATUS_ORDER = ["EN_ATTENTE", "EN_TRAITEMENT", "TRAITE"];

const FILTERS = [
  { value: "TOUS", label: "Tous" },
  { value: "EN_ATTENTE", label: "En attente" },
  { value: "EN_TRAITEMENT", label: "En traitement" },
  { value: "TRAITE", label: "Traité" },
];

export function AdminDocumentsTable({ documents }: { documents: AdminDoc[] }) {
  const [rows, setRows] = useState<AdminDoc[]>(documents);
  const [filter, setFilter] = useState("TOUS");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [noteEditor, setNoteEditor] = useState<{ id: string; value: string } | null>(null);
  const [toast, setToast] = useState("");

  const visible = useMemo(
    () => (filter === "TOUS" ? rows : rows.filter((d) => d.status === filter)),
    [rows, filter]
  );

  const counts = useMemo(() => {
    const c: Record<string, number> = { TOUS: rows.length };
    for (const s of STATUS_ORDER) c[s] = rows.filter((d) => d.status === s).length;
    return c;
  }, [rows]);

  async function changeStatus(id: string, status: string) {
    setBusyId(id);
    setToast("");
    try {
      const res = await fetch(`/api/admin/documents/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        setRows((prev) => prev.map((d) => (d.id === id ? { ...d, status } : d)));
        setToast(
          `Statut mis à jour (${STATUS_LABELS[status]}). Le client a été notifié par email.`
        );
      } else {
        setToast("Échec de la mise à jour du statut.");
      }
    } finally {
      setBusyId(null);
    }
  }

  async function saveNote(id: string, value: string) {
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/documents/${id}/note`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: value }),
      });
      if (res.ok) {
        setRows((prev) =>
          prev.map((d) => (d.id === id ? { ...d, note: value.trim() || null } : d))
        );
        setNoteEditor(null);
        setToast("Note enregistrée.");
      }
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-4">
      {/* Filtres */}
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => {
          const active = filter === f.value;
          return (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
                active
                  ? "bg-ink text-white"
                  : "border border-neutral-200 text-neutral-600 hover:border-neutral-300"
              }`}
            >
              {f.label}
              <span
                className={`ml-2 text-xs ${active ? "text-neutral-400" : "text-neutral-400"}`}
              >
                {counts[f.value] ?? 0}
              </span>
            </button>
          );
        })}
      </div>

      {toast && (
        <div className="rounded-sm border-l-2 border-brand-500 bg-brand-50 px-4 py-3 text-sm font-medium text-brand-900">
          {toast}
        </div>
      )}

      <div className="overflow-hidden rounded-md border border-neutral-100 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left">
            <thead>
              <tr className="border-b border-neutral-100 bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500">
                <th className="px-6 py-3 font-medium">Document</th>
                <th className="px-6 py-3 font-medium">Client</th>
                <th className="px-6 py-3 font-medium">Statut</th>
                <th className="px-6 py-3 font-medium">Changer</th>
                <th className="px-6 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {visible.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-sm text-neutral-500">
                    Aucun document pour ce filtre.
                  </td>
                </tr>
              )}
              {visible.map((doc) => (
                <Fragment key={doc.id}>
                  <tr className="text-sm align-top">
                    <td className="px-6 py-4">
                      <p className="font-semibold text-ink">{doc.originalName}</p>
                      <p className="text-xs text-neutral-500">
                        {DOCUMENT_TYPE_LABELS[doc.type]} · {formatBytes(doc.size)} ·{" "}
                        {new Date(doc.createdAt).toLocaleDateString("fr-FR")}
                      </p>
                      {doc.note && (
                        <p className="mt-1.5 inline-block rounded-sm bg-amber-50 px-2 py-0.5 text-xs text-amber-800">
                          📝 {doc.note}
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4 text-neutral-600">
                      {doc.clientCompany || doc.clientName}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${STATUS_STYLES[doc.status]}`}
                      >
                        {STATUS_LABELS[doc.status]}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={doc.status}
                        disabled={busyId === doc.id}
                        onChange={(e) => changeStatus(doc.id, e.target.value)}
                        className="rounded-sm border border-neutral-200 px-2 py-1.5 text-xs outline-none focus:border-brand-500 disabled:opacity-60"
                      >
                        {STATUS_ORDER.map((s) => (
                          <option key={s} value={s}>
                            {STATUS_LABELS[s]}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-3">
                        <button
                          onClick={() =>
                            setNoteEditor(
                              noteEditor?.id === doc.id
                                ? null
                                : { id: doc.id, value: doc.note ?? "" }
                            )
                          }
                          className="text-sm font-semibold text-neutral-600 hover:text-ink"
                        >
                          Note
                        </button>
                        <a
                          href={`/api/admin/documents/${doc.id}/download`}
                          className="text-sm font-semibold text-brand-600 hover:underline"
                        >
                          Télécharger
                        </a>
                      </div>
                    </td>
                  </tr>
                  {noteEditor?.id === doc.id && (
                    <tr className="bg-neutral-50">
                      <td colSpan={5} className="px-6 py-4">
                        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-neutral-500">
                          Commentaire interne / note pour le document
                        </label>
                        <div className="flex gap-3">
                          <input
                            value={noteEditor.value}
                            autoFocus
                            onChange={(e) =>
                              setNoteEditor({ id: doc.id, value: e.target.value })
                            }
                            placeholder="Ex : pièce manquante, à revoir avec le client..."
                            className="flex-1 rounded-sm border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-brand-500"
                          />
                          <button
                            onClick={() => saveNote(doc.id, noteEditor.value)}
                            disabled={busyId === doc.id}
                            className="rounded-sm bg-brand-500 px-4 py-2 text-sm font-semibold text-ink transition hover:bg-[#78a821] disabled:opacity-50"
                          >
                            Enregistrer
                          </button>
                          <button
                            onClick={() => setNoteEditor(null)}
                            className="rounded-sm border border-neutral-200 px-4 py-2 text-sm font-semibold text-neutral-600 hover:bg-white"
                          >
                            Annuler
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
