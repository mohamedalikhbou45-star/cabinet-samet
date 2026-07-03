"use client";

import { useState } from "react";
import {
  DOCUMENT_TYPE_LABELS,
  STATUS_LABELS,
  STATUS_STYLES,
  formatBytes,
} from "@/lib/labels";

type Doc = {
  id: string;
  originalName: string;
  type: string;
  status: string;
  size: number;
  createdAt: string;
};

const STATUS_ORDER = ["EN_ATTENTE", "EN_TRAITEMENT", "TRAITE"];

export function HistoryTable({
  initialDocuments,
}: {
  initialDocuments: Doc[];
}) {
  const [documents, setDocuments] = useState<Doc[]>(initialDocuments);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [toast, setToast] = useState("");

  async function changeStatus(id: string, status: string) {
    setUpdatingId(id);
    setToast("");
    try {
      const res = await fetch(`/api/documents/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        setDocuments((prev) =>
          prev.map((d) => (d.id === id ? { ...d, status } : d))
        );
        setToast(
          `Statut mis à jour vers « ${STATUS_LABELS[status]} ». Une notification par email a été envoyée.`
        );
      } else {
        setToast("La mise à jour du statut a échoué.");
      }
    } catch {
      setToast("Erreur réseau lors de la mise à jour.");
    } finally {
      setUpdatingId(null);
    }
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
          <table className="w-full min-w-[720px] text-left">
            <thead>
              <tr className="border-b border-neutral-100 bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500">
                <th className="px-6 py-3 font-medium">Document</th>
                <th className="px-6 py-3 font-medium">Type</th>
                <th className="px-6 py-3 font-medium">Date de dépôt</th>
                <th className="px-6 py-3 font-medium">Statut</th>
                <th className="px-6 py-3 font-medium">Modifier le statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {documents.map((doc) => (
                <tr key={doc.id} className="text-sm">
                  <td className="px-6 py-4">
                    <p className="font-medium text-slate-900">
                      {doc.originalName}
                    </p>
                    <p className="text-xs text-slate-500">
                      {formatBytes(doc.size)}
                    </p>
                  </td>
                  <td className="px-6 py-4 text-slate-600">
                    {DOCUMENT_TYPE_LABELS[doc.type]}
                  </td>
                  <td className="px-6 py-4 text-slate-600">
                    {new Date(doc.createdAt).toLocaleDateString("fr-FR", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${STATUS_STYLES[doc.status]}`}
                    >
                      {STATUS_LABELS[doc.status]}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <select
                      value={doc.status}
                      disabled={updatingId === doc.id}
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs text-slate-400">
        Note : la modification du statut est disponible à des fins de
        démonstration du système de notifications par email.
      </p>
    </div>
  );
}
