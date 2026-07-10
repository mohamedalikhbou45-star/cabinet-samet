"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const CODE_LENGTH = 6;
const CODE_DURATION_S = 10 * 60;
const RESEND_COOLDOWN_S = 60;

function formatTime(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function Verify2FAPage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [digits, setDigits] = useState<string[]>(Array(CODE_LENGTH).fill(""));
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(CODE_DURATION_S);
  const [resendCooldown, setResendCooldown] = useState(RESEND_COOLDOWN_S);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
    } else if (status === "authenticated" && session?.user?.twoFactorVerified) {
      router.replace(session.user.role === "ADMIN" ? "/admin/dashboard" : "/dashboard");
    }
  }, [status, session, router]);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const id = setInterval(() => setSecondsLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, [secondsLeft]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const id = setInterval(() => setResendCooldown((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, [resendCooldown]);

  const expired = secondsLeft <= 0;

  function handleChange(index: number, value: string) {
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[index] = digit;
    setDigits(next);
    if (digit && index < CODE_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, CODE_LENGTH);
    if (!pasted) return;
    e.preventDefault();
    const next = Array(CODE_LENGTH).fill("");
    for (let i = 0; i < pasted.length; i++) next[i] = pasted[i];
    setDigits(next);
    inputRefs.current[Math.min(pasted.length, CODE_LENGTH - 1)]?.focus();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const code = digits.join("");
    if (code.length !== CODE_LENGTH || expired) return;

    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/verify-2fa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, remember }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Code incorrect.");
        if (data.resent) {
          setSecondsLeft(CODE_DURATION_S);
          setResendCooldown(RESEND_COOLDOWN_S);
        }
        setDigits(Array(CODE_LENGTH).fill(""));
        inputRefs.current[0]?.focus();
        setLoading(false);
        return;
      }

      await update({ twoFactorVerified: true });
      router.push(session?.user?.role === "ADMIN" ? "/admin/dashboard" : "/dashboard");
      router.refresh();
    } catch {
      setError("Une erreur est survenue. Réessayez.");
      setLoading(false);
    }
  }

  async function handleResend() {
    if (resendCooldown > 0) return;
    setError("");
    setResending(true);
    try {
      const res = await fetch("/api/auth/resend-2fa", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Impossible de renvoyer le code.");
      } else {
        setSecondsLeft(CODE_DURATION_S);
        setResendCooldown(RESEND_COOLDOWN_S);
        setDigits(Array(CODE_LENGTH).fill(""));
        inputRefs.current[0]?.focus();
      }
    } finally {
      setResending(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 py-12">
        <div className="animate-fade-up">
          <Link href="/" className="mb-12 inline-flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-md bg-ink text-sm font-extrabold text-white">
              CS
            </span>
            <span className="text-[15px] font-bold tracking-tight text-ink">
              Cabinet Samet
              <span className="font-medium text-neutral-500"> de Comptabilité</span>
            </span>
          </Link>

          <h1 className="text-3xl font-extrabold tracking-tight text-ink">
            Vérification en deux étapes
          </h1>
          <p className="mt-3 text-[15px] text-neutral-600">
            Saisissez le code à 6 chiffres envoyé à{" "}
            <span className="font-semibold text-ink">
              {session?.user?.email ?? "votre adresse email"}
            </span>
            .
          </p>

          <form onSubmit={handleSubmit} className="mt-10 space-y-6">
            {error && (
              <div className="rounded-sm border-l-2 border-red-500 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="flex justify-between gap-2">
              {digits.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => {
                    inputRefs.current[i] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  disabled={expired}
                  onChange={(e) => handleChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  onPaste={handlePaste}
                  autoFocus={i === 0}
                  className="h-14 w-12 rounded-sm border border-neutral-200 text-center text-2xl font-bold text-ink outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100 disabled:bg-neutral-100 disabled:text-neutral-300"
                />
              ))}
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className={expired ? "font-semibold text-red-600" : "text-neutral-500"}>
                {expired ? "Code expiré" : `Expire dans ${formatTime(secondsLeft)}`}
              </span>
              <button
                type="button"
                onClick={handleResend}
                disabled={resendCooldown > 0 || resending}
                className="font-semibold text-brand-600 hover:underline disabled:cursor-not-allowed disabled:text-neutral-400 disabled:no-underline"
              >
                {resending
                  ? "Envoi..."
                  : resendCooldown > 0
                    ? `Renvoyer le code (${resendCooldown}s)`
                    : "Renvoyer le code"}
              </button>
            </div>

            <label className="flex items-center gap-2 text-sm text-neutral-600">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="h-4 w-4 rounded border-neutral-300 text-brand-600 focus:ring-brand-500"
              />
              Se souvenir de cet appareil pendant 30 jours
            </label>

            <button
              type="submit"
              disabled={loading || expired || digits.join("").length !== CODE_LENGTH}
              className="w-full rounded-sm bg-brand-500 px-4 py-3 text-sm font-semibold text-ink transition hover:bg-[#78a821] disabled:cursor-not-allowed disabled:bg-neutral-200 disabled:text-neutral-400"
            >
              {loading ? "Vérification..." : "Vérifier le code"}
            </button>
          </form>
        </div>
      </div>

      <footer className="border-t border-neutral-100 py-6">
        <p className="text-center text-xs text-neutral-400">
          © {new Date().getFullYear()} Cabinet Samet de Comptabilité
        </p>
      </footer>
    </div>
  );
}
