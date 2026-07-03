import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ChangePasswordForm } from "@/components/ChangePasswordForm";

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      name: true,
      email: true,
      company: true,
      createdAt: true,
    },
  });

  if (!user) redirect("/login");

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-ink">
          Mon profil
        </h1>
        <p className="mt-2 text-[15px] text-neutral-600">
          Vos informations et la sécurité de votre compte.
        </p>
      </div>

      {/* Informations */}
      <div className="rounded-md border border-neutral-100 bg-white p-6">
        <h2 className="text-lg font-bold tracking-tight text-ink">
          Informations
        </h2>
        <dl className="mt-5 grid gap-5 sm:grid-cols-2">
          {[
            { label: "Nom", value: user.name },
            { label: "Email", value: user.email },
            { label: "Société", value: user.company || "—" },
            {
              label: "Membre depuis",
              value: new Date(user.createdAt).toLocaleDateString("fr-FR", {
                day: "2-digit",
                month: "long",
                year: "numeric",
              }),
            },
          ].map((item) => (
            <div key={item.label}>
              <dt className="text-xs font-semibold uppercase tracking-wide text-neutral-400">
                {item.label}
              </dt>
              <dd className="mt-1 text-sm font-medium text-ink">{item.value}</dd>
            </div>
          ))}
        </dl>
      </div>

      {/* Sécurité */}
      <div className="rounded-md border border-neutral-100 bg-white p-6">
        <div className="mb-1 flex items-center gap-2">
          <span className="text-brand-600">
            <ShieldIcon />
          </span>
          <h2 className="text-lg font-bold tracking-tight text-ink">Sécurité</h2>
        </div>
        <p className="mb-6 text-sm text-neutral-600">
          Modifiez votre mot de passe. Vous recevrez un email de confirmation.
        </p>
        <ChangePasswordForm />
      </div>
    </div>
  );
}

function ShieldIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}
