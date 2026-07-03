"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PASSWORD_RULE_HINT } from "@/lib/password";

export function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password !== confirm) {
      setError("Les deux mots de passe ne correspondent pas.");
      return;
    }

    setLoading(true);
    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });
    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Une erreur est survenue.");
      return;
    }

    setDone(true);
    setTimeout(() => router.push("/login"), 2500);
  }

  if (done) {
    return (
      <div className="rounded-sm border-l-2 border-brand-500 bg-brand-50 px-4 py-4 text-sm text-brand-900">
        <p className="font-semibold">Mot de passe réinitialisé.</p>
        <p className="mt-1 text-brand-800">
          Vous allez être redirigé vers la page de connexion...
        </p>
        <Link href="/login" className="mt-2 inline-block font-semibold underline">
          Se connecter maintenant
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-sm border-l-2 border-red-500 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-neutral-700">
          Nouveau mot de passe
        </label>
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          className="w-full rounded-sm border border-neutral-200 px-4 py-3 text-sm text-ink outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
        />
        <p className="mt-1.5 text-xs text-neutral-400">{PASSWORD_RULE_HINT}</p>
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-neutral-700">
          Confirmer le mot de passe
        </label>
        <input
          type="password"
          required
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="••••••••"
          className="w-full rounded-sm border border-neutral-200 px-4 py-3 text-sm text-ink outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-sm bg-brand-500 px-4 py-3 text-sm font-semibold text-ink transition hover:bg-[#78a821] disabled:opacity-60"
      >
        {loading ? "Réinitialisation..." : "Réinitialiser mon mot de passe"}
      </button>
    </form>
  );
}
