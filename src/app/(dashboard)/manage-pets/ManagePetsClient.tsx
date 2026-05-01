"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type Pet = {
  id: string;
  name: string;
  species: string;
  breed?: string;
  age?: number;
  status: string;
  energy_level?: number;
  good_with_children?: boolean;
  good_with_animals?: boolean;
  house_trained?: boolean;
};

type Props = {
  shelter: { id: string; name: string };
  pets: Pet[];
};

const statusColors: Record<string, string> = {
  available: "bg-primary/15 text-primary border-primary/30",
  pending: "bg-secondary/15 text-secondary border-secondary/30",
  adopted: "bg-accent text-accent-foreground border-border",
  fostered: "bg-accent text-accent-foreground border-border",
  medical_hold: "bg-destructive/15 text-destructive border-destructive/30",
};

const statusLabels: Record<string, string> = {
  available: "Available",
  pending: "Pending Adoption",
  adopted: "Adopted",
  fostered: "Fostered",
  medical_hold: "Medical Hold",
};

export default function ManagePetsClient({
  shelter,
  pets: initialPets,
}: Props) {
  const [pets, setPets] = useState(initialPets);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (petId: string, petName: string) => {
    if (
      !confirm(
        `Are you sure you want to remove ${petName} from your shelter? This cannot be undone.`,
      )
    )
      return;

    setDeletingId(petId);
    const supabase = createClient();

    const { error } = await supabase.from("pets").delete().eq("id", petId);

    if (error) {
      toast.error("Failed to delete pet");
    } else {
      toast.success(`${petName} removed from shelter`);
      setPets((prev) => prev.filter((p) => p.id !== petId));
    }
    setDeletingId(null);
  };

  return (
    <div className="organic-page">
      {/* Navbar */}
      <nav className="organic-nav">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🐾</span>
          <span className="font-bold text-lg">Pet Adoption</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/home">
            <Button variant="outline" size="sm">
              ← Dashboard
            </Button>
          </Link>
          <Link href="/pet-register">
            <Button size="sm">+ Register New Pet</Button>
          </Link>
        </div>
      </nav>

      <div className="organic-shell max-w-5xl">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground">Manage Pets</h1>
          <p className="text-muted-foreground mt-1">
            {shelter.name} · {pets.length} pet{pets.length !== 1 ? "s" : ""}{" "}
            listed
          </p>
        </div>

        {pets.length === 0 ? (
          <div className="organic-empty">
            <div className="text-5xl mb-4">🐶</div>
            <h3 className="text-lg font-medium text-accent-foreground">
              No pets listed yet
            </h3>
            <p className="text-muted-foreground/75 mt-1 mb-6">
              Start by registering your first pet
            </p>
            <Link href="/pet-register">
              <Button>+ Register a Pet</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {pets.map((pet) => (
              <div
                key={pet.id}
                className="bg-card rounded-[1.5rem] border border-border/60 px-5 py-4 flex items-center justify-between shadow-soft"
              >
                <div className="flex items-center gap-4">
                  <div className="text-3xl">
                    {pet.species.toLowerCase() === "dog"
                      ? "🐶"
                      : pet.species.toLowerCase() === "cat"
                        ? "🐱"
                        : "🐾"}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-foreground">
                        {pet.name}
                      </h3>
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded-full border capitalize ${
                          statusColors[pet.status] ??
                          "bg-muted text-muted-foreground"
                        }`}
                      >
                        {statusLabels[pet.status] ?? pet.status}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {pet.species}
                      {pet.breed ? ` · ${pet.breed}` : ""}
                      {pet.age !== undefined && pet.age !== null
                        ? ` · ${pet.age} yr${pet.age !== 1 ? "s" : ""}`
                        : ""}
                    </p>
                    <div className="flex gap-2 mt-1 flex-wrap">
                      {pet.energy_level && (
                        <span className="text-xs text-muted-foreground/75">
                          ⚡ Energy {pet.energy_level}/10
                        </span>
                      )}
                      {pet.good_with_children && (
                        <span className="text-xs text-muted-foreground/75">
                          👶 Good with kids
                        </span>
                      )}
                      {pet.good_with_animals && (
                        <span className="text-xs text-muted-foreground/75">
                          🐾 Good with animals
                        </span>
                      )}
                      {pet.house_trained && (
                        <span className="text-xs text-muted-foreground/75">
                          🏠 House trained
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Link href={`/pets/${pet.id}`}>
                    <Button variant="outline" size="sm">
                      View
                    </Button>
                  </Link>
                  <Link href={`/pets/${pet.id}/edit`}>
                    <Button variant="outline" size="sm">
                      Edit
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive hover:bg-destructive/10 border-destructive/30"
                    onClick={() => handleDelete(pet.id, pet.name)}
                    disabled={deletingId === pet.id}
                  >
                    {deletingId === pet.id ? "Removing..." : "Remove"}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
