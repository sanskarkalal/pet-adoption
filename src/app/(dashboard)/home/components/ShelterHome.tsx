"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import PetCard from "./PetCard";
import { toast } from "sonner";

type Props = {
  profile: { name: string; role: string };
  shelter: { id: string; name: string; city: string; state: string } | null;
  pets: any[];
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
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🐾</span>
          <span className="font-bold text-lg">Pet Adoption</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">
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

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Your Pets</h1>
            <p className="text-gray-500 mt-1">
              {pets.length === 0
                ? "No pets listed yet"
                : `${pets.length} pet${pets.length === 1 ? "" : "s"} listed`}
            </p>
          </div>
          <Link href="/pet-register">
            <Button>+ Register New Pet</Button>
          </Link>
        </div>

        {/* Pet Grid */}
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
