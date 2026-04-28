-- ============================================================
-- Full Schema (Release 2)
-- For reference and fresh installs
-- ============================================================

CREATE TABLE public.profiles (
  id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name text NOT NULL,
  role text NOT NULL CHECK (role IN ('adopter', 'foster', 'shelter')),
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.shelters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
  name text NOT NULL,
  address text NOT NULL,
  city text NOT NULL,
  state text NOT NULL,
  phone text,
  email text,
  website text,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.pets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shelter_id uuid REFERENCES public.shelters(id) ON DELETE CASCADE,
  name text NOT NULL,
  species text NOT NULL,
  breed text,
  age integer,
  sex text NOT NULL CHECK (sex IN ('male', 'female', 'unknown')),
  status text NOT NULL DEFAULT 'available'
    CHECK (status IN ('available', 'pending', 'adopted', 'fostered', 'medical_hold')),
  description text,
  behavior text,
  medical_history text,
  is_vaccinated boolean DEFAULT false,
  is_neutered boolean DEFAULT false,
  photo_urls text[],
  -- Release 2 fields
  energy_level integer CHECK (energy_level >= 1 AND energy_level <= 10),
  good_with_children boolean DEFAULT false,
  good_with_animals boolean DEFAULT false,
  house_trained boolean DEFAULT false,
  training_level text CHECK (training_level IN ('none', 'basic', 'intermediate', 'advanced')),
  special_needs text,
  unique_quirks text,
  video_urls text[],
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
  preferred_species text[],
  preferred_breed text,
  preferred_age_min integer,
  preferred_age_max integer,
  has_children boolean,
  has_other_pets boolean,
  living_situation text CHECK (living_situation IN ('house', 'apartment', 'condo', 'other')),
  yard boolean,
  experience_level text CHECK (experience_level IN ('first_time', 'some_experience', 'experienced')),
  notes text,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.adoption_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id uuid REFERENCES public.pets(id) ON DELETE CASCADE NOT NULL,
  shelter_id uuid REFERENCES public.shelters(id) ON DELETE CASCADE NOT NULL,
  adopter_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  message text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE (pet_id, adopter_id)
);

CREATE TABLE public.pet_bookmarks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id uuid REFERENCES public.pets(id) ON DELETE CASCADE NOT NULL,
  adopter_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE (pet_id, adopter_id)
);

-- RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shelters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.adoption_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pet_bookmarks ENABLE ROW LEVEL SECURITY;

-- Profiles
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (true);

-- Pets
CREATE POLICY "Anyone can view pets" ON public.pets FOR SELECT USING (true);
CREATE POLICY "Shelters can insert pets" ON public.pets FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.shelters WHERE user_id = auth.uid() AND id = shelter_id));
CREATE POLICY "Shelters can update own pets" ON public.pets FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.shelters WHERE user_id = auth.uid() AND id = shelter_id));
CREATE POLICY "Shelters can delete own pets" ON public.pets FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.shelters WHERE user_id = auth.uid() AND id = shelter_id));

-- Shelters
CREATE POLICY "Anyone can view shelter data" ON public.shelters FOR SELECT USING (true);
CREATE POLICY "Shelters can insert own data" ON public.shelters FOR INSERT
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "Shelters can update own data" ON public.shelters FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "Shelters can delete own data" ON public.shelters FOR DELETE
  USING (user_id = auth.uid());

-- Preferences
CREATE POLICY "Users can view own preferences" ON public.preferences FOR SELECT
  USING (user_id = auth.uid());
CREATE POLICY "Users can insert own preferences" ON public.preferences FOR INSERT
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own preferences" ON public.preferences FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can delete own preferences" ON public.preferences FOR DELETE
  USING (user_id = auth.uid());

-- Adoption Applications
CREATE POLICY "Adopters can view own applications" ON public.adoption_applications FOR SELECT
  USING (adopter_id = auth.uid());
CREATE POLICY "Adopters can insert own applications" ON public.adoption_applications FOR INSERT
  WITH CHECK (adopter_id = auth.uid());
CREATE POLICY "Shelters can view applications for their pets" ON public.adoption_applications FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.shelters WHERE user_id = auth.uid() AND id = shelter_id));
CREATE POLICY "Shelters can update applications for their pets" ON public.adoption_applications FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.shelters WHERE user_id = auth.uid() AND id = shelter_id));

-- Bookmarks
CREATE POLICY "Adopters can manage own bookmarks" ON public.pet_bookmarks FOR ALL
  USING (adopter_id = auth.uid());
