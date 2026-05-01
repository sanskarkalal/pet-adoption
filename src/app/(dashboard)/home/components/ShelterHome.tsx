"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import PetCard from "./PetCard";
import { toast } from "sonner";

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
};

type Props = {
  profile: { name: string; role: string };
  shelter: { id: string; name: string; city: string; state: string } | null;
  pets: Pet[];
};

export default function ShelterHome({ profile, shelter, pets }: Props) {
  const router = useRouter();

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    toast.success("Signed out!");
    router.push("/login");
    router.refresh();
  };

  return (
    <div className="organic-page">
      {/* Navbar */}
      <nav className="organic-nav">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🐾</span>
          <span className="font-bold text-lg">Pet Adoption</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">
            🏛️ {shelter?.name ?? profile.name}
          </span>
          <Link href="/shelter-setup">
            <Button variant="outline" size="sm">
              Edit Shelter
            </Button>
          </Link>
          <Button variant="outline" size="sm" onClick={handleSignOut}>
            Sign Out
          </Button>
        </div>
      </nav>

      <div className="organic-shell">
        {/* Action bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              {pets.length === 0
                ? "No pets listed yet"
                : `${pets.length} pet${pets.length === 1 ? "" : "s"} listed`}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/applications">
              <Button variant="outline">📋 Applications</Button>
            </Link>
            <Link href="/manage-pets">
              <Button variant="outline">🐾 Manage Pets</Button>
            </Link>
            <Link href="/pet-register">
              <Button>+ Register New Pet</Button>
            </Link>
          </div>
        </div>

        {/* Pet Grid */}
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {pets.map((pet) => (
              <PetCard key={pet.id} pet={pet} showStatus={true} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
