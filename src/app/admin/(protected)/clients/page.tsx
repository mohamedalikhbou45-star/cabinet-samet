import { prisma } from "@/lib/prisma";
import { AdminClientsTable } from "@/components/AdminClientsTable";

export default async function AdminClientsPage() {
  const clients = await prisma.user.findMany({
    where: { role: "CLIENT" },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { documents: true } } },
  });

  const rows = clients.map((c) => ({
    id: c.id,
    name: c.name,
    email: c.email,
    company: c.company,
    createdAt: c.createdAt.toISOString(),
    active: c.active,
    locked: c.locked,
    failedAttempts: c.failedAttempts,
    docCount: c._count.documents,
  }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-ink">
          Clients
        </h1>
        <p className="mt-2 text-[15px] text-neutral-600">
          {rows.length} client{rows.length > 1 ? "s" : ""} inscrit
          {rows.length > 1 ? "s" : ""} au portail.
        </p>
      </div>

      <AdminClientsTable clients={rows} />
    </div>
  );
}
