import { prisma } from "@/lib/prisma";
import { AdminDocumentsTable } from "@/components/AdminDocumentsTable";

export default async function AdminDocumentsPage() {
  const documents = await prisma.document.findMany({
    orderBy: { createdAt: "desc" },
    include: { user: { select: { name: true, company: true } } },
  });

  const rows = documents.map((d) => ({
    id: d.id,
    originalName: d.originalName,
    type: d.type,
    status: d.status,
    size: d.size,
    note: d.note,
    createdAt: d.createdAt.toISOString(),
    clientName: d.user.name,
    clientCompany: d.user.company,
  }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-ink">
          Documents
        </h1>
        <p className="mt-2 text-[15px] text-neutral-600">
          Tous les documents déposés par les clients. Changez le statut,
          téléchargez ou ajoutez une note.
        </p>
      </div>

      <AdminDocumentsTable documents={rows} />
    </div>
  );
}
