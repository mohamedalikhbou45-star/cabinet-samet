import Link from "next/link";

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 py-12">
        <div className="animate-fade-up">
          <Link href="/" className="mb-12 inline-flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-md bg-ink text-sm font-extrabold text-white">
              CS
            </span>
            <span className="text-[15px] font-bold tracking-tight text-ink">
              Cabinet Samet
              <span className="font-medium text-neutral-500"> de Comptabilité</span>
            </span>
          </Link>

          <h1 className="text-3xl font-extrabold tracking-tight text-ink">
            {title}
          </h1>
          <p className="mt-3 text-[15px] text-neutral-600">{subtitle}</p>

          <div className="mt-10">{children}</div>

          <div className="mt-8 text-sm text-neutral-600">{footer}</div>
        </div>
      </div>

      <footer className="border-t border-neutral-100 py-6">
        <p className="text-center text-xs text-neutral-400">
          © {new Date().getFullYear()} Cabinet Samet de Comptabilité
        </p>
      </footer>
    </div>
  );
}
