import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import PetProfileView from "./components/PetProfileView";

export default async function PetProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
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

  const { data: pet } = await supabase
    .from("pets")
    .select("*, shelters(id, name, city, state, phone, email)")
    .eq("id", id)
    .single();

  if (!pet) notFound();

  // Check if adopter already applied
  let hasApplied = false;
  if (profile?.role === "adopter" || profile?.role === "foster") {
    const { data: app } = await supabase
      .from("adoption_applications")
      .select("id")
      .eq("pet_id", pet.id)
      .eq("adopter_id", user.id)
      .single();
    hasApplied = !!app;
  }

  // Check if bookmarked
  let isBookmarked = false;
  if (profile?.role === "adopter" || profile?.role === "foster") {
    const { data: bm } = await supabase
      .from("pet_bookmarks")
      .select("id")
      .eq("pet_id", pet.id)
      .eq("adopter_id", user.id)
      .single();
    isBookmarked = !!bm;
  }

  // Check if this shelter owns the pet
  let isShelterOwner = false;
  if (profile?.role === "shelter") {
    const { data: shelter } = await supabase
      .from("shelters")
      .select("id")
      .eq("user_id", user.id)
      .single();
    isShelterOwner = shelter?.id === pet.shelter_id;
  }

  const { count: applicationCount } = await supabase
    .from("adoption_applications")
    .select("*", { count: "exact", head: true })
    .eq("pet_id", pet.id);

  return (
    <PetProfileView
      pet={pet}
      profile={profile}
      userId={user.id}
      hasApplied={hasApplied}
      isBookmarked={isBookmarked}
      isShelterOwner={isShelterOwner}
      applicationCount={applicationCount ?? 0}
    />
  );
}
