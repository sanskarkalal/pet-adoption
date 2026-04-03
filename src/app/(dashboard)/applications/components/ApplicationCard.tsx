"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type Pet = {
  id: string;
  name: string;
  species: string;
  breed?: string;
  status: string;
};

type Adopter = {
  id: string;
  name: string;
};

type Application = {
  id: string;
  status: string;
  message?: string;
  created_at: string;
  pets: Pet | null;
  profiles: Adopter | null;
};

type Props = {
  application: Application;
  readonly?: boolean;
};

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

const statusBadgeColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700 border-yellow-200",
  accepted: "bg-green-100 text-green-700 border-green-200",
  rejected: "bg-red-100 text-red-700 border-red-200",
};

export default function ApplicationCard({
  application: initialApp,
  readonly = false,
}: Props) {
  const router = useRouter();
  const [app, setApp] = useState(initialApp);
  const [loading, setLoading] = useState<"accept" | "reject" | null>(null);

  const handleDecision = async (decision: "accepted" | "rejected") => {
    setLoading(decision === "accepted" ? "accept" : "reject");
    const supabase = createClient();

    // Update application status
    const { error: appError } = await supabase
      .from("adoption_applications")
      .update({
        status: decision,
        updated_at: new Date().toISOString(),
      })
      .eq("id", app.id);

    if (appError) {
      toast.error("Failed to update application.");
      setLoading(null);
      return;
    }

    // If accepted, update pet status to pending
    if (decision === "accepted" && app.pets?.id) {
      await supabase
        .from("pets")
        .update({ status: "pending" })
        .eq("id", app.pets.id);
    }

    toast.success(
      decision === "accepted"
        ? `Application accepted! ${app.pets?.name ?? "Pet"} is now Pending Adoption.`
        : "Application rejected.",
    );

    setApp((prev) => ({ ...prev, status: decision }));
    setLoading(null);
    router.refresh();
  };

  const badgeColor =
    statusBadgeColors[app.status] ??
    "bg-gray-100 text-gray-600 border-gray-200";

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <p className="font-semibold text-gray-900">
              {app.profiles?.name ?? "Unknown Applicant"}
            </p>
            <span
              className={`text-xs font-medium px-2 py-0.5 rounded-full border capitalize ${badgeColor}`}
            >
              {app.status}
            </span>
          </div>
          <p className="text-sm text-gray-500">
            Applied for{" "}
            <Link
              href={`/pets/${app.pets?.id}`}
              className="text-black font-medium hover:underline"
            >
              {app.pets?.name ?? "Unknown Pet"}
            </Link>
            {app.pets?.species
              ? ` (${app.pets.species}${app.pets.breed ? ` · ${app.pets.breed}` : ""})`
              : ""}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            {formatDate(app.created_at)}
          </p>
        </div>
      </div>

      {/* Applicant message */}
      {app.message && (
        <div className="bg-gray-50 rounded-lg p-3 mb-4">
          <p className="text-sm text-gray-700 leading-relaxed">
            &ldquo;{app.message}&rdquo;
          </p>
        </div>
      )}

      {/* Accept / Reject — only shown for pending, non-readonly */}
      {!readonly && app.status === "pending" && (
        <div className="flex gap-2">
          <Button
            size="sm"
            className="bg-green-600 hover:bg-green-700 text-white"
            onClick={() => handleDecision("accepted")}
            disabled={loading !== null}
          >
            {loading === "accept" ? "Accepting..." : "✓ Accept"}
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="text-red-600 border-red-200 hover:bg-red-50"
            onClick={() => handleDecision("rejected")}
            disabled={loading !== null}
          >
            {loading === "reject" ? "Rejecting..." : "✕ Reject"}
          </Button>
        </div>
      )}
    </div>
  );
}
