
CREATE OR REPLACE FUNCTION public.generate_discount_code()
RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
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

REVOKE EXECUTE ON FUNCTION public.generate_discount_code() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
