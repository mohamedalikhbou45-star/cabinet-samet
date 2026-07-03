"use client";

import { useState } from "react";

export function AdminMessageForm({
  clientId,
  clientName,
  compact,
}: {
  clientId: string;
  clientName: string;
  compact?: boolean;
}) {
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState("");

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    setSending(true);
    setFeedback("");
    try {
      const res = await fetch("/api/admin/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: clientId, body }),
      });
      if (res.ok) {
        setBody("");
        setFeedback(`Message envoyé à ${clientName}.`);
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
    <form onSubmit={send} className="space-y-3">
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={compact ? 3 : 4}
        placeholder={`Écrire un message à ${clientName}...`}
        className="w-full resize-none rounded-sm border border-neutral-200 px-4 py-3 text-sm text-ink outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
      />
      <div className="flex items-center justify-between gap-4">
        {feedback ? (
          <p className="text-sm font-medium text-brand-700">{feedback}</p>
        ) : (
          <span className="text-xs text-neutral-400">
            Le client verra ce message dans son espace.
          </span>
        )}
        <button
          type="submit"
          disabled={sending || !body.trim()}
          className="shrink-0 rounded-sm bg-brand-500 px-5 py-2.5 text-sm font-semibold text-ink transition hover:bg-[#78a821] disabled:opacity-50"
        >
          {sending ? "Envoi..." : "Envoyer"}
        </button>
      </div>
    </form>
  );
}
