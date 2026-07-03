"use client";

import { useState } from "react";
import { PASSWORD_RULE_HINT } from "@/lib/password";

export function ChangePasswordForm() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (next !== confirm) {
      setError("Le nouveau mot de passe et sa confirmation ne correspondent pas.");
      return;
    }

    setLoading(true);
    const res = await fetch("/api/profile/password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword: current, newPassword: next }),
    });
    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Une erreur est survenue.");
      return;
    }

    setSuccess("Votre mot de passe a été modifié. Un email de confirmation vous a été envoyé.");
    setCurrent("");
    setNext("");
    setConfirm("");
  }

  const inputClass =
    "w-full rounded-sm border border-neutral-200 px-4 py-3 text-sm text-ink outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100";

  return (
    <form onSubmit={handleSubmit} className="max-w-md space-y-4">
      {error && (
        <div className="rounded-sm border-l-2 border-red-500 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-sm border-l-2 border-brand-500 bg-brand-50 px-4 py-3 text-sm text-brand-900">
          {success}
        </div>
      )}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-neutral-700">
          Mot de passe actuel
        </label>
        <input
          type="password"
          required
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
          className={inputClass}
        />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-neutral-700">
          Nouveau mot de passe
        </label>
        <input
          type="password"
          required
          value={next}
          onChange={(e) => setNext(e.target.value)}
          className={inputClass}
        />
        <p className="mt-1.5 text-xs text-neutral-400">{PASSWORD_RULE_HINT}</p>
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-neutral-700">
          Confirmer le nouveau mot de passe
        </label>
        <input
          type="password"
          required
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className={inputClass}
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="rounded-sm bg-brand-500 px-5 py-3 text-sm font-semibold text-ink transition hover:bg-[#78a821] disabled:opacity-60"
      >
        {loading ? "Modification..." : "Modifier le mot de passe"}
      </button>
    </form>
  );
}
