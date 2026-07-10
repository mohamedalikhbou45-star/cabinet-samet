"use client";

import { useState } from "react";
import { signIn, getSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LockCountdown } from "@/components/LockCountdown";
import { parseAuthError } from "@/lib/authError";

export default function AdminLoginPage() {
  const router = useRouter();
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
          setError("Identifiants invalides ou accès non autorisé.");
        }
      } catch {
        setError(parseAuthError(result.error).message);
      }
      setLoading(false);
      return;
    }

    // On vérifie que le compte est bien administrateur.
    const session = await getSession();
    setLoading(false);

    if (session?.user?.role !== "ADMIN") {
      setError("Cet espace est réservé aux administrateurs.");
      return;
    }

    if (!session.user.twoFactorVerified) {
      router.push("/verify-2fa");
      return;
    }

    router.push("/admin/dashboard");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink px-6">
      <div className="w-full max-w-md animate-fade-up">
        <div className="mb-10 flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-md bg-brand-500 text-sm font-extrabold text-ink">
            CS
          </span>
          <div>
            <p className="text-[15px] font-bold text-white">Cabinet Samet</p>
            <p className="text-xs font-medium uppercase tracking-widest text-brand-500">
              Administration
            </p>
          </div>
        </div>

        <div className="rounded-md border border-white/10 bg-white/[0.03] p-8">
          <h1 className="text-2xl font-extrabold tracking-tight text-white">
            Espace administrateur
          </h1>
          <p className="mt-2 text-sm text-neutral-400">
            Connectez-vous pour gérer les clients et les documents.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            {lockUntil !== null && !blocked && (
              <LockCountdown
                until={lockUntil}
                variant="admin"
                onExpire={() => setLockUntil(null)}
              />
            )}
            {blocked && (
              <div
                role="alert"
                className="flex items-start gap-3 rounded-sm border-l-4 border-red-500 bg-red-500/10 px-4 py-3.5 text-sm text-red-200"
              >
                <span className="mt-0.5 text-lg leading-none">🔒</span>
                <div>
                  <p className="font-semibold">
                    Compte administrateur bloqué.
                  </p>
                  <p className="mt-1 text-red-300">
                    Tentative suspecte détectée. Déblocage requis en base.
                  </p>
                </div>
              </div>
            )}
            {error && (
              <div className="rounded-sm border-l-2 border-red-500 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                {error}
              </div>
            )}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-neutral-300">
                Adresse email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@cabinetsamet.fr"
                className="w-full rounded-sm border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition placeholder:text-neutral-500 focus:border-brand-500"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-neutral-300">
                Mot de passe
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-sm border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition placeholder:text-neutral-500 focus:border-brand-500"
              />
            </div>
            <button
              type="submit"
              disabled={loading || locked}
              className="w-full rounded-sm bg-brand-500 px-4 py-3 text-sm font-semibold text-ink transition hover:bg-[#78a821] disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-neutral-500"
            >
              {locked
                ? "Connexion verrouillée"
                : loading
                  ? "Connexion..."
                  : "Se connecter"}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-neutral-500">
          <Link href="/" className="hover:text-brand-500">
            ← Retour au site
          </Link>
        </p>
      </div>
    </div>
  );
}
