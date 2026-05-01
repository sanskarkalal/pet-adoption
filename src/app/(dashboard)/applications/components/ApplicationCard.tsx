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
  pending: "border-secondary/30 bg-secondary/15 text-secondary",
  accepted: "border-primary/30 bg-primary/15 text-primary",
  rejected: "border-destructive/30 bg-destructive/15 text-destructive",
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
    statusBadgeColors[app.status] ?? "border-border/60 bg-muted text-muted-foreground";

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
    <div className="organic-panel p-5">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <p className="font-semibold text-foreground">
              {app.profiles?.name ?? "Unknown Applicant"}
            </p>
            <span
              className={`rounded-full border px-2 py-0.5 text-xs font-medium capitalize ${badgeColor}`}
            >
              {app.status}
            </span>
            {hasApplicationUpdate(app.created_at, app.updated_at) && (
              <span className="rounded-full bg-accent/60 px-2 py-0.5 text-xs font-medium text-primary">
                Updated
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            Applied for{" "}
            <Link
              href={`/pets/${app.pets?.id}`}
              className="font-medium text-primary hover:underline"
            >
              {app.pets?.name ?? "Unknown Pet"}
            </Link>
            {app.pets?.species
              ? ` (${app.pets.species}${app.pets.breed ? ` · ${app.pets.breed}` : ""})`
              : ""}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground/75">
            Submitted {formatDate(app.created_at)}
          </p>
        </div>
      </div>

      {details ? (
        <div className="space-y-4">
          <div className="rounded-2xl bg-background p-3">
            <p className="text-sm font-medium text-foreground">Applicant summary</p>
            <p className="mt-1 text-sm leading-relaxed text-accent-foreground">
              {applicationSummary(details)}
            </p>
          </div>

          <div className="space-y-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground/75">
                Why this pet
              </p>
              <p className="mt-1 text-sm leading-relaxed text-accent-foreground">
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
                  <div key={key} className="rounded-2xl border border-border/60 p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground/75">
                      {label}
                    </p>
                    <p className="mt-1 text-sm text-accent-foreground">{value}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : legacyMessage ? (
        <div className="mb-4 rounded-2xl bg-background p-3">
          <p className="text-sm leading-relaxed text-accent-foreground">
            &ldquo;{legacyMessage}&rdquo;
          </p>
        </div>
      ) : null}

      {!readonly && app.status === "pending" && (
        <div className="mt-4 flex gap-2">
          <Button
            size="sm"
            className="bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={() => handleDecision("accepted")}
            disabled={loading !== null}
          >
            {loading === "accept" ? "Accepting..." : "Accept"}
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="border-destructive/30 text-destructive hover:bg-destructive/10"
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
