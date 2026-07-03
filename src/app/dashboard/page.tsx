import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  DOCUMENT_TYPE_LABELS,
  STATUS_LABELS,
  STATUS_STYLES,
} from "@/lib/labels";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  const userId = session.user.id;

  const [documents, messages] = await Promise.all([
    prisma.document.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    }),
    prisma.message.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  // Les messages non lus sont marqués comme lus dès l'affichage du tableau de bord.
  if (messages.some((m) => !m.read)) {
    await prisma.message.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });
  }

  const stats = {
    total: documents.length,
    enAttente: documents.filter((d) => d.status === "EN_ATTENTE").length,
    enTraitement: documents.filter((d) => d.status === "EN_TRAITEMENT").length,
    traite: documents.filter((d) => d.status === "TRAITE").length,
  };

  const cards = [
    { label: "Documents déposés", value: stats.total, hint: "au total" },
    { label: "En attente", value: stats.enAttente, hint: "à traiter", dot: "bg-amber-400" },
    { label: "En traitement", value: stats.enTraitement, hint: "en cours", dot: "bg-brand-500" },
    { label: "Traités", value: stats.traite, hint: "finalisés", dot: "bg-emerald-500" },
  ];

  const recent = documents.slice(0, 6);

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-ink">
            Tableau de bord
          </h1>
          <p className="mt-2 text-[15px] text-neutral-600">
            Vue d'ensemble de vos documents comptables.
          </p>
        </div>
        <Link
          href="/dashboard/documents"
          className="rounded-sm bg-brand-500 px-5 py-3 text-sm font-semibold text-ink transition hover:bg-[#78a821]"
        >
          + Déposer un document
        </Link>
      </div>

      {/* Messages du cabinet */}
      {messages.length > 0 && (
        <div className="rounded-md border border-neutral-100 bg-white">
          <div className="flex items-center gap-2 border-b border-neutral-100 px-6 py-5">
            <span className="text-brand-600">
              <MailIcon />
            </span>
            <h2 className="text-lg font-bold tracking-tight text-ink">
              Messages du cabinet
            </h2>
          </div>
          <ul className="divide-y divide-neutral-100">
            {messages.slice(0, 4).map((m) => (
              <li key={m.id} className="px-6 py-4">
                <p className="text-sm text-ink">{m.body}</p>
                <p className="mt-1 text-xs text-neutral-400">
                  {new Date(m.createdAt).toLocaleString("fr-FR")}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid gap-px overflow-hidden rounded-md border border-neutral-100 bg-neutral-100 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <div key={card.label} className="bg-white p-6">
            <div className="flex items-center gap-2">
              {card.dot && (
                <span className={`h-2 w-2 rounded-full ${card.dot}`} />
              )}
              <p className="text-sm font-medium text-neutral-500">
                {card.label}
              </p>
            </div>
            <p className="mt-4 text-4xl font-extrabold tracking-tight text-ink">
              {card.value}
            </p>
            <p className="mt-1 text-xs text-neutral-400">{card.hint}</p>
          </div>
        ))}
      </div>

      {/* Documents récents */}
      <div className="rounded-md border border-neutral-100">
        <div className="flex items-center justify-between border-b border-neutral-100 px-6 py-5">
          <h2 className="text-lg font-bold tracking-tight text-ink">
            Documents récents
          </h2>
          <Link
            href="/dashboard/historique"
            className="text-sm font-semibold text-brand-600 underline-offset-4 transition hover:underline"
          >
            Voir tout →
          </Link>
        </div>

        {recent.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <p className="text-sm text-neutral-500">
              Vous n'avez encore déposé aucun document.
            </p>
            <Link
              href="/dashboard/documents"
              className="mt-3 inline-block text-sm font-semibold text-brand-600 hover:underline"
            >
              Déposer votre premier document
            </Link>
          </div>
        ) : (
          <ul className="divide-y divide-neutral-100">
            {recent.map((doc) => (
              <li
                key={doc.id}
                className="flex items-center justify-between gap-4 px-6 py-4 transition hover:bg-neutral-50"
              >
                <div className="flex min-w-0 items-center gap-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-neutral-100 text-neutral-500">
                    <FileIcon />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-ink">
                      {doc.originalName}
                    </p>
                    <p className="text-xs text-neutral-500">
                      {DOCUMENT_TYPE_LABELS[doc.type]} ·{" "}
                      {new Date(doc.createdAt).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                </div>
                <span
                  className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${STATUS_STYLES[doc.status]}`}
                >
                  {STATUS_LABELS[doc.status]}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function FileIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 7-10 5L2 7" />
    </svg>
  );
}
