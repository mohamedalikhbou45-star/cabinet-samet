"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { Chatbot } from "@/components/Chatbot";
import { SessionTimeoutGuard } from "@/components/SessionTimeoutGuard";

const links = [
  { href: "/dashboard", label: "Tableau de bord", icon: GridIcon },
  { href: "/dashboard/documents", label: "Déposer un document", icon: UploadIcon },
  { href: "/dashboard/historique", label: "Historique", icon: ClockIcon },
  { href: "/profile", label: "Mon profil", icon: UserIcon },
];

export function DashboardShell({
  userName,
  children,
}: {
  userName: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const initials = userName
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const nav = (
    <nav className="flex flex-1 flex-col gap-1 px-4">
      {links.map((link) => {
        const active = pathname === link.href;
        const Icon = link.icon;
        return (
          <Link
            key={link.href}
            href={link.href}
            onClick={() => setOpen(false)}
            className={`group flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition ${
              active
                ? "bg-brand-500 text-ink"
                : "text-neutral-400 hover:bg-white/5 hover:text-white"
            }`}
          >
            <Icon className="h-[18px] w-[18px]" />
            {link.label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Sidebar desktop */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col bg-ink lg:flex">
        <div className="flex h-20 items-center gap-3 px-6">
          <span className="flex h-10 w-10 items-center justify-center rounded-md bg-brand-500 text-sm font-extrabold text-ink">
            CS
          </span>
          <span className="text-sm font-bold leading-tight text-white">
            Cabinet Samet
            <span className="block text-xs font-medium text-neutral-500">
              Espace client
            </span>
          </span>
        </div>
        <div className="mt-4 flex flex-1 flex-col">{nav}</div>
        <div className="border-t border-white/10 p-4">
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-neutral-400 transition hover:bg-white/5 hover:text-white"
          >
            <LogoutIcon className="h-[18px] w-[18px]" />
            Déconnexion
          </button>
        </div>
      </aside>

      {/* Drawer mobile */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-ink/50 backdrop-blur-sm animate-fade-in"
            onClick={() => setOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 flex w-64 flex-col bg-ink">
            <div className="flex h-20 items-center justify-between px-6">
              <span className="flex h-10 w-10 items-center justify-center rounded-md bg-brand-500 text-sm font-extrabold text-ink">
                CS
              </span>
              <button
                onClick={() => setOpen(false)}
                className="text-neutral-400 hover:text-white"
                aria-label="Fermer le menu"
              >
                ✕
              </button>
            </div>
            <div className="mt-4 flex flex-1 flex-col">{nav}</div>
            <div className="border-t border-white/10 p-4">
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-neutral-400 transition hover:bg-white/5 hover:text-white"
              >
                <LogoutIcon className="h-[18px] w-[18px]" />
                Déconnexion
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Contenu */}
      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-neutral-100 bg-white/90 px-6 backdrop-blur lg:px-10">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setOpen(true)}
              className="text-ink lg:hidden"
              aria-label="Ouvrir le menu"
            >
              <MenuIcon className="h-6 w-6" />
            </button>
            <div>
              <p className="text-xs font-medium text-neutral-500">Bienvenue</p>
              <p className="text-sm font-bold text-ink">{userName}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button
              className="relative flex h-10 w-10 items-center justify-center rounded-full border border-neutral-200 text-neutral-600 transition hover:border-neutral-300 hover:text-ink"
              aria-label="Notifications"
            >
              <BellIcon className="h-5 w-5" />
              <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-brand-500 ring-2 ring-white" />
            </button>
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-ink text-xs font-bold text-white">
              {initials}
            </span>
          </div>
        </header>

        <main className="mx-auto max-w-6xl px-6 py-10 lg:px-10">{children}</main>
      </div>

      {/* Chatbot — visible uniquement dans l'espace client authentifié. */}
      <Chatbot />
      <SessionTimeoutGuard logoutUrl="/login" />
    </div>
  );
}

function UserIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}
function GridIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}
function UploadIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );
}
function ClockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <polyline points="12 7 12 12 15 14" />
    </svg>
  );
}
function LogoutIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}
function BellIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}
function MenuIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}
