"use client";

import { useEffect, useRef, useState } from "react";
import { CHATBOT_GREETING, getDemoResponse } from "@/lib/chatbot";

type ChatMessage = {
  id: string;
  role: "bot" | "user";
  text: string;
};

const CABINET_EMAIL = "contact@cabinet-samet.fr";

function uid() {
  return Math.random().toString(36).slice(2);
}

export function Chatbot() {
  const enabled = process.env.NEXT_PUBLIC_CHATBOT_ENABLED === "true";

  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([{ id: uid(), role: "bot", text: CHATBOT_GREETING }]);
    }
  }, [open, messages.length]);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, typing]);

  if (!enabled) return null;

  function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;

    const userMsg: ChatMessage = { id: uid(), role: "user", text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setTyping(true);

    // Simule un temps de réponse pour un rendu plus naturel.
    // En mode démo : réponses préprogrammées. Dès qu'ANTHROPIC_API_KEY sera
    // configurée côté serveur, cet appel local sera remplacé par une requête
    // vers une route API qui interroge le modèle Claude.
    setTimeout(() => {
      const reply = getDemoResponse(text);
      setMessages((prev) => [...prev, { id: uid(), role: "bot", text: reply }]);
      setTyping(false);
    }, 600);
  }

  return (
    <>
      {/* Fenêtre de chat */}
      {open && (
        <div className="fixed bottom-24 right-6 z-50 flex h-[520px] w-[380px] max-w-[calc(100vw-3rem)] flex-col overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-2xl animate-fade-up">
          {/* En-tête */}
          <div className="flex items-center justify-between bg-ink px-5 py-4">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-md bg-brand-500 text-xs font-extrabold text-ink">
                CS
              </span>
              <div>
                <p className="text-sm font-bold text-white">
                  Assistant Cabinet Samet
                </p>
                <p className="flex items-center gap-1.5 text-xs text-neutral-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
                  Mode démo
                </p>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              aria-label="Fermer le chat"
              className="text-neutral-400 transition hover:text-white"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto bg-neutral-50 px-4 py-4">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-3.5 py-2.5 text-sm leading-relaxed ${
                    m.role === "user"
                      ? "bg-brand-500 text-ink"
                      : "border border-neutral-200 bg-white text-ink"
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}
            {typing && (
              <div className="flex justify-start">
                <div className="flex items-center gap-1 rounded-lg border border-neutral-200 bg-white px-3.5 py-3">
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-neutral-400 [animation-delay:-0.3s]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-neutral-400 [animation-delay:-0.15s]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-neutral-400" />
                </div>
              </div>
            )}
          </div>

          {/* Action contact comptable */}
          <div className="border-t border-neutral-100 px-4 py-3">
            <a
              href={`mailto:${CABINET_EMAIL}`}
              className="flex w-full items-center justify-center gap-2 rounded-sm border border-neutral-200 px-4 py-2.5 text-sm font-semibold text-ink transition hover:border-brand-500 hover:text-brand-700"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <path d="m22 7-10 5L2 7" />
              </svg>
              Contacter mon comptable
            </a>
          </div>

          {/* Saisie */}
          <form onSubmit={sendMessage} className="flex items-center gap-2 border-t border-neutral-100 px-4 py-3">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Écrivez votre message..."
              className="flex-1 rounded-sm border border-neutral-200 px-3 py-2 text-sm text-ink outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
            />
            <button
              type="submit"
              disabled={!input.trim()}
              aria-label="Envoyer"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm bg-brand-500 text-ink transition hover:bg-[#78a821] disabled:opacity-40"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </form>

          {/* Disclaimer */}
          <p className="bg-amber-50 px-4 py-2 text-center text-[11px] font-medium text-amber-800">
            ⚠️ Assistant IA — bientôt disponible
          </p>
        </div>
      )}

      {/* Bouton flottant */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Fermer le chat" : "Ouvrir le chat"}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-brand-500 text-ink shadow-lg transition hover:scale-105 hover:bg-[#78a821] active:scale-95"
      >
        {open ? (
          <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        ) : (
          <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
          </svg>
        )}
      </button>
    </>
  );
}
