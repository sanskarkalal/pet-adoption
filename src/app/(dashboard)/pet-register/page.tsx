"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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

const SPECIES_OPTIONS = [
  "Dog",
  "Cat",
  "Rabbit",
  "Bird",
  "Guinea Pig",
  "Other",
] as const;
const SEX_OPTIONS = ["male", "female", "unknown"] as const;
const TRAINING_OPTIONS = ["none", "basic", "intermediate", "advanced"] as const;

type Sex = (typeof SEX_OPTIONS)[number];
type TrainingLevel = (typeof TRAINING_OPTIONS)[number];

const trainingLabels: Record<TrainingLevel, string> = {
  none: "No Training",
  basic: "Basic Commands",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

export default function PetRegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [mediaUploading, setMediaUploading] = useState(false);

  // Core fields
  const [name, setName] = useState("");
  const [species, setSpecies] = useState("");
  const [breed, setBreed] = useState("");
  const [age, setAge] = useState("");
  const [sex, setSex] = useState<Sex>("unknown");
  const [description, setDescription] = useState("");
  const [behavior, setBehavior] = useState("");
  const [medicalHistory, setMedicalHistory] = useState("");
  const [isVaccinated, setIsVaccinated] = useState(false);
  const [isNeutered, setIsNeutered] = useState(false);

  // R2 fields
  const [energyLevel, setEnergyLevel] = useState("");
  const [goodWithChildren, setGoodWithChildren] = useState(false);
  const [goodWithAnimals, setGoodWithAnimals] = useState(false);
  const [houseTrained, setHouseTrained] = useState(false);
  const [trainingLevel, setTrainingLevel] = useState<TrainingLevel>("none");
  const [uniqueQuirks, setUniqueQuirks] = useState("");
  const [specialNeeds, setSpecialNeeds] = useState("");

  // Media
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [videoUrls, setVideoUrls] = useState<string[]>([]);

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = "Pet name is required";
    if (!species) newErrors.species = "Species is required";
    if (age !== "" && (isNaN(Number(age)) || Number(age) < 0)) {
      newErrors.age = "Age must be a positive number";
    }
    if (
      energyLevel !== "" &&
      (isNaN(Number(energyLevel)) ||
        Number(energyLevel) < 1 ||
        Number(energyLevel) > 10)
    ) {
      newErrors.energyLevel = "Energy level must be between 1 and 10";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
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

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login");
      return;
    }

    const { data: shelter } = await supabase
      .from("shelters")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!shelter) {
      toast.error("Please complete your shelter profile first");
      router.push("/shelter-setup");
      return;
    }

    // Duplicate name check
    const { data: existing } = await supabase
      .from("pets")
      .select("id")
      .eq("shelter_id", shelter.id)
      .eq("name", name.trim())
      .single();

    if (existing) {
      toast.error(
        `A pet named "${name.trim()}" already exists in your shelter`,
      );
      setLoading(false);
      return;
    }

    const { error } = await supabase.from("pets").insert({
      shelter_id: shelter.id,
      name: name.trim(),
      species,
      breed: breed || null,
      age: age !== "" ? Number(age) : null,
      sex,
      description: description || null,
      behavior: behavior || null,
      medical_history: medicalHistory || null,
      is_vaccinated: isVaccinated,
      is_neutered: isNeutered,
      status: "available",
      energy_level: energyLevel !== "" ? Number(energyLevel) : null,
      good_with_children: goodWithChildren,
      good_with_animals: goodWithAnimals,
      house_trained: houseTrained,
      training_level: trainingLevel,
      special_needs: specialNeeds || null,
      unique_quirks: uniqueQuirks || null,
      photo_urls: photoUrls.length > 0 ? photoUrls : null,
      video_urls: videoUrls.length > 0 ? videoUrls : null,
    });

    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }

    toast.success("Pet registered successfully! 🐾");
    router.push("/manage-pets");
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="text-4xl mb-2">🐾</div>
          <CardTitle className="text-2xl">Register a Pet</CardTitle>
          <CardDescription>
            Add a new pet to your shelter listing
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">
                Pet Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                placeholder="Buddy"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              {errors.name && (
                <p className="text-red-500 text-sm">{errors.name}</p>
              )}
            </div>

            {/* Species */}
            <div className="space-y-2">
              <Label>
                Species <span className="text-red-500">*</span>
              </Label>
              <div className="flex flex-wrap gap-2">
                {SPECIES_OPTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSpecies(s)}
                    className={`px-3 py-1.5 rounded-full border-2 text-sm font-medium transition-all cursor-pointer ${
                      species === s
                        ? "border-black bg-black text-white"
                        : "border-gray-200 hover:border-gray-400 bg-white"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
              {errors.species && (
                <p className="text-red-500 text-sm">{errors.species}</p>
              )}
            </div>

            {/* Breed + Age */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="breed">
                  Breed{" "}
                  <span className="text-gray-400 text-xs">(optional)</span>
                </Label>
                <Input
                  id="breed"
                  placeholder="Labrador Retriever"
                  value={breed}
                  onChange={(e) => setBreed(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="age">
                  Age (years){" "}
                  <span className="text-gray-400 text-xs">(optional)</span>
                </Label>
                <Input
                  id="age"
                  type="number"
                  placeholder="3"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                />
                {errors.age && (
                  <p className="text-red-500 text-sm">{errors.age}</p>
                )}
              </div>
            </div>

            {/* Sex */}
            <div className="space-y-2">
              <Label>
                Sex <span className="text-red-500">*</span>
              </Label>
              <div className="flex gap-3">
                {SEX_OPTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSex(s)}
                    className={`px-3 py-1.5 rounded-full border-2 text-sm font-medium transition-all cursor-pointer ${
                      sex === s
                        ? "border-black bg-black text-white"
                        : "border-gray-200 hover:border-gray-400 bg-white"
                    }`}
                  >
                    {s === "male"
                      ? "♂ Male"
                      : s === "female"
                        ? "♀ Female"
                        : "? Unknown"}
                  </button>
                ))}
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">
                Description{" "}
                <span className="text-gray-400 text-xs">(optional)</span>
              </Label>
              <Textarea
                id="description"
                placeholder="Tell adopters about this pet..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            {/* Behavior */}
            <div className="space-y-2">
              <Label htmlFor="behavior">
                Behavior & Personality{" "}
                <span className="text-gray-400 text-xs">(optional)</span>
              </Label>
              <Textarea
                id="behavior"
                placeholder="Loves to play fetch, good with kids..."
                value={behavior}
                onChange={(e) => setBehavior(e.target.value)}
              />
            </div>

            {/* Medical History */}
            <div className="space-y-2">
              <Label htmlFor="medical_history">
                Medical History{" "}
                <span className="text-gray-400 text-xs">(optional)</span>
              </Label>
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

            {/* R2 Fields */}
            <div className="border-t border-gray-100 pt-6">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-6">
                Additional Details
              </p>

              {/* Energy Level */}
              <div className="space-y-2 mb-6">
                <Label htmlFor="energy_level">
                  Energy Level (1–10){" "}
                  <span className="text-gray-400 text-xs">(optional)</span>
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
                {errors.energyLevel && (
                  <p className="text-red-500 text-sm">{errors.energyLevel}</p>
                )}
              </div>

              {/* Compatibility */}
              <div className="space-y-2 mb-6">
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
              <div className="space-y-2 mb-6">
                <Label>Training Level</Label>
                <div className="flex flex-wrap gap-2">
                  {TRAINING_OPTIONS.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTrainingLevel(t)}
                      className={`px-3 py-1.5 rounded-full border-2 text-sm font-medium transition-all cursor-pointer ${
                        trainingLevel === t
                          ? "border-black bg-black text-white"
                          : "border-gray-200 hover:border-gray-400 bg-white"
                      }`}
                    >
                      {trainingLabels[t]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Unique Quirks */}
              <div className="space-y-2 mb-6">
                <Label htmlFor="unique_quirks">
                  Unique Quirks{" "}
                  <span className="text-gray-400 text-xs">(optional)</span>
                </Label>
                <Textarea
                  id="unique_quirks"
                  placeholder="Scared of thunder, loves belly rubs..."
                  value={uniqueQuirks}
                  onChange={(e) => setUniqueQuirks(e.target.value)}
                />
              </div>

              {/* Special Needs */}
              <div className="space-y-2 mb-6">
                <Label htmlFor="special_needs">
                  Special Needs{" "}
                  <span className="text-gray-400 text-xs">(optional)</span>
                </Label>
                <Textarea
                  id="special_needs"
                  placeholder="Requires daily medication, needs quiet environment..."
                  value={specialNeeds}
                  onChange={(e) => setSpecialNeeds(e.target.value)}
                />
              </div>

              {/* Photos & Videos */}
              <div className="space-y-2 mb-6">
                <Label>Photos & Videos</Label>
                <MediaUpload
                  onPhotosChange={setPhotoUrls}
                  onVideosChange={setVideoUrls}
                  onUploadStateChange={setMediaUploading}
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={loading || mediaUploading}
            >
              {loading ? "Registering..." : "Register Pet →"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
