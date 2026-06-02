import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Shield, Lock, KeyRound, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { verifyAccess } from "@/lib/admin.functions";
import { getAccessCode, setAccessCode } from "@/lib/access-store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Nexus Vault — Verificación de acceso" },
      { name: "description", content: "Introduce tu código de acceso para entrar al panel." },
    ],
  }),
  component: AccessGate,
});

function AccessGate() {
  const nav = useNavigate();
  const verify = useServerFn(verifyAccess);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (getAccessCode()) nav({ to: "/dashboard" });
  }, [nav]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (code.length < 4) { setError("Código demasiado corto"); return; }
    setLoading(true);
    try {
      await verify({ data: { accessCode: code } });
      setAccessCode(code);
      toast.success("Acceso concedido");
      nav({ to: "/dashboard" });
    } catch (err) {
      setError("Código incorrecto. Acceso denegado.");
      toast.error("Acceso denegado");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center px-4 overflow-hidden">
      {/* animated orbs */}
      <div className="pointer-events-none absolute inset-0 grid-bg opacity-30" />
      <div className="pointer-events-none absolute -top-32 -left-32 h-96 w-96 rounded-full blur-3xl animate-float"
        style={{ background: "radial-gradient(circle, oklch(0.68 0.22 255 / 60%), transparent 70%)" }} />
      <div className="pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 rounded-full blur-3xl animate-float"
        style={{ background: "radial-gradient(circle, oklch(0.62 0.25 305 / 60%), transparent 70%)", animationDelay: "2s" }} />

      <div className="relative w-full max-w-md">
        {/* logo */}
        <div className="mb-8 flex flex-col items-center">
          <div className="relative">
            <div className="absolute inset-0 rounded-2xl blur-xl animate-pulse-glow"
              style={{ background: "var(--gradient-primary)" }} />
            <div className="glass-strong relative flex h-20 w-20 items-center justify-center rounded-2xl">
              <Shield className="h-10 w-10" style={{ color: "oklch(0.78 0.2 250)" }} strokeWidth={1.8} />
            </div>
          </div>
          <h1 className="mt-5 text-3xl font-bold tracking-tight">
            <span className="text-gradient">NEXUS</span> <span className="text-foreground">VAULT</span>
          </h1>
          <p className="mt-1 text-xs uppercase tracking-[0.3em] text-muted-foreground">
            Premium Access Terminal
          </p>
        </div>

        {/* card */}
        <form onSubmit={onSubmit} className="glass-strong glow-border rounded-2xl p-8">
          <div className="mb-6 flex items-center gap-3">
            <Lock className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs uppercase tracking-widest text-muted-foreground">Verificación segura</span>
          </div>

          <label className="block text-sm font-medium text-foreground/90">Código de acceso</label>
          <div className="relative mt-2">
            <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="password"
              inputMode="numeric"
              autoFocus
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="••••"
              className="w-full rounded-xl border border-border bg-input/40 py-3.5 pl-11 pr-4 font-mono text-lg tracking-[0.5em] text-center text-foreground placeholder:text-muted-foreground/60 outline-none transition focus:border-primary/60 focus:bg-input/60"
            />
          </div>

          {error && (
            <div className="mt-3 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3.5 text-sm font-semibold text-primary-foreground transition-transform hover:scale-[1.02] disabled:opacity-60"
            style={{ background: "var(--gradient-primary)", boxShadow: "var(--shadow-elegant)" }}
          >
            {loading ? <><Loader2 className="h-4 w-4 animate-spin" />Verificando…</> : <>Entrar al sistema</>}
          </button>

          <p className="mt-6 text-center text-[11px] uppercase tracking-widest text-muted-foreground/70">
            Acceso restringido · Solo personal autorizado
          </p>
        </form>

        <p className="mt-6 text-center text-xs text-muted-foreground/60">
          © Nexus Vault · Encrypted Session
        </p>
      </div>
    </main>
  );
}
