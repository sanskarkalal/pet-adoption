import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ShelterHome from "./components/ShelterHome";
import AdopterHome from "./components/AdopterHome";

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
    const { data: shelter } = await supabase
      .from("shelters")
      .select("*")
      .eq("user_id", user.id)
      .single();

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
  const { data: preferences } = await supabase
    .from("preferences")
    .select("*")
    .eq("user_id", user.id)
    .single();

  const { data: availablePets } = await supabase
    .from("pets")
    .select("*, shelters(name, city, state)")
    .eq("status", "available")
    .order("created_at", { ascending: false });

  const pets =
    availablePets
      ?.map((pet) => {
        let score = 0;

        if (
          preferences?.preferred_species?.length &&
          preferences.preferred_species.includes(pet.species)
        ) {
          score += 4;
        }

        if (
          preferences?.preferred_breed &&
          pet.breed?.toLowerCase().includes(preferences.preferred_breed.toLowerCase())
        ) {
          score += 2;
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
          score += 1;
        }

        if (preferences?.has_other_pets && pet.good_with_animals) {
          score += 1;
        }

        if (preferences?.yard && pet.energy_level != null && pet.energy_level >= 6) {
          score += 1;
        }

        return { ...pet, matchScore: score };
      })
      .sort((a, b) => b.matchScore - a.matchScore) ?? [];

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

  return (
    <AdopterHome
      profile={profile}
      pets={pets}
      preferences={preferences}
      isFiltered={isFiltered}
      applicationCount={applicationCount ?? 0}
      bookmarkCount={bookmarkCount ?? 0}
    />
  );
}
