"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import ApplyButton from "./ApplyButton";
import BookmarkButton from "./BookmarkButton";
import { toast } from "sonner";

type Shelter = {
  id: string;
  name: string;
  city: string;
  state: string;
  phone?: string;
  email?: string;
};

type Pet = {
  id: string;
  shelter_id: string;
  name: string;
  species: string;
  breed?: string;
  age?: number;
  sex: string;
  status: string;
  description?: string;
  behavior?: string;
  medical_history?: string;
  is_vaccinated: boolean;
  is_neutered: boolean;
  photo_urls?: string[];
  video_urls?: string[];
  energy_level?: number;
  good_with_children?: boolean;
  good_with_animals?: boolean;
  house_trained?: boolean;
  training_level?: string;
  special_needs?: string;
  unique_quirks?: string;
  shelters?: Shelter;
};

type Props = {
  pet: Pet;
  profile: { role: string; name: string } | null;
  userId: string;
  hasApplied: boolean;
  isBookmarked: boolean;
  isShelterOwner: boolean;
  applicationCount: number;
};

const statusConfig: Record<string, { label: string; color: string }> = {
  available: { label: "Available", color: "bg-primary/15 text-primary" },
  pending: {
    label: "Pending Adoption",
    color: "bg-secondary/15 text-secondary",
  },
  adopted: { label: "Adopted", color: "bg-accent text-accent-foreground" },
  fostered: { label: "Fostered", color: "bg-accent text-accent-foreground" },
  medical_hold: { label: "Medical Hold", color: "bg-destructive/15 text-destructive" },
};

const trainingLabels: Record<string, string> = {
  none: "No Training",
  basic: "Basic Commands",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

export default function PetProfileView({
  pet,
  profile,
  userId,
  hasApplied,
  isBookmarked,
  isShelterOwner,
  applicationCount,
}: Props) {
  const router = useRouter();
  const status = statusConfig[pet.status] ?? {
    label: pet.status,
    color: "bg-muted text-muted-foreground",
  };

  const isAdopterOrFoster =
    profile?.role === "adopter" || profile?.role === "foster";

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    toast.success("Signed out");
    router.push("/login");
  };

  return (
    <div className="organic-page">
      <nav className="organic-nav">
        <div className="flex items-center gap-2">
          <span className="font-bold text-lg">Pet Adoption</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/home">
            <Button variant="outline" size="sm">
              Back to Browse
            </Button>
          </Link>
          {isAdopterOrFoster && (
            <>
              <Link href="/applications">
                <Button variant="ghost" size="sm">
                  My Applications
                </Button>
              </Link>
              <Link href="/bookmarks">
                <Button variant="ghost" size="sm">
                  My Bookmarks
                </Button>
              </Link>
            </>
          )}
          <Button variant="outline" size="sm" onClick={handleSignOut}>
            Sign Out
          </Button>
        </div>
      </nav>

      <div className="organic-shell max-w-5xl space-y-6">
        {pet.photo_urls && pet.photo_urls.length > 0 && (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {pet.photo_urls.map((url, index) => (
              <div key={index} className="relative h-56 w-full md:h-48">
                <Image
                  src={url}
                  alt={`${pet.name} photo ${index + 1}`}
                  fill
                  className="rounded-[1.5rem] border border-border/60 object-cover"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
              </div>
            ))}
          </div>
        )}

        <div className="organic-panel">
          <div className="mb-4 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="mb-1 flex flex-wrap items-center gap-3">
                <h1 className="text-3xl font-bold text-foreground">{pet.name}</h1>
                <span
                  className={`rounded-full px-3 py-1 text-sm font-medium ${status.color}`}
                >
                  {status.label}
                </span>
              </div>
              <p className="text-muted-foreground">
                {pet.species}
                {pet.breed ? ` · ${pet.breed}` : ""}
                {pet.age != null ? ` · ${pet.age} yr${pet.age !== 1 ? "s" : ""}` : ""}
                {` · ${pet.sex.charAt(0).toUpperCase() + pet.sex.slice(1)}`}
              </p>
            </div>

            {isAdopterOrFoster && (
              <BookmarkButton
                petId={pet.id}
                userId={userId}
                initialBookmarked={isBookmarked}
              />
            )}
          </div>

          <div className="mb-5 grid gap-3 rounded-[1.5rem] bg-background p-4 md:grid-cols-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground/75">
                Applications
              </p>
              <p className="mt-1 text-lg font-semibold text-foreground">
                {applicationCount}
              </p>
              <p className="text-sm text-muted-foreground">
                People have applied for this pet so far.
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground/75">
                Shelter
              </p>
              <p className="mt-1 text-lg font-semibold text-foreground">
                {pet.shelters?.name ?? "Unknown shelter"}
              </p>
              <p className="text-sm text-muted-foreground">
                {pet.shelters?.city}, {pet.shelters?.state}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground/75">
                Availability
              </p>
              <p className="mt-1 text-lg font-semibold text-foreground">
                {status.label}
              </p>
              <p className="text-sm text-muted-foreground">
                Status updates also appear in your bookmarks and applications tabs.
              </p>
            </div>
          </div>

          <div className="mb-5 flex flex-wrap gap-2">
            {pet.is_vaccinated && (
              <span className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-sm text-primary">
                Vaccinated
              </span>
            )}
            {pet.is_neutered && (
              <span className="rounded-full border border-border bg-accent/60 px-3 py-1 text-sm text-accent-foreground">
                Neutered or spayed
              </span>
            )}
            {pet.house_trained && (
              <span className="rounded-full border border-secondary/30 bg-secondary/10 px-3 py-1 text-sm text-secondary">
                House trained
              </span>
            )}
            {pet.good_with_children && (
              <span className="rounded-full border border-secondary/30 bg-secondary/10 px-3 py-1 text-sm text-secondary">
                Good with kids
              </span>
            )}
            {pet.good_with_animals && (
              <span className="rounded-full border border-secondary/30 bg-secondary/10 px-3 py-1 text-sm text-secondary">
                Good with animals
              </span>
            )}
            {pet.energy_level != null && (
              <span className="rounded-full border border-border/60 bg-background px-3 py-1 text-sm text-accent-foreground">
                Energy {pet.energy_level}/10
              </span>
            )}
            {pet.training_level && pet.training_level !== "none" && (
              <span className="rounded-full border border-border bg-accent/60 px-3 py-1 text-sm text-accent-foreground">
                {trainingLabels[pet.training_level] ?? pet.training_level}
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-3">
            {isAdopterOrFoster && (
              <ApplyButton
                petId={pet.id}
                shelterId={pet.shelter_id}
                userId={userId}
                petStatus={pet.status}
                hasApplied={hasApplied}
              />
            )}
            {isShelterOwner && (
              <Link href={`/pets/${pet.id}/edit`}>
                <Button variant="outline">Edit Profile</Button>
              </Link>
            )}
          </div>
        </div>

        {pet.description && (
          <div className="organic-panel">
            <h2 className="mb-2 font-semibold text-foreground">About {pet.name}</h2>
            <p className="leading-relaxed text-muted-foreground">{pet.description}</p>
          </div>
        )}

        {pet.behavior && (
          <div className="organic-panel">
            <h2 className="mb-2 font-semibold text-foreground">
              Behavior and Personality
            </h2>
            <p className="leading-relaxed text-muted-foreground">{pet.behavior}</p>
          </div>
        )}

        {pet.unique_quirks && (
          <div className="organic-panel">
            <h2 className="mb-2 font-semibold text-foreground">Unique Quirks</h2>
            <p className="leading-relaxed text-muted-foreground">{pet.unique_quirks}</p>
          </div>
        )}

        {pet.special_needs && (
          <div className="rounded-[1.5rem] border border-secondary/30 bg-secondary/10 p-6">
            <h2 className="mb-2 font-semibold text-secondary">Special Needs</h2>
            <p className="leading-relaxed text-secondary">{pet.special_needs}</p>
          </div>
        )}

        {pet.medical_history && (
          <div className="organic-panel">
            <h2 className="mb-2 font-semibold text-foreground">Medical History</h2>
            <p className="leading-relaxed text-muted-foreground">{pet.medical_history}</p>
          </div>
        )}

        {pet.video_urls && pet.video_urls.length > 0 && (
          <div className="organic-panel">
            <h2 className="mb-3 font-semibold text-foreground">Videos</h2>
            <div className="space-y-3">
              {pet.video_urls.map((url, index) => (
                <video key={index} src={url} controls className="w-full rounded-2xl" />
              ))}
            </div>
          </div>
        )}

        {pet.shelters && (
          <div className="organic-panel">
            <h2 className="mb-3 font-semibold text-foreground">About the Shelter</h2>
            <p className="font-medium text-foreground">{pet.shelters.name}</p>
            <p className="text-sm text-muted-foreground">
              {pet.shelters.city}, {pet.shelters.state}
            </p>
            {pet.shelters.phone && (
              <p className="mt-1 text-sm text-muted-foreground">{pet.shelters.phone}</p>
            )}
            {pet.shelters.email && (
              <p className="text-sm text-muted-foreground">{pet.shelters.email}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
