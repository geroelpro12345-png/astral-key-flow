import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const Payload = z.object({
  secret: z.string(),
  title: z.string().min(1).max(200),
  username: z.string().min(1).max(120),
  category: z.string().min(1).max(80).default("general"),
  description: z.string().max(2000).optional(),
  priority: z.enum(["baja","media","alta","critica"]).default("media"),
  discord_user_id: z.string().max(64).optional(),
});

// Endpoint público para que el bot de Discord cree reportes.
// El bot envía { secret: "8617", ...campos }
export const Route = createFileRoute("/api/public/discord-report")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let body: unknown;
        try { body = await request.json(); }
        catch { return Response.json({ error: "Invalid JSON" }, { status: 400 }); }

        const parsed = Payload.safeParse(body);
        if (!parsed.success) {
          return Response.json({ error: "Invalid payload", issues: parsed.error.issues }, { status: 400 });
        }
        if (parsed.data.secret !== "8617") {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data, error } = await supabaseAdmin.from("reports").insert({
          title: parsed.data.title,
          username: parsed.data.username,
          category: parsed.data.category,
          description: parsed.data.description ?? null,
          priority: parsed.data.priority,
          discord_user_id: parsed.data.discord_user_id ?? null,
        }).select("id").single();

        if (error) return Response.json({ error: error.message }, { status: 500 });
        return Response.json({ ok: true, report_id: data.id });
      },
      OPTIONS: async () => new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      }),
    },
  },
});
