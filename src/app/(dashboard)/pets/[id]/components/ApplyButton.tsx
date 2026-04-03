"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

type Props = {
  petId: string;
  shelterId: string;
  userId: string;
  petStatus: string;
  hasApplied: boolean;
};

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
  const [message, setMessage] = useState("");

  // Pet is not available — show disabled label
  if (petStatus !== "available") {
    const label =
      petStatus === "pending"
        ? "⏳ Pending Adoption"
        : petStatus === "medical_hold"
          ? "🏥 Medical Hold"
          : petStatus === "adopted"
            ? "✅ Already Adopted"
            : "Not Available";

    return (
      <Button
        disabled
        variant="outline"
        className="text-gray-400 cursor-not-allowed"
      >
        {label}
      </Button>
    );
  }

  // Already applied
  if (applied) {
    return (
      <Button
        disabled
        variant="outline"
        className="text-green-600 border-green-200 bg-green-50"
      >
        ✅ Application Submitted
      </Button>
    );
  }

  const handleApply = async () => {
    if (!message.trim()) {
      toast.error(
        "Please write a short message about why you would be a great match.",
      );
      return;
    }

    setLoading(true);
    const supabase = createClient();

    const { error } = await supabase.from("adoption_applications").insert({
      pet_id: petId,
      shelter_id: shelterId,
      adopter_id: userId,
      message: message.trim(),
      status: "pending",
    });

    if (error) {
      if (error.code === "23505") {
        toast.error("You have already applied for this pet.");
        setApplied(true);
      } else {
        toast.error("Failed to submit application. Please try again.");
      }
    } else {
      toast.success(
        "Application submitted! The shelter will review it soon. 🐾",
      );
      setApplied(true);
      setShowForm(false);
    }
    setLoading(false);
  };

  return (
    <div className="w-full">
      {!showForm ? (
        <Button
          onClick={() => setShowForm(true)}
          className="bg-black text-white hover:bg-gray-800"
        >
          🐾 Apply for Adoption
        </Button>
      ) : (
        <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-3">
          <div className="space-y-1">
            <Label>
              Why would you be a great match?{" "}
              <span className="text-red-500">*</span>
            </Label>
            <Textarea
              placeholder="Tell the shelter a bit about yourself, your home, and why you would love to adopt this pet..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
            />
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleApply}
              disabled={loading}
              className="bg-black text-white hover:bg-gray-800"
            >
              {loading ? "Submitting..." : "Submit Application →"}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setShowForm(false);
                setMessage("");
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
