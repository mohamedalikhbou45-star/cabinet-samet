export type WeekBar = { label: string; count: number };

/**
 * Histogramme simple des dépôts par semaine (série unique, vert de marque).
 * Rendu en HTML/CSS — barres ancrées à la ligne de base, extrémités arrondies.
 */
export function WeeklyChart({ data }: { data: WeekBar[] }) {
  const max = Math.max(1, ...data.map((d) => d.count));

  return (
    <div>
      <div className="flex h-52 items-end gap-3">
        {data.map((bar, i) => {
          const heightPct = (bar.count / max) * 100;
          return (
            <div
              key={i}
              className="group relative flex flex-1 flex-col items-center justify-end"
            >
              {/* Valeur au survol */}
              <div className="pointer-events-none absolute -top-7 rounded bg-ink px-2 py-1 text-xs font-semibold text-white opacity-0 transition group-hover:opacity-100">
                {bar.count}
              </div>
              <div
                className="w-full rounded-t-[4px] bg-brand-500 transition-all duration-500 group-hover:bg-[#78a821]"
                style={{ height: `${Math.max(heightPct, bar.count > 0 ? 6 : 2)}%` }}
              />
            </div>
          );
        })}
      </div>
      <div className="mt-3 flex gap-3 border-t border-neutral-100 pt-3">
        {data.map((bar, i) => (
          <span
            key={i}
            className="flex-1 text-center text-[11px] font-medium text-neutral-500"
          >
            {bar.label}
          </span>
        ))}
      </div>
    </div>
  );
}
