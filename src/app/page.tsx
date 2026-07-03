import Link from "next/link";

const services = [
  {
    title: "Comptabilité",
    description:
      "Tenue, révision et établissement de vos comptes annuels. Une comptabilité fiable, à jour et parfaitement conforme.",
  },
  {
    title: "Fiscalité",
    description:
      "Déclarations, optimisation et sécurisation fiscale. Nous anticipons vos échéances et défendons vos intérêts.",
  },
  {
    title: "Conseil",
    description:
      "Pilotage, prévisionnels et accompagnement stratégique pour éclairer vos décisions et soutenir votre croissance.",
  },
];

const figures = [
  { value: "150+", label: "clients accompagnés" },
  { value: "10 ans", label: "d'expérience" },
  { value: "98 %", label: "de satisfaction" },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navbar fixe */}
      <header className="fixed inset-x-0 top-0 z-50 border-b border-neutral-100 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6 lg:px-10">
          <Link href="/" className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-md bg-ink text-sm font-extrabold tracking-tight text-white">
              CS
            </span>
            <span className="text-[15px] font-bold tracking-tight text-ink">
              Cabinet Samet
              <span className="hidden font-medium text-neutral-500 sm:inline">
                {" "}
                de Comptabilité
              </span>
            </span>
          </Link>
          <div className="flex items-center gap-6">
            <Link
              href="/login"
              className="text-sm font-semibold text-ink transition hover:text-brand-600"
            >
              Se connecter
            </Link>
            <Link
              href="/register"
              className="hidden rounded-sm bg-brand-500 px-5 py-2.5 text-sm font-semibold text-ink transition hover:bg-[#78a821] sm:inline-block"
            >
              Créer un compte
            </Link>
          </div>
        </div>
      </header>

      {/* Hero plein écran */}
      <section className="relative flex min-h-screen items-center overflow-hidden pt-20">
        <div className="pointer-events-none absolute -right-40 top-1/4 h-[520px] w-[520px] rounded-full bg-brand-50 blur-3xl" />
        <div className="mx-auto w-full max-w-7xl px-6 lg:px-10">
          <div className="max-w-4xl stagger">
            <div className="mb-8 flex items-center gap-3">
              <span className="h-px w-10 bg-brand-500" />
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-neutral-500">
                Portail client
              </span>
            </div>
            <h1 className="text-5xl font-extrabold leading-[1.05] tracking-tight text-ink sm:text-6xl lg:text-7xl">
              L'expertise comptable au service de votre{" "}
              <span className="text-brand-500">croissance</span>.
            </h1>
            <p className="mt-8 max-w-2xl text-lg leading-relaxed text-neutral-600 sm:text-xl">
              Le Cabinet Samet de Comptabilité digitalise votre gestion : déposez
              vos factures, contrats de leasing et relevés bancaires dans un
              espace sécurisé et suivez leur traitement en temps réel.
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-5">
              <Link
                href="/register"
                className="group inline-flex items-center gap-2 rounded-sm bg-brand-500 px-7 py-4 text-base font-semibold text-ink transition hover:bg-[#78a821]"
              >
                Accéder à votre espace
                <span className="transition-transform group-hover:translate-x-1">
                  →
                </span>
              </Link>
              <Link
                href="/login"
                className="text-base font-semibold text-ink underline-offset-4 transition hover:underline"
              >
                J'ai déjà un compte
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="border-t border-neutral-100 py-24 lg:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-10">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
              Nos domaines d'expertise
            </h2>
            <p className="mt-4 text-lg text-neutral-600">
              Un accompagnement global, à chaque étape de la vie de votre
              entreprise.
            </p>
          </div>

          <div className="mt-16 grid gap-px overflow-hidden border border-neutral-100 md:grid-cols-3">
            {services.map((service, i) => (
              <div
                key={service.title}
                className="group bg-white p-10 transition hover:bg-neutral-50"
              >
                <span className="text-sm font-bold text-brand-500">
                  0{i + 1}
                </span>
                <div className="mt-6 h-px w-12 bg-brand-500 transition-all group-hover:w-20" />
                <h3 className="mt-6 text-2xl font-bold tracking-tight text-ink">
                  {service.title}
                </h3>
                <p className="mt-4 text-[15px] leading-relaxed text-neutral-600">
                  {service.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Chiffres clés */}
      <section className="border-t border-neutral-100 bg-neutral-50 py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-10">
          <div className="grid gap-12 sm:grid-cols-3">
            {figures.map((fig) => (
              <div key={fig.label} className="text-center sm:text-left">
                <p className="text-6xl font-extrabold tracking-tight text-ink lg:text-7xl">
                  {fig.value}
                </p>
                <p className="mt-3 text-sm font-semibold uppercase tracking-wider text-neutral-500">
                  {fig.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 lg:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-10">
          <div className="flex flex-col items-start justify-between gap-8 border-l-2 border-brand-500 pl-8 lg:flex-row lg:items-center">
            <h2 className="max-w-2xl text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
              Prêt à confier votre comptabilité à un partenaire de confiance ?
            </h2>
            <Link
              href="/register"
              className="shrink-0 rounded-sm bg-brand-500 px-7 py-4 text-base font-semibold text-ink transition hover:bg-[#78a821]"
            >
              Ouvrir mon espace client
            </Link>
          </div>
        </div>
      </section>

      {/* Footer sombre */}
      <footer className="bg-ink text-neutral-400">
        <div className="mx-auto max-w-7xl px-6 py-16 lg:px-10">
          <div className="flex flex-col justify-between gap-12 lg:flex-row">
            <div className="max-w-sm">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-md bg-brand-500 text-sm font-extrabold text-ink">
                  CS
                </span>
                <span className="text-[15px] font-bold text-white">
                  Cabinet Samet de Comptabilité
                </span>
              </div>
              <p className="mt-5 text-sm leading-relaxed text-neutral-400">
                Cabinet d'expertise comptable au service des entrepreneurs, TPE
                et PME. Comptabilité, fiscalité et conseil.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-12 sm:grid-cols-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-white">
                  Cabinet
                </p>
                <ul className="mt-4 space-y-3 text-sm">
                  <li><span className="transition hover:text-brand-500">Comptabilité</span></li>
                  <li><span className="transition hover:text-brand-500">Fiscalité</span></li>
                  <li><span className="transition hover:text-brand-500">Conseil</span></li>
                </ul>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-white">
                  Espace client
                </p>
                <ul className="mt-4 space-y-3 text-sm">
                  <li>
                    <Link href="/login" className="transition hover:text-brand-500">
                      Se connecter
                    </Link>
                  </li>
                  <li>
                    <Link href="/register" className="transition hover:text-brand-500">
                      Créer un compte
                    </Link>
                  </li>
                </ul>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-white">
                  Suivez-nous
                </p>
                <ul className="mt-4 space-y-3 text-sm">
                  <li><span className="transition hover:text-brand-500">LinkedIn</span></li>
                  <li><span className="transition hover:text-brand-500">Twitter / X</span></li>
                  <li><span className="transition hover:text-brand-500">Contact</span></li>
                </ul>
              </div>
            </div>
          </div>

          <div className="mt-14 flex flex-col items-start justify-between gap-4 border-t border-neutral-800 pt-8 text-xs text-neutral-500 sm:flex-row sm:items-center">
            <p>
              © {new Date().getFullYear()} Cabinet Samet de Comptabilité. Tous
              droits réservés.
            </p>
            <p>Mentions légales · Politique de confidentialité</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
