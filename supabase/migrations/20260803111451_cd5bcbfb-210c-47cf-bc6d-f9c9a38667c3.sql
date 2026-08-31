CREATE TABLE public.wheel_spins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  prize_id text NOT NULL,
  prize_label text NOT NULL,
  code text,
  is_winner boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX wheel_spins_email_key ON public.wheel_spins (lower(email));
GRANT ALL ON public.wheel_spins TO service_role;
ALTER TABLE public.wheel_spins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "No direct client access" ON public.wheel_spins AS RESTRICTIVE FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);