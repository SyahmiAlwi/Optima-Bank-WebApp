"use client";

import { supabaseBrowser } from "@/lib/supabase/client";
import { useTransition } from "react";
import { addToWishlist, removeFromWishlist } from "./actions"; 

export default function WishlistButton({ userId, voucherId, isInWishlist }) {
  const [pending, startTransition] = useTransition();

  const toggleWishlist = () => {
    startTransition(async () => {
      if (isInWishlist) {
        await removeFromWishlist(userId, voucherId);
      } else {
        await addToWishlist(userId, voucherId);
      }
    });
  };

  return (
    <button
      onClick={toggleWishlist}
      disabled={pending}
      className="flex items-center gap-2"
    >
      {isInWishlist ? "❤️ Remove" : "🤍 Add"}
    </button>
  );
}
