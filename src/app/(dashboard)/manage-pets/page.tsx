import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ManagePetsClient from "./ManagePetsClient";

export default async function ManagePetsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "shelter") redirect("/home");

  const { data: shelter } = await supabase
    .from("shelters")
    .select("id, name")
    .eq("user_id", user.id)
    .single();

  if (!shelter) redirect("/shelter-setup");

  const { data: pets } = await supabase
    .from("pets")
    .select("*")
    .eq("shelter_id", shelter.id)
    .order("created_at", { ascending: false });

  return <ManagePetsClient shelter={shelter} pets={pets ?? []} />;
}
