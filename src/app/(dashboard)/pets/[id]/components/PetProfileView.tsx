"use client";

import Link from "next/link";
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
};

const statusConfig: Record<string, { label: string; color: string }> = {
  available: { label: "Available", color: "bg-green-100 text-green-700" },
  pending: {
    label: "Pending Adoption",
    color: "bg-yellow-100 text-yellow-700",
  },
  adopted: { label: "Adopted", color: "bg-blue-100 text-blue-700" },
  fostered: { label: "Fostered", color: "bg-purple-100 text-purple-700" },
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
    toast.success("Signed out!");
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🐾</span>
          <span className="font-bold text-lg">Pet Adoption</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/home">
            <Button variant="outline" size="sm">
              ← Browse Pets
            </Button>
          </Link>
          <Button variant="outline" size="sm" onClick={handleSignOut}>
            Sign Out
          </Button>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
        {/* Photo Gallery */}
        {pet.photo_urls && pet.photo_urls.length > 0 && (
          <div className="grid grid-cols-3 gap-3">
            {pet.photo_urls.map((url, i) => (
              <img
                key={i}
                src={url}
                alt={`${pet.name} photo ${i + 1}`}
                className="w-full h-48 object-cover rounded-xl border border-gray-200"
              />
            ))}
          </div>
        )}

        {/* Header card */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-3xl font-bold text-gray-900">{pet.name}</h1>
                <span
                  className={`text-sm font-medium px-3 py-1 rounded-full ${status.color}`}
                >
                  {status.label}
                </span>
              </div>
              <p className="text-gray-500">
                {pet.species}
                {pet.breed ? ` · ${pet.breed}` : ""}
                {pet.age !== undefined && pet.age !== null
                  ? ` · ${pet.age} yr${pet.age !== 1 ? "s" : ""}`
                  : ""}
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

          {/* Quick fact badges */}
          <div className="flex flex-wrap gap-2 mb-5">
            {pet.is_vaccinated && (
              <span className="text-sm bg-green-50 text-green-700 border border-green-200 px-3 py-1 rounded-full">
                💉 Vaccinated
              </span>
            )}
            {pet.is_neutered && (
              <span className="text-sm bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1 rounded-full">
                ✂️ Neutered/Spayed
              </span>
            )}
            {pet.house_trained && (
              <span className="text-sm bg-orange-50 text-orange-700 border border-orange-200 px-3 py-1 rounded-full">
                🏠 House Trained
              </span>
            )}
            {pet.good_with_children && (
              <span className="text-sm bg-pink-50 text-pink-700 border border-pink-200 px-3 py-1 rounded-full">
                👶 Good with Kids
              </span>
            )}
            {pet.good_with_animals && (
              <span className="text-sm bg-yellow-50 text-yellow-700 border border-yellow-200 px-3 py-1 rounded-full">
                🐾 Good with Animals
              </span>
            )}
            {pet.energy_level !== undefined && pet.energy_level !== null && (
              <span className="text-sm bg-gray-50 text-gray-700 border border-gray-200 px-3 py-1 rounded-full">
                ⚡ Energy {pet.energy_level}/10
              </span>
            )}
            {pet.training_level && pet.training_level !== "none" && (
              <span className="text-sm bg-indigo-50 text-indigo-700 border border-indigo-200 px-3 py-1 rounded-full">
                🎓 {trainingLabels[pet.training_level] ?? pet.training_level}
              </span>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 flex-wrap">
            {isAdopterOrFoster && (
              <ApplyButton
                petId={pet.id}
                shelterId={pet.shelters?.id ?? ""}
                userId={userId}
                petStatus={pet.status}
                hasApplied={hasApplied}
              />
            )}
            {isShelterOwner && (
              <Link href={`/pets/${pet.id}/edit`}>
                <Button variant="outline">✏️ Edit Profile</Button>
              </Link>
            )}
          </div>
        </div>

        {/* About */}
        {pet.description && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <h2 className="font-semibold text-gray-900 mb-2">
              About {pet.name}
            </h2>
            <p className="text-gray-600 leading-relaxed">{pet.description}</p>
          </div>
        )}

        {/* Behavior */}
        {pet.behavior && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <h2 className="font-semibold text-gray-900 mb-2">
              Behavior & Personality
            </h2>
            <p className="text-gray-600 leading-relaxed">{pet.behavior}</p>
          </div>
        )}

        {/* Unique Quirks */}
        {pet.unique_quirks && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <h2 className="font-semibold text-gray-900 mb-2">
              ✨ Unique Quirks
            </h2>
            <p className="text-gray-600 leading-relaxed">{pet.unique_quirks}</p>
          </div>
        )}

        {/* Special Needs */}
        {pet.special_needs && (
          <div className="bg-amber-50 rounded-xl border border-amber-200 p-6">
            <h2 className="font-semibold text-amber-900 mb-2">
              ⚠️ Special Needs
            </h2>
            <p className="text-amber-800 leading-relaxed">
              {pet.special_needs}
            </p>
          </div>
        )}

        {/* Medical History */}
        {pet.medical_history && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <h2 className="font-semibold text-gray-900 mb-2">
              🏥 Medical History
            </h2>
            <p className="text-gray-600 leading-relaxed">
              {pet.medical_history}
            </p>
          </div>
        )}

        {/* Videos */}
        {pet.video_urls && pet.video_urls.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <h2 className="font-semibold text-gray-900 mb-3">🎥 Videos</h2>
            <div className="space-y-3">
              {pet.video_urls.map((url, i) => (
                <video
                  key={i}
                  src={url}
                  controls
                  className="w-full rounded-lg"
                />
              ))}
            </div>
          </div>
        )}

        {/* Shelter info */}
        {pet.shelters && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <h2 className="font-semibold text-gray-900 mb-3">
              🏛️ About the Shelter
            </h2>
            <p className="font-medium text-gray-800">{pet.shelters.name}</p>
            <p className="text-gray-500 text-sm">
              {pet.shelters.city}, {pet.shelters.state}
            </p>
            {pet.shelters.phone && (
              <p className="text-gray-500 text-sm mt-1">
                📞 {pet.shelters.phone}
              </p>
            )}
            {pet.shelters.email && (
              <p className="text-gray-500 text-sm">✉️ {pet.shelters.email}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
