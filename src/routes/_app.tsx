import { Link, Outlet, createFileRoute, useLocation, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  LayoutDashboard, KeyRound, FileWarning, Route as RouteIcon,
  Settings, LogOut, Shield, Menu, X,
} from "lucide-react";
import { clearAccessCode, getAccessCode } from "@/lib/access-store";
import { toast } from "sonner";
import { PageTransition } from "@/components/PageTransition";

export const Route = createFileRoute("/_app")({
  component: AppLayout,
});

const nav = [
  { to: "/dashboard", label: "Resumen", icon: LayoutDashboard },
  { to: "/keys", label: "Keys", icon: KeyRound },
  { to: "/reports", label: "Reportes", icon: FileWarning },
  { to: "/tracker", label: "Tracker", icon: RouteIcon },
  { to: "/settings", label: "Configuración", icon: Settings },
] as const;

function AppLayout() {
  const navigate = useNavigate();
  const loc = useLocation();
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!getAccessCode()) {
      navigate({ to: "/" });
    } else {
      setReady(true);
    }
  }, [navigate]);

  if (!ready) return null;

  function logout() {
    clearAccessCode();
    toast.success("Sesión cerrada");
    navigate({ to: "/" });
  }

  return (
    <div className="relative min-h-screen">
      <div className="pointer-events-none fixed inset-0 grid-bg opacity-20" />
      {/* ambient glows */}
      <div className="pointer-events-none fixed -top-40 -left-40 h-96 w-96 rounded-full blur-3xl animate-glow-pulse" style={{ background: "oklch(0.68 0.22 255 / 25%)" }} />
      <div className="pointer-events-none fixed -bottom-40 -right-40 h-96 w-96 rounded-full blur-3xl animate-glow-pulse" style={{ background: "oklch(0.62 0.25 305 / 25%)", animationDelay: "2s" }} />

      {/* sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-72 transform transition-transform duration-500 ease-out lg:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="m-3 h-[calc(100vh-1.5rem)] rounded-2xl glass-strong p-5 flex flex-col"
        >
          <div className="flex items-center gap-3 px-2">
            <div className="relative">
              <div className="absolute inset-0 rounded-xl blur-md opacity-70 animate-glow-pulse" style={{ background: "var(--gradient-primary)" }} />
              <div className="relative flex h-10 w-10 items-center justify-center rounded-xl glass-strong">
                <Shield className="h-5 w-5" style={{ color: "oklch(0.78 0.2 250)" }} />
              </div>
            </div>
            <div>
              <div className="text-sm font-bold tracking-wide"><span className="text-gradient animate-gradient-shift" style={{ backgroundImage: "var(--gradient-primary)" }}>NEXUS</span> VAULT</div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Admin Console</div>
            </div>
          </div>

          <nav className="mt-8 flex-1 space-y-1">
            {nav.map(({ to, label, icon: Icon }, i) => {
              const active = loc.pathname === to;
              return (
                <motion.div
                  key={to}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.1 + i * 0.05, ease: [0.22, 1, 0.36, 1] }}
                >
                  <Link
                    to={to}
                    onClick={() => setOpen(false)}
                    className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-300 ${
                      active
                        ? "text-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-white/5 hover:translate-x-1"
                    }`}
                    style={active ? { background: "linear-gradient(135deg, oklch(0.68 0.22 255 / 18%), oklch(0.62 0.25 305 / 14%))", boxShadow: "inset 0 1px 0 oklch(1 0 0 / 8%)" } : undefined}
                  >
                    {active && (
                      <motion.span
                        layoutId="active-pill"
                        className="absolute left-0 top-1/2 h-6 -translate-y-1/2 w-[3px] rounded-r-full"
                        style={{ background: "var(--gradient-primary)", boxShadow: "0 0 12px oklch(0.78 0.2 250 / 80%)" }}
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                      />
                    )}
                    <Icon className={`h-4 w-4 transition-transform duration-300 ${active ? "scale-110" : "group-hover:scale-110 group-hover:rotate-3"}`} />
                    <span className="font-medium">{label}</span>
                  </Link>
                </motion.div>
              );
            })}
          </nav>

          <button onClick={logout}
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all duration-300 hover:translate-x-1">
            <LogOut className="h-4 w-4" />
            Cerrar sesión
          </button>
        </motion.div>
      </aside>

      {/* mobile toggle */}
      <button onClick={() => setOpen(!open)}
        className="fixed top-4 right-4 z-50 lg:hidden glass-strong rounded-xl p-2.5 transition-transform hover:scale-105 active:scale-95">
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* content */}
      <main className="relative lg:pl-72 p-3 lg:p-6">
        <div className="mx-auto max-w-7xl">
          <PageTransition>
            <Outlet />
          </PageTransition>
        </div>
      </main>
    </div>
  );
}
