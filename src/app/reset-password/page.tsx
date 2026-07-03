import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { hashToken } from "@/lib/password";
import { AuthShell } from "@/components/AuthShell";
import { ResetPasswordForm } from "@/components/ResetPasswordForm";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: { token?: string };
}) {
  const token = searchParams.token ?? "";

  let valid = false;
  if (token) {
    const record = await prisma.passwordResetToken.findUnique({
      where: { tokenHash: hashToken(token) },
    });
    valid = Boolean(record && !record.usedAt && record.expiresAt > new Date());
  }

  return (
    <AuthShell
      title="Réinitialiser le mot de passe"
      subtitle={
        valid
          ? "Choisissez un nouveau mot de passe pour votre compte."
          : "Ce lien n'est plus valide."
      }
      footer={
        <Link href="/login" className="font-semibold text-brand-700 hover:underline">
          ← Retour à la connexion
        </Link>
      }
    >
      {valid ? (
        <ResetPasswordForm token={token} />
      ) : (
        <div className="space-y-4">
          <div className="rounded-sm border-l-2 border-red-500 bg-red-50 px-4 py-4 text-sm text-red-700">
            <p className="font-semibold">Lien invalide ou expiré</p>
            <p className="mt-1">
              Ce lien de réinitialisation a expiré (il est valable 1 heure) ou a
              déjà été utilisé. Veuillez en demander un nouveau.
            </p>
          </div>
          <Link
            href="/forgot-password"
            className="inline-block rounded-sm bg-brand-500 px-4 py-3 text-sm font-semibold text-ink transition hover:bg-[#78a821]"
          >
            Demander un nouveau lien
          </Link>
        </div>
      )}
    </AuthShell>
  );
}
