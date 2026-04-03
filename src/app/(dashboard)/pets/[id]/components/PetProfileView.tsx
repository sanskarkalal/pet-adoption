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
  available: { label: "Available", color: "bg-green-100 text-green-700" },
  pending: {
    label: "Pending Adoption",
    color: "bg-yellow-100 text-yellow-700",
  },
  adopted: { label: "Adopted", color: "bg-blue-100 text-blue-700" },
  fostered: { label: "Fostered", color: "bg-violet-100 text-violet-700" },
  medical_hold: { label: "Medical Hold", color: "bg-red-100 text-red-700" },
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
    color: "bg-gray-100 text-gray-600",
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
    <div className="min-h-screen bg-gray-50">
      <nav className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4">
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

      <div className="mx-auto max-w-5xl space-y-6 px-6 py-8">
        {pet.photo_urls && pet.photo_urls.length > 0 && (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {pet.photo_urls.map((url, index) => (
              <div key={index} className="relative h-56 w-full md:h-48">
                <Image
                  src={url}
                  alt={`${pet.name} photo ${index + 1}`}
                  fill
                  className="rounded-xl border border-gray-200 object-cover"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
              </div>
            ))}
          </div>
        )}

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="mb-1 flex flex-wrap items-center gap-3">
                <h1 className="text-3xl font-bold text-gray-900">{pet.name}</h1>
                <span
                  className={`rounded-full px-3 py-1 text-sm font-medium ${status.color}`}
                >
                  {status.label}
                </span>
              </div>
              <p className="text-gray-500">
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

          <div className="mb-5 grid gap-3 rounded-xl bg-gray-50 p-4 md:grid-cols-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                Applications
              </p>
              <p className="mt-1 text-lg font-semibold text-gray-900">
                {applicationCount}
              </p>
              <p className="text-sm text-gray-500">
                People have applied for this pet so far.
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                Shelter
              </p>
              <p className="mt-1 text-lg font-semibold text-gray-900">
                {pet.shelters?.name ?? "Unknown shelter"}
              </p>
              <p className="text-sm text-gray-500">
                {pet.shelters?.city}, {pet.shelters?.state}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                Availability
              </p>
              <p className="mt-1 text-lg font-semibold text-gray-900">
                {status.label}
              </p>
              <p className="text-sm text-gray-500">
                Status updates also appear in your bookmarks and applications tabs.
              </p>
            </div>
          </div>

          <div className="mb-5 flex flex-wrap gap-2">
            {pet.is_vaccinated && (
              <span className="rounded-full border border-green-200 bg-green-50 px-3 py-1 text-sm text-green-700">
                Vaccinated
              </span>
            )}
            {pet.is_neutered && (
              <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-sm text-blue-700">
                Neutered or spayed
              </span>
            )}
            {pet.house_trained && (
              <span className="rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-sm text-orange-700">
                House trained
              </span>
            )}
            {pet.good_with_children && (
              <span className="rounded-full border border-pink-200 bg-pink-50 px-3 py-1 text-sm text-pink-700">
                Good with kids
              </span>
            )}
            {pet.good_with_animals && (
              <span className="rounded-full border border-yellow-200 bg-yellow-50 px-3 py-1 text-sm text-yellow-700">
                Good with animals
              </span>
            )}
            {pet.energy_level != null && (
              <span className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-sm text-gray-700">
                Energy {pet.energy_level}/10
              </span>
            )}
            {pet.training_level && pet.training_level !== "none" && (
              <span className="rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-sm text-indigo-700">
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
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-2 font-semibold text-gray-900">About {pet.name}</h2>
            <p className="leading-relaxed text-gray-600">{pet.description}</p>
          </div>
        )}

        {pet.behavior && (
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-2 font-semibold text-gray-900">
              Behavior and Personality
            </h2>
            <p className="leading-relaxed text-gray-600">{pet.behavior}</p>
          </div>
        )}

        {pet.unique_quirks && (
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-2 font-semibold text-gray-900">Unique Quirks</h2>
            <p className="leading-relaxed text-gray-600">{pet.unique_quirks}</p>
          </div>
        )}

        {pet.special_needs && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-6">
            <h2 className="mb-2 font-semibold text-amber-900">Special Needs</h2>
            <p className="leading-relaxed text-amber-800">{pet.special_needs}</p>
          </div>
        )}

        {pet.medical_history && (
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-2 font-semibold text-gray-900">Medical History</h2>
            <p className="leading-relaxed text-gray-600">{pet.medical_history}</p>
          </div>
        )}

        {pet.video_urls && pet.video_urls.length > 0 && (
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-3 font-semibold text-gray-900">Videos</h2>
            <div className="space-y-3">
              {pet.video_urls.map((url, index) => (
                <video key={index} src={url} controls className="w-full rounded-lg" />
              ))}
            </div>
          </div>
        )}

        {pet.shelters && (
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-3 font-semibold text-gray-900">About the Shelter</h2>
            <p className="font-medium text-gray-800">{pet.shelters.name}</p>
            <p className="text-sm text-gray-500">
              {pet.shelters.city}, {pet.shelters.state}
            </p>
            {pet.shelters.phone && (
              <p className="mt-1 text-sm text-gray-500">{pet.shelters.phone}</p>
            )}
            {pet.shelters.email && (
              <p className="text-sm text-gray-500">{pet.shelters.email}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
