"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { useDropzone } from "react-dropzone";
import { DOCUMENT_TYPE_OPTIONS, formatBytes } from "@/lib/labels";

type Queued = {
  file: File;
  type: string;
  status: "pending" | "uploading" | "done" | "error";
  error?: string;
};

export default function UploadPage() {
  const router = useRouter();
  const [items, setItems] = useState<Queued[]>([]);
  const [defaultType, setDefaultType] = useState("FACTURE");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  const onDrop = useCallback(
    (accepted: File[]) => {
      setMessage("");
      setItems((prev) => [
        ...prev,
        ...accepted.map((file) => ({
          file,
          type: defaultType,
          status: "pending" as const,
        })),
      ]);
    },
    [defaultType]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "image/jpeg": [".jpg", ".jpeg"],
      "image/png": [".png"],
      "application/vnd.ms-excel": [".xls"],
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
    },
    maxSize: 15 * 1024 * 1024,
  });

  function updateType(index: number, type: string) {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, type } : item))
    );
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleUpload() {
    if (items.length === 0) return;
    setSubmitting(true);
    setMessage("");

    let successCount = 0;
    const next = [...items];

    for (let i = 0; i < next.length; i++) {
      if (next[i].status === "done") continue;
      next[i] = { ...next[i], status: "uploading" };
      setItems([...next]);

      const formData = new FormData();
      formData.append("file", next[i].file);
      formData.append("type", next[i].type);

      try {
        const res = await fetch("/api/documents", {
          method: "POST",
          body: formData,
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          next[i] = {
            ...next[i],
            status: "error",
            error: data.error ?? "Échec de l'envoi.",
          };
        } else {
          next[i] = { ...next[i], status: "done" };
          successCount++;
        }
      } catch {
        next[i] = { ...next[i], status: "error", error: "Erreur réseau." };
      }
      setItems([...next]);
    }

    setSubmitting(false);
    if (successCount > 0) {
      setMessage(
        `${successCount} document(s) déposé(s) avec succès. Ils sont maintenant "En attente" de traitement.`
      );
      router.refresh();
    }
  }

  const hasPending = items.some((i) => i.status !== "done");

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-ink">
          Déposer un document
        </h1>
        <p className="mt-2 text-[15px] text-neutral-600">
          Glissez-déposez vos factures, contrats de leasing ou relevés bancaires.
        </p>
      </div>

      <div className="rounded-md border border-neutral-100 bg-white p-6">
        <label className="mb-2 block text-sm font-medium text-neutral-700">
          Type de document par défaut
        </label>
        <select
          value={defaultType}
          onChange={(e) => setDefaultType(e.target.value)}
          className="mb-5 w-full max-w-xs rounded-sm border border-neutral-200 px-3 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
        >
          {DOCUMENT_TYPE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <div
          {...getRootProps()}
          className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-14 text-center transition ${
            isDragActive
              ? "border-brand-500 bg-brand-50"
              : "border-neutral-200 bg-neutral-50 hover:border-brand-400 hover:bg-brand-50/40"
          }`}
        >
          <input {...getInputProps()} />
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-brand-100 text-2xl">
            ⬆️
          </div>
          {isDragActive ? (
            <p className="text-sm font-medium text-brand-700">
              Déposez vos fichiers ici...
            </p>
          ) : (
            <>
              <p className="text-sm font-medium text-slate-700">
                Glissez-déposez vos fichiers ou{" "}
                <span className="text-brand-700">parcourez</span>
              </p>
              <p className="mt-1 text-xs text-slate-500">
                PDF, JPG, PNG, XLS, XLSX · 15 Mo maximum par fichier
              </p>
            </>
          )}
        </div>
      </div>

      {items.length > 0 && (
        <div className="rounded-md border border-neutral-100 bg-white">
          <div className="border-b border-neutral-100 px-6 py-4">
            <h2 className="font-bold tracking-tight text-ink">
              Fichiers à déposer ({items.length})
            </h2>
          </div>
          <ul className="divide-y divide-slate-100">
            {items.map((item, index) => (
              <li
                key={`${item.file.name}-${index}`}
                className="flex flex-wrap items-center gap-3 px-6 py-4"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-900">
                    {item.file.name}
                  </p>
                  <p className="text-xs text-slate-500">
                    {formatBytes(item.file.size)}
                  </p>
                </div>

                <select
                  value={item.type}
                  disabled={item.status === "done" || submitting}
                  onChange={(e) => updateType(index, e.target.value)}
                  className="rounded-sm border border-neutral-200 px-2 py-1.5 text-xs outline-none focus:border-brand-500 disabled:opacity-60"
                >
                  {DOCUMENT_TYPE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>

                {item.status === "pending" && (
                  <button
                    onClick={() => removeItem(index)}
                    disabled={submitting}
                    className="text-xs font-medium text-slate-400 hover:text-red-600"
                  >
                    Retirer
                  </button>
                )}
                {item.status === "uploading" && (
                  <span className="text-xs font-medium text-blue-600">
                    Envoi...
                  </span>
                )}
                {item.status === "done" && (
                  <span className="text-xs font-medium text-emerald-600">
                    ✓ Déposé
                  </span>
                )}
                {item.status === "error" && (
                  <span className="text-xs font-medium text-red-600">
                    {item.error}
                  </span>
                )}
              </li>
            ))}
          </ul>
          <div className="flex items-center justify-between gap-4 border-t border-neutral-100 px-6 py-4">
            {message ? (
              <p className="text-sm font-medium text-emerald-700">{message}</p>
            ) : (
              <span />
            )}
            <button
              onClick={handleUpload}
              disabled={submitting || !hasPending}
              className="rounded-sm bg-brand-500 px-5 py-3 text-sm font-semibold text-ink transition hover:bg-[#78a821] disabled:opacity-60"
            >
              {submitting ? "Envoi en cours..." : "Déposer les documents"}
            </button>
          </div>
        </div>
      )}

      {message && items.every((i) => i.status === "done") && (
        <div className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {message}
        </div>
      )}
    </div>
  );
}
