import Link from "next/link";

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
  shelters?: { name: string; city: string; state: string };
};

const statusColors: Record<string, string> = {
  available: "bg-green-100 text-green-700",
  pending: "bg-yellow-100 text-yellow-700",
  adopted: "bg-blue-100 text-blue-700",
  fostered: "bg-purple-100 text-purple-700",
  medical_hold: "bg-red-100 text-red-700",
};

const statusLabels: Record<string, string> = {
  available: "Available",
  pending: "Pending",
  adopted: "Adopted",
  fostered: "Fostered",
  medical_hold: "Medical Hold",
};

export default function PetCard({
  pet,
  showStatus = false,
}: {
  pet: Pet;
  showStatus?: boolean;
}) {
  const speciesEmoji =
    pet.species.toLowerCase() === "dog"
      ? "🐶"
      : pet.species.toLowerCase() === "cat"
        ? "🐱"
        : "🐾";

  return (
    <Link href={`/pets/${pet.id}`} className="block group">
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all group-hover:border-gray-300 overflow-hidden">
        {/* Photo or fallback */}
        {pet.photo_urls && pet.photo_urls.length > 0 ? (
          <img
            src={pet.photo_urls[0]}
            alt={pet.name}
            className="w-full h-44 object-cover"
          />
        ) : (
          <div className="w-full h-44 bg-gray-100 flex items-center justify-center text-5xl">
            {speciesEmoji}
          </div>
        )}

        <div className="p-5">
          {/* Header */}
          <div className="flex items-start justify-between mb-2">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 group-hover:text-black">
                {pet.name}
              </h3>
              <p className="text-sm text-gray-500">
                {pet.species}
                {pet.breed ? ` · ${pet.breed}` : ""}
              </p>
            </div>
            {showStatus && (
              <span
                className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize shrink-0 ml-2 ${
                  statusColors[pet.status] ?? "bg-gray-100 text-gray-600"
                }`}
              >
                {statusLabels[pet.status] ?? pet.status}
              </span>
            )}
          </div>

          {/* Badges */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            {pet.age !== undefined && pet.age !== null && (
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                🎂 {pet.age} {pet.age === 1 ? "yr" : "yrs"}
              </span>
            )}
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full capitalize">
              {pet.sex === "male" ? "♂" : pet.sex === "female" ? "♀" : "?"}{" "}
              {pet.sex}
            </span>
            {pet.energy_level !== undefined && pet.energy_level !== null && (
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                ⚡ {pet.energy_level}/10
              </span>
            )}
            {pet.is_vaccinated && (
              <span className="text-xs bg-green-50 text-green-600 px-2 py-1 rounded-full">
                💉 Vaccinated
              </span>
            )}
            {pet.good_with_children && (
              <span className="text-xs bg-pink-50 text-pink-600 px-2 py-1 rounded-full">
                👶 Kids OK
              </span>
            )}
            {pet.good_with_animals && (
              <span className="text-xs bg-yellow-50 text-yellow-600 px-2 py-1 rounded-full">
                🐾 Animals OK
              </span>
            )}
          </div>

          {/* Description */}
          {pet.description && (
            <p className="text-sm text-gray-600 mb-3 line-clamp-2">
              {pet.description}
            </p>
          )}

          {/* Shelter */}
          {pet.shelters && (
            <p className="text-xs text-gray-400">
              📍 {pet.shelters.name} · {pet.shelters.city}, {pet.shelters.state}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}
