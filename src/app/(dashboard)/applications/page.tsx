import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import ApplicationCard from "./components/ApplicationCard";
import {
  applicationSummary,
  hasApplicationUpdate,
  parseApplicationMessage,
} from "@/lib/application-details";

const statusPillStyles: Record<string, string> = {
  pending: "border-secondary/30 bg-secondary/15 text-secondary",
  accepted: "border-primary/30 bg-primary/15 text-primary",
  rejected: "border-destructive/30 bg-destructive/15 text-destructive",
  available: "border-primary/30 bg-primary/15 text-primary",
  adopted: "border-border bg-accent text-accent-foreground",
  fostered: "border-border bg-accent text-accent-foreground",
  medical_hold: "border-destructive/30 bg-destructive/15 text-destructive",
  pending_adoption: "border-secondary/30 bg-secondary/15 text-secondary",
};

const applicationStatusLabels: Record<string, string> = {
  pending: "Application Pending",
  accepted: "Application Accepted",
  rejected: "Application Rejected",
};

const petStatusLabels: Record<string, string> = {
  available: "Pet Available",
  pending: "Pet Pending Adoption",
  adopted: "Pet Adopted",
  fostered: "Pet Fostered",
  medical_hold: "Pet Medical Hold",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function statusLabel(value: string) {
  return value.replaceAll("_", " ");
}

function firstRelation<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

export default async function ApplicationsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, name")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/login");

  if (profile.role === "shelter") {
    const { data: shelter } = await supabase
      .from("shelters")
      .select("id, name")
      .eq("user_id", user.id)
      .single();

    if (!shelter) redirect("/shelter-setup");

    const { data: applications } = await supabase
      .from("adoption_applications")
      .select(
        `
        *,
        pets(id, name, species, breed, status),
        profiles!adopter_id(id, name)
      `,
      )
      .eq("shelter_id", shelter.id)
      .order("created_at", { ascending: false });

    const pending = applications?.filter((a) => a.status === "pending") ?? [];
    const reviewed = applications?.filter((a) => a.status !== "pending") ?? [];

    return (
      <div className="organic-page">
        <nav className="organic-nav">
          <div className="flex items-center gap-2">
            <span className="text-2xl">Pet Adoption</span>
          </div>
          <Link href="/home">
            <Button variant="outline" size="sm">
              Back to Dashboard
            </Button>
          </Link>
        </nav>

        <div className="organic-shell max-w-4xl">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-foreground">
              Adoption Applications
            </h1>
            <p className="mt-1 text-muted-foreground">
              {shelter.name} · {applications?.length ?? 0} total application
              {applications?.length !== 1 ? "s" : ""}
            </p>
          </div>

          <section className="mb-10">
            <h2 className="mb-4 text-lg font-semibold text-foreground">
              Pending Review ({pending.length})
            </h2>
            {pending.length === 0 ? (
              <div className="organic-empty py-12">
                <p className="text-muted-foreground/75">No pending applications</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pending.map((app) => (
                  <ApplicationCard key={app.id} application={app} />
                ))}
              </div>
            )}
          </section>

          {reviewed.length > 0 && (
            <section>
              <h2 className="mb-4 text-lg font-semibold text-foreground">
                Reviewed ({reviewed.length})
              </h2>
              <div className="space-y-4">
                {reviewed.map((app) => (
                  <ApplicationCard key={app.id} application={app} readonly />
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    );
  }

  const { data: applications } = await supabase
    .from("adoption_applications")
    .select(
      `
      id,
      status,
      message,
      created_at,
      updated_at,
      pets(id, name, species, breed, status, photo_urls),
      shelters(name, city, state)
    `,
    )
    .eq("adopter_id", user.id)
    .order("updated_at", { ascending: false });

  const pending = applications?.filter((a) => a.status === "pending") ?? [];
  const updates = applications?.filter((a) =>
    hasApplicationUpdate(a.created_at, a.updated_at),
  ) ?? [];

  return (
    <div className="organic-page">
      <nav className="organic-nav">
        <div className="flex items-center gap-3">
          <span className="text-xl font-bold text-foreground">Pet Adoption</span>
          <Link href="/home">
            <Button variant="ghost" size="sm">
              Browse Pets
            </Button>
          </Link>
          <Link href="/bookmarks">
            <Button variant="ghost" size="sm">
              My Bookmarks
            </Button>
          </Link>
        </div>
        <Link href="/preferences">
          <Button variant="outline" size="sm">
            Preferences
          </Button>
        </Link>
      </nav>

      <div className="organic-shell">
        <div className="mb-8 flex flex-col gap-4 organic-panel md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">My Applications</h1>
            <p className="mt-1 text-muted-foreground">
              Track every adoption application, shelter response, and pet status
              in one place.
            </p>
          </div>
          <div className="flex gap-3 text-sm text-muted-foreground">
            <span>{applications?.length ?? 0} total</span>
            <span>{pending.length} pending</span>
            <span>{updates.length} updates</span>
          </div>
        </div>

        {updates.length > 0 && (
          <section className="mb-8 rounded-2xl border border-border bg-accent/60 p-5">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <h2 className="font-semibold text-primary">Recent Updates</h2>
                <p className="text-sm text-primary">
                  These applications have a newer status or review update.
                </p>
              </div>
            </div>
            <div className="space-y-3">
              {updates.map((application) => (
                (() => {
                  const pet = firstRelation(application.pets);

                  return (
                    <div
                      key={application.id}
                      className="flex flex-col gap-2 rounded-[1.5rem] border border-border/50 bg-card p-4 md:flex-row md:items-center md:justify-between"
                    >
                      <div>
                        <p className="font-medium text-foreground">
                          {pet?.name ?? "Pet"} was updated
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Shelter decision:{" "}
                          <span className="font-medium capitalize">
                            {applicationStatusLabels[application.status] ??
                              statusLabel(application.status)}
                          </span>
                          {" · "}Pet status:{" "}
                          <span className="font-medium">
                            {petStatusLabels[pet?.status ?? ""] ??
                              statusLabel(pet?.status ?? "unknown")}
                          </span>
                        </p>
                      </div>
                      <Link href={`/pets/${pet?.id}`}>
                        <Button variant="outline" size="sm">
                          View Pet
                        </Button>
                      </Link>
                    </div>
                  );
                })()
              ))}
            </div>
          </section>
        )}

        {applications && applications.length > 0 ? (
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-foreground">
                  All Applications
                </h2>
                <span className="text-sm text-muted-foreground">
                  Ordered by latest activity
                </span>
              </div>

              {applications.map((application) => {
                const { details, legacyMessage } = parseApplicationMessage(
                  application.message,
                );
                const pet = firstRelation(application.pets);
                const shelter = firstRelation(application.shelters);

                return (
                  <div
                    key={application.id}
                    className="overflow-hidden rounded-[2rem] border border-border/60 bg-card/95 shadow-soft"
                  >
                    <div className="flex flex-col gap-4 p-5 md:flex-row">
                      <div className="relative h-40 w-full overflow-hidden rounded-[1.5rem] bg-muted md:w-44">
                        {pet?.photo_urls?.[0] ? (
                          <Image
                            src={pet.photo_urls[0]}
                            alt={pet.name}
                            fill
                            className="object-cover"
                            sizes="176px"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-4xl">
                            🐾
                          </div>
                        )}
                      </div>

                      <div className="flex-1 space-y-3">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <Link
                              href={`/pets/${pet?.id}`}
                              className="text-lg font-semibold text-foreground hover:underline"
                            >
                              {pet?.name ?? "Unknown Pet"}
                            </Link>
                            <p className="text-sm text-muted-foreground">
                              {pet?.species}
                              {pet?.breed ? ` · ${pet.breed}` : ""}
                              {shelter?.name ? ` · ${shelter.name}` : ""}
                              {shelter?.city ? ` · ${shelter.city}, ${shelter.state}` : ""}
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <span
                              className={`rounded-full border px-2.5 py-1 text-xs font-medium capitalize ${
                                statusPillStyles[application.status] ??
                                "border-border/60 bg-muted text-muted-foreground"
                              }`}
                            >
                              {applicationStatusLabels[application.status] ??
                                statusLabel(application.status)}
                            </span>
                            <span
                              className={`rounded-full border px-2.5 py-1 text-xs font-medium ${
                                statusPillStyles[pet?.status ?? ""] ??
                                "border-border/60 bg-muted text-muted-foreground"
                              }`}
                            >
                              {petStatusLabels[pet?.status ?? ""] ??
                                statusLabel(pet?.status ?? "unknown")}
                            </span>
                            {hasApplicationUpdate(
                              application.created_at,
                              application.updated_at,
                            ) && (
                              <span className="rounded-full bg-accent/60 px-2.5 py-1 text-xs font-medium text-primary">
                                New update
                              </span>
                            )}
                          </div>
                        </div>

                        <p className="text-sm text-muted-foreground">
                          Applied on {formatDate(application.created_at)}
                        </p>

                        <div className="rounded-[1.5rem] bg-background p-4">
                          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground/75">
                            Your application
                          </p>
                          <p className="mt-2 text-sm leading-relaxed text-accent-foreground">
                            {details
                              ? applicationSummary(details)
                              : legacyMessage ?? "Application submitted."}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </section>

            <aside className="space-y-4">
              <div className="organic-panel p-5">
                <h2 className="font-semibold text-foreground">Status Guide</h2>
                <div className="mt-3 space-y-3 text-sm text-muted-foreground">
                  <p>
                    <span className="font-medium text-foreground">Pending:</span>{" "}
                    The shelter has your application and has not made a decision
                    yet.
                  </p>
                  <p>
                    <span className="font-medium text-foreground">Accepted:</span>{" "}
                    The shelter chose your application. The pet may still show as
                    pending adoption while final paperwork or handoff steps are in
                    progress.
                  </p>
                  <p>
                    <span className="font-medium text-foreground">Rejected:</span>{" "}
                    The shelter decided not to move forward on this application.
                  </p>
                </div>
              </div>

              <div className="organic-panel p-5">
                <h2 className="font-semibold text-foreground">Need to adjust fit?</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Keep your household preferences current so the browse page shows
                  pets that better match your home, experience, and lifestyle.
                </p>
                <Link href="/preferences" className="mt-4 inline-block">
                  <Button variant="outline" size="sm">
                    Update Preferences
                  </Button>
                </Link>
              </div>
            </aside>
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-border bg-card py-20 text-center">
            <h2 className="text-lg font-semibold text-foreground">
              No applications yet
            </h2>
            <p className="mt-2 text-muted-foreground">
              Browse pets you love and submit an application when you find the
              right match.
            </p>
            <Link href="/home" className="mt-5 inline-block">
              <Button>Browse Pets</Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
