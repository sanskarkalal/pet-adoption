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
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";

const petSchema = z.object({
  name: z.string().min(1, "Pet name is required"),
  species: z.string().min(1, "Species is required"),
  breed: z.string().optional(),
  age: z.coerce.number().min(0, "Age must be a positive number").optional(),
  sex: z.enum(["male", "female", "unknown"]),
  description: z.string().optional(),
  behavior: z.string().optional(),
  medical_history: z.string().optional(),
  is_vaccinated: z.boolean().default(false),
  is_neutered: z.boolean().default(false),
});

type PetForm = z.infer<typeof petSchema>;

export default function PetRegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<PetForm>({
    resolver: zodResolver(petSchema),
    defaultValues: {
      sex: "unknown",
      is_vaccinated: false,
      is_neutered: false,
    },
  });

  const isVaccinated = watch("is_vaccinated");
  const isNeutered = watch("is_neutered");

  const onSubmit = async (data: PetForm) => {
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

    // Get shelter id for this user
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

    // Check for duplicate pet name in this shelter
    const { data: existing } = await supabase
      .from("pets")
      .select("id")
      .eq("shelter_id", shelter.id)
      .eq("name", data.name)
      .single();

    if (existing) {
      toast.error(`A pet named "${data.name}" already exists in your shelter`);
      setLoading(false);
      return;
    }

    const { error } = await supabase.from("pets").insert({
      shelter_id: shelter.id,
      name: data.name,
      species: data.species,
      breed: data.breed || null,
      age: data.age || null,
      sex: data.sex,
      description: data.description || null,
      behavior: data.behavior || null,
      medical_history: data.medical_history || null,
      is_vaccinated: data.is_vaccinated,
      is_neutered: data.is_neutered,
      status: "available",
    });

    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }

    toast.success("Pet registered successfully!");
    router.push("/home");
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="text-4xl mb-2">🐾</div>
          <CardTitle className="text-2xl">Register a Pet</CardTitle>
          <CardDescription>
            Add a new pet to your shelter listing
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Pet Name</Label>
                <Input id="name" placeholder="Buddy" {...register("name")} />
                {errors.name && (
                  <p className="text-red-500 text-sm">{errors.name.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="species">Species</Label>
                <Input
                  id="species"
                  placeholder="Dog, Cat, Rabbit..."
                  {...register("species")}
                />
                {errors.species && (
                  <p className="text-red-500 text-sm">
                    {errors.species.message}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="breed">
                  Breed{" "}
                  <span className="text-gray-400 text-xs">(optional)</span>
                </Label>
                <Input
                  id="breed"
                  placeholder="Golden Retriever"
                  {...register("breed")}
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
                  {...register("age")}
                />
                {errors.age && (
                  <p className="text-red-500 text-sm">{errors.age.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Sex</Label>
              <div className="grid grid-cols-3 gap-3">
                {["male", "female", "unknown"].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() =>
                      setValue("sex", s as "male" | "female" | "unknown")
                    }
                    className={`p-2 rounded-lg border-2 text-center text-sm font-medium transition-all cursor-pointer capitalize ${
                      watch("sex") === s
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

            <div className="space-y-2">
              <Label htmlFor="description">
                Description{" "}
                <span className="text-gray-400 text-xs">(optional)</span>
              </Label>
              <Textarea
                id="description"
                placeholder="Tell adopters about this pet..."
                {...register("description")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="behavior">
                Behavior & Quirks{" "}
                <span className="text-gray-400 text-xs">(optional)</span>
              </Label>
              <Textarea
                id="behavior"
                placeholder="Loves to play fetch, good with kids..."
                {...register("behavior")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="medical_history">
                Medical History{" "}
                <span className="text-gray-400 text-xs">(optional)</span>
              </Label>
              <Textarea
                id="medical_history"
                placeholder="Any known medical conditions or history..."
                {...register("medical_history")}
              />
            </div>

            <div className="flex gap-6">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="is_vaccinated"
                  checked={isVaccinated}
                  onCheckedChange={(val) => setValue("is_vaccinated", !!val)}
                />
                <Label htmlFor="is_vaccinated">Vaccinated</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="is_neutered"
                  checked={isNeutered}
                  onCheckedChange={(val) => setValue("is_neutered", !!val)}
                />
                <Label htmlFor="is_neutered">Neutered/Spayed</Label>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Registering..." : "Register Pet →"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
