export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; fg: string; label: string }> = {
    active: { bg: "oklch(0.7 0.2 155 / 15%)", fg: "oklch(0.8 0.2 155)", label: "Activa" },
    suspended: { bg: "oklch(0.78 0.18 75 / 15%)", fg: "oklch(0.85 0.18 75)", label: "Suspendida" },
    expired: { bg: "oklch(0.65 0.25 25 / 15%)", fg: "oklch(0.78 0.22 25)", label: "Expirada" },
    pendiente: { bg: "oklch(0.78 0.18 75 / 15%)", fg: "oklch(0.85 0.18 75)", label: "Pendiente" },
    en_revision: { bg: "oklch(0.68 0.22 255 / 15%)", fg: "oklch(0.78 0.2 250)", label: "En revisión" },
    resuelto: { bg: "oklch(0.7 0.2 155 / 15%)", fg: "oklch(0.8 0.2 155)", label: "Resuelto" },
    cerrado: { bg: "oklch(1 0 0 / 8%)", fg: "oklch(0.7 0.04 260)", label: "Cerrado" },
  };
  const s = map[status] ?? { bg: "oklch(1 0 0 / 8%)", fg: "oklch(0.7 0.04 260)", label: status };
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium"
      style={{ background: s.bg, color: s.fg, border: `1px solid ${s.fg}30` }}>
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: s.fg }} />
      {s.label}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: string }) {
  const map: Record<string, { bg: string; fg: string; label: string }> = {
    baja: { bg: "oklch(1 0 0 / 6%)", fg: "oklch(0.7 0.04 260)", label: "Baja" },
    media: { bg: "oklch(0.68 0.22 255 / 15%)", fg: "oklch(0.78 0.2 250)", label: "Media" },
    alta: { bg: "oklch(0.78 0.18 75 / 15%)", fg: "oklch(0.85 0.18 75)", label: "Alta" },
    critica: { bg: "oklch(0.65 0.25 25 / 18%)", fg: "oklch(0.78 0.22 25)", label: "Crítica" },
  };
  const s = map[priority] ?? map.media;
  return (
    <span className="inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide"
      style={{ background: s.bg, color: s.fg, border: `1px solid ${s.fg}30` }}>
      {s.label}
    </span>
  );
}
