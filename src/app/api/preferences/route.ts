import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

type PreferencesPayload = {
  preferred_species?: string[];
  preferred_breed?: string | null;
  preferred_age_min?: number | null;
  preferred_age_max?: number | null;
  has_children?: boolean;
  has_other_pets?: boolean;
  living_situation?: string;
  yard?: boolean;
  experience_level?: string;
  notes?: string | null;
};

export async function PUT(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = (await request.json()) as PreferencesPayload;
  const payload = {
    preferred_species: body.preferred_species ?? [],
    preferred_breed: body.preferred_breed?.trim() || null,
    preferred_age_min: body.preferred_age_min ?? null,
    preferred_age_max: body.preferred_age_max ?? null,
    has_children: Boolean(body.has_children),
    has_other_pets: Boolean(body.has_other_pets),
    living_situation: body.living_situation ?? "house",
    yard: Boolean(body.yard),
    experience_level: body.experience_level ?? "first_time",
    notes: body.notes?.trim() || null,
  };

  const { data: updatedPreferences, error: updateError } = await supabase
    .from("preferences")
    .update(payload)
    .eq("user_id", user.id)
    .select("*");

  let savedPreferences = updatedPreferences?.[0] ?? null;
  let error = updateError;

  if (!savedPreferences && !error) {
    const { data: insertedPreferences, error: insertError } = await supabase
      .from("preferences")
      .insert({ user_id: user.id, ...payload })
      .select("*")
      .single();

    savedPreferences = insertedPreferences;
    error = insertError;
  }

  if (error || !savedPreferences) {
    return NextResponse.json(
      { error: error?.message ?? "Unable to save preferences." },
      { status: 400 },
    );
  }

  const { data: verifiedPreferences, error: verifyError } = await supabase
    .from("preferences")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1);

  if (verifyError || !verifiedPreferences?.[0]) {
    return NextResponse.json(
      {
        error:
          verifyError?.message ??
          "Preferences save returned a row, but the updated row could not be reloaded.",
      },
      { status: 400 },
    );
  }

  return NextResponse.json(
    { preferences: verifiedPreferences[0], userId: user.id },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
