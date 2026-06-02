
-- Enums
CREATE TYPE public.key_status AS ENUM ('active','suspended','expired');
CREATE TYPE public.key_duration AS ENUM ('1d','7d','15d','30d','60d','90d','permanent');
CREATE TYPE public.report_status AS ENUM ('pendiente','en_revision','resuelto','cerrado');
CREATE TYPE public.report_priority AS ENUM ('baja','media','alta','critica');
CREATE TYPE public.tracker_stage AS ENUM ('enviado','recibido','en_revision','investigando','resolucion_aplicada','finalizado');

-- Keys
CREATE TABLE public.keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  status public.key_status NOT NULL DEFAULT 'active',
  duration public.key_duration NOT NULL,
  user_associated TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ
);
CREATE INDEX idx_keys_status ON public.keys(status);
CREATE INDEX idx_keys_created ON public.keys(created_at DESC);

-- Reports
CREATE TABLE public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  username TEXT NOT NULL,
  discord_user_id TEXT,
  description TEXT,
  status public.report_status NOT NULL DEFAULT 'pendiente',
  priority public.report_priority NOT NULL DEFAULT 'media',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_reports_status ON public.reports(status);
CREATE INDEX idx_reports_created ON public.reports(created_at DESC);

-- Trackers
CREATE TABLE public.trackers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL UNIQUE REFERENCES public.reports(id) ON DELETE CASCADE,
  current_stage public.tracker_stage NOT NULL DEFAULT 'enviado',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_trackers_stage ON public.trackers(current_stage);

-- Tracker events
CREATE TABLE public.tracker_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tracker_id UUID NOT NULL REFERENCES public.trackers(id) ON DELETE CASCADE,
  stage public.tracker_stage NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_tracker_events_tracker ON public.tracker_events(tracker_id, created_at DESC);

-- Grants: only service_role (server) can access
GRANT ALL ON public.keys TO service_role;
GRANT ALL ON public.reports TO service_role;
GRANT ALL ON public.trackers TO service_role;
GRANT ALL ON public.tracker_events TO service_role;

-- RLS enabled but no policies for anon/authenticated => locked down
ALTER TABLE public.keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trackers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tracker_events ENABLE ROW LEVEL SECURITY;

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

CREATE TRIGGER reports_touch BEFORE UPDATE ON public.reports
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trackers_touch BEFORE UPDATE ON public.trackers
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Auto-create tracker when a report is inserted
CREATE OR REPLACE FUNCTION public.create_tracker_for_report()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE new_tracker_id UUID;
BEGIN
  INSERT INTO public.trackers(report_id, current_stage)
  VALUES (NEW.id, 'enviado') RETURNING id INTO new_tracker_id;
  INSERT INTO public.tracker_events(tracker_id, stage, note)
  VALUES (new_tracker_id, 'enviado', 'Reporte enviado automáticamente');
  RETURN NEW;
END $$;

CREATE TRIGGER reports_autotracker AFTER INSERT ON public.reports
  FOR EACH ROW EXECUTE FUNCTION public.create_tracker_for_report();

-- When tracker stage changes, log event
CREATE OR REPLACE FUNCTION public.log_tracker_stage_change()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.current_stage IS DISTINCT FROM OLD.current_stage THEN
    INSERT INTO public.tracker_events(tracker_id, stage, note)
    VALUES (NEW.id, NEW.current_stage, 'Cambio de etapa');
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER trackers_log_change AFTER UPDATE ON public.trackers
  FOR EACH ROW EXECUTE FUNCTION public.log_tracker_stage_change();
