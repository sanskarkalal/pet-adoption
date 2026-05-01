import Link from "next/link";
import Image from "next/image";

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

const statusColors: Record<string, string> = {
  available: "bg-primary/15 text-primary",
  pending: "bg-secondary/15 text-secondary",
  adopted: "bg-accent text-accent-foreground",
  fostered: "bg-accent text-accent-foreground",
  medical_hold: "bg-destructive/15 text-destructive",
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
      <div className="overflow-hidden rounded-[2rem_1.5rem_2.5rem_1.5rem] border border-border/60 bg-card/95 shadow-soft transition-all duration-300 group-hover:-translate-y-1 group-hover:rotate-[0.35deg] group-hover:border-secondary/60 group-hover:shadow-float">
        {/* Photo or fallback */}
        {pet.photo_urls && pet.photo_urls.length > 0 ? (
          <div className="relative w-full h-44">
            <Image
              src={pet.photo_urls[0]}
              alt={pet.name}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          </div>
        ) : (
          <div className="flex h-44 w-full items-center justify-center bg-muted text-5xl">
            {speciesEmoji}
          </div>
        )}

        <div className="p-5">
          {/* Header */}
          <div className="flex items-start justify-between mb-2">
            <div>
              <h3 className="text-lg font-semibold text-foreground group-hover:text-primary">
                {pet.name}
              </h3>
              <p className="text-sm text-muted-foreground">
                {pet.species}
                {pet.breed ? ` · ${pet.breed}` : ""}
              </p>
            </div>
            {showStatus && (
              <span
                className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize shrink-0 ml-2 ${
                  statusColors[pet.status] ?? "bg-muted text-muted-foreground"
                }`}
              >
                {statusLabels[pet.status] ?? pet.status}
              </span>
            )}
            {!showStatus && pet.matchScore != null && pet.matchScore > 0 && (
              <span className="ml-2 shrink-0 rounded-full bg-primary/15 px-2.5 py-1 text-xs font-medium text-primary">
                Match {pet.matchScore}
              </span>
            )}
          </div>

          {/* Badges */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            {pet.age !== undefined && pet.age !== null && (
              <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded-full">
                🎂 {pet.age} {pet.age === 1 ? "yr" : "yrs"}
              </span>
            )}
            <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded-full capitalize">
              {pet.sex === "male" ? "♂" : pet.sex === "female" ? "♀" : "?"}{" "}
              {pet.sex}
            </span>
            {pet.energy_level !== undefined && pet.energy_level !== null && (
              <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded-full">
                ⚡ {pet.energy_level}/10
              </span>
            )}
            {pet.is_vaccinated && (
              <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                💉 Vaccinated
              </span>
            )}
            {pet.good_with_children && (
              <span className="text-xs bg-secondary/10 text-secondary px-2 py-1 rounded-full">
                👶 Kids OK
              </span>
            )}
            {pet.good_with_animals && (
              <span className="text-xs bg-secondary/10 text-secondary px-2 py-1 rounded-full">
                🐾 Animals OK
              </span>
            )}
          </div>

          {/* Description */}
          {pet.description && (
            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
              {pet.description}
            </p>
          )}

          {/* Shelter */}
          {pet.shelters && (
            <p className="text-xs text-muted-foreground/75">
              📍 {pet.shelters.name} · {pet.shelters.city}, {pet.shelters.state}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}
