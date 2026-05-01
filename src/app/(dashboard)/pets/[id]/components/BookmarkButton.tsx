"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

// ─────────────────────────────────────────────
// BookmarkButton
// ─────────────────────────────────────────────

type BookmarkProps = {
  petId: string;
  userId: string;
  initialBookmarked: boolean;
};

export default function BookmarkButton({
  petId,
  userId,
  initialBookmarked,
}: BookmarkProps) {
  const [bookmarked, setBookmarked] = useState(initialBookmarked);
  const [loading, setLoading] = useState(false);

  const handleToggle = async () => {
    setLoading(true);
    const supabase = createClient();

    if (bookmarked) {
      const { error } = await supabase
        .from("pet_bookmarks")
        .delete()
        .eq("pet_id", petId)
        .eq("adopter_id", userId);

      if (error) {
        toast.error("Failed to remove bookmark");
      } else {
        setBookmarked(false);
        toast.success("Bookmark removed");
      }
    } else {
      const { error } = await supabase.from("pet_bookmarks").insert({
        pet_id: petId,
        adopter_id: userId,
      });

      if (error) {
        toast.error("Failed to bookmark pet");
      } else {
        setBookmarked(true);
        toast.success(
          "Bookmarked! We will notify you if their status changes. 🔔",
        );
      }
    }

    setLoading(false);
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleToggle}
      disabled={loading}
      className={`transition-all ${
        bookmarked
          ? "border-secondary bg-secondary/10 text-secondary hover:bg-secondary/15"
          : "border-border/60 hover:border-secondary"
      }`}
      title={bookmarked ? "Remove bookmark" : "Bookmark this pet"}
    >
      {bookmarked ? "🔖 Bookmarked" : "🔖 Bookmark"}
    </Button>
  );
}

// ─────────────────────────────────────────────
// AvailabilityPopup
// Import and use this in AdopterHome by passing
// notifications derived from bookmarked pets
// whose status changed since last visit.
// ─────────────────────────────────────────────

type PopupNotification = {
  petId: string;
  petName: string;
  isNowAvailable: boolean;
};

type PopupProps = {
  notifications: PopupNotification[];
};

export function AvailabilityPopup({ notifications }: PopupProps) {
  const [dismissed, setDismissed] = useState<string[]>([]);

  const visible = notifications.filter((n) => !dismissed.includes(n.petId));
  if (visible.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 space-y-3 max-w-sm">
      {visible.map((n) => (
        <div
          key={n.petId}
          className="bg-card border border-border/60 rounded-[1.5rem] shadow-float p-4 flex flex-col gap-2"
        >
          <div className="flex items-start justify-between">
            <p className="text-sm font-semibold text-foreground">{n.petName}</p>
            <button
              onClick={() => setDismissed((prev) => [...prev, n.petId])}
              className="text-muted-foreground/75 hover:text-muted-foreground text-xs ml-3 shrink-0"
            >
              ✕
            </button>
          </div>
          <p className="text-sm text-muted-foreground">
            {n.isNowAvailable
              ? "Your new possible buddy is available for adoption! 😁"
              : "Seems like this buddy is no longer available for adoption 😢"}
          </p>
          <Link
            href={`/pets/${n.petId}`}
            className="text-sm font-medium text-primary hover:underline"
            onClick={() => setDismissed((prev) => [...prev, n.petId])}
          >
            view their profile
          </Link>
        </div>
      ))}
    </div>
  );
}
