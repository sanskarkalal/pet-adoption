import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import EditPetClient from "./EditPetClient";

export default async function EditPetPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: shelter } = await supabase
    .from("shelters")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!shelter) redirect("/shelter-setup");

  const { data: pet } = await supabase
    .from("pets")
    .select("*")
    .eq("id", params.id)
    .eq("shelter_id", shelter.id)
    .single();

  if (!pet) notFound();

  return <EditPetClient pet={pet} />;
}
