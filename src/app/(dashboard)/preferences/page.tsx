"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
type PreferencesFormState = {
  preferred_species: string[];
  preferred_breed: string;
  preferred_age_min: string;
  preferred_age_max: string;
  has_children: boolean;
  has_other_pets: boolean;
  living_situation: PreferencesForm["living_situation"];
  yard: boolean;
  experience_level: PreferencesForm["experience_level"];
  notes: string;
};
type PreferencesErrors = Partial<Record<keyof PreferencesFormState, string>>;
type SavedPreferences = Partial<
  Omit<PreferencesForm, "preferred_age_min" | "preferred_age_max">
> & {
  preferred_age_min?: number | null;
  preferred_age_max?: number | null;
  preferred_breed?: string | null;
  notes?: string | null;
};

const emptyPreferencesForm: PreferencesFormState = {
  preferred_species: [],
  preferred_breed: "",
  preferred_age_min: "",
  preferred_age_max: "",
  has_children: false,
  has_other_pets: false,
  living_situation: "house",
  yard: false,
  experience_level: "first_time",
  notes: "",
};

function preferencesToForm(preferences?: SavedPreferences | null): PreferencesFormState {
  if (!preferences) return emptyPreferencesForm;

  return {
    preferred_species: preferences.preferred_species ?? [],
    preferred_breed: preferences.preferred_breed ?? "",
    preferred_age_min:
      preferences.preferred_age_min == null
        ? ""
        : String(preferences.preferred_age_min),
    preferred_age_max:
      preferences.preferred_age_max == null
        ? ""
        : String(preferences.preferred_age_max),
    has_children: preferences.has_children ?? false,
    has_other_pets: preferences.has_other_pets ?? false,
    living_situation: preferences.living_situation ?? "house",
    yard: preferences.yard ?? false,
    experience_level: preferences.experience_level ?? "first_time",
    notes: preferences.notes ?? "",
  };
}

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
  const [saveDebug, setSaveDebug] = useState<string | null>(null);
  const [form, setForm] = useState<PreferencesFormState>(emptyPreferencesForm);
  const [errors, setErrors] = useState<PreferencesErrors>({});

  const updateField = <K extends keyof PreferencesFormState>(
    field: K,
    value: PreferencesFormState[K],
  ) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setSaveDebug(null);
  };

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

      const { data, error } = await supabase
        .from("preferences")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1);

      if (error) {
        toast.error(`Failed to load preferences: ${error.message}`);
        setBootstrapping(false);
        return;
      }

      const preferences = data?.[0];
      if (preferences) {
        setForm(preferencesToForm(preferences));
      }

      setBootstrapping(false);
    };

    void loadPreferences();
  }, [router]);

  const toggleSpecies = (species: string) => {
    const updated = form.preferred_species.includes(species)
      ? form.preferred_species.filter((item) => item !== species)
      : [...form.preferred_species, species];

    updateField("preferred_species", updated);
  };

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    const parsed = preferencesSchema.safeParse(form);

    if (!parsed.success) {
      const nextErrors: PreferencesErrors = {};
      parsed.error.issues.forEach((issue) => {
        const field = issue.path[0] as keyof PreferencesFormState | undefined;
        if (field) nextErrors[field] = issue.message;
      });
      setErrors(nextErrors);
      setLoading(false);
      return;
    }

    const currentData = parsed.data;

    const payload = {
      preferred_species: currentData.preferred_species,
      preferred_breed: currentData.preferred_breed?.trim() || null,
      preferred_age_min:
        currentData.preferred_age_min == null
          ? null
          : currentData.preferred_age_min,
      preferred_age_max:
        currentData.preferred_age_max == null
          ? null
          : currentData.preferred_age_max,
      has_children: currentData.has_children,
      has_other_pets: currentData.has_other_pets,
      living_situation: currentData.living_situation,
      yard: currentData.yard,
      experience_level: currentData.experience_level,
      notes: currentData.notes?.trim() || null,
    };

    const response = await fetch("/api/preferences", {
      method: "PUT",
      cache: "no-store",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const result = (await response.json()) as {
      preferences?: SavedPreferences;
      userId?: string;
      error?: string;
    };

    if (!response.ok || !result.preferences) {
      toast.error(result.error ?? "Unable to save preferences.");
      setSaveDebug(result.error ?? "Save failed without an error message.");
      setLoading(false);
      return;
    }

    setForm(preferencesToForm(result.preferences));
    toast.success(
      `Saved preferences for ${result.preferences.preferred_species?.join(", ")}`,
    );
    setLoading(false);
    setSaveDebug(
      `Sent ${payload.preferred_species.join(", ")}; saved ${
        result.preferences.preferred_species?.join(", ") || "none"
      } for ${result.userId}`,
    );
    window.location.assign("/home");
  };

  if (bootstrapping) {
    return (
      <div className="organic-auth">
        <Card className="w-full max-w-xl">
          <CardContent className="py-12 text-center text-muted-foreground">
            Loading your preferences...
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="organic-page p-4 py-10">
      <div className="relative z-10 mx-auto max-w-3xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Pet Match Preferences</CardTitle>
            <CardDescription>
              Set practical household preferences so the browse page feels closer
              to standard adoption matching instead of random filtering.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-8">
              <section className="space-y-4">
                <div>
                  <h2 className="font-semibold text-foreground">What are you open to?</h2>
                  <p className="text-sm text-muted-foreground">
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
                          form.preferred_species.includes(species)
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border/60 bg-card hover:border-secondary"
                        }`}
                      >
                        {species}
                      </button>
                    ))}
                  </div>
                  {errors.preferred_species && (
                    <p className="text-sm text-destructive">
                      {errors.preferred_species}
                    </p>
                  )}
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="preferred_breed">
                      Preferred breed
                      <span className="ml-1 text-xs text-muted-foreground/75">(optional)</span>
                    </Label>
                    <Input
                      id="preferred_breed"
                      placeholder="Example: Labrador, tabby, mixed breed"
                      value={form.preferred_breed}
                      onChange={(event) =>
                        updateField("preferred_breed", event.target.value)
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>
                      Preferred age range
                      <span className="ml-1 text-xs text-muted-foreground/75">(optional)</span>
                    </Label>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Input
                        type="number"
                        min={0}
                        placeholder="Min age"
                        value={form.preferred_age_min}
                        onChange={(event) =>
                          updateField("preferred_age_min", event.target.value)
                        }
                      />
                      <Input
                        type="number"
                        min={0}
                        placeholder="Max age"
                        value={form.preferred_age_max}
                        onChange={(event) =>
                          updateField("preferred_age_max", event.target.value)
                        }
                      />
                    </div>
                    {errors.preferred_age_min && (
                      <p className="text-sm text-destructive">
                        {errors.preferred_age_min}
                      </p>
                    )}
                    {errors.preferred_age_max && (
                      <p className="text-sm text-destructive">
                        {errors.preferred_age_max}
                      </p>
                    )}
                  </div>
                </div>
              </section>

              <section className="space-y-4 border-t border-border/40 pt-8">
                <div>
                  <h2 className="font-semibold text-foreground">Household fit</h2>
                  <p className="text-sm text-muted-foreground">
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
                        updateField(
                          "living_situation",
                          option.id as PreferencesForm["living_situation"],
                        )
                      }
                      className={`rounded-[1.5rem] border-2 p-4 text-left transition-all ${
                        form.living_situation === option.id
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border/60 bg-card hover:border-secondary"
                      }`}
                    >
                      <p className="font-medium">{option.label}</p>
                      <p
                        className={`mt-1 text-sm ${
                          form.living_situation === option.id
                            ? "text-primary-foreground/80"
                            : "text-muted-foreground"
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
                        updateField(
                          "experience_level",
                          option.id as PreferencesForm["experience_level"],
                        )
                      }
                      className={`rounded-[1.5rem] border-2 p-4 text-left transition-all ${
                        form.experience_level === option.id
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border/60 bg-card hover:border-secondary"
                      }`}
                    >
                      <p className="font-medium">{option.label}</p>
                      <p
                        className={`mt-1 text-sm ${
                          form.experience_level === option.id
                            ? "text-primary-foreground/80"
                            : "text-muted-foreground"
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
                      checked={form.has_children}
                      onCheckedChange={(value) =>
                        updateField("has_children", !!value)
                      }
                    />
                    <Label htmlFor="has_children">Children live in the home</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="has_other_pets"
                      checked={form.has_other_pets}
                      onCheckedChange={(value) =>
                        updateField("has_other_pets", !!value)
                      }
                    />
                    <Label htmlFor="has_other_pets">Other pets live in the home</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="yard"
                      checked={form.yard}
                      onCheckedChange={(value) =>
                        updateField("yard", !!value)
                      }
                    />
                    <Label htmlFor="yard">Access to a yard or outdoor space</Label>
                  </div>
                </div>
              </section>

              <section className="space-y-2 border-t border-border/40 pt-8">
                <Label htmlFor="notes">
                  Notes for matching
                  <span className="ml-1 text-xs text-muted-foreground/75">(optional)</span>
                </Label>
                <Textarea
                  id="notes"
                  rows={4}
                  placeholder="Examples: looking for a calm senior pet, open to bonded pairs, need good apartment behavior."
                  value={form.notes}
                  onChange={(event) => updateField("notes", event.target.value)}
                />
              </section>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Saving..." : "Save Preferences"}
              </Button>
              {saveDebug && (
                <p className="text-center text-xs text-muted-foreground">{saveDebug}</p>
              )}
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
