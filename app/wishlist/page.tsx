"use client";

import { useEffect, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Card, CardContent } from "@/components/ui/card";
import WishlistButton from "./WishlistButton";

type Voucher = {
  id: string;
  title: string;
  description: string;
  image_url: string;
};

export default function WishlistPage() {
  const supabase = createClientComponentClient();
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [wishlistIds, setWishlistIds] = useState<string[]>([]);

  // Load current user
  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) setUserId(user.id);
    };
    getUser();
  }, [supabase]);

  // Fetch wishlist vouchers
  useEffect(() => {
    if (!userId) return;
    const fetchWishlist = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("wishlist")
        .select("voucher_id, vouchers(*)")
        .eq("user_id", userId);

      if (error) {
        console.error(error);
      } else {
        setVouchers(data.map((item: any) => item.vouchers));
        setWishlistIds(data.map((item: any) => item.voucher_id));
      }
      setLoading(false);
    };
    fetchWishlist();
  }, [userId, supabase]);

  if (loading) return <p className="p-6">Loading wishlist...</p>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">My Wishlist</h1>
      {vouchers.length === 0 ? (
        <p className="text-gray-500">No vouchers in your wishlist yet.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {vouchers.map((voucher) => (
            <Card key={voucher.id} className="relative shadow-md rounded-2xl">
              <img
                src={voucher.image_url}
                alt={voucher.title}
                className="rounded-t-2xl h-40 w-full object-cover"
              />
              <CardContent className="p-4">
                <h2 className="font-semibold text-lg">{voucher.title}</h2>
                <p className="text-sm text-gray-600">{voucher.description}</p>
              </CardContent>

              {/* Reusable Button */}
              <div className="absolute top-3 right-3">
                <WishlistButton
                  userId={userId!}
                  voucherId={voucher.id}
                  isInitiallyInWishlist={wishlistIds.includes(voucher.id)}
                />
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
