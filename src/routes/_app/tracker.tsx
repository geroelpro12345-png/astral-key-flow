import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import {
  Send, Inbox, Eye, Search as SearchIcon, Wrench, CheckCircle2, Flag,
  Loader2, ChevronRight,
} from "lucide-react";
import { listTrackers, advanceTracker } from "@/lib/admin.functions";
import { getAccessCode } from "@/lib/access-store";
import { PriorityBadge } from "@/components/Badges";

export const Route = createFileRoute("/_app/tracker")({
  head: () => ({ meta: [{ title: "Tracker — Nexus Vault" }] }),
  component: TrackerPage,
});

const STAGES = [
  { key: "enviado", label: "Reporte enviado", icon: Send },
  { key: "recibido", label: "Reporte recibido", icon: Inbox },
  { key: "en_revision", label: "En revisión", icon: Eye },
  { key: "investigando", label: "Investigando", icon: SearchIcon },
  { key: "resolucion_aplicada", label: "Resolución aplicada", icon: Wrench },
  { key: "finalizado", label: "Finalizado", icon: CheckCircle2 },
] as const;

function stageIndex(s: string) {
  return STAGES.findIndex(x => x.key === s);
}

function TrackerPage() {
  const qc = useQueryClient();
  const access = () => ({ accessCode: getAccessCode()! });
  const list = useServerFn(listTrackers);
  const adv = useServerFn(advanceTracker);

  const { data, isLoading } = useQuery({
    queryKey: ["trackers"], queryFn: () => list({ data: access() }), refetchInterval: 15000,
  });

  const [selected, setSelected] = useState<string | null>(null);
  const current = (data ?? []).find(t => t.id === selected) ?? (data ?? [])[0];

  const advM = useMutation({
    mutationFn: (v: { id: string; stage: string }) =>
      adv({ data: { ...access(), id: v.id, stage: v.stage as never } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["trackers"] }); toast.success("Etapa actualizada"); },
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <header>
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Seguimiento en vivo</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">Tracker de reportes</h1>
        <p className="text-sm text-muted-foreground mt-1">Igual que un seguimiento de pedido — cada reporte tiene su propia ruta visual.</p>
      </header>

      {isLoading && <div className="glass-strong rounded-2xl p-12 text-center"><Loader2 className="inline h-5 w-5 animate-spin" /></div>}

      {!isLoading && (data ?? []).length === 0 && (
        <div className="glass-strong rounded-2xl p-16 text-center">
          <Flag className="mx-auto h-10 w-10 opacity-40 mb-2" />
          <p className="text-sm text-muted-foreground">Sin trackers todavía. Se crean automáticamente al recibir un reporte.</p>
        </div>
      )}

      {data && data.length > 0 && current && (
        <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
          {/* list */}
          <aside className="glass-strong rounded-2xl p-3 max-h-[70vh] overflow-y-auto">
            <div className="px-2 py-2 text-xs uppercase tracking-widest text-muted-foreground">Reportes ({data.length})</div>
            <div className="space-y-1">
              {data.map(t => {
                const active = t.id === current.id;
                return (
                  <button key={t.id} onClick={() => setSelected(t.id)}
                    className={`w-full text-left rounded-xl px-3 py-3 transition ${active ? "" : "hover:bg-white/[0.04]"}`}
                    style={active ? { background: "linear-gradient(135deg, oklch(0.68 0.22 255 / 18%), oklch(0.62 0.25 305 / 14%))" } : undefined}>
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-medium">{t.report?.title ?? "Reporte"}</span>
                      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                    <div className="mt-1 text-[11px] text-muted-foreground truncate">
                      {t.report?.username} · {new Date(t.created_at).toLocaleDateString()}
                    </div>
                    <div className="mt-1.5">
                      <span className="text-[10px] uppercase tracking-widest text-primary/80">{t.current_stage.replace("_"," ")}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </aside>

          {/* detail */}
          <section className="glass-strong rounded-2xl p-6">
            <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] uppercase tracking-widest rounded-md bg-white/5 px-2 py-0.5">{current.report?.category}</span>
                  {current.report && <PriorityBadge priority={current.report.priority} />}
                </div>
                <h2 className="text-xl font-bold">{current.report?.title}</h2>
                <p className="text-xs text-muted-foreground mt-1">
                  De {current.report?.username} · {new Date(current.created_at).toLocaleString()}
                </p>
              </div>
            </div>

            {/* timeline visual */}
            <TrackerTimeline currentStage={current.current_stage} />

            <div className="mt-6 flex flex-wrap gap-2">
              {STAGES.map(s => {
                const active = current.current_stage === s.key;
                return (
                  <button key={s.key} disabled={active}
                    onClick={() => advM.mutate({ id: current.id, stage: s.key })}
                    className={`rounded-lg px-3 py-2 text-xs font-medium transition disabled:opacity-100 ${
                      active ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
                    style={active ? { background: "var(--gradient-primary)" } : { background: "oklch(1 0 0 / 4%)" }}>
                    {s.label}
                  </button>
                );
              })}
            </div>

            {/* history */}
            <div className="mt-8">
              <h3 className="text-xs uppercase tracking-widest text-muted-foreground mb-3">Historial</h3>
              <div className="space-y-2">
                {(current.events ?? []).sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at)).map(ev => (
                  <div key={ev.id} className="flex items-center gap-3 rounded-xl bg-white/[0.02] px-3 py-2 text-sm">
                    <span className="h-2 w-2 rounded-full" style={{ background: "var(--gradient-primary)" }} />
                    <span className="font-medium">{STAGES.find(s => s.key === ev.stage)?.label ?? ev.stage}</span>
                    <span className="ml-auto text-xs text-muted-foreground">{new Date(ev.created_at).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

function TrackerTimeline({ currentStage }: { currentStage: string }) {
  const idx = stageIndex(currentStage);
  const progress = (idx / (STAGES.length - 1)) * 100;
  return (
    <div className="relative">
      {/* base line */}
      <div className="absolute left-0 right-0 top-5 h-1 rounded-full bg-white/5" />
      {/* progress line */}
      <div className="absolute left-0 top-5 h-1 rounded-full transition-all duration-700"
        style={{ width: `${progress}%`, background: "var(--gradient-primary)", boxShadow: "0 0 12px oklch(0.68 0.22 255 / 60%)" }} />

      <ol className="relative grid grid-cols-3 sm:grid-cols-6 gap-2">
        {STAGES.map((s, i) => {
          const done = i <= idx;
          const isCurrent = i === idx;
          const Icon = s.icon;
          return (
            <li key={s.key} className="flex flex-col items-center text-center">
              <div className={`relative flex h-10 w-10 items-center justify-center rounded-full border transition ${
                done ? "border-transparent text-primary-foreground" : "border-white/10 text-muted-foreground bg-card/40"
              } ${isCurrent ? "animate-pulse-glow" : ""}`}
                style={done ? { background: "var(--gradient-primary)" } : undefined}>
                <Icon className="h-4 w-4" />
              </div>
              <span className={`mt-2 text-[10px] sm:text-xs leading-tight ${done ? "text-foreground" : "text-muted-foreground"}`}>
                {s.label}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
