-- Run this once in the Supabase SQL editor for existing databases.
-- It resets shelter and preference RLS to match the app's save flows.

ALTER TABLE public.shelters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.preferences ENABLE ROW LEVEL SECURITY;

CREATE UNIQUE INDEX IF NOT EXISTS shelters_user_id_key
  ON public.shelters(user_id);

CREATE UNIQUE INDEX IF NOT EXISTS preferences_user_id_key
  ON public.preferences(user_id);

DROP POLICY IF EXISTS "Anyone can view shelter data" ON public.shelters;
DROP POLICY IF EXISTS "Shelters can insert own data" ON public.shelters;
DROP POLICY IF EXISTS "Shelters can update own data" ON public.shelters;
DROP POLICY IF EXISTS "Shelters can delete own data" ON public.shelters;

CREATE POLICY "Anyone can view shelter data"
ON public.shelters
FOR SELECT
USING (true);

CREATE POLICY "Shelters can insert own data"
ON public.shelters
FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Shelters can update own data"
ON public.shelters
FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Shelters can delete own data"
ON public.shelters
FOR DELETE
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can manage own preferences" ON public.preferences;
DROP POLICY IF EXISTS "Users can view own preferences" ON public.preferences;
DROP POLICY IF EXISTS "Users can insert own preferences" ON public.preferences;
DROP POLICY IF EXISTS "Users can update own preferences" ON public.preferences;
DROP POLICY IF EXISTS "Users can delete own preferences" ON public.preferences;

CREATE POLICY "Users can view own preferences"
ON public.preferences
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can insert own preferences"
ON public.preferences
FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own preferences"
ON public.preferences
FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own preferences"
ON public.preferences
FOR DELETE
USING (user_id = auth.uid());

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.shelters TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.preferences TO authenticated;
