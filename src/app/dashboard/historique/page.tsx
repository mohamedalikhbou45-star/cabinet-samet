import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { HistoryTable } from "@/components/HistoryTable";

export default async function HistoriquePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  const userId = session.user.id;

  const documents = await prisma.document.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  const serialized = documents.map((d) => ({
    id: d.id,
    originalName: d.originalName,
    type: d.type,
    status: d.status,
    size: d.size,
    createdAt: d.createdAt.toISOString(),
  }));

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-ink">
            Historique des documents
          </h1>
          <p className="mt-2 max-w-2xl text-[15px] text-neutral-600">
            Suivez le statut de chaque document déposé. Une notification par
            email est envoyée à chaque changement de statut.
          </p>
        </div>
        <Link
          href="/dashboard/documents"
          className="rounded-sm bg-brand-500 px-5 py-3 text-sm font-semibold text-ink transition hover:bg-[#78a821]"
        >
          + Déposer un document
        </Link>
      </div>

      {serialized.length === 0 ? (
        <div className="rounded-md border border-neutral-100 bg-white px-6 py-16 text-center">
          <p className="text-sm text-neutral-500">
            Aucun document dans votre historique pour le moment.
          </p>
        </div>
      ) : (
        <HistoryTable initialDocuments={serialized} />
      )}
    </div>
  );
}
