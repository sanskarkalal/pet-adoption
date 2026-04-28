"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";

const shelterSchema = z.object({
  name: z.string().min(2, "Shelter name must be at least 2 characters"),
  address: z.string().min(5, "Please enter a valid address"),
  city: z.string().min(2, "City is required"),
  state: z.string().min(2, "State is required"),
  phone: z.string().min(10, "Please enter a valid phone number"),
  email: z.string().email("Please enter a valid email"),
  website: z
    .string()
    .url("Please enter a valid URL")
    .optional()
    .or(z.literal("")),
});

type ShelterForm = z.infer<typeof shelterSchema>;
type ShelterErrors = Partial<Record<keyof ShelterForm, string>>;

const emptyShelterForm: ShelterForm = {
  name: "",
  address: "",
  city: "",
  state: "",
  phone: "",
  email: "",
  website: "",
};

export default function ShelterSetupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [hasExistingShelter, setHasExistingShelter] = useState(false);
  const [saveDebug, setSaveDebug] = useState<string | null>(null);
  const [form, setForm] = useState<ShelterForm>(emptyShelterForm);
  const [errors, setErrors] = useState<ShelterErrors>({});

  const updateField = (field: keyof ShelterForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setSaveDebug(null);
  };

  useEffect(() => {
    const loadExistingShelter = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const { data: shelters, error } = await supabase
        .from("shelters")
        .select("id, name, address, city, state, phone, email, website")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1);

      if (error) {
        toast.error("Failed to load shelter profile.");
        setInitialLoading(false);
        return;
      }

      const shelter = shelters?.[0];
      if (shelter) {
        setHasExistingShelter(true);
        setForm({
          name: shelter.name ?? "",
          address: shelter.address ?? "",
          city: shelter.city ?? "",
          state: shelter.state ?? "",
          phone: shelter.phone ?? "",
          email: shelter.email ?? "",
          website: shelter.website ?? "",
        });
      }

      setInitialLoading(false);
    };

    loadExistingShelter();
  }, [router]);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    const parsed = shelterSchema.safeParse(form);

    if (!parsed.success) {
      const nextErrors: ShelterErrors = {};
      parsed.error.issues.forEach((issue) => {
        const field = issue.path[0] as keyof ShelterForm | undefined;
        if (field) nextErrors[field] = issue.message;
      });
      setErrors(nextErrors);
      setLoading(false);
      return;
    }

    const currentData = parsed.data;

    const payload = {
      name: currentData.name.trim(),
      address: currentData.address.trim(),
      city: currentData.city.trim(),
      state: currentData.state.trim(),
      phone: currentData.phone.trim(),
      email: currentData.email.trim(),
      website: currentData.website?.trim() ? currentData.website.trim() : null,
    };

    const response = await fetch("/api/shelter", {
      method: "PUT",
      cache: "no-store",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const result = (await response.json()) as {
      shelter?: ShelterForm & { id: string };
      userId?: string;
      error?: string;
    };

    if (!response.ok || !result.shelter) {
      toast.error(result.error ?? "Unable to save shelter profile.");
      setSaveDebug(result.error ?? "Save failed without an error message.");
      setLoading(false);
      return;
    }

    toast.success(`Saved shelter as ${result.shelter.name}`);
    setHasExistingShelter(true);
    setForm({
      name: result.shelter.name ?? "",
      address: result.shelter.address ?? "",
      city: result.shelter.city ?? "",
      state: result.shelter.state ?? "",
      phone: result.shelter.phone ?? "",
      email: result.shelter.email ?? "",
      website: result.shelter.website ?? "",
    });
    setLoading(false);
    setSaveDebug(
      `Sent ${payload.name}; saved ${result.shelter.name} (${result.shelter.id}) for ${result.userId}`,
    );
    window.location.assign("/home");
  };

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-lg">
          <CardContent className="py-12 text-center text-gray-500">
            Loading shelter profile...
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="text-4xl mb-2">🏛️</div>
          <CardTitle className="text-2xl">
            {hasExistingShelter ? "Edit Shelter Profile" : "Set Up Your Shelter"}
          </CardTitle>
          <CardDescription>
            {hasExistingShelter
              ? "Update your organization details"
              : "Tell us about your organization"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="name">Shelter Name</Label>
              <Input
                id="name"
                placeholder="Happy Paws Shelter"
                value={form.name}
                onChange={(event) => updateField("name", event.target.value)}
              />
              {errors.name && (
                <p className="text-red-500 text-sm">{errors.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Street Address</Label>
              <Input
                id="address"
                placeholder="123 Main St"
                value={form.address}
                onChange={(event) => updateField("address", event.target.value)}
              />
              {errors.address && (
                <p className="text-red-500 text-sm">{errors.address}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  placeholder="Chicago"
                  value={form.city}
                  onChange={(event) => updateField("city", event.target.value)}
                />
                {errors.city && (
                  <p className="text-red-500 text-sm">{errors.city}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  placeholder="IL"
                  value={form.state}
                  onChange={(event) => updateField("state", event.target.value)}
                />
                {errors.state && (
                  <p className="text-red-500 text-sm">{errors.state}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                placeholder="(312) 555-0123"
                value={form.phone}
                onChange={(event) => updateField("phone", event.target.value)}
              />
              {errors.phone && (
                <p className="text-red-500 text-sm">{errors.phone}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Contact Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="contact@shelter.org"
                value={form.email}
                onChange={(event) => updateField("email", event.target.value)}
              />
              {errors.email && (
                <p className="text-red-500 text-sm">{errors.email}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="website">
                Website{" "}
                <span className="text-gray-400 text-xs">(optional)</span>
              </Label>
              <Input
                id="website"
                placeholder="https://www.shelter.org"
                value={form.website ?? ""}
                onChange={(event) => updateField("website", event.target.value)}
              />
              {errors.website && (
                <p className="text-red-500 text-sm">{errors.website}</p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading
                ? "Saving..."
                : hasExistingShelter
                  ? "Save Changes"
                  : "Save Shelter"}
            </Button>
            {saveDebug && (
              <p className="text-center text-xs text-gray-500">{saveDebug}</p>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
