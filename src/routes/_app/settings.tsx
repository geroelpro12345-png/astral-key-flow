import { createFileRoute } from "@tanstack/react-router";
import { Webhook, Shield, Database, Bot } from "lucide-react";

export const Route = createFileRoute("/_app/settings")({
  head: () => ({ meta: [{ title: "Configuración — Nexus Vault" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const webhookUrl = `${origin}/api/public/discord-report`;

  return (
    <div className="space-y-6 animate-fade-in">
      <header>
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Sistema</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">Configuración</h1>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="glass-strong rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-3">
            <Shield className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold uppercase tracking-widest">Seguridad</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            El acceso al panel está protegido por un código confidencial de 4 dígitos. La sesión se guarda únicamente en este navegador.
          </p>
          <div className="mt-4 rounded-xl border border-primary/20 bg-primary/5 p-3 text-xs text-muted-foreground">
            Para cambiar el código, edita la constante <code className="text-primary">ACCESS_CODE</code> en <code className="text-primary">src/lib/admin.functions.ts</code>.
          </div>
        </div>

        <div className="glass-strong rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-3">
            <Database className="h-4 w-4 text-secondary" />
            <h2 className="text-sm font-semibold uppercase tracking-widest">Backend</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Datos almacenados en Lovable Cloud. Todas las operaciones pasan por server functions con clave de servicio.
          </p>
          <ul className="mt-3 space-y-1.5 text-xs text-muted-foreground">
            <li>• Tablas: <code className="text-primary">keys</code>, <code className="text-primary">reports</code>, <code className="text-primary">trackers</code>, <code className="text-primary">tracker_events</code></li>
            <li>• Trackers creados automáticamente al insertar un reporte</li>
            <li>• Eventos registrados en cada cambio de etapa</li>
          </ul>
        </div>

        <div className="glass-strong rounded-2xl p-6 md:col-span-2">
          <div className="flex items-center gap-2 mb-3">
            <Bot className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold uppercase tracking-widest">Webhook para bot de Discord</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Configura tu bot para enviar reportes a este endpoint. El tracker se generará automáticamente.
          </p>

          <div className="mt-4 space-y-3">
            <div>
              <label className="text-[10px] uppercase tracking-widest text-muted-foreground">URL</label>
              <div className="mt-1 rounded-lg bg-input/40 border border-border px-3 py-2.5 font-mono text-xs break-all">
                <span className="text-secondary">POST</span> {webhookUrl}
              </div>
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-widest text-muted-foreground">Body JSON</label>
              <pre className="mt-1 rounded-lg bg-black/40 border border-border p-4 text-xs font-mono overflow-x-auto"><code>{`{
  "secret": "8617",
  "title": "Bug en sistema X",
  "username": "Usuario#1234",
  "category": "bug",
  "priority": "alta",
  "description": "Detalles del problema…",
  "discord_user_id": "123456789"
}`}</code></pre>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Webhook className="h-3.5 w-3.5" />
              Prioridades: <code className="text-primary">baja</code> · <code className="text-primary">media</code> · <code className="text-primary">alta</code> · <code className="text-primary">critica</code>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
