create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  name text not null,
  role text not null check (role in ('adopter', 'foster', 'shelter')),
  created_at timestamp with time zone default now()
);

create table public.shelters (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade unique,
  name text not null,
  address text not null,
  city text not null,
  state text not null,
  phone text,
  email text,
  website text,
  created_at timestamp with time zone default now()
);

create table public.pets (
  id uuid primary key default gen_random_uuid(),
  shelter_id uuid references public.shelters(id) on delete cascade,
  name text not null,
  species text not null,
  breed text,
  age integer,
  sex text not null check (sex in ('male', 'female', 'unknown')),
  status text not null default 'available' check (status in ('available', 'adopted', 'fostered', 'pending')),
  description text,
  behavior text,
  medical_history text,
  is_vaccinated boolean default false,
  is_neutered boolean default false,
  photo_urls text[],
  created_at timestamp with time zone default now()
);

create table public.preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade unique,
  preferred_species text[],
  preferred_breed text,
  preferred_age_min integer,
  preferred_age_max integer,
  has_children boolean,
  has_other_pets boolean,
  living_situation text check (living_situation in ('house', 'apartment', 'condo', 'other')),
  yard boolean,
  experience_level text check (experience_level in ('first_time', 'some_experience', 'experienced')),
  notes text,
  created_at timestamp with time zone default now()
);

-- RLS
alter table public.profiles enable row level security;
alter table public.shelters enable row level security;
alter table public.pets enable row level security;
alter table public.preferences enable row level security;

-- Policies
create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Users can insert own profile" on public.profiles for insert with check (true);

create policy "Anyone can view pets" on public.pets for select using (true);
create policy "Shelters can insert pets" on public.pets for insert with check (
  exists (select 1 from public.shelters where user_id = auth.uid() and id = shelter_id)
);
create policy "Shelters can update own pets" on public.pets for update using (
  exists (select 1 from public.shelters where user_id = auth.uid() and id = shelter_id)
);

create policy "Shelters can view own data" on public.shelters for select using (user_id = auth.uid());
create policy "Shelters can insert own data" on public.shelters for insert with check (user_id = auth.uid());
create policy "Shelters can update own data" on public.shelters for update using (user_id = auth.uid());

create policy "Users can manage own preferences" on public.preferences for all using (user_id = auth.uid());