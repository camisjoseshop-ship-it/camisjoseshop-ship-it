CREATE OR REPLACE FUNCTION public.prevent_profile_discount_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.discount_percent IS DISTINCT FROM OLD.discount_percent
     OR NEW.discount_code IS DISTINCT FROM OLD.discount_code THEN
    NEW.discount_percent := OLD.discount_percent;
    NEW.discount_code := OLD.discount_code;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_profile_discount ON public.profiles;
CREATE TRIGGER protect_profile_discount
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.prevent_profile_discount_change();