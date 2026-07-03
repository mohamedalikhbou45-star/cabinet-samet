import Link from "next/link";
import { prisma } from "@/lib/prisma";
import {
  DOCUMENT_TYPE_LABELS,
  STATUS_LABELS,
  STATUS_STYLES,
} from "@/lib/labels";
import { WeeklyChart, WeekBar } from "@/components/WeeklyChart";
import { SecurityAlerts } from "@/components/SecurityAlerts";

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export default async function AdminDashboardPage() {
  const now = new Date();
  const todayStart = startOfDay(now);

  const [
    totalClients,
    todayCount,
    enAttente,
    traite,
    allDocs,
    recent,
    lockedClients,
  ] = await Promise.all([
    prisma.user.count({ where: { role: "CLIENT" } }),
    prisma.document.count({ where: { createdAt: { gte: todayStart } } }),
    prisma.document.count({ where: { status: "EN_ATTENTE" } }),
    prisma.document.count({ where: { status: "TRAITE" } }),
    prisma.document.findMany({ select: { createdAt: true } }),
    prisma.document.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      include: { user: { select: { name: true, company: true } } },
    }),
    prisma.user.findMany({
      where: {
        role: "CLIENT",
        OR: [{ locked: true }, { lockedUntil: { gt: now } }],
      },
      orderBy: { lockedAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        failedAttempts: true,
        lockedAt: true,
        lockedUntil: true,
        locked: true,
      },
    }),
  ]);

  const lockedAccounts = lockedClients.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    failedAttempts: u.failedAttempts,
    lockedAt: u.lockedAt ? u.lockedAt.toISOString() : null,
    lockedUntil: u.lockedUntil ? u.lockedUntil.toISOString() : null,
    permanent: u.locked,
  }));

  // Dépôts sur les 8 dernières semaines.
  const weeks: WeekBar[] = [];
  for (let i = 7; i >= 0; i--) {
    const end = new Date(todayStart);
    end.setDate(end.getDate() - i * 7);
    const start = new Date(end);
    start.setDate(start.getDate() - 6);
    const count = allDocs.filter(
      (d) => d.createdAt >= start && d.createdAt <= new Date(end.getTime() + 86400000 - 1)
    ).length;
    const label = start.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
    });
    weeks.push({ label, count });
  }

  const cards = [
    { label: "Clients inscrits", value: totalClients },
    { label: "Reçus aujourd'hui", value: todayCount, dot: "bg-brand-500" },
    { label: "En attente", value: enAttente, dot: "bg-amber-400" },
    { label: "Traités", value: traite, dot: "bg-emerald-500" },
  ];

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-ink">
          Tableau de bord
        </h1>
        <p className="mt-2 text-[15px] text-neutral-600">
          Vue d'ensemble de l'activité du cabinet.
        </p>
      </div>

      <SecurityAlerts initialAccounts={lockedAccounts} />

      <div className="grid gap-px overflow-hidden rounded-md border border-neutral-100 bg-neutral-100 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <div key={card.label} className="bg-white p-6">
            <div className="flex items-center gap-2">
              {card.dot && <span className={`h-2 w-2 rounded-full ${card.dot}`} />}
              <p className="text-sm font-medium text-neutral-500">{card.label}</p>
            </div>
            <p className="mt-4 text-4xl font-extrabold tracking-tight text-ink">
              {card.value}
            </p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Graphique */}
        <div className="rounded-md border border-neutral-100 bg-white p-6 lg:col-span-3">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-lg font-bold tracking-tight text-ink">
              Dépôts par semaine
            </h2>
            <span className="text-xs font-medium text-neutral-400">
              8 dernières semaines
            </span>
          </div>
          <WeeklyChart data={weeks} />
        </div>

        {/* Derniers documents */}
        <div className="rounded-md border border-neutral-100 bg-white lg:col-span-2">
          <div className="flex items-center justify-between border-b border-neutral-100 px-6 py-5">
            <h2 className="text-lg font-bold tracking-tight text-ink">
              Derniers documents
            </h2>
            <Link
              href="/admin/documents"
              className="text-sm font-semibold text-brand-600 hover:underline"
            >
              Tout voir →
            </Link>
          </div>
          {recent.length === 0 ? (
            <p className="px-6 py-12 text-center text-sm text-neutral-500">
              Aucun document reçu pour le moment.
            </p>
          ) : (
            <ul className="divide-y divide-neutral-100">
              {recent.map((doc) => (
                <li key={doc.id} className="px-6 py-3.5">
                  <div className="flex items-center justify-between gap-3">
                    <p className="truncate text-sm font-semibold text-ink">
                      {doc.originalName}
                    </p>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${STATUS_STYLES[doc.status]}`}
                    >
                      {STATUS_LABELS[doc.status]}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-neutral-500">
                    {doc.user.company || doc.user.name} ·{" "}
                    {DOCUMENT_TYPE_LABELS[doc.type]}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
