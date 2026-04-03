"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  emptyApplicationDetails,
  serializeApplicationMessage,
  type ApplicationDetails,
} from "@/lib/application-details";
import { toast } from "sonner";

type Props = {
  petId: string;
  shelterId: string;
  userId: string;
  petStatus: string;
  hasApplied: boolean;
};

const householdOptions = [
  { value: "house", label: "House" },
  { value: "apartment", label: "Apartment" },
  { value: "condo", label: "Condo or townhome" },
  { value: "other", label: "Other" },
];

const housingOptions = [
  { value: "own", label: "Own" },
  { value: "rent", label: "Rent" },
  { value: "family", label: "Live with family" },
  { value: "other", label: "Other" },
];

const activityOptions = [
  { value: "low", label: "Low-key home" },
  { value: "moderate", label: "Moderately active" },
  { value: "high", label: "Very active" },
];

const timelineOptions = [
  { value: "asap", label: "Ready now" },
  { value: "1_2_weeks", label: "In 1-2 weeks" },
  { value: "this_month", label: "This month" },
  { value: "just_browsing", label: "Still deciding" },
];

function fieldLabel(value: string) {
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export default function ApplyButton({
  petId,
  shelterId,
  userId,
  petStatus,
  hasApplied,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [applied, setApplied] = useState(hasApplied);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<ApplicationDetails>(emptyApplicationDetails);

  const updateField = (field: keyof ApplicationDetails, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const resetForm = () => {
    setForm(emptyApplicationDetails());
    setShowForm(false);
  };

  const requiredFields: Array<keyof ApplicationDetails> = [
    "intro",
    "householdType",
    "housingStatus",
    "householdSize",
    "otherPetsInfo",
    "workSchedule",
    "experience",
    "carePlan",
    "timeline",
  ];

  const missingField = requiredFields.find((field) => !form[field].trim());

  if (petStatus !== "available") {
    const label =
      petStatus === "pending"
        ? "Pending Adoption"
        : petStatus === "medical_hold"
          ? "Medical Hold"
          : petStatus === "adopted"
            ? "Already Adopted"
            : "Not Available";

    return (
      <Button
        disabled
        variant="outline"
        className="cursor-not-allowed text-gray-400"
      >
        {label}
      </Button>
    );
  }

  if (applied) {
    return (
      <Button
        disabled
        variant="outline"
        className="border-green-200 bg-green-50 text-green-600"
      >
        Application Submitted
      </Button>
    );
  }

  const handleApply = async () => {
    if (missingField) {
      toast.error(`Please complete ${fieldLabel(missingField)}.`);
      return;
    }

    if (!shelterId) {
      toast.error("Could not determine shelter. Please refresh and try again.");
      return;
    }

    setLoading(true);
    const supabase = createClient();

    const { error } = await supabase.from("adoption_applications").insert({
      pet_id: petId,
      shelter_id: shelterId,
      adopter_id: userId,
      message: serializeApplicationMessage(form),
      status: "pending",
    });

    if (error) {
      if (error.code === "23505") {
        toast.error("You have already applied for this pet.");
        setApplied(true);
      } else {
        toast.error(`Failed to submit: ${error.message}`);
      }
      setLoading(false);
      return;
    }

    toast.success("Application submitted. The shelter can now review the details.");
    setApplied(true);
    resetForm();
    setLoading(false);
  };

  return (
    <div className="w-full">
      {!showForm ? (
        <Button
          onClick={() => setShowForm(true)}
          className="bg-black text-white hover:bg-gray-800"
        >
          Apply for Adoption
        </Button>
      ) : (
        <div className="mt-4 space-y-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
          <div>
            <h3 className="font-semibold text-gray-900">Adoption Application</h3>
            <p className="text-sm text-gray-500">
              Share the information shelters usually need to review fit,
              readiness, and daily care plans.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="intro">
                Why are you interested in this pet?{" "}
                <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="intro"
                rows={4}
                placeholder="Tell the shelter why this pet feels like a good match for you."
                value={form.intro}
                onChange={(e) => updateField("intro", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>
                Living situation <span className="text-red-500">*</span>
              </Label>
              <Select
                value={form.householdType}
                onValueChange={(value) => updateField("householdType", value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select home type" />
                </SelectTrigger>
                <SelectContent>
                  {householdOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>
                Housing status <span className="text-red-500">*</span>
              </Label>
              <Select
                value={form.housingStatus}
                onValueChange={(value) => updateField("housingStatus", value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Own, rent, or other" />
                </SelectTrigger>
                <SelectContent>
                  {housingOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="householdSize">
                Household members <span className="text-red-500">*</span>
              </Label>
              <Input
                id="householdSize"
                placeholder="Example: 2 adults, 1 teenager"
                value={form.householdSize}
                onChange={(e) => updateField("householdSize", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="childrenInfo">Children at home</Label>
              <Input
                id="childrenInfo"
                placeholder="Example: No children / Ages 6 and 9"
                value={form.childrenInfo}
                onChange={(e) => updateField("childrenInfo", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="otherPetsInfo">
                Other pets <span className="text-red-500">*</span>
              </Label>
              <Input
                id="otherPetsInfo"
                placeholder="Example: One senior cat, dog-friendly"
                value={form.otherPetsInfo}
                onChange={(e) => updateField("otherPetsInfo", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>
                Home activity level <span className="text-red-500">*</span>
              </Label>
              <Select
                value={form.activityLevel}
                onValueChange={(value) => updateField("activityLevel", value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select activity level" />
                </SelectTrigger>
                <SelectContent>
                  {activityOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="workSchedule">
                Daily schedule and time at home{" "}
                <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="workSchedule"
                rows={3}
                placeholder="Describe your work schedule, who will help with care, and how long the pet may be alone."
                value={form.workSchedule}
                onChange={(e) => updateField("workSchedule", e.target.value)}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="experience">
                Pet experience <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="experience"
                rows={3}
                placeholder="Share your experience with similar pets, training, medication, or behavior support."
                value={form.experience}
                onChange={(e) => updateField("experience", e.target.value)}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="carePlan">
                Care plan and preparedness <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="carePlan"
                rows={3}
                placeholder="How will you handle exercise, vet care, settling in, and any special needs?"
                value={form.carePlan}
                onChange={(e) => updateField("carePlan", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>
                Adoption timeline <span className="text-red-500">*</span>
              </Label>
              <Select
                value={form.timeline}
                onValueChange={(value) => updateField("timeline", value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="When are you ready?" />
                </SelectTrigger>
                <SelectContent>
                  {timelineOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleApply}
              disabled={loading}
              className="bg-black text-white hover:bg-gray-800"
            >
              {loading ? "Submitting..." : "Submit Application"}
            </Button>
            <Button variant="outline" onClick={resetForm}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
