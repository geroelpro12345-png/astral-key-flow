import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const ACCESS_CODE = "8617";

function assertAccess(code: string) {
  if (code !== ACCESS_CODE) throw new Error("Código de acceso inválido");
}

function randomKeyCode() {
  const seg = () => Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${seg()}-${seg()}-${seg()}-${seg()}`;
}

function durationToMs(d: string): number | null {
  switch (d) {
    case "1d": return 86400_000;
    case "7d": return 7 * 86400_000;
    case "15d": return 15 * 86400_000;
    case "30d": return 30 * 86400_000;
    case "60d": return 60 * 86400_000;
    case "90d": return 90 * 86400_000;
    default: return null;
  }
}

const AccessInput = z.object({ accessCode: z.string() });

// VERIFY ACCESS
export const verifyAccess = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => AccessInput.parse(d))
  .handler(async ({ data }) => {
    assertAccess(data.accessCode);
    return { ok: true };
  });

// DASHBOARD STATS
export const getDashboardStats = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => AccessInput.parse(d))
  .handler(async ({ data }) => {
    assertAccess(data.accessCode);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [keys, reports, trackers] = await Promise.all([
      supabaseAdmin.from("keys").select("id,status,created_at"),
      supabaseAdmin.from("reports").select("id,status,priority,created_at,title,username").order("created_at", { ascending: false }).limit(50),
      supabaseAdmin.from("trackers").select("id,current_stage"),
    ]);
    const allKeys = keys.data ?? [];
    const allReports = reports.data ?? [];
    const allTrackers = trackers.data ?? [];
    return {
      keysActive: allKeys.filter(k => k.status === "active").length,
      keysSuspended: allKeys.filter(k => k.status === "suspended").length,
      keysTotal: allKeys.length,
      reportsTotal: allReports.length,
      reportsPending: allReports.filter(r => r.status === "pendiente").length,
      reportsCritical: allReports.filter(r => r.priority === "critica").length,
      trackersActive: allTrackers.filter(t => t.current_stage !== "finalizado").length,
      recentReports: allReports.slice(0, 8),
    };
  });

// ============ KEYS ============
export const listKeys = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => AccessInput.parse(d))
  .handler(async ({ data }) => {
    assertAccess(data.accessCode);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows, error } = await supabaseAdmin
      .from("keys").select("*").order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

const CreateKey = AccessInput.extend({
  duration: z.enum(["1d","7d","15d","30d","60d","90d","permanent"]),
  user_associated: z.string().max(120).optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
});
export const createKey = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => CreateKey.parse(d))
  .handler(async ({ data }) => {
    assertAccess(data.accessCode);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const ms = durationToMs(data.duration);
    const expires_at = ms ? new Date(Date.now() + ms).toISOString() : null;
    const code = randomKeyCode();
    const { data: row, error } = await supabaseAdmin.from("keys").insert({
      code, duration: data.duration, expires_at,
      user_associated: data.user_associated ?? null,
      notes: data.notes ?? null,
    }).select().single();
    if (error) throw new Error(error.message);
    return row;
  });

const UpdateKeyStatus = AccessInput.extend({
  id: z.string().uuid(),
  status: z.enum(["active","suspended","expired"]),
});
export const updateKeyStatus = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => UpdateKeyStatus.parse(d))
  .handler(async ({ data }) => {
    assertAccess(data.accessCode);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("keys").update({ status: data.status }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const DeleteKey = AccessInput.extend({ id: z.string().uuid() });
export const deleteKey = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => DeleteKey.parse(d))
  .handler(async ({ data }) => {
    assertAccess(data.accessCode);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("keys").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// reveal full key (temporary)
export const revealKey = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => AccessInput.extend({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    assertAccess(data.accessCode);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin.from("keys").select("code").eq("id", data.id).single();
    if (error) throw new Error(error.message);
    return { code: row.code };
  });

// ============ REPORTS ============
export const listReports = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => AccessInput.parse(d))
  .handler(async ({ data }) => {
    assertAccess(data.accessCode);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows, error } = await supabaseAdmin
      .from("reports").select("*").order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

const CreateReport = AccessInput.extend({
  title: z.string().min(1).max(200),
  category: z.string().min(1).max(80).default("general"),
  username: z.string().min(1).max(120),
  description: z.string().max(2000).optional().nullable(),
  priority: z.enum(["baja","media","alta","critica"]).default("media"),
});
export const createReport = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => CreateReport.parse(d))
  .handler(async ({ data }) => {
    assertAccess(data.accessCode);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin.from("reports").insert({
      title: data.title, category: data.category, username: data.username,
      description: data.description ?? null, priority: data.priority,
    }).select().single();
    if (error) throw new Error(error.message);
    return row;
  });

const UpdateReport = AccessInput.extend({
  id: z.string().uuid(),
  status: z.enum(["pendiente","en_revision","resuelto","cerrado"]).optional(),
  priority: z.enum(["baja","media","alta","critica"]).optional(),
});
export const updateReport = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => UpdateReport.parse(d))
  .handler(async ({ data }) => {
    assertAccess(data.accessCode);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const patch: Record<string, unknown> = {};
    if (data.status) patch.status = data.status;
    if (data.priority) patch.priority = data.priority;
    const { error } = await supabaseAdmin.from("reports").update(patch).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteReport = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => AccessInput.extend({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    assertAccess(data.accessCode);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("reports").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ============ TRACKERS ============
export const listTrackers = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => AccessInput.parse(d))
  .handler(async ({ data }) => {
    assertAccess(data.accessCode);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows, error } = await supabaseAdmin
      .from("trackers")
      .select("*, report:reports(id,title,username,status,priority,category,created_at), events:tracker_events(id,stage,note,created_at)")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

const UpdateTracker = AccessInput.extend({
  id: z.string().uuid(),
  stage: z.enum(["enviado","recibido","en_revision","investigando","resolucion_aplicada","finalizado"]),
});
export const advanceTracker = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => UpdateTracker.parse(d))
  .handler(async ({ data }) => {
    assertAccess(data.accessCode);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("trackers")
      .update({ current_stage: data.stage }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
