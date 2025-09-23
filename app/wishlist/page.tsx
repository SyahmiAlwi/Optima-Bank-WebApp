"use client";

import { useEffect, useState } from "react";
import { Navbar } from "@/components/ui/navbar";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { GiTwoCoins } from "react-icons/gi";
import { FaHeart } from "react-icons/fa";

export default function WishlistPage() {
  const [user, setUser] = useState<any>(null);
  const [wishlist, setWishlist] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Fetch user
  useEffect(() => {
    const fetchUser = async () => {
      const supabase = supabaseBrowser();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/auth");
      } else {
        setUser(user);
      }
    };
    fetchUser();
  }, [router]);

  // Fetch wishlist items
  useEffect(() => {
    if (!user) return;

    const fetchWishlist = async () => {
      const supabase = supabaseBrowser();
      const { data, error } = await supabase
        .from("wishlist")
        .select(`
          id,
          voucher: voucher_id (
            id,
            title,
            points,
            image
          )
        `)
        .eq("user_id", user.id);

      if (error) {
        console.error(error);
      } else {
        setWishlist(data || []);
      }
      setLoading(false);
    };

    fetchWishlist();
  }, [user]);

  // Remove from wishlist
  const handleRemove = async (wishlistId: number) => {
    const supabase = supabaseBrowser();
    const { error } = await supabase.from("wishlist").delete().eq("id", wishlistId);
    if (error) {
      alert("Failed to remove: " + error.message);
    } else {
      setWishlist((prev) => prev.filter((item) => item.id !== wishlistId));
      alert("Removed from wishlist!");
    }
  };

  if (loading) {
    return <p className="p-6">Loading wishlist...</p>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={{ totalpoints: user?.totalpoints ?? 0 }} />

      <main className="p-6">
        <h2 className="text-xl font-semibold mb-4">My Wishlist</h2>

        {wishlist.length === 0 ? (
          <p className="text-gray-500">No vouchers in your wishlist yet.</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {wishlist.map((item) => (
              <div key={item.id} className="bg-white rounded-lg shadow-md p-4">
                <img
                  src={`/images/${item.voucher.image || "default.jpg"}`}
                  alt={item.voucher.title}
                  className="w-full h-32 object-cover rounded-md mb-3"
                />

                {/* Title + Heart aligned horizontally */}
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-800 text-lg">
                    {item.voucher.title}
                  </h3>
                  <FaHeart
                    className="text-red-500 cursor-pointer hover:scale-110 transition text-2xl"
                    onClick={() => handleRemove(item.id)}
                  />
                </div>

                <div className="flex items-center text-yellow-500 font-semibold text-sm">
                  <GiTwoCoins className="mr-1" /> {item.voucher.points}
                </div>

                <Button
                  className="mt-3 bg-[#512da8] text-white w-full"
                  onClick={() => router.push(`/voucherdetails?id=${item.voucher.id}`)}
                >
                  View Details
                </Button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
