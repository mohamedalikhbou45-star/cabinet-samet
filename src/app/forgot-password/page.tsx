"use client";

import { useState } from "react";
import Link from "next/link";
import { AuthShell } from "@/components/AuthShell";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    setLoading(false);
    setSubmitted(true);
  }

  return (
    <AuthShell
      title="Mot de passe oublié"
      subtitle="Saisissez votre email : nous vous enverrons un lien pour réinitialiser votre mot de passe."
      footer={
        <>
          <Link href="/login" className="font-semibold text-brand-700 hover:underline">
            ← Retour à la connexion
          </Link>
        </>
      }
    >
      {submitted ? (
        <div className="rounded-sm border-l-2 border-brand-500 bg-brand-50 px-4 py-4 text-sm text-brand-900">
          <p className="font-semibold">Vérifiez votre boîte mail.</p>
          <p className="mt-1 text-brand-800">
            Si un compte est associé à <strong>{email}</strong>, vous recevrez un
            lien de réinitialisation valable 1 heure.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-neutral-700">
              Adresse email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="vous@entreprise.fr"
              className="w-full rounded-sm border border-neutral-200 px-4 py-3 text-sm text-ink outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-sm bg-brand-500 px-4 py-3 text-sm font-semibold text-ink transition hover:bg-[#78a821] disabled:opacity-60"
          >
            {loading ? "Envoi..." : "Envoyer le lien de réinitialisation"}
          </button>
        </form>
      )}
    </AuthShell>
  );
}
