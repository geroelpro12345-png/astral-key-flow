import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Search, FileWarning, Loader2, Plus, Trash2, X } from "lucide-react";
import { listReports, updateReport, deleteReport, createReport } from "@/lib/admin.functions";
import { getAccessCode } from "@/lib/access-store";
import { PriorityBadge, StatusBadge } from "@/components/Badges";

export const Route = createFileRoute("/_app/reports")({
  head: () => ({ meta: [{ title: "Reportes — Nexus Vault" }] }),
  component: ReportsPage,
});

const STATUSES = ["pendiente","en_revision","resuelto","cerrado"] as const;
const PRIORITIES = ["baja","media","alta","critica"] as const;

function ReportsPage() {
  const qc = useQueryClient();
  const access = () => ({ accessCode: getAccessCode()! });
  const list = useServerFn(listReports);
  const upd = useServerFn(updateReport);
  const del = useServerFn(deleteReport);
  const create = useServerFn(createReport);

  const { data, isLoading } = useQuery({
    queryKey: ["reports"], queryFn: () => list({ data: access() }), refetchInterval: 20000,
  });

  const [q, setQ] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [openCreate, setOpenCreate] = useState(false);

  const updM = useMutation({
    mutationFn: (v: { id: string; status?: string; priority?: string }) =>
      upd({ data: { ...access(), id: v.id, status: v.status as never, priority: v.priority as never } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["reports"] }),
  });
  const delM = useMutation({
    mutationFn: (id: string) => del({ data: { ...access(), id } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["reports"] }); toast.success("Reporte eliminado"); },
  });
  const createM = useMutation({
    mutationFn: (v: { title: string; username: string; category: string; priority: string; description?: string }) =>
      create({ data: { ...access(), ...v, priority: v.priority as never } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["reports"] }); toast.success("Reporte creado"); setOpenCreate(false); },
    onError: (e) => toast.error(e.message),
  });

  const filtered = useMemo(() => {
    return (data ?? []).filter(r => {
      if (status !== "all" && r.status !== status) return false;
      if (q) {
        const s = q.toLowerCase();
        if (!r.title.toLowerCase().includes(s) && !r.username.toLowerCase().includes(s) && !r.category.toLowerCase().includes(s)) return false;
      }
      return true;
    });
  }, [data, q, status]);

  return (
    <div className="space-y-6 animate-fade-in">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Centro de incidencias</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">Reportes</h1>
        </div>
        <button onClick={() => setOpenCreate(true)}
          className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-primary-foreground"
          style={{ background: "var(--gradient-primary)", boxShadow: "var(--shadow-elegant)" }}>
          <Plus className="h-4 w-4" /> Nuevo reporte
        </button>
      </header>

      <div className="glass-strong rounded-2xl p-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar reportes…"
            className="w-full rounded-lg bg-input/40 border border-border pl-10 pr-3 py-2.5 text-sm outline-none focus:border-primary/50" />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {(["all", ...STATUSES] as const).map(s => (
            <button key={s} onClick={() => setStatus(s)}
              className={`rounded-lg px-3 py-2 text-xs font-medium transition ${status === s ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
              style={status === s ? { background: "var(--gradient-primary)" } : { background: "oklch(1 0 0 / 4%)" }}>
              {s === "all" ? "Todos" : s.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-3">
        {isLoading && <div className="glass-strong rounded-2xl p-12 text-center"><Loader2 className="inline h-5 w-5 animate-spin" /></div>}
        {!isLoading && filtered.length === 0 && (
          <div className="glass-strong rounded-2xl p-16 text-center">
            <FileWarning className="mx-auto h-10 w-10 opacity-40 mb-2" />
            <p className="text-sm text-muted-foreground">Sin reportes. El bot de Discord puede crearlos vía <code className="text-primary">POST /api/public/discord-report</code>.</p>
          </div>
        )}
        {filtered.map(r => (
          <div key={r.id} className="glass-strong rounded-2xl p-5 transition hover:-translate-y-0.5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase tracking-widest text-muted-foreground rounded-md bg-white/5 px-2 py-0.5">{r.category}</span>
                  <PriorityBadge priority={r.priority} />
                </div>
                <h3 className="mt-2 font-semibold text-lg">{r.title}</h3>
                {r.description && <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{r.description}</p>}
                <div className="mt-3 text-xs text-muted-foreground">
                  <span className="text-foreground/80">{r.username}</span> · {new Date(r.created_at).toLocaleString()}
                  {r.discord_user_id && <span> · Discord: <code className="text-primary/80">{r.discord_user_id}</code></span>}
                </div>
              </div>
              <div className="flex flex-col gap-2 items-end">
                <StatusBadge status={r.status} />
                <div className="flex gap-1.5">
                  <select value={r.status}
                    onChange={(e) => updM.mutate({ id: r.id, status: e.target.value })}
                    className="rounded-lg bg-input/50 border border-border px-2 py-1.5 text-xs outline-none focus:border-primary/50">
                    {STATUSES.map(s => <option key={s} value={s}>{s.replace("_"," ")}</option>)}
                  </select>
                  <select value={r.priority}
                    onChange={(e) => updM.mutate({ id: r.id, priority: e.target.value })}
                    className="rounded-lg bg-input/50 border border-border px-2 py-1.5 text-xs outline-none focus:border-primary/50">
                    {PRIORITIES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <button onClick={() => { if (confirm("¿Eliminar reporte?")) delM.mutate(r.id); }}
                    className="rounded-lg border border-white/5 p-2 hover:bg-destructive/20 hover:text-destructive">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {openCreate && <CreateModal loading={createM.isPending}
        onClose={() => setOpenCreate(false)} onSubmit={(v) => createM.mutate(v)} />}
    </div>
  );
}

function CreateModal({ onClose, onSubmit, loading }: {
  onClose: () => void;
  onSubmit: (v: { title: string; username: string; category: string; priority: string; description?: string }) => void;
  loading: boolean;
}) {
  const [title, setTitle] = useState("");
  const [username, setUsername] = useState("");
  const [category, setCategory] = useState("general");
  const [priority, setPriority] = useState("media");
  const [description, setDescription] = useState("");
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md bg-black/50 animate-fade-in">
      <div className="glass-strong glow-border w-full max-w-lg rounded-2xl p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-semibold">Nuevo reporte</h3>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-white/10"><X className="h-4 w-4" /></button>
        </div>
        <div className="space-y-3">
          <Field label="Título"><input value={title} onChange={(e) => setTitle(e.target.value)} className={inp}/></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Usuario"><input value={username} onChange={(e) => setUsername(e.target.value)} className={inp}/></Field>
            <Field label="Categoría"><input value={category} onChange={(e) => setCategory(e.target.value)} className={inp}/></Field>
          </div>
          <Field label="Prioridad">
            <select value={priority} onChange={(e) => setPriority(e.target.value)} className={inp}>
              {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </Field>
          <Field label="Descripción">
            <textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} className={inp}/>
          </Field>
        </div>
        <button disabled={loading || !title || !username}
          onClick={() => onSubmit({ title, username, category, priority, description: description || undefined })}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-50"
          style={{ background: "var(--gradient-primary)" }}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Crear
        </button>
      </div>
    </div>
  );
}

const inp = "w-full rounded-lg bg-input/40 border border-border px-3 py-2.5 text-sm outline-none focus:border-primary/50";
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs uppercase tracking-widest text-muted-foreground">{label}</label>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}
