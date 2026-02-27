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

  if (profile?.role === "shelter") {
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

  // Adopter or Foster
  const { data: pets } = await supabase
    .from("pets")
    .select("*, shelters(name, city, state)")
    .eq("status", "available")
    .order("created_at", { ascending: false });

  return <AdopterHome profile={profile} pets={pets ?? []} />;
}
