"use client";

import { useState } from "react";

type ClientOption = { id: string; name: string; company: string | null };
type SentMessage = {
  id: string;
  body: string;
  createdAt: string;
  clientName: string;
};

export function AdminMessenger({
  clients,
  recent,
}: {
  clients: ClientOption[];
  recent: SentMessage[];
}) {
  const [clientId, setClientId] = useState(clients[0]?.id ?? "");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [sent, setSent] = useState<SentMessage[]>(recent);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!clientId || !body.trim()) return;
    setSending(true);
    setFeedback("");
    try {
      const res = await fetch("/api/admin/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: clientId, body }),
      });
      if (res.ok) {
        const client = clients.find((c) => c.id === clientId);
        const data = await res.json();
        setSent((prev) => [
          {
            id: data.message.id,
            body: data.message.body,
            createdAt: data.message.createdAt,
            clientName: client?.name ?? "Client",
          },
          ...prev,
        ]);
        setBody("");
        setFeedback(`Message envoyé à ${client?.name}.`);
      } else {
        const data = await res.json().catch(() => ({}));
        setFeedback(data.error ?? "Échec de l'envoi.");
      }
    } catch {
      setFeedback("Erreur réseau.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      <div className="rounded-md border border-neutral-100 bg-white p-6 lg:col-span-2">
        <h2 className="text-lg font-bold tracking-tight text-ink">
          Nouveau message
        </h2>
        {clients.length === 0 ? (
          <p className="mt-4 text-sm text-neutral-500">
            Aucun client à contacter pour le moment.
          </p>
        ) : (
          <form onSubmit={send} className="mt-4 space-y-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-neutral-700">
                Destinataire
              </label>
              <select
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className="w-full rounded-sm border border-neutral-200 px-3 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
              >
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                    {c.company ? ` — ${c.company}` : ""}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-neutral-700">
                Message
              </label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={5}
                placeholder="Votre message au client..."
                className="w-full resize-none rounded-sm border border-neutral-200 px-4 py-3 text-sm text-ink outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
              />
            </div>
            {feedback && (
              <p className="text-sm font-medium text-brand-700">{feedback}</p>
            )}
            <button
              type="submit"
              disabled={sending || !body.trim()}
              className="w-full rounded-sm bg-brand-500 px-5 py-3 text-sm font-semibold text-ink transition hover:bg-[#78a821] disabled:opacity-50"
            >
              {sending ? "Envoi..." : "Envoyer le message"}
            </button>
          </form>
        )}
      </div>

      <div className="rounded-md border border-neutral-100 bg-white lg:col-span-3">
        <div className="border-b border-neutral-100 px-6 py-5">
          <h2 className="text-lg font-bold tracking-tight text-ink">
            Messages envoyés récemment
          </h2>
        </div>
        {sent.length === 0 ? (
          <p className="px-6 py-12 text-center text-sm text-neutral-500">
            Aucun message envoyé pour l'instant.
          </p>
        ) : (
          <ul className="divide-y divide-neutral-100">
            {sent.map((m) => (
              <li key={m.id} className="px-6 py-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-ink">
                    À {m.clientName}
                  </p>
                  <span className="text-xs text-neutral-400">
                    {new Date(m.createdAt).toLocaleString("fr-FR")}
                  </span>
                </div>
                <p className="mt-1 text-sm text-neutral-600">{m.body}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
