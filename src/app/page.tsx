import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function Home() {
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

  if (profile?.role === "shelter") {
    const { data: shelter } = await supabase
      .from("shelters")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (shelter) redirect("/home");
    else redirect("/shelter-setup");
  }

  redirect("/home");
}
