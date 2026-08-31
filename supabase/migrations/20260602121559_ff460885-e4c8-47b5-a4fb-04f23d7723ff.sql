
CREATE OR REPLACE FUNCTION public.generate_discount_code()
RETURNS TEXT LANGUAGE plpgsql AS $$
DECLARE
  new_code TEXT;
  done BOOLEAN := FALSE;
BEGIN
  WHILE NOT done LOOP
    new_code := 'CAMIS-' || upper(substring(md5(random()::text) from 1 for 6));
    PERFORM 1 FROM public.profiles WHERE discount_code = new_code;
    IF NOT FOUND THEN done := TRUE; END IF;
  END LOOP;
  RETURN new_code;
END;
$$;

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  discount_code TEXT UNIQUE NOT NULL,
  discount_percent INTEGER NOT NULL DEFAULT 10,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own profile" ON public.profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, discount_code)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    public.generate_discount_code()
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
