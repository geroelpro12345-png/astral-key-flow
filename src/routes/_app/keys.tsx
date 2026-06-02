import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Plus, Search, Copy, Eye, EyeOff, Trash2, PauseCircle, PlayCircle,
  KeyRound, Loader2, X,
} from "lucide-react";
import {
  listKeys, createKey, updateKeyStatus, deleteKey, revealKey,
} from "@/lib/admin.functions";
import { getAccessCode } from "@/lib/access-store";
import { StatusBadge } from "@/components/Badges";

export const Route = createFileRoute("/_app/keys")({
  head: () => ({ meta: [{ title: "Keys — Nexus Vault" }] }),
  component: KeysPage,
});

const DURATIONS = [
  { v: "1d", l: "1 día" }, { v: "7d", l: "7 días" }, { v: "15d", l: "15 días" },
  { v: "30d", l: "30 días" }, { v: "60d", l: "60 días" }, { v: "90d", l: "90 días" },
  { v: "permanent", l: "Permanente" },
] as const;

function maskKey(code: string) {
  const parts = code.split("-");
  return parts.map((p, i) => i === parts.length - 1 ? p : "XXXX").join("-");
}

function KeysPage() {
  const qc = useQueryClient();
  const list = useServerFn(listKeys);
  const create = useServerFn(createKey);
  const upd = useServerFn(updateKeyStatus);
  const del = useServerFn(deleteKey);
  const reveal = useServerFn(revealKey);

  const access = () => ({ accessCode: getAccessCode()! });

  const { data, isLoading } = useQuery({
    queryKey: ["keys"],
    queryFn: () => list({ data: access() }),
  });

  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [revealed, setRevealed] = useState<Record<string, string>>({});
  const [openCreate, setOpenCreate] = useState(false);

  const filtered = useMemo(() => {
    return (data ?? []).filter(k => {
      if (statusFilter !== "all" && k.status !== statusFilter) return false;
      if (q && !k.code.toLowerCase().includes(q.toLowerCase()) &&
          !(k.user_associated ?? "").toLowerCase().includes(q.toLowerCase())) return false;
      return true;
    });
  }, [data, q, statusFilter]);

  const createM = useMutation({
    mutationFn: (input: { duration: string; user_associated?: string; notes?: string }) =>
      create({ data: { ...access(), duration: input.duration as never, user_associated: input.user_associated, notes: input.notes } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["keys"] }); toast.success("Key creada"); setOpenCreate(false); },
    onError: (e) => toast.error(e.message),
  });

  const statusM = useMutation({
    mutationFn: (v: { id: string; status: "active"|"suspended"|"expired" }) =>
      upd({ data: { ...access(), id: v.id, status: v.status } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["keys"] }); toast.success("Estado actualizado"); },
  });
  const delM = useMutation({
    mutationFn: (id: string) => del({ data: { ...access(), id } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["keys"] }); toast.success("Key eliminada"); },
  });

  async function onReveal(id: string) {
    if (revealed[id]) {
      const copy = { ...revealed }; delete copy[id]; setRevealed(copy);
      return;
    }
    try {
      const { code } = await reveal({ data: { ...access(), id } });
      setRevealed(prev => ({ ...prev, [id]: code }));
      toast("Key revelada por 15 s");
      setTimeout(() => setRevealed(prev => { const c = { ...prev }; delete c[id]; return c; }), 15000);
    } catch (e: unknown) { toast.error((e as Error).message); }
  }

  async function onCopy(id: string) {
    const { code } = await reveal({ data: { ...access(), id } });
    await navigator.clipboard.writeText(code);
    toast.success("Key copiada al portapapeles");
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Licencias</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">Gestión de Keys</h1>
        </div>
        <button onClick={() => setOpenCreate(true)}
          className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:scale-[1.02]"
          style={{ background: "var(--gradient-primary)", boxShadow: "var(--shadow-elegant)" }}>
          <Plus className="h-4 w-4" /> Nueva Key
        </button>
      </header>

      {/* filters */}
      <div className="glass-strong rounded-2xl p-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por código o usuario…"
            className="w-full rounded-lg bg-input/40 border border-border pl-10 pr-3 py-2.5 text-sm outline-none focus:border-primary/50" />
        </div>
        <div className="flex gap-1.5">
          {["all","active","suspended","expired"].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`rounded-lg px-3 py-2 text-xs font-medium capitalize transition ${
                statusFilter === s ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
              style={statusFilter === s ? { background: "var(--gradient-primary)" } : { background: "oklch(1 0 0 / 4%)" }}>
              {s === "all" ? "Todas" : s === "active" ? "Activas" : s === "suspended" ? "Suspendidas" : "Expiradas"}
            </button>
          ))}
        </div>
      </div>

      {/* table */}
      <div className="glass-strong rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs uppercase tracking-widest text-muted-foreground">
              <tr className="border-b border-white/5">
                <th className="px-5 py-3 text-left">Key</th>
                <th className="px-5 py-3 text-left">Estado</th>
                <th className="px-5 py-3 text-left">Duración</th>
                <th className="px-5 py-3 text-left">Usuario</th>
                <th className="px-5 py-3 text-left">Creada</th>
                <th className="px-5 py-3 text-left">Expira</th>
                <th className="px-5 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr><td colSpan={7} className="p-12 text-center text-muted-foreground">
                  <Loader2 className="inline h-5 w-5 animate-spin" />
                </td></tr>
              )}
              {!isLoading && filtered.length === 0 && (
                <tr><td colSpan={7} className="p-16 text-center text-muted-foreground">
                  <KeyRound className="mx-auto h-8 w-8 mb-2 opacity-40" />
                  Sin keys. Crea la primera con el botón superior.
                </td></tr>
              )}
              {filtered.map(k => (
                <tr key={k.id} className="border-b border-white/5 hover:bg-white/[0.02] transition">
                  <td className="px-5 py-3 font-mono text-xs">
                    <span className="text-foreground">{revealed[k.id] ?? maskKey(k.code)}</span>
                  </td>
                  <td className="px-5 py-3"><StatusBadge status={k.status} /></td>
                  <td className="px-5 py-3 text-muted-foreground">{labelDuration(k.duration)}</td>
                  <td className="px-5 py-3 text-muted-foreground">{k.user_associated ?? "—"}</td>
                  <td className="px-5 py-3 text-xs text-muted-foreground">{new Date(k.created_at).toLocaleDateString()}</td>
                  <td className="px-5 py-3 text-xs text-muted-foreground">
                    {k.expires_at ? new Date(k.expires_at).toLocaleDateString() : "∞"}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex justify-end gap-1.5">
                      <IconBtn title="Ver/Ocultar" onClick={() => onReveal(k.id)}>
                        {revealed[k.id] ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      </IconBtn>
                      <IconBtn title="Copiar" onClick={() => onCopy(k.id)}><Copy className="h-3.5 w-3.5" /></IconBtn>
                      {k.status === "active" ? (
                        <IconBtn title="Suspender" onClick={() => statusM.mutate({ id: k.id, status: "suspended" })}>
                          <PauseCircle className="h-3.5 w-3.5" />
                        </IconBtn>
                      ) : (
                        <IconBtn title="Reactivar" onClick={() => statusM.mutate({ id: k.id, status: "active" })}>
                          <PlayCircle className="h-3.5 w-3.5" />
                        </IconBtn>
                      )}
                      <IconBtn title="Eliminar" danger onClick={() => {
                        if (confirm("¿Eliminar esta key definitivamente?")) delM.mutate(k.id);
                      }}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </IconBtn>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {openCreate && (
        <CreateKeyModal
          onClose={() => setOpenCreate(false)}
          onSubmit={(v) => createM.mutate(v)}
          loading={createM.isPending}
        />
      )}
    </div>
  );
}

function labelDuration(d: string) {
  return DURATIONS.find(x => x.v === d)?.l ?? d;
}

function IconBtn({ children, onClick, title, danger }: { children: React.ReactNode; onClick: () => void; title: string; danger?: boolean }) {
  return (
    <button onClick={onClick} title={title}
      className={`rounded-lg p-2 transition border border-white/5 ${
        danger ? "hover:bg-destructive/20 hover:text-destructive hover:border-destructive/30" : "hover:bg-white/10 hover:border-white/10"
      }`}>
      {children}
    </button>
  );
}

function CreateKeyModal({ onClose, onSubmit, loading }: {
  onClose: () => void;
  onSubmit: (v: { duration: string; user_associated?: string; notes?: string }) => void;
  loading: boolean;
}) {
  const [duration, setDuration] = useState<string>("30d");
  const [user, setUser] = useState("");
  const [notes, setNotes] = useState("");
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md bg-black/50 animate-fade-in">
      <div className="glass-strong glow-border w-full max-w-md rounded-2xl p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-semibold">Nueva Key</h3>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-white/10"><X className="h-4 w-4" /></button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-xs uppercase tracking-widest text-muted-foreground">Duración</label>
            <div className="mt-2 grid grid-cols-3 gap-1.5">
              {DURATIONS.map(d => (
                <button key={d.v} onClick={() => setDuration(d.v)}
                  className={`rounded-lg px-2 py-2 text-xs font-medium transition ${
                    duration === d.v ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
                  style={duration === d.v ? { background: "var(--gradient-primary)" } : { background: "oklch(1 0 0 / 4%)" }}>
                  {d.l}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs uppercase tracking-widest text-muted-foreground">Usuario asociado (opcional)</label>
            <input value={user} onChange={(e) => setUser(e.target.value)}
              className="mt-2 w-full rounded-lg bg-input/40 border border-border px-3 py-2.5 text-sm outline-none focus:border-primary/50" />
          </div>
          <div>
            <label className="text-xs uppercase tracking-widest text-muted-foreground">Notas (opcional)</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
              className="mt-2 w-full rounded-lg bg-input/40 border border-border px-3 py-2.5 text-sm outline-none focus:border-primary/50" />
          </div>
        </div>
        <button disabled={loading}
          onClick={() => onSubmit({ duration, user_associated: user || undefined, notes: notes || undefined })}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-50"
          style={{ background: "var(--gradient-primary)" }}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Generar Key
        </button>
      </div>
    </div>
  );
}
