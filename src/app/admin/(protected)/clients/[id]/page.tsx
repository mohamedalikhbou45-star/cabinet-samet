import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  DOCUMENT_TYPE_LABELS,
  STATUS_LABELS,
  STATUS_STYLES,
  formatBytes,
} from "@/lib/labels";
import { AdminMessageForm } from "@/components/AdminMessageForm";

export default async function ClientDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const client = await prisma.user.findFirst({
    where: { id: params.id, role: "CLIENT" },
    include: {
      documents: { orderBy: { createdAt: "desc" } },
      messages: { orderBy: { createdAt: "desc" } },
      loginAttempts: { orderBy: { createdAt: "desc" }, take: 12 },
    },
  });

  if (!client) notFound();

  const stats = {
    total: client.documents.length,
    enAttente: client.documents.filter((d) => d.status === "EN_ATTENTE").length,
    traite: client.documents.filter((d) => d.status === "TRAITE").length,
  };

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/admin/clients"
          className="text-sm font-semibold text-brand-600 hover:underline"
        >
          ← Retour aux clients
        </Link>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="flex h-14 w-14 items-center justify-center rounded-md bg-ink text-lg font-extrabold text-white">
              {client.name.slice(0, 2).toUpperCase()}
            </span>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-ink">
                {client.name}
              </h1>
              <p className="text-sm text-neutral-500">
                {client.company ? `${client.company} · ` : ""}
                {client.email}
              </p>
            </div>
          </div>
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${
              client.active
                ? "bg-emerald-100 text-emerald-800 ring-emerald-600/20"
                : "bg-red-100 text-red-800 ring-red-600/20"
            }`}
          >
            {client.active ? "Compte actif" : "Compte désactivé"}
          </span>
        </div>
      </div>

      <div className="grid gap-px overflow-hidden rounded-md border border-neutral-100 bg-neutral-100 sm:grid-cols-3">
        {[
          { label: "Documents", value: stats.total },
          { label: "En attente", value: stats.enAttente },
          { label: "Traités", value: stats.traite },
        ].map((s) => (
          <div key={s.label} className="bg-white p-6">
            <p className="text-sm font-medium text-neutral-500">{s.label}</p>
            <p className="mt-3 text-3xl font-extrabold tracking-tight text-ink">
              {s.value}
            </p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Documents du client */}
        <div className="rounded-md border border-neutral-100 bg-white lg:col-span-3">
          <div className="border-b border-neutral-100 px-6 py-5">
            <h2 className="text-lg font-bold tracking-tight text-ink">
              Documents déposés
            </h2>
          </div>
          {client.documents.length === 0 ? (
            <p className="px-6 py-12 text-center text-sm text-neutral-500">
              Ce client n'a déposé aucun document.
            </p>
          ) : (
            <ul className="divide-y divide-neutral-100">
              {client.documents.map((doc) => (
                <li
                  key={doc.id}
                  className="flex items-center justify-between gap-4 px-6 py-4"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-ink">
                      {doc.originalName}
                    </p>
                    <p className="text-xs text-neutral-500">
                      {DOCUMENT_TYPE_LABELS[doc.type]} · {formatBytes(doc.size)} ·{" "}
                      {new Date(doc.createdAt).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${STATUS_STYLES[doc.status]}`}
                    >
                      {STATUS_LABELS[doc.status]}
                    </span>
                    <a
                      href={`/api/admin/documents/${doc.id}/download`}
                      className="text-sm font-semibold text-brand-600 hover:underline"
                    >
                      Télécharger
                    </a>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Messagerie */}
        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-md border border-neutral-100 bg-white p-6">
            <h2 className="text-lg font-bold tracking-tight text-ink">
              Envoyer un message
            </h2>
            <div className="mt-4">
              <AdminMessageForm
                clientId={client.id}
                clientName={client.name}
                compact
              />
            </div>
          </div>

          <div className="rounded-md border border-neutral-100 bg-white p-6">
            <h2 className="text-lg font-bold tracking-tight text-ink">
              Historique des messages
            </h2>
            {client.messages.length === 0 ? (
              <p className="mt-4 text-sm text-neutral-500">
                Aucun message envoyé.
              </p>
            ) : (
              <ul className="mt-4 space-y-3">
                {client.messages.map((m) => (
                  <li
                    key={m.id}
                    className="rounded-sm border-l-2 border-brand-500 bg-neutral-50 px-4 py-3"
                  >
                    <p className="text-sm text-ink">{m.body}</p>
                    <p className="mt-1 text-xs text-neutral-400">
                      {new Date(m.createdAt).toLocaleString("fr-FR")}
                      {m.read ? " · Lu" : " · Non lu"}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* Sécurité & historique de connexion */}
      <div className="rounded-md border border-neutral-100 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-100 px-6 py-5">
          <h2 className="text-lg font-bold tracking-tight text-ink">
            Sécurité & connexions
          </h2>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-neutral-500">
              Tentatives échouées :{" "}
              <span
                className={`font-bold ${
                  client.failedAttempts > 0 ? "text-amber-600" : "text-ink"
                }`}
              >
                {client.failedAttempts}
              </span>
            </span>
            {client.locked ? (
              <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-800 ring-1 ring-inset ring-red-600/20">
                🔒 Compte bloqué
              </span>
            ) : (
              <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-800 ring-1 ring-inset ring-emerald-600/20">
                Aucun blocage
              </span>
            )}
          </div>
        </div>

        {client.loginAttempts.length === 0 ? (
          <p className="px-6 py-10 text-center text-sm text-neutral-500">
            Aucune connexion enregistrée.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left">
              <thead>
                <tr className="border-b border-neutral-100 bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500">
                  <th className="px-6 py-3 font-medium">Date</th>
                  <th className="px-6 py-3 font-medium">Heure</th>
                  <th className="px-6 py-3 font-medium">Adresse IP</th>
                  <th className="px-6 py-3 font-medium">Résultat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {client.loginAttempts.map((a) => {
                  const d = new Date(a.createdAt);
                  return (
                    <tr key={a.id} className="text-sm">
                      <td className="px-6 py-3 text-neutral-600">
                        {d.toLocaleDateString("fr-FR")}
                      </td>
                      <td className="px-6 py-3 text-neutral-600">
                        {d.toLocaleTimeString("fr-FR")}
                      </td>
                      <td className="px-6 py-3 font-mono text-xs text-neutral-600">
                        {a.ip}
                      </td>
                      <td className="px-6 py-3">
                        {a.success ? (
                          <span className="text-xs font-semibold text-emerald-600">
                            ✓ Réussie
                          </span>
                        ) : (
                          <span className="text-xs font-semibold text-red-600">
                            ✕ Échouée
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
