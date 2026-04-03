import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// GET /api/applications
// Shelter: returns all applications for their pets
// Adopter/Foster: returns their own applications
export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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

    if (!shelter) {
      return NextResponse.json({ error: "Shelter not found" }, { status: 404 });
    }

    const { data, error } = await supabase
      .from("adoption_applications")
      .select(
        "*, pets(id, name, species, breed, status), profiles!adopter_id(id, name)",
      )
      .eq("shelter_id", shelter.id)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ applications: data });
  }

  // Adopter or Foster
  const { data, error } = await supabase
    .from("adoption_applications")
    .select(
      "*, pets(id, name, species, breed, photo_urls, status), shelters(name, city, state)",
    )
    .eq("adopter_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ applications: data });
}

// POST /api/applications
// Adopter submits a new adoption application
export async function POST(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    pet_id?: string;
    shelter_id?: string;
    message?: string;
  };

  const { pet_id, shelter_id, message } = body;

  if (!pet_id || !shelter_id) {
    return NextResponse.json(
      { error: "pet_id and shelter_id are required" },
      { status: 400 },
    );
  }

  // Verify pet is still available before inserting
  const { data: pet } = await supabase
    .from("pets")
    .select("status")
    .eq("id", pet_id)
    .single();

  if (!pet || pet.status !== "available") {
    return NextResponse.json(
      { error: "This pet is no longer available for adoption." },
      { status: 400 },
    );
  }

  const { data, error } = await supabase
    .from("adoption_applications")
    .insert({
      pet_id,
      shelter_id,
      adopter_id: user.id,
      message: message ?? null,
      status: "pending",
    })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "You have already applied for this pet." },
        { status: 409 },
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ application: data }, { status: 201 });
}

// PATCH /api/applications
// Shelter accepts or rejects an application
export async function PATCH(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    application_id?: string;
    status?: string;
  };

  const { application_id, status } = body;

  if (!application_id || !["accepted", "rejected"].includes(status ?? "")) {
    return NextResponse.json(
      { error: "application_id and valid status (accepted|rejected) required" },
      { status: 400 },
    );
  }

  // Verify caller is a shelter
  const { data: shelter } = await supabase
    .from("shelters")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!shelter) {
    return NextResponse.json({ error: "Shelter not found" }, { status: 404 });
  }

  // Verify the application belongs to this shelter
  const { data: app, error: fetchError } = await supabase
    .from("adoption_applications")
    .select("pet_id, shelter_id")
    .eq("id", application_id)
    .single();

  if (fetchError || !app) {
    return NextResponse.json(
      { error: "Application not found" },
      { status: 404 },
    );
  }

  if (app.shelter_id !== shelter.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Update application status
  const { error: updateError } = await supabase
    .from("adoption_applications")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", application_id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  // If accepted, update pet status to pending
  if (status === "accepted") {
    await supabase
      .from("pets")
      .update({ status: "pending" })
      .eq("id", app.pet_id);
  }

  return NextResponse.json({ success: true, status });
}
