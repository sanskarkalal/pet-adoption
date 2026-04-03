"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";

const optionalNumberField = z.preprocess((value) => {
  if (value === "" || value == null) return undefined;
  return Number(value);
}, z.number().min(0).optional());

const preferencesSchema = z
  .object({
    preferred_species: z.array(z.string()).min(1, "Select at least one species"),
    preferred_breed: z.string().optional(),
    preferred_age_min: optionalNumberField,
    preferred_age_max: optionalNumberField,
    has_children: z.boolean().default(false),
    has_other_pets: z.boolean().default(false),
    living_situation: z.enum(["house", "apartment", "condo", "other"]),
    yard: z.boolean().default(false),
    experience_level: z.enum(["first_time", "some_experience", "experienced"]),
    notes: z.string().optional(),
  })
  .refine(
    (data) =>
      data.preferred_age_min == null ||
      data.preferred_age_max == null ||
      data.preferred_age_min <= data.preferred_age_max,
    {
      message: "Minimum age cannot be greater than maximum age",
      path: ["preferred_age_max"],
    },
  );

type PreferencesForm = z.output<typeof preferencesSchema>;
type PreferencesFormInput = z.input<typeof preferencesSchema>;

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
  {
    id: "house",
    label: "House",
    description: "Best if you want larger or higher-energy pets in your mix.",
  },
  {
    id: "apartment",
    label: "Apartment",
    description: "Great for filtering toward adaptable indoor companions.",
  },
  {
    id: "condo",
    label: "Condo",
    description: "Helpful when you want flexible size and noise needs.",
  },
  {
    id: "other",
    label: "Other",
    description: "Use this if your setup is less standard.",
  },
];

const experienceOptions = [
  {
    id: "first_time",
    label: "First-time owner",
    description: "We will bias toward easier first matches.",
  },
  {
    id: "some_experience",
    label: "Some experience",
    description: "Good for moderate energy or training needs.",
  },
  {
    id: "experienced",
    label: "Experienced",
    description: "Includes pets that need extra handling or structure.",
  },
];

export default function PreferencesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [bootstrapping, setBootstrapping] = useState(true);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<PreferencesFormInput, unknown, PreferencesForm>({
    resolver: zodResolver(preferencesSchema),
    defaultValues: {
      preferred_species: [],
      preferred_breed: "",
      preferred_age_min: undefined,
      preferred_age_max: undefined,
      has_children: false,
      has_other_pets: false,
      living_situation: "house",
      yard: false,
      experience_level: "first_time",
      notes: "",
    },
  });

  const preferredSpecies = watch("preferred_species");
  const hasChildren = watch("has_children");
  const hasOtherPets = watch("has_other_pets");
  const yard = watch("yard");
  const livingChoice = watch("living_situation");
  const experienceChoice = watch("experience_level");

  useEffect(() => {
    const loadPreferences = async () => {
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast.error("Not authenticated");
        router.push("/login");
        return;
      }

      const { data } = await supabase
        .from("preferences")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (data) {
        reset({
          preferred_species: data.preferred_species ?? [],
          preferred_breed: data.preferred_breed ?? "",
          preferred_age_min: data.preferred_age_min ?? undefined,
          preferred_age_max: data.preferred_age_max ?? undefined,
          has_children: data.has_children ?? false,
          has_other_pets: data.has_other_pets ?? false,
          living_situation: data.living_situation ?? "house",
          yard: data.yard ?? false,
          experience_level: data.experience_level ?? "first_time",
          notes: data.notes ?? "",
        });
      }

      setBootstrapping(false);
    };

    void loadPreferences();
  }, [reset, router]);

  const toggleSpecies = (species: string) => {
    const updated = preferredSpecies.includes(species)
      ? preferredSpecies.filter((item) => item !== species)
      : [...preferredSpecies, species];

    setValue("preferred_species", updated, { shouldValidate: true });
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

    const payload = {
      preferred_species: data.preferred_species,
      preferred_breed: data.preferred_breed?.trim() || null,
      preferred_age_min:
        data.preferred_age_min == null ? null : data.preferred_age_min,
      preferred_age_max:
        data.preferred_age_max == null ? null : data.preferred_age_max,
      has_children: data.has_children,
      has_other_pets: data.has_other_pets,
      living_situation: data.living_situation,
      yard: data.yard,
      experience_level: data.experience_level,
      notes: data.notes?.trim() || null,
    };

    const { data: existing } = await supabase
      .from("preferences")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    const { error } = existing
      ? await supabase.from("preferences").update(payload).eq("user_id", user.id)
      : await supabase.from("preferences").insert({ user_id: user.id, ...payload });

    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }

    toast.success("Preferences saved");
    router.push("/home");
    router.refresh();
  };

  if (bootstrapping) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-xl">
          <CardContent className="py-12 text-center text-gray-500">
            Loading your preferences...
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 py-10">
      <div className="mx-auto max-w-3xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Pet Match Preferences</CardTitle>
            <CardDescription>
              Set practical household preferences so the browse page feels closer
              to standard adoption matching instead of random filtering.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
              <section className="space-y-4">
                <div>
                  <h2 className="font-semibold text-gray-900">What are you open to?</h2>
                  <p className="text-sm text-gray-500">
                    Choose the pet types and age range you want to prioritize.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Preferred Species</Label>
                  <div className="flex flex-wrap gap-2">
                    {speciesOptions.map((species) => (
                      <button
                        key={species}
                        type="button"
                        onClick={() => toggleSpecies(species)}
                        className={`rounded-full border-2 px-3 py-1.5 text-sm font-medium transition-all ${
                          preferredSpecies.includes(species)
                            ? "border-black bg-black text-white"
                            : "border-gray-200 bg-white hover:border-gray-400"
                        }`}
                      >
                        {species}
                      </button>
                    ))}
                  </div>
                  {errors.preferred_species && (
                    <p className="text-sm text-red-500">
                      {errors.preferred_species.message}
                    </p>
                  )}
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="preferred_breed">
                      Preferred breed
                      <span className="ml-1 text-xs text-gray-400">(optional)</span>
                    </Label>
                    <Input
                      id="preferred_breed"
                      placeholder="Example: Labrador, tabby, mixed breed"
                      {...register("preferred_breed")}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>
                      Preferred age range
                      <span className="ml-1 text-xs text-gray-400">(optional)</span>
                    </Label>
                    <div className="grid grid-cols-2 gap-3">
                      <Input
                        type="number"
                        min={0}
                        placeholder="Min age"
                        {...register("preferred_age_min")}
                      />
                      <Input
                        type="number"
                        min={0}
                        placeholder="Max age"
                        {...register("preferred_age_max")}
                      />
                    </div>
                    {errors.preferred_age_max && (
                      <p className="text-sm text-red-500">
                        {errors.preferred_age_max.message}
                      </p>
                    )}
                  </div>
                </div>
              </section>

              <section className="space-y-4 border-t border-gray-100 pt-8">
                <div>
                  <h2 className="font-semibold text-gray-900">Household fit</h2>
                  <p className="text-sm text-gray-500">
                    These details help the app surface pets that match your day to
                    day environment.
                  </p>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  {livingOptions.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() =>
                        setValue("living_situation", option.id as PreferencesForm["living_situation"])
                      }
                      className={`rounded-xl border-2 p-4 text-left transition-all ${
                        livingChoice === option.id
                          ? "border-black bg-black text-white"
                          : "border-gray-200 bg-white hover:border-gray-400"
                      }`}
                    >
                      <p className="font-medium">{option.label}</p>
                      <p
                        className={`mt-1 text-sm ${
                          livingChoice === option.id ? "text-gray-200" : "text-gray-500"
                        }`}
                      >
                        {option.description}
                      </p>
                    </button>
                  ))}
                </div>

                <div className="grid gap-3 md:grid-cols-3">
                  {experienceOptions.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() =>
                        setValue(
                          "experience_level",
                          option.id as PreferencesForm["experience_level"],
                        )
                      }
                      className={`rounded-xl border-2 p-4 text-left transition-all ${
                        experienceChoice === option.id
                          ? "border-black bg-black text-white"
                          : "border-gray-200 bg-white hover:border-gray-400"
                      }`}
                    >
                      <p className="font-medium">{option.label}</p>
                      <p
                        className={`mt-1 text-sm ${
                          experienceChoice === option.id
                            ? "text-gray-200"
                            : "text-gray-500"
                        }`}
                      >
                        {option.description}
                      </p>
                    </button>
                  ))}
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="has_children"
                      checked={hasChildren}
                      onCheckedChange={(value) =>
                        setValue("has_children", !!value)
                      }
                    />
                    <Label htmlFor="has_children">Children live in the home</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="has_other_pets"
                      checked={hasOtherPets}
                      onCheckedChange={(value) =>
                        setValue("has_other_pets", !!value)
                      }
                    />
                    <Label htmlFor="has_other_pets">Other pets live in the home</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="yard"
                      checked={yard}
                      onCheckedChange={(value) => setValue("yard", !!value)}
                    />
                    <Label htmlFor="yard">Access to a yard or outdoor space</Label>
                  </div>
                </div>
              </section>

              <section className="space-y-2 border-t border-gray-100 pt-8">
                <Label htmlFor="notes">
                  Notes for matching
                  <span className="ml-1 text-xs text-gray-400">(optional)</span>
                </Label>
                <Textarea
                  id="notes"
                  rows={4}
                  placeholder="Examples: looking for a calm senior pet, open to bonded pairs, need good apartment behavior."
                  {...register("notes")}
                />
              </section>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Saving..." : "Save Preferences"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
