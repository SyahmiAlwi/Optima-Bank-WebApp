"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/ui/navbar";
import { supabaseBrowser } from "@/lib/supabase/client";
import {
  FaHeart,
  FaShoppingCart,
  FaBasketballBall,
  FaUtensils,
  FaFilm,
} from "react-icons/fa";
import { getUser, fetchVouchers } from "./action";

export default function HomePage() {
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const searchParams = useSearchParams();
  const categoryFromQuery = searchParams.get("category") || "All";
  const [activeCategory, setActiveCategory] = useState(categoryFromQuery);
  const [vouchers, setVouchers] = useState<any[]>([]);
  const router = useRouter();

  // ✅ Fetch user
  useEffect(() => {
    const loadUser = async () => {
      const userData = await getUser();
      setUser(userData);
      setLoading(false);
      if (!userData) router.push("/auth");
    };
    loadUser();
  }, [router]);

  // ✅ Fetch vouchers
  useEffect(() => {
    const loadVouchers = async () => {
      const data = await fetchVouchers();
      setVouchers(data);
    };
    loadVouchers();
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

  // ✅ Filter vouchers
  const filteredVouchers =
    activeCategory === "All"
      ? vouchers
      : vouchers.filter((v) => {
          if (activeCategory === "Sport") return v.category_id === 1;
          if (activeCategory === "Food") return v.category_id === 2;
          if (activeCategory === "Entertainment") return v.category_id === 3;
          return true;
        });

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* ✅ Navbar (already has logo, links, coins, profile) */}
      <Navbar />

{/* ✅ Search bar placed below navbar */}
<div className="w-full bg-gray-50 flex justify-center py-6">
  <div className="w-full max-w-2xl px-1">
    <input
      type="text"
      placeholder="Search vouchers..."
      className="w-full px-4 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#512da8]"
    />
  </div>
</div>

      {/* ✅ Page Layout */}
      <div className="flex flex-1 min-h-screen">
        {/* Sidebar */}
        <aside className="w-40 h-full border-r border-gray-200 flex flex-col">
          <h2 className="px-4 text-lg font-bold text-[#512da8] mb-4">
            Categories
          </h2>
          <nav className="flex flex-col space-y-2">
            {["All", "Sport", "Food", "Entertainment"].map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`flex items-center px-4 py-2 rounded-r-full transition ${
                  activeCategory === cat
                    ? "bg-[#512da8] text-white shadow-md"
                    : "text-gray-700 hover:bg-purple-50 hover:text-[#512da8]"
                }`}
              >
                {cat === "Sport" && <FaBasketballBall className="mr-2" />}
                {cat === "Food" && <FaUtensils className="mr-2" />}
                {cat === "Entertainment" && <FaFilm className="mr-2" />}
                {cat === "All" ? "All Vouchers" : cat}
              </button>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          <h2 className="text-xl font-semibold mb-4">
            {activeCategory} Vouchers
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredVouchers.length > 0 ? (
              filteredVouchers.map((voucher, index) => (
                <div
                  key={index}
                  className="bg-white rounded-lg shadow-md p-4"
                >
                  <img
                    src={`/images/${voucher.image || "default.jpg"}`}
                    alt={voucher.title}
                    className="w-full h-32 object-cover rounded-md mb-3 cursor-pointer"
                    onClick={() =>
                      router.push(`/voucherdetails?id=${voucher.id}`)
                    }
                  />
                  <h3 className="font-semibold text-gray-800 mb-2">
                    {voucher.title}
                  </h3>
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
                        onClick={() => router.push("/wishlist")}
                      />
                      <FaShoppingCart
                        className="cursor-pointer hover:text-[#512da8]"
                        onClick={() =>
                          alert(`Added ${voucher.title} to cart`)
                        }
                      />
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500">No vouchers available</p>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}