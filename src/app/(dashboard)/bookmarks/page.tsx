import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";

const statusStyles: Record<string, string> = {
  available: "border-primary/30 bg-primary/15 text-primary",
  pending: "border-secondary/30 bg-secondary/15 text-secondary",
  adopted: "border-border bg-accent text-accent-foreground",
  fostered: "border-border bg-accent text-accent-foreground",
  medical_hold: "border-destructive/30 bg-destructive/15 text-destructive",
};

function formatStatus(value: string) {
  return value.replaceAll("_", " ");
}

const bookmarkAlertLabels: Record<string, string> = {
  pending: "pending adoption",
  adopted: "adopted",
  fostered: "in foster care",
  medical_hold: "on medical hold",
};

function firstRelation<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

export default async function BookmarksPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role === "shelter") redirect("/home");

  const { data: bookmarks } = await supabase
    .from("pet_bookmarks")
    .select(
      `
      id,
      created_at,
      pets(
        id,
        name,
        species,
        breed,
        age,
        status,
        photo_urls,
        shelters(name, city, state)
      )
    `,
    )
    .eq("adopter_id", user.id)
    .order("created_at", { ascending: false });

  const unavailable =
    bookmarks?.filter((bookmark) => {
      const pet = firstRelation(bookmark.pets);
      return pet && pet.status !== "available";
    }) ?? [];

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
          <Link href="/applications">
            <Button variant="ghost" size="sm">
              My Applications
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
            <h1 className="text-2xl font-bold text-foreground">My Bookmarks</h1>
            <p className="mt-1 text-muted-foreground">
              Keep an eye on pets you are interested in and spot availability
              changes quickly.
            </p>
          </div>
          <div className="flex gap-3 text-sm text-muted-foreground">
            <span>{bookmarks?.length ?? 0} saved</span>
            <span>{unavailable.length} status changes</span>
          </div>
        </div>

        {unavailable.length > 0 && (
          <section className="mb-8 rounded-2xl border border-secondary/30 bg-secondary/10 p-5">
            <h2 className="font-semibold text-secondary">Availability Alerts</h2>
            <div className="mt-3 space-y-3">
              {unavailable.map((bookmark) => (
                (() => {
                  const pet = firstRelation(bookmark.pets);

                  return (
                    <div
                      key={bookmark.id}
                      className="flex flex-col gap-2 rounded-[1.5rem] border border-secondary/20 bg-card p-4 md:flex-row md:items-center md:justify-between"
                    >
                      <div>
                        <p className="font-medium text-foreground">{pet?.name}</p>
                        <p className="text-sm text-muted-foreground">
                          This pet is now{" "}
                          {bookmarkAlertLabels[pet?.status ?? ""] ??
                            formatStatus(pet?.status ?? "unknown")}
                          .
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

        {bookmarks && bookmarks.length > 0 ? (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {bookmarks.map((bookmark) => {
              const pet = firstRelation(bookmark.pets);
              const shelter = firstRelation(pet?.shelters);

              return (
                <div
                  key={bookmark.id}
                  className="overflow-hidden rounded-[2rem] border border-border/60 bg-card/95 shadow-soft"
                >
                  <div className="relative h-52 w-full bg-muted">
                    {pet?.photo_urls?.[0] ? (
                      <Image
                        src={pet.photo_urls[0]}
                        alt={pet.name}
                        fill
                        className="object-cover"
                        sizes="(max-width: 1280px) 50vw, 33vw"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-5xl">
                        🐾
                      </div>
                    )}
                  </div>

                  <div className="space-y-4 p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <Link
                          href={`/pets/${pet?.id}`}
                          className="text-lg font-semibold text-foreground hover:underline"
                        >
                          {pet?.name}
                        </Link>
                        <p className="text-sm text-muted-foreground">
                          {pet?.species}
                          {pet?.breed ? ` · ${pet.breed}` : ""}
                          {pet?.age != null ? ` · ${pet.age} yrs` : ""}
                        </p>
                      </div>
                      <span
                        className={`rounded-full border px-2.5 py-1 text-xs font-medium ${
                          statusStyles[pet?.status ?? ""] ??
                          "border-border/60 bg-muted text-muted-foreground"
                        }`}
                      >
                        {formatStatus(pet?.status ?? "unknown")}
                      </span>
                    </div>

                    {shelter && (
                      <p className="text-sm text-muted-foreground">
                        {shelter.name} · {shelter.city}, {shelter.state}
                      </p>
                    )}

                    <p className="text-xs text-muted-foreground/75">
                      Bookmarked on{" "}
                      {new Date(bookmark.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>

                    <div className="flex gap-2">
                      <Link href={`/pets/${pet?.id}`}>
                        <Button size="sm">View Profile</Button>
                      </Link>
                      <Link href="/applications">
                        <Button variant="outline" size="sm">
                          My Applications
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-border bg-card py-20 text-center">
            <h2 className="text-lg font-semibold text-foreground">
              No bookmarks yet
            </h2>
            <p className="mt-2 text-muted-foreground">
              Save pets you want to revisit and track their availability here.
            </p>
            <Link href="/home" className="mt-5 inline-block">
              <Button>Explore Pets</Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
