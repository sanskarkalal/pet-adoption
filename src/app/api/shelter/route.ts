import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

type ShelterPayload = {
  name?: string;
  address?: string;
  city?: string;
  state?: string;
  phone?: string;
  email?: string;
  website?: string | null;
};

export async function PUT(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = (await request.json()) as ShelterPayload;
  const payload = {
    name: body.name?.trim() ?? "",
    address: body.address?.trim() ?? "",
    city: body.city?.trim() ?? "",
    state: body.state?.trim() ?? "",
    phone: body.phone?.trim() ?? "",
    email: body.email?.trim() ?? "",
    website: body.website?.trim() ? body.website.trim() : null,
  };

  const { data: updatedShelters, error: updateError } = await supabase
    .from("shelters")
    .update(payload)
    .eq("user_id", user.id)
    .select("id, name, address, city, state, phone, email, website");

  let savedShelter = updatedShelters?.[0] ?? null;
  let error = updateError;

  if (!savedShelter && !error) {
    const { data: insertedShelter, error: insertError } = await supabase
      .from("shelters")
      .insert({
        user_id: user.id,
        ...payload,
      })
      .select("id, name, address, city, state, phone, email, website")
      .single();

    savedShelter = insertedShelter;
    error = insertError;
  }

  if (error || !savedShelter) {
    return NextResponse.json(
      { error: error?.message ?? "Unable to save shelter profile." },
      { status: 400 },
    );
  }

  const { data: verifiedShelters, error: verifyError } = await supabase
    .from("shelters")
    .select("id, name, address, city, state, phone, email, website")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1);

  if (verifyError || !verifiedShelters?.[0]) {
    return NextResponse.json(
      {
        error:
          verifyError?.message ??
          "Shelter save returned a row, but the updated row could not be reloaded.",
      },
      { status: 400 },
    );
  }

  return NextResponse.json(
    { shelter: verifiedShelters[0], userId: user.id },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
