import { prisma } from "@/lib/prisma";
import { AdminMessenger } from "@/components/AdminMessenger";

export default async function AdminMessagesPage() {
  const [clients, recentMessages] = await Promise.all([
    prisma.user.findMany({
      where: { role: "CLIENT" },
      orderBy: { name: "asc" },
      select: { id: true, name: true, company: true },
    }),
    prisma.message.findMany({
      orderBy: { createdAt: "desc" },
      take: 15,
      include: { user: { select: { name: true } } },
    }),
  ]);

  const recent = recentMessages.map((m) => ({
    id: m.id,
    body: m.body,
    createdAt: m.createdAt.toISOString(),
    clientName: m.user.name,
  }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-ink">
          Messagerie
        </h1>
        <p className="mt-2 text-[15px] text-neutral-600">
          Envoyez un message à un client. Il le retrouvera directement dans son
          espace.
        </p>
      </div>

      <AdminMessenger clients={clients} recent={recent} />
    </div>
  );
}
