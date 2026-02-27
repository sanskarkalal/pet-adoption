"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import PetCard from "./PetCard";
import { toast } from "sonner";

type Props = {
  profile: { name: string; role: string };
  pets: any[];
};

export default function AdopterHome({ profile, pets }: Props) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [speciesFilter, setSpeciesFilter] = useState("");

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    toast.success("Signed out!");
    router.push("/login");
    router.refresh();
  };

  const filtered = pets.filter((pet) => {
    const matchesSearch =
      pet.name.toLowerCase().includes(search.toLowerCase()) ||
      pet.species.toLowerCase().includes(search.toLowerCase()) ||
      pet.breed?.toLowerCase().includes(search.toLowerCase());

    const matchesSpecies = speciesFilter
      ? pet.species.toLowerCase() === speciesFilter.toLowerCase()
      : true;

    return matchesSearch && matchesSpecies;
  });

  const species = [...new Set(pets.map((p) => p.species))];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🐾</span>
          <span className="font-bold text-lg">Pet Adoption</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">
            {profile.role === "foster" ? "💝" : "🏠"} {profile.name}
          </span>
          <Link href="/preferences">
            <Button variant="outline" size="sm">
              Edit Preferences
            </Button>
          </Link>
          <Button variant="outline" size="sm" onClick={handleSignOut}>
            Sign Out
          </Button>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            Find Your Perfect Pet 🐾
          </h1>
          <p className="text-gray-500 mt-1">
            {pets.length} pet{pets.length === 1 ? "" : "s"} available for
            adoption
          </p>
        </div>

        {/* Filters */}
        <div className="flex gap-3 mb-6 flex-wrap">
          <Input
            placeholder="Search by name, species, breed..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-xs"
          />
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setSpeciesFilter("")}
              className={`px-3 py-1.5 rounded-full border-2 text-sm font-medium transition-all cursor-pointer ${
                speciesFilter === ""
                  ? "border-black bg-black text-white"
                  : "border-gray-200 hover:border-gray-400 bg-white"
              }`}
            >
              All
            </button>
            {species.map((s) => (
              <button
                key={s}
                onClick={() => setSpeciesFilter(s)}
                className={`px-3 py-1.5 rounded-full border-2 text-sm font-medium transition-all cursor-pointer ${
                  speciesFilter === s
                    ? "border-black bg-black text-white"
                    : "border-gray-200 hover:border-gray-400 bg-white"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Pet Grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
            <div className="text-5xl mb-4">🔍</div>
            <h3 className="text-lg font-medium text-gray-700">No pets found</h3>
            <p className="text-gray-400 mt-1">
              Try adjusting your search or filters
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((pet) => (
              <PetCard key={pet.id} pet={pet} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
