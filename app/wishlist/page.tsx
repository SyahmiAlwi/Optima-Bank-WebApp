"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/ui/navbar";
import { GiTwoCoins } from "react-icons/gi";
import { FaShoppingCart, FaHeart } from "react-icons/fa";
import { supabaseBrowser } from "@/lib/supabase/client";

export default function WishlistPage() {
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [wishlist, setWishlist] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = supabaseBrowser();

  // ✅ Fetch user
  useEffect(() => {
    const fetchUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        setUser({ id: data.user.id, email: data.user.email ?? undefined });
      } else {
        router.push("/auth");
      }
    };
    fetchUser();
  }, [supabase, router]);

  // ✅ Fetch wishlist vouchers
  useEffect(() => {
    if (!user?.id) return;

    const fetchWishlist = async () => {
      const { data, error } = await supabase
        .from("wishlist")
        .select("id, voucher:vouchers(id, title, image, points)")
        .eq("user_id", user.id);

      if (!error && data) {
        setWishlist(data);
      }
      setLoading(false);
    };

    fetchWishlist();
  }, [user?.id, supabase]);

  // ✅ Remove from wishlist
  const removeFromWishlist = async (wishlistId: string) => {
    await supabase.from("wishlist").delete().eq("id", wishlistId);
    setWishlist((prev) => prev.filter((item) => item.id !== wishlistId));
  };

  if (loading) {
    return (
      <div className="h-svh flex items-center justify-center bg-gradient-to-r from-gray-200 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#512da8] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading wishlist...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* ✅ Navbar now matches expected prop */}
      <Navbar user={{ totalpoints: 0 }} />

      <main className="flex-1 p-6">
        <h2 className="text-xl font-semibold mb-6 text-[#512da8]">My Wishlist</h2>

        {wishlist.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {wishlist.map((item) => (
              <div key={item.id} className="bg-white rounded-lg shadow-md p-4">
                <img
                  src={`/images/${item.voucher.image || "default.jpg"}`}
                  alt={item.voucher.title}
                  className="w-full h-32 object-cover rounded-md mb-3 cursor-pointer"
                  onClick={() => router.push(`/voucherdetails?id=${item.voucher.id}`)}
                />
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-800">{item.voucher.title}</h3>
                  <span className="flex items-center text-yellow-500 font-semibold text-sm">
                    <GiTwoCoins className="mr-1 text-base" />
                    {item.voucher.points}
                  </span>
                </div>
                <div className="flex justify-between items-center mt-3">
                  <Button
                    className="bg-[#512da8] text-white px-3 py-1 text-sm"
                    onClick={() => alert(`Redeemed: ${item.voucher.title}`)}
                  >
                    Redeem
                  </Button>
                  <div className="flex space-x-3 text-gray-600 text-lg">
                    <FaHeart
                      className="cursor-pointer hover:text-red-500"
                      onClick={() => removeFromWishlist(item.id)}
                    />
                    <FaShoppingCart
                      className="cursor-pointer hover:text-[#512da8] ml-2"
                      onClick={() => alert(`Added ${item.voucher.title} to cart`)}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No vouchers in wishlist yet</p>
        )}
      </main>
    </div>
  );
}
