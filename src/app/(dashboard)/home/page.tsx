import { createClient } from "@/lib/supabase/server";
import { hasApplicationUpdate } from "@/lib/application-details";
import { redirect } from "next/navigation";
import ShelterHome from "./components/ShelterHome";
import AdopterHome from "./components/AdopterHome";

function firstRelation<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

export default async function HomePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, name")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/login");

  if (profile.role === "shelter") {
    const { data: shelters } = await supabase
      .from("shelters")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1);

    const shelter = shelters?.[0] ?? null;

    const { data: pets } = await supabase
      .from("pets")
      .select("*")
      .eq("shelter_id", shelter?.id)
      .order("created_at", { ascending: false });

    return (
      <ShelterHome profile={profile} shelter={shelter} pets={pets ?? []} />
    );
  }

  // Fetch user preferences
  const { data: preferenceRows } = await supabase
    .from("preferences")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1);

  const preferences = preferenceRows?.[0] ?? null;

  const { data: availablePets } = await supabase
    .from("pets")
    .select("*, shelters(name, city, state)")
    .eq("status", "available")
    .order("created_at", { ascending: false });

  const pets =
    availablePets
      ?.map((pet) => {
        let score = 0;

        if (preferences?.preferred_species?.length) {
          const preferredSpecies = preferences.preferred_species.map(
            (species: string) => species.toLowerCase(),
          );

          if (preferredSpecies.includes(pet.species.toLowerCase())) {
            score += 8;
          }
        }

        if (
          preferences?.preferred_breed &&
          pet.breed?.toLowerCase().includes(preferences.preferred_breed.toLowerCase())
        ) {
          score += 4;
        }

        if (
          preferences?.preferred_age_min != null &&
          pet.age != null &&
          pet.age >= preferences.preferred_age_min
        ) {
          score += 1;
        }

        if (
          preferences?.preferred_age_max != null &&
          pet.age != null &&
          pet.age <= preferences.preferred_age_max
        ) {
          score += 1;
        }

        if (preferences?.has_children && pet.good_with_children) {
          score += 3;
        }

        if (preferences?.has_other_pets && pet.good_with_animals) {
          score += 3;
        }

        if (preferences?.yard && pet.energy_level != null && pet.energy_level >= 6) {
          score += 2;
        }

        return { ...pet, matchScore: score };
      })
      .sort(
        (a, b) =>
          b.matchScore - a.matchScore ||
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      ) ?? [];

  const isFiltered = Boolean(
    preferences &&
      (preferences.preferred_species?.length ||
        preferences.preferred_breed ||
        preferences.preferred_age_min != null ||
        preferences.preferred_age_max != null ||
        preferences.has_children ||
        preferences.has_other_pets ||
        preferences.yard),
  );

  const [{ count: applicationCount }, { count: bookmarkCount }] = await Promise.all([
    supabase
      .from("adoption_applications")
      .select("*", { count: "exact", head: true })
      .eq("adopter_id", user.id),
    supabase
      .from("pet_bookmarks")
      .select("*", { count: "exact", head: true })
      .eq("adopter_id", user.id),
  ]);

  const { data: applications } = await supabase
    .from("adoption_applications")
    .select(
      `
      id,
      pet_id,
      created_at,
      updated_at
    `,
    )
    .eq("adopter_id", user.id);

  const { data: bookmarkedPets } = await supabase
    .from("pet_bookmarks")
    .select(
      `
      pet_id,
      pets(
        id,
        name,
        status
      )
    `,
    )
    .eq("adopter_id", user.id);

  const appliedPetIds = new Set((applications ?? []).map((app) => app.pet_id));
  const applicationUpdateCount =
    applications?.filter((app) =>
      hasApplicationUpdate(app.created_at, app.updated_at),
    ).length ?? 0;

  const availabilityNotifications =
    bookmarkedPets
      ?.map((bookmark) => firstRelation(bookmark.pets))
      .filter(
        (pet): pet is { id: string; name: string; status: string } =>
          Boolean(
            pet && pet.status !== "available" && !appliedPetIds.has(pet.id),
          ),
      )
      .map((pet) => ({
        petId: pet.id,
        petName: pet.name,
        isNowAvailable: false,
      })) ?? [];

  return (
    <AdopterHome
      profile={profile}
      pets={pets}
      preferences={preferences}
      isFiltered={isFiltered}
      applicationCount={applicationCount ?? 0}
      bookmarkCount={bookmarkCount ?? 0}
      applicationUpdateCount={applicationUpdateCount}
      availabilityNotifications={availabilityNotifications}
    />
  );
}
