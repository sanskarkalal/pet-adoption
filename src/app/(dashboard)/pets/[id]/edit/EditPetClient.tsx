"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import MediaUpload from "@/components/ui/MediaUpload";
import { toast } from "sonner";

const STATUS_OPTIONS = [
  "available",
  "pending",
  "adopted",
  "fostered",
  "medical_hold",
] as const;

const TRAINING_OPTIONS = ["none", "basic", "intermediate", "advanced"] as const;

type Status = (typeof STATUS_OPTIONS)[number];
type TrainingLevel = (typeof TRAINING_OPTIONS)[number];

const statusLabels: Record<Status, string> = {
  available: "Available",
  pending: "Pending Adoption",
  adopted: "Adopted",
  fostered: "Fostered",
  medical_hold: "Medical Hold",
};

const trainingLabels: Record<TrainingLevel, string> = {
  none: "No Training",
  basic: "Basic Commands",
  intermediate: "Intermediate",
  advanced: "Advanced",
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
};

function toStatus(val: string): Status {
  return (STATUS_OPTIONS as readonly string[]).includes(val)
    ? (val as Status)
    : "available";
}

function toTraining(val: string | undefined): TrainingLevel {
  return (TRAINING_OPTIONS as readonly string[]).includes(val ?? "")
    ? (val as TrainingLevel)
    : "none";
}

export default function EditPetClient({ pet }: { pet: Pet }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [mediaUploading, setMediaUploading] = useState(false);

  const [status, setStatus] = useState<Status>(toStatus(pet.status));
  const [description, setDescription] = useState(pet.description ?? "");
  const [behavior, setBehavior] = useState(pet.behavior ?? "");
  const [medicalHistory, setMedicalHistory] = useState(
    pet.medical_history ?? "",
  );
  const [isVaccinated, setIsVaccinated] = useState(pet.is_vaccinated);
  const [isNeutered, setIsNeutered] = useState(pet.is_neutered);
  const [energyLevel, setEnergyLevel] = useState<string>(
    pet.energy_level !== undefined ? String(pet.energy_level) : "",
  );
  const [goodWithChildren, setGoodWithChildren] = useState(
    pet.good_with_children ?? false,
  );
  const [goodWithAnimals, setGoodWithAnimals] = useState(
    pet.good_with_animals ?? false,
  );
  const [houseTrained, setHouseTrained] = useState(pet.house_trained ?? false);
  const [trainingLevel, setTrainingLevel] = useState<TrainingLevel>(
    toTraining(pet.training_level),
  );
  const [uniqueQuirks, setUniqueQuirks] = useState(pet.unique_quirks ?? "");
  const [specialNeeds, setSpecialNeeds] = useState(pet.special_needs ?? "");
  const [photoUrls, setPhotoUrls] = useState<string[]>(pet.photo_urls ?? []);
  const [videoUrls, setVideoUrls] = useState<string[]>(pet.video_urls ?? []);
  const [energyError, setEnergyError] = useState("");

  const validate = (): boolean => {
    if (energyLevel !== "") {
      const n = Number(energyLevel);
      if (isNaN(n) || n < 1 || n > 10) {
        setEnergyError("Energy level must be between 1 and 10");
        return false;
      }
    }
    setEnergyError("");
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    if (mediaUploading) {
      toast.error("Please wait for the photo or video upload to finish.");
      return;
    }

    setLoading(true);
    const supabase = createClient();

    const { error } = await supabase
      .from("pets")
      .update({
        description: description || null,
        behavior: behavior || null,
        medical_history: medicalHistory || null,
        is_vaccinated: isVaccinated,
        is_neutered: isNeutered,
        status,
        energy_level: energyLevel === "" ? null : Number(energyLevel),
        good_with_children: goodWithChildren,
        good_with_animals: goodWithAnimals,
        house_trained: houseTrained,
        training_level: trainingLevel,
        special_needs: specialNeeds || null,
        unique_quirks: uniqueQuirks || null,
        photo_urls: photoUrls.length > 0 ? photoUrls : null,
        video_urls: videoUrls.length > 0 ? videoUrls : null,
      })
      .eq("id", pet.id);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success(`${pet.name}'s profile updated!`);
      router.push("/manage-pets");
      router.refresh();
    }
    setLoading(false);
  };

  return (
    <div className="organic-page px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <Link href="/manage-pets">
            <Button variant="outline" size="sm">
              ← Back to Manage Pets
            </Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <div className="text-3xl mb-1">✏️</div>
            <CardTitle>Edit {pet.name}&apos;s Profile</CardTitle>
            <CardDescription>
              Required fields (name, species, breed, age, sex) cannot be changed
              after registration.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Locked fields */}
              <div className="bg-background border border-border/60 rounded-2xl p-4 space-y-3">
                <p className="text-xs font-medium text-muted-foreground/75 uppercase tracking-wide">
                  Locked Fields
                </p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label className="text-muted-foreground/75">Name</Label>
                    <Input
                      value={pet.name}
                      disabled
                      className="bg-muted text-muted-foreground"
                    />
                  </div>
                  <div>
                    <Label className="text-muted-foreground/75">Species</Label>
                    <Input
                      value={pet.species}
                      disabled
                      className="bg-muted text-muted-foreground"
                    />
                  </div>
                  <div>
                    <Label className="text-muted-foreground/75">Breed</Label>
                    <Input
                      value={pet.breed ?? "—"}
                      disabled
                      className="bg-muted text-muted-foreground"
                    />
                  </div>
                  <div>
                    <Label className="text-muted-foreground/75">Age</Label>
                    <Input
                      value={
                        pet.age !== undefined && pet.age !== null
                          ? `${pet.age} years`
                          : "—"
                      }
                      disabled
                      className="bg-muted text-muted-foreground"
                    />
                  </div>
                  <div>
                    <Label className="text-muted-foreground/75">Sex</Label>
                    <Input
                      value={pet.sex}
                      disabled
                      className="bg-muted text-muted-foreground capitalize"
                    />
                  </div>
                </div>
              </div>

              {/* Status */}
              <div className="space-y-2">
                <Label>Availability Status</Label>
                <div className="flex flex-wrap gap-2">
                  {STATUS_OPTIONS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setStatus(s)}
                      className={`px-3 py-1.5 rounded-full border-2 text-sm font-medium transition-all cursor-pointer ${
                        status === s
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border/60 hover:border-secondary bg-card"
                      }`}
                    >
                      {statusLabels[s]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Tell adopters about this pet..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              {/* Behavior */}
              <div className="space-y-2">
                <Label htmlFor="behavior">Behavior & Personality</Label>
                <Textarea
                  id="behavior"
                  placeholder="Loves to play fetch, good with kids..."
                  value={behavior}
                  onChange={(e) => setBehavior(e.target.value)}
                />
              </div>

              {/* Medical History */}
              <div className="space-y-2">
                <Label htmlFor="medical_history">Medical History</Label>
                <Textarea
                  id="medical_history"
                  placeholder="Any known conditions or history..."
                  value={medicalHistory}
                  onChange={(e) => setMedicalHistory(e.target.value)}
                />
              </div>

              {/* Vaccinated / Neutered */}
              <div className="flex gap-6">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="is_vaccinated"
                    checked={isVaccinated}
                    onCheckedChange={(val) => setIsVaccinated(!!val)}
                  />
                  <Label htmlFor="is_vaccinated">Vaccinated</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="is_neutered"
                    checked={isNeutered}
                    onCheckedChange={(val) => setIsNeutered(!!val)}
                  />
                  <Label htmlFor="is_neutered">Neutered/Spayed</Label>
                </div>
              </div>

              {/* Energy Level */}
              <div className="space-y-2">
                <Label htmlFor="energy_level">
                  Energy Level (1–10){" "}
                  <span className="text-muted-foreground/75 text-xs">(optional)</span>
                </Label>
                <Input
                  id="energy_level"
                  type="number"
                  min={1}
                  max={10}
                  placeholder="e.g. 7"
                  value={energyLevel}
                  onChange={(e) => setEnergyLevel(e.target.value)}
                />
                {energyError && (
                  <p className="text-destructive text-sm">{energyError}</p>
                )}
              </div>

              {/* Compatibility */}
              <div className="space-y-2">
                <Label>Compatibility</Label>
                <div className="flex gap-6 flex-wrap">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="good_with_children"
                      checked={goodWithChildren}
                      onCheckedChange={(val) => setGoodWithChildren(!!val)}
                    />
                    <Label htmlFor="good_with_children">
                      Good with children
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="good_with_animals"
                      checked={goodWithAnimals}
                      onCheckedChange={(val) => setGoodWithAnimals(!!val)}
                    />
                    <Label htmlFor="good_with_animals">
                      Good with other animals
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="house_trained"
                      checked={houseTrained}
                      onCheckedChange={(val) => setHouseTrained(!!val)}
                    />
                    <Label htmlFor="house_trained">House trained</Label>
                  </div>
                </div>
              </div>

              {/* Training Level */}
              <div className="space-y-2">
                <Label>Training Level</Label>
                <div className="flex flex-wrap gap-2">
                  {TRAINING_OPTIONS.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTrainingLevel(t)}
                      className={`px-3 py-1.5 rounded-full border-2 text-sm font-medium transition-all cursor-pointer ${
                        trainingLevel === t
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border/60 hover:border-secondary bg-card"
                      }`}
                    >
                      {trainingLabels[t]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Unique Quirks */}
              <div className="space-y-2">
                <Label htmlFor="unique_quirks">
                  Unique Quirks{" "}
                  <span className="text-muted-foreground/75 text-xs">(optional)</span>
                </Label>
                <Textarea
                  id="unique_quirks"
                  placeholder="Scared of thunder, loves belly rubs..."
                  value={uniqueQuirks}
                  onChange={(e) => setUniqueQuirks(e.target.value)}
                />
              </div>

              {/* Special Needs */}
              <div className="space-y-2">
                <Label htmlFor="special_needs">
                  Special Needs{" "}
                  <span className="text-muted-foreground/75 text-xs">(optional)</span>
                </Label>
                <Textarea
                  id="special_needs"
                  placeholder="Requires daily medication, needs quiet environment..."
                  value={specialNeeds}
                  onChange={(e) => setSpecialNeeds(e.target.value)}
                />
              </div>

              {/* Photos & Videos */}
              <div className="space-y-2">
                <Label>Photos & Videos</Label>
                <MediaUpload
                  petId={pet.id}
                  existingPhotoUrls={photoUrls}
                  existingVideoUrls={videoUrls}
                  onPhotosChange={setPhotoUrls}
                  onVideosChange={setVideoUrls}
                  onUploadStateChange={setMediaUploading}
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={loading || mediaUploading}
              >
                {loading ? "Saving..." : "Save Changes →"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
