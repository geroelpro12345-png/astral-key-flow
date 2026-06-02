import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { motion } from "framer-motion";
import { KeyRound, FileWarning, Route as RouteIcon, Activity, Sparkles, AlertTriangle, Clock } from "lucide-react";
import { getDashboardStats } from "@/lib/admin.functions";
import { getAccessCode } from "@/lib/access-store";
import { StatusBadge, PriorityBadge } from "@/components/Badges";
import { SkeletonCard } from "@/components/SkeletonCard";
import { StaggerList, StaggerItem } from "@/components/PageTransition";

export const Route = createFileRoute("/_app/dashboard")({
  head: () => ({ meta: [{ title: "Resumen — Nexus Vault" }] }),
  component: Dashboard,
});

function Dashboard() {
  const fn = useServerFn(getDashboardStats);
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => fn({ data: { accessCode: getAccessCode()! } }),
    refetchInterval: 15000,
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Panel principal</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">Resumen del sistema</h1>
        </div>
        <div className="glass rounded-full px-4 py-2 text-xs flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-[oklch(0.7_0.2_155)] animate-pulse" />
          Sistema operativo · Datos en vivo
        </div>
      </header>

      <StaggerList className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
        ) : (
          <>
            <StaggerItem><StatCard icon={KeyRound} label="Keys activas" value={data?.keysActive ?? 0} sub={`${data?.keysTotal ?? 0} totales`} tone="primary" /></StaggerItem>
            <StaggerItem><StatCard icon={FileWarning} label="Reportes" value={data?.reportsTotal ?? 0} sub={`${data?.reportsPending ?? 0} pendientes`} tone="secondary" /></StaggerItem>
            <StaggerItem><StatCard icon={RouteIcon} label="Trackers activos" value={data?.trackersActive ?? 0} sub="En proceso" tone="primary" /></StaggerItem>
            <StaggerItem><StatCard icon={AlertTriangle} label="Críticos" value={data?.reportsCritical ?? 0} sub="Prioridad máxima" tone="danger" /></StaggerItem>
          </>
        )}
      </StaggerList>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="glass-strong rounded-2xl p-6 lg:col-span-2 scan-line-overlay">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-semibold uppercase tracking-widest">Actividad reciente</h2>
            </div>
            <span className="text-xs text-muted-foreground">Últimos reportes</span>
          </div>
          <div className="space-y-2">
            {isLoading && Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-14 rounded-xl bg-white/5 animate-shimmer" />
            ))}
            {data?.recentReports.length === 0 && !isLoading && (
              <p className="py-12 text-center text-sm text-muted-foreground">Sin reportes todavía. El bot de Discord puede enviar a <code className="text-primary">/api/public/discord-report</code>.</p>
            )}
            {data?.recentReports.map((r) => (
              <div key={r.id} className="group flex items-center justify-between gap-3 rounded-xl border border-transparent bg-white/[0.02] px-4 py-3 transition hover:border-primary/20 hover:bg-white/[0.04]">
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">{r.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {r.username} · {new Date(r.created_at).toLocaleString()}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <PriorityBadge priority={r.priority} />
                  <StatusBadge status={r.status} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-strong rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="h-4 w-4 text-secondary" />
            <h2 className="text-sm font-semibold uppercase tracking-widest">Resumen rápido</h2>
          </div>
          <ul className="space-y-3 text-sm">
            <Row label="Keys suspendidas" value={data?.keysSuspended ?? 0} />
            <Row label="Reportes pendientes" value={data?.reportsPending ?? 0} />
            <Row label="Trackers en curso" value={data?.trackersActive ?? 0} />
            <Row label="Prioridad crítica" value={data?.reportsCritical ?? 0} highlight />
          </ul>

          <div className="mt-6 rounded-xl border border-primary/20 bg-primary/5 p-4 text-xs">
            <div className="flex items-center gap-2 text-primary mb-1"><Clock className="h-3.5 w-3.5" />Auto-refresh activo</div>
            <p className="text-muted-foreground">Los datos se actualizan cada 15 s en tiempo real.</p>
          </div>
        </div>
      </section>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, sub, tone }: {
  icon: React.ComponentType<{ className?: string }>;
  label: string; value: number; sub: string;
  tone: "primary" | "secondary" | "danger";
}) {
  const glow = tone === "primary" ? "var(--shadow-glow-blue)"
    : tone === "secondary" ? "var(--shadow-glow-purple)"
    : "0 0 32px oklch(0.65 0.25 25 / 30%)";
  const grad = tone === "primary"
    ? "linear-gradient(135deg, oklch(0.68 0.22 255 / 25%), transparent)"
    : tone === "secondary"
    ? "linear-gradient(135deg, oklch(0.62 0.25 305 / 25%), transparent)"
    : "linear-gradient(135deg, oklch(0.65 0.25 25 / 25%), transparent)";
  return (
    <div className="glass-strong group relative overflow-hidden rounded-2xl p-5 hover-lift cursor-default"
      style={{ boxShadow: `var(--shadow-card), ${glow}` }}>
      <div className="absolute -top-12 -right-12 h-32 w-32 rounded-full blur-2xl opacity-50 group-hover:opacity-80 transition-opacity duration-500 animate-glow-pulse" style={{ background: grad }} />
      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">{label}</p>
          <motion.p
            key={value}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mt-2 font-display text-4xl font-bold tabular-nums"
          >
            {value}
          </motion.p>
          <p className="mt-1 text-xs text-muted-foreground">{sub}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-2.5 transition-transform duration-500 group-hover:rotate-12 group-hover:scale-110">
          <Icon className="h-5 w-5 text-foreground/90" />
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  return (
    <li className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={`font-mono text-lg ${highlight ? "text-destructive" : "text-foreground"}`}>{value}</span>
    </li>
  );
}
