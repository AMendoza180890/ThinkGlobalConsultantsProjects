-- Function to handle syncing metadata from auth.users to public.user_profiles
CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_profiles (
    user_id,
    school_id,
    tenure_band,
    grade_level,
    department,
    onboarded,
    updated_at
  )
  VALUES (
    new.id,
    (new.raw_user_meta_data->>'school_id')::uuid,
    new.raw_user_meta_data->>'tenure_band',
    new.raw_user_meta_data->>'grade_level',
    new.raw_user_meta_data->>'department',
    true,
    now()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    school_id = EXCLUDED.school_id,
    tenure_band = EXCLUDED.tenure_band,
    grade_level = EXCLUDED.grade_level,
    department = EXCLUDED.department,
    onboarded = true,
    updated_at = now();
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to run on every new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_profile();

-- Trigger to run on metadata updates (in case they sign in again with different data before profile is locked)
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
CREATE TRIGGER on_auth_user_updated
  AFTER UPDATE OF raw_user_meta_data ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_profile();
