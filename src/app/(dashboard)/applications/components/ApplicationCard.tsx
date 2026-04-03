"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  applicationSummary,
  hasApplicationUpdate,
  parseApplicationMessage,
  type ApplicationDetails,
} from "@/lib/application-details";
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
  updated_at?: string | null;
  pets: Pet | null;
  profiles: Adopter | null;
};

type Props = {
  application: Application;
  readonly?: boolean;
};

const statusBadgeColors: Record<string, string> = {
  pending: "border-yellow-200 bg-yellow-100 text-yellow-700",
  accepted: "border-green-200 bg-green-100 text-green-700",
  rejected: "border-red-200 bg-red-100 text-red-700",
};

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

const detailLabelMap: Partial<Record<keyof ApplicationDetails, string>> = {
  householdType: "Living situation",
  housingStatus: "Housing status",
  householdSize: "Household members",
  childrenInfo: "Children",
  otherPetsInfo: "Other pets",
  workSchedule: "Daily schedule",
  activityLevel: "Activity level",
  experience: "Pet experience",
  carePlan: "Care plan",
  timeline: "Timeline",
};

export default function ApplicationCard({
  application: initialApp,
  readonly = false,
}: Props) {
  const router = useRouter();
  const [app, setApp] = useState(initialApp);
  const [loading, setLoading] = useState<"accept" | "reject" | null>(null);

  const { details, legacyMessage } = parseApplicationMessage(app.message);
  const badgeColor =
    statusBadgeColors[app.status] ?? "border-gray-200 bg-gray-100 text-gray-600";

  const handleDecision = async (decision: "accepted" | "rejected") => {
    setLoading(decision === "accepted" ? "accept" : "reject");
    const supabase = createClient();

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

    if (decision === "accepted" && app.pets?.id) {
      await supabase.from("pets").update({ status: "pending" }).eq("id", app.pets.id);
    }

    toast.success(
      decision === "accepted"
        ? `Application accepted. ${app.pets?.name ?? "This pet"} is now pending adoption.`
        : "Application rejected.",
    );

    setApp((prev) => ({
      ...prev,
      status: decision,
      updated_at: new Date().toISOString(),
    }));
    setLoading(null);
    router.refresh();
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <p className="font-semibold text-gray-900">
              {app.profiles?.name ?? "Unknown Applicant"}
            </p>
            <span
              className={`rounded-full border px-2 py-0.5 text-xs font-medium capitalize ${badgeColor}`}
            >
              {app.status}
            </span>
            {hasApplicationUpdate(app.created_at, app.updated_at) && (
              <span className="rounded-full bg-sky-50 px-2 py-0.5 text-xs font-medium text-sky-700">
                Updated
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500">
            Applied for{" "}
            <Link
              href={`/pets/${app.pets?.id}`}
              className="font-medium text-black hover:underline"
            >
              {app.pets?.name ?? "Unknown Pet"}
            </Link>
            {app.pets?.species
              ? ` (${app.pets.species}${app.pets.breed ? ` · ${app.pets.breed}` : ""})`
              : ""}
          </p>
          <p className="mt-0.5 text-xs text-gray-400">
            Submitted {formatDate(app.created_at)}
          </p>
        </div>
      </div>

      {details ? (
        <div className="space-y-4">
          <div className="rounded-lg bg-gray-50 p-3">
            <p className="text-sm font-medium text-gray-900">Applicant summary</p>
            <p className="mt-1 text-sm leading-relaxed text-gray-700">
              {applicationSummary(details)}
            </p>
          </div>

          <div className="space-y-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                Why this pet
              </p>
              <p className="mt-1 text-sm leading-relaxed text-gray-700">
                {details.intro}
              </p>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              {(Object.entries(detailLabelMap) as Array<
                [keyof ApplicationDetails, string]
              >).map(([key, label]) => {
                const value = details[key];
                if (!value) return null;

                return (
                  <div key={key} className="rounded-lg border border-gray-200 p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                      {label}
                    </p>
                    <p className="mt-1 text-sm text-gray-700">{value}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : legacyMessage ? (
        <div className="mb-4 rounded-lg bg-gray-50 p-3">
          <p className="text-sm leading-relaxed text-gray-700">
            &ldquo;{legacyMessage}&rdquo;
          </p>
        </div>
      ) : null}

      {!readonly && app.status === "pending" && (
        <div className="mt-4 flex gap-2">
          <Button
            size="sm"
            className="bg-green-600 text-white hover:bg-green-700"
            onClick={() => handleDecision("accepted")}
            disabled={loading !== null}
          >
            {loading === "accept" ? "Accepting..." : "Accept"}
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="border-red-200 text-red-600 hover:bg-red-50"
            onClick={() => handleDecision("rejected")}
            disabled={loading !== null}
          >
            {loading === "reject" ? "Rejecting..." : "Reject"}
          </Button>
        </div>
      )}
    </div>
  );
}
