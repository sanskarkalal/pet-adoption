import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import ApplicationCard from "./components/ApplicationCard";

export default async function ApplicationsPage() {
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

  const { data: applications } = await supabase
    .from("adoption_applications")
    .select(
      `
      *,
      pets(id, name, species, breed, status),
      profiles!adopter_id(id, name)
    `,
    )
    .eq("shelter_id", shelter.id)
    .order("created_at", { ascending: false });

  const pending = applications?.filter((a) => a.status === "pending") ?? [];
  const reviewed = applications?.filter((a) => a.status !== "pending") ?? [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🐾</span>
          <span className="font-bold text-lg">Pet Adoption</span>
        </div>
        <Link href="/home">
          <Button variant="outline" size="sm">
            ← Dashboard
          </Button>
        </Link>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            Adoption Applications
          </h1>
          <p className="text-gray-500 mt-1">
            {shelter.name} · {applications?.length ?? 0} total application
            {applications?.length !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Pending */}
        <section className="mb-10">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            ⏳ Pending Review ({pending.length})
          </h2>
          {pending.length === 0 ? (
            <div className="bg-white rounded-xl border border-dashed border-gray-300 py-12 text-center">
              <p className="text-gray-400">No pending applications</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pending.map((app) => (
                <ApplicationCard key={app.id} application={app} />
              ))}
            </div>
          )}
        </section>

        {/* Reviewed */}
        {reviewed.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              📋 Reviewed ({reviewed.length})
            </h2>
            <div className="space-y-4">
              {reviewed.map((app) => (
                <ApplicationCard key={app.id} application={app} readonly />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
