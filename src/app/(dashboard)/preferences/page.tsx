"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";

const preferencesSchema = z.object({
  preferred_species: z.array(z.string()).min(1, "Select at least one species"),
  preferred_age_min: z.coerce.number().min(0).optional(),
  preferred_age_max: z.coerce.number().min(0).optional(),
  has_children: z.boolean().default(false),
  has_other_pets: z.boolean().default(false),
  living_situation: z.enum(["house", "apartment", "condo", "other"]),
  yard: z.boolean().default(false),
  experience_level: z.enum(["first_time", "some_experience", "experienced"]),
  notes: z.string().optional(),
});

type PreferencesForm = z.infer<typeof preferencesSchema>;

const speciesOptions = [
  "Dog",
  "Cat",
  "Rabbit",
  "Bird",
  "Fish",
  "Reptile",
  "Other",
];

const livingOptions = [
  { id: "house", label: "🏠 House" },
  { id: "apartment", label: "🏢 Apartment" },
  { id: "condo", label: "🏙️ Condo" },
  { id: "other", label: "🏕️ Other" },
];

const experienceOptions = [
  { id: "first_time", label: "🐣 First Time Owner" },
  { id: "some_experience", label: "🐾 Some Experience" },
  { id: "experienced", label: "⭐ Experienced Owner" },
];

export default function PreferencesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [selectedSpecies, setSelectedSpecies] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<PreferencesForm>({
    resolver: zodResolver(preferencesSchema),
    defaultValues: {
      has_children: false,
      has_other_pets: false,
      yard: false,
      living_situation: "house",
      experience_level: "first_time",
      preferred_species: [],
    },
  });

  const hasChildren = watch("has_children");
  const hasOtherPets = watch("has_other_pets");
  const yard = watch("yard");
  const livingChoice = watch("living_situation");
  const experienceChoice = watch("experience_level");

  const toggleSpecies = (species: string) => {
    const updated = selectedSpecies.includes(species)
      ? selectedSpecies.filter((s) => s !== species)
      : [...selectedSpecies, species];
    setSelectedSpecies(updated);
    setValue("preferred_species", updated);
  };

  const onSubmit = async (data: PreferencesForm) => {
    setLoading(true);
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Not authenticated");
      router.push("/login");
      return;
    }

    // Check if preferences already exist
    const { data: existing } = await supabase
      .from("preferences")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (existing) {
      const { error } = await supabase
        .from("preferences")
        .update({
          preferred_species: data.preferred_species,
          preferred_age_min: data.preferred_age_min || null,
          preferred_age_max: data.preferred_age_max || null,
          has_children: data.has_children,
          has_other_pets: data.has_other_pets,
          living_situation: data.living_situation,
          yard: data.yard,
          experience_level: data.experience_level,
          notes: data.notes || null,
        })
        .eq("user_id", user.id);

      if (error) {
        toast.error(error.message);
        setLoading(false);
        return;
      }
    } else {
      const { error } = await supabase.from("preferences").insert({
        user_id: user.id,
        preferred_species: data.preferred_species,
        preferred_age_min: data.preferred_age_min || null,
        preferred_age_max: data.preferred_age_max || null,
        has_children: data.has_children,
        has_other_pets: data.has_other_pets,
        living_situation: data.living_situation,
        yard: data.yard,
        experience_level: data.experience_level,
        notes: data.notes || null,
      });

      if (error) {
        toast.error(error.message);
        setLoading(false);
        return;
      }
    }

    toast.success("Preferences saved!");
    router.push("/home");
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="text-4xl mb-2">💝</div>
          <CardTitle className="text-2xl">Your Preferences</CardTitle>
          <CardDescription>Help us find your perfect pet match</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Species */}
            <div className="space-y-2">
              <Label>Preferred Species</Label>
              <div className="flex flex-wrap gap-2">
                {speciesOptions.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => toggleSpecies(s)}
                    className={`px-3 py-1.5 rounded-full border-2 text-sm font-medium transition-all cursor-pointer ${
                      selectedSpecies.includes(s)
                        ? "border-black bg-black text-white"
                        : "border-gray-200 hover:border-gray-400 bg-white"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
              {errors.preferred_species && (
                <p className="text-red-500 text-sm">
                  {errors.preferred_species.message}
                </p>
              )}
            </div>

            {/* Age Range */}
            <div className="space-y-2">
              <Label>
                Preferred Age Range (years){" "}
                <span className="text-gray-400 text-xs">(optional)</span>
              </Label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Input
                    type="number"
                    placeholder="Min age"
                    {...register("preferred_age_min")}
                  />
                </div>
                <div>
                  <Input
                    type="number"
                    placeholder="Max age"
                    {...register("preferred_age_max")}
                  />
                </div>
              </div>
            </div>

            {/* Living Situation */}
            <div className="space-y-2">
              <Label>Living Situation</Label>
              <div className="grid grid-cols-2 gap-3">
                {livingOptions.map((l) => (
                  <button
                    key={l.id}
                    type="button"
                    onClick={() => setValue("living_situation", l.id as any)}
                    className={`p-3 rounded-lg border-2 text-sm font-medium transition-all cursor-pointer ${
                      livingChoice === l.id
                        ? "border-black bg-black text-white"
                        : "border-gray-200 hover:border-gray-400 bg-white"
                    }`}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Experience Level */}
            <div className="space-y-2">
              <Label>Experience Level</Label>
              <div className="grid grid-cols-3 gap-3">
                {experienceOptions.map((e) => (
                  <button
                    key={e.id}
                    type="button"
                    onClick={() => setValue("experience_level", e.id as any)}
                    className={`p-3 rounded-lg border-2 text-xs font-medium transition-all cursor-pointer ${
                      experienceChoice === e.id
                        ? "border-black bg-black text-white"
                        : "border-gray-200 hover:border-gray-400 bg-white"
                    }`}
                  >
                    {e.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Checkboxes */}
            <div className="space-y-3">
              <Label>Household Info</Label>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="has_children"
                  checked={hasChildren}
                  onCheckedChange={(val) => setValue("has_children", !!val)}
                />
                <Label htmlFor="has_children">I have children at home</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="has_other_pets"
                  checked={hasOtherPets}
                  onCheckedChange={(val) => setValue("has_other_pets", !!val)}
                />
                <Label htmlFor="has_other_pets">I have other pets</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="yard"
                  checked={yard}
                  onCheckedChange={(val) => setValue("yard", !!val)}
                />
                <Label htmlFor="yard">I have a yard</Label>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">
                Additional Notes{" "}
                <span className="text-gray-400 text-xs">(optional)</span>
              </Label>
              <Input
                id="notes"
                placeholder="Anything else we should know..."
                {...register("notes")}
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Saving..." : "Save & Find Pets →"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
