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
  available: "bg-green-100 text-green-700 border-green-200",
  pending: "bg-yellow-100 text-yellow-700 border-yellow-200",
  adopted: "bg-blue-100 text-blue-700 border-blue-200",
  fostered: "bg-purple-100 text-purple-700 border-purple-200",
  medical_hold: "bg-red-100 text-red-700 border-red-200",
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
              ← Dashboard
            </Button>
          </Link>
          <Link href="/pet-register">
            <Button size="sm">+ Register New Pet</Button>
          </Link>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Manage Pets</h1>
          <p className="text-gray-500 mt-1">
            {shelter.name} · {pets.length} pet{pets.length !== 1 ? "s" : ""}{" "}
            listed
          </p>
        </div>

        {pets.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
            <div className="text-5xl mb-4">🐶</div>
            <h3 className="text-lg font-medium text-gray-700">
              No pets listed yet
            </h3>
            <p className="text-gray-400 mt-1 mb-6">
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
                className="bg-white rounded-xl border border-gray-200 px-5 py-4 flex items-center justify-between shadow-sm"
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
                      <h3 className="font-semibold text-gray-900">
                        {pet.name}
                      </h3>
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded-full border capitalize ${
                          statusColors[pet.status] ??
                          "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {statusLabels[pet.status] ?? pet.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">
                      {pet.species}
                      {pet.breed ? ` · ${pet.breed}` : ""}
                      {pet.age !== undefined && pet.age !== null
                        ? ` · ${pet.age} yr${pet.age !== 1 ? "s" : ""}`
                        : ""}
                    </p>
                    <div className="flex gap-2 mt-1 flex-wrap">
                      {pet.energy_level && (
                        <span className="text-xs text-gray-400">
                          ⚡ Energy {pet.energy_level}/10
                        </span>
                      )}
                      {pet.good_with_children && (
                        <span className="text-xs text-gray-400">
                          👶 Good with kids
                        </span>
                      )}
                      {pet.good_with_animals && (
                        <span className="text-xs text-gray-400">
                          🐾 Good with animals
                        </span>
                      )}
                      {pet.house_trained && (
                        <span className="text-xs text-gray-400">
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
                    className="text-red-600 hover:bg-red-50 border-red-200"
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
