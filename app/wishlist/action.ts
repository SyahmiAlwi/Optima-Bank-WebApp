"use client";

import { useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Heart } from "lucide-react";

interface WishlistButtonProps {
  userId: string;
  voucherId: string;
  isInitiallyInWishlist: boolean;
}

export default function WishlistButton({
  userId,
  voucherId,
  isInitiallyInWishlist,
}: WishlistButtonProps) {
  const supabase = createClientComponentClient();
  const [isInWishlist, setIsInWishlist] = useState(isInitiallyInWishlist);
  const [loading, setLoading] = useState(false);

  const toggleWishlist = async () => {
    if (!userId) return;
    setLoading(true);

    if (isInWishlist) {
      // Remove
      await supabase
        .from("wishlist")
        .delete()
        .eq("user_id", userId)
        .eq("voucher_id", voucherId);
      setIsInWishlist(false);
    } else {
      // Add
      await supabase.from("wishlist").insert([
        { user_id: userId, voucher_id: voucherId },
      ]);
      setIsInWishlist(true);
    }

    setLoading(false);
  };

  return (
    <button
      onClick={toggleWishlist}
      disabled={loading}
      className="flex items-center gap-2"
    >
      <Heart
        className={`h-6 w-6 ${
          isInWishlist ? "fill-red-500 text-red-500" : "text-gray-400"
        }`}
      />
      {isInWishlist ? "Remove from Wishlist" : "Add to Wishlist"}
    </button>
  );
}
