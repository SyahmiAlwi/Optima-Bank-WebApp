"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/ui/navbar";
import { GiTwoCoins } from "react-icons/gi";
import { FaHeart, FaShoppingCart } from "react-icons/fa";
import { getUser, fetchWishlistVouchers, removeFromWishlist } from "./action"; // ✅ you'll implement these

export default function WishlistPage() {
  const [user, setUser] = useState<{ email?: string; totalpoints?: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [wishlistVouchers, setWishlistVouchers] = useState<any[]>([]);
  const router = useRouter();

  // Fetch user
  useEffect(() => {
    const loadUser = async () => {
      const userData = await getUser();
      setUser(userData);
      setLoading(false);
      if (!userData) router.push("/auth");
    };
    loadUser();
  }, [router]);

  // Fetch wishlist vouchers
  useEffect(() => {
    const loadWishlist = async () => {
      const data = await fetchWishlistVouchers();
      setWishlistVouchers(data);
    };
    loadWishlist();
  }, []);

  if (loading) {
    return (
      <div className="h-svh flex items-center justify-center bg-gradient-to-r from-gray-200 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#512da8] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const userPoints = user.totalpoints ?? 0;

  const handleRemove = async (voucherId: number) => {
    await removeFromWishlist(voucherId);
    setWishlistVouchers((prev) => prev.filter((v) => v.id !== voucherId));
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Navbar */}
      <Navbar user={user ?? undefined} />

      {/* Page Layout: Sidebar + Main */}
      <div className="flex flex-1 min-h-screen">
        {/* Sidebar */}
        <aside className="w-40 h-full border-r border-gray-200 flex flex-col pt-6">
          <h2 className="px-4 text-lg font-bold text-[#512da8] mb-4">Wishlist</h2>
          <p className="px-4 text-sm text-gray-500">Your saved vouchers</p>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          <h2 className="text-xl font-semibold mb-4">My Wishlist</h2>

          {/* Voucher grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {wishlistVouchers.length > 0 ? (
              wishlistVouchers.map((voucher, index) => (
                <div key={index} className="bg-white rounded-lg shadow-md p-4">
                  <img
                    src={`/images/${voucher.image || "default.jpg"}`}
                    alt={voucher.title}
                    className="w-full h-32 object-cover rounded-md mb-3 cursor-pointer"
                    onClick={() => router.push(`/voucherdetails?id=${voucher.id}`)}
                  />
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-gray-800">{voucher.title}</h3>
                    <span className="flex items-center text-yellow-500 font-semibold text-sm">
                      <GiTwoCoins className="mr-1 text-base" />
                      {voucher.points}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mt-3">
                    <Button
                      className="bg-[#512da8] text-white px-3 py-1 text-sm"
                      onClick={() => alert(`Redeemed: ${voucher.title}`)}
                    >
                      Redeem
                    </Button>
                    <div className="flex space-x-3 text-gray-600 text-lg">
                      <FaHeart
                        className="cursor-pointer hover:text-red-500"
                        onClick={() => handleRemove(voucher.id)}
                      />
                      <FaShoppingCart
                        className="cursor-pointer hover:text-[#512da8]"
                        onClick={() => alert(`Added ${voucher.title} to cart`)}
                      />
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500">No vouchers in wishlist</p>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
