"use client";

import { Suspense, useState } from "react";
import { signIn, getSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { AuthShell } from "@/components/AuthShell";
import { LockCountdown } from "@/components/LockCountdown";
import { parseAuthError } from "@/lib/authError";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const expired = searchParams.get("expired") === "1";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [lockUntil, setLockUntil] = useState<number | null>(null);
  const [blocked, setBlocked] = useState(false);
  const [loading, setLoading] = useState(false);

  const locked = blocked || (lockUntil !== null && lockUntil > Date.now());

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (locked) return;
    setError("");
    setLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      // On récupère l'état de verrouillage précis pour afficher un compte à rebours.
      try {
        const res = await fetch(
          `/api/auth/lock-status?email=${encodeURIComponent(email)}`
        );
        const status = await res.json();
        if (status.state === "temp" && status.lockedUntil) {
          setLockUntil(new Date(status.lockedUntil).getTime());
          setBlocked(false);
          setError("");
        } else if (status.state === "blocked") {
          setBlocked(true);
          setError("");
        } else {
          setError(parseAuthError(result.error).message);
        }
      } catch {
        setError(parseAuthError(result.error).message);
      }
      setLoading(false);
      return;
    }

    const session = await getSession();
    setLoading(false);

    if (session?.user && !session.user.twoFactorVerified) {
      router.push("/verify-2fa");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <AuthShell
      title="Connexion à votre espace"
      subtitle="Accédez à vos documents et suivez leur traitement."
      footer={
        <>
          Pas encore de compte ?{" "}
          <Link href="/register" className="font-semibold text-brand-700 hover:underline">
            Créer un compte
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {expired && (
          <div
            role="alert"
            className="flex items-start gap-3 rounded-sm border-l-4 border-amber-500 bg-amber-50 px-4 py-3.5 text-sm text-amber-800"
          >
            <span className="mt-0.5 text-lg leading-none">⏰</span>
            <p>Votre session a expiré pour des raisons de sécurité.</p>
          </div>
        )}
        {lockUntil !== null && !blocked && (
          <LockCountdown
            until={lockUntil}
            variant="client"
            onExpire={() => setLockUntil(null)}
          />
        )}
        {blocked && (
          <div
            role="alert"
            className="flex items-start gap-3 rounded-sm border-l-4 border-red-500 bg-red-50 px-4 py-3.5 text-sm text-red-700"
          >
            <span className="mt-0.5 text-lg leading-none">🔒</span>
            <div>
              <p className="font-semibold">Votre compte est bloqué.</p>
              <p className="mt-1 text-red-600">
                Suite à de trop nombreuses tentatives. Contactez le cabinet pour
                le débloquer.
              </p>
            </div>
          </div>
        )}
        {error && (
          <div className="rounded-sm border-l-2 border-red-500 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}
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
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label className="block text-sm font-medium text-neutral-700">
              Mot de passe
            </label>
            <Link
              href="/forgot-password"
              className="text-xs font-semibold text-brand-600 hover:underline"
            >
              Mot de passe oublié ?
            </Link>
          </div>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full rounded-sm border border-neutral-200 px-4 py-3 text-sm text-ink outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
          />
        </div>
        <button
          type="submit"
          disabled={loading || locked}
          className="w-full rounded-sm bg-brand-500 px-4 py-3 text-sm font-semibold text-ink transition hover:bg-[#78a821] disabled:cursor-not-allowed disabled:bg-neutral-200 disabled:text-neutral-400"
        >
          {locked
            ? "Connexion verrouillée"
            : loading
              ? "Connexion..."
              : "Se connecter"}
        </button>
      </form>
    </AuthShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
