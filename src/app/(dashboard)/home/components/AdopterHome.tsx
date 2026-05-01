"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import PetCard from "./PetCard";
import { toast } from "sonner";
import { AvailabilityPopup } from "../../pets/[id]/components/BookmarkButton";

type Pet = {
  id: string;
  name: string;
  species: string;
  breed?: string;
  age?: number;
  sex: string;
  status: string;
  description?: string;
  is_vaccinated: boolean;
  is_neutered: boolean;
  energy_level?: number;
  good_with_children?: boolean;
  good_with_animals?: boolean;
  house_trained?: boolean;
  photo_urls?: string[];
  matchScore?: number;
  shelters?: { name: string; city: string; state: string };
};

type Preferences = {
  preferred_species?: string[];
  preferred_breed?: string;
  preferred_age_min?: number;
  preferred_age_max?: number;
  has_children?: boolean;
  has_other_pets?: boolean;
  living_situation?: string;
  experience_level?: string;
  yard?: boolean;
} | null;

type Props = {
  profile: { name: string; role: string };
  pets: Pet[];
  preferences: Preferences;
  isFiltered: boolean;
  applicationCount: number;
  bookmarkCount: number;
  applicationUpdateCount: number;
  availabilityNotifications: {
    petId: string;
    petName: string;
    isNowAvailable: boolean;
  }[];
};

export default function AdopterHome({
  profile,
  pets,
  preferences,
  isFiltered,
  applicationCount,
  bookmarkCount,
  applicationUpdateCount,
  availabilityNotifications,
}: Props) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [speciesFilter, setSpeciesFilter] = useState("");

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    toast.success("Signed out");
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

  const species = [...new Set(pets.map((pet) => pet.species))];

  return (
    <div className="organic-page">
      <nav className="organic-nav">
        <div className="flex items-center gap-2">
          <span className="font-bold text-lg">Pet Adoption</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link href="/applications" className="relative inline-flex">
            <Button variant="outline" size="sm">
              My Applications ({applicationCount})
            </Button>
            {applicationUpdateCount > 0 && (
              <span className="absolute -right-2 -top-2 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 text-[11px] font-semibold leading-none text-primary-foreground shadow">
                {applicationUpdateCount}
              </span>
            )}
          </Link>
          <Link href="/bookmarks">
            <Button variant="outline" size="sm">
              My Bookmarks ({bookmarkCount})
            </Button>
          </Link>
          <Link href="/preferences">
            <Button variant="outline" size="sm">
              Edit Preferences
            </Button>
          </Link>
          <span className="px-2 text-sm text-muted-foreground">{profile.name}</span>
          <Button variant="outline" size="sm" onClick={handleSignOut}>
            Sign Out
          </Button>
        </div>
      </nav>

      <div className="organic-shell">
        <div className="mb-6 flex flex-col gap-4 organic-panel md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Find Your Perfect Pet</h1>
            <p className="mt-1 text-muted-foreground">
              {pets.length} available pet{pets.length === 1 ? "" : "s"} ranked
              with your saved preferences in mind.
            </p>
          </div>
          <div className="flex gap-4 text-sm text-muted-foreground">
            <span>{applicationCount} applications</span>
            <span>{applicationUpdateCount} updates</span>
            <span>{bookmarkCount} bookmarks</span>
          </div>
        </div>

        {isFiltered && (
          <div className="mb-6 rounded-[1.5rem] border border-primary/30 bg-primary/10 px-4 py-3">
            <p className="text-sm text-primary">
              Pets are ranked using your species, breed, age, and household-fit
              preferences instead of being hidden too aggressively.
              {preferences?.preferred_species?.length
                ? ` Prioritizing: ${preferences.preferred_species.join(", ")}.`
                : ""}
              {preferences?.preferred_breed
                ? ` Breed preference: ${preferences.preferred_breed}.`
                : ""}
            </p>
          </div>
        )}

        {!preferences && (
          <div className="mb-6 flex items-center justify-between rounded-[1.5rem] border border-secondary/30 bg-secondary/10 px-4 py-3">
            <p className="text-sm text-secondary">
              Set your preferences to get better ranking and more relevant matches.
            </p>
            <Link href="/preferences">
              <Button
                size="sm"
                variant="outline"
                className="border-secondary/50 text-secondary hover:bg-secondary/15"
              >
                Set Preferences
              </Button>
            </Link>
          </div>
        )}

        <div className="mb-6 flex flex-wrap gap-3">
          <Input
            placeholder="Search by name, species, or breed..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-xs"
          />
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSpeciesFilter("")}
              className={`rounded-full border-2 px-3 py-1.5 text-sm font-medium transition-all ${
                speciesFilter === ""
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border/60 bg-card hover:border-secondary"
              }`}
            >
              All
            </button>
            {species.map((value) => (
              <button
                key={value}
                onClick={() => setSpeciesFilter(value)}
                className={`rounded-full border-2 px-3 py-1.5 text-sm font-medium transition-all ${
                  speciesFilter === value
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border/60 bg-card hover:border-secondary"
                }`}
              >
                {value}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="organic-empty">
            <h3 className="text-lg font-medium text-accent-foreground">No pets found</h3>
            <p className="mt-1 text-muted-foreground/75">
              Try adjusting your search, species filter, or preferences.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((pet) => (
              <PetCard key={pet.id} pet={pet} />
            ))}
          </div>
        )}
      </div>
      <AvailabilityPopup notifications={availabilityNotifications} />
    </div>
  );
}
