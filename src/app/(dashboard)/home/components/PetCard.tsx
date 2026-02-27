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
  is_vaccinated: boolean;
  is_neutered: boolean;
  shelters?: { name: string; city: string; state: string };
};

export default function PetCard({
  pet,
  showStatus = false,
}: {
  pet: Pet;
  showStatus?: boolean;
}) {
  const statusColors: Record<string, string> = {
    available: "bg-green-100 text-green-700",
    pending: "bg-yellow-100 text-yellow-700",
    adopted: "bg-blue-100 text-blue-700",
    fostered: "bg-purple-100 text-purple-700",
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{pet.name}</h3>
          <p className="text-sm text-gray-500">
            {pet.species}
            {pet.breed ? ` • ${pet.breed}` : ""}
          </p>
        </div>
        {showStatus && (
          <span
            className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${statusColors[pet.status]}`}
          >
            {pet.status}
          </span>
        )}
      </div>

      {/* Details */}
      <div className="flex flex-wrap gap-2 mb-3">
        {pet.age !== undefined && pet.age !== null && (
          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
            🎂 {pet.age} {pet.age === 1 ? "year" : "years"}
          </span>
        )}
        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full capitalize">
          {pet.sex === "male" ? "♂" : pet.sex === "female" ? "♀" : "?"}{" "}
          {pet.sex}
        </span>
        {pet.is_vaccinated && (
          <span className="text-xs bg-green-50 text-green-600 px-2 py-1 rounded-full">
            💉 Vaccinated
          </span>
        )}
        {pet.is_neutered && (
          <span className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-full">
            ✂️ Neutered
          </span>
        )}
      </div>

      {/* Description */}
      {pet.description && (
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
          {pet.description}
        </p>
      )}

      {/* Shelter info for adopters */}
      {pet.shelters && (
        <p className="text-xs text-gray-400 mt-2">
          📍 {pet.shelters.name} • {pet.shelters.city}, {pet.shelters.state}
        </p>
      )}
    </div>
  );
}
