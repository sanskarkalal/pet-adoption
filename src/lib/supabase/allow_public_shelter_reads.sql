-- Run this once in the Supabase SQL editor for existing databases.
-- It allows adopter-facing pet pages to read shelter name/contact/location
-- through joins like pets(..., shelters(name, city, state, phone, email)).

DROP POLICY IF EXISTS "Shelters can view own data" ON public.shelters;

CREATE POLICY "Anyone can view shelter data"
ON public.shelters
FOR SELECT
USING (true);
