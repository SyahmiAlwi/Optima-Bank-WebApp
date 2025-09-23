"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/ui/navbar";
import { GiTwoCoins } from "react-icons/gi";
import {
  FaHeart,
  FaRegHeart,
  FaShoppingCart,
  FaBasketballBall,
  FaUtensils,
  FaFilm,
} from "react-icons/fa";
import { getUser, fetchVouchers } from "./action";
import { supabaseBrowser } from "@/lib/supabase/client";

export default function HomePage() {
  const [user, setUser] = useState<{ id?: string; email?: string; totalpoints?: number } | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("All");
  const [vouchers, setVouchers] = useState<any[]>([]);
  const [wishlistIds, setWishlistIds] = useState<number[]>([]); // ✅ store wishlist voucher IDs
  const [searchTerm, setSearchTerm] = useState("");
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

  // Fetch vouchers + wishlist
  useEffect(() => {
    const loadData = async () => {
      const vouchersData = await fetchVouchers();
      setVouchers(vouchersData);

      if (user?.id) {
        const supabase = supabaseBrowser();
        const { data } = await supabase
          .from("wishlist")
          .select("voucher_id")
          .eq("user_id", user.id);

        setWishlistIds(data?.map((item) => item.voucher_id) || []);
      }
    };
    loadData();
  }, [user]);

  // ✅ Toggle wishlist add/remove
  const toggleWishlist = async (voucherId: number) => {
    if (!user) return router.push("/auth");

    const supabase = supabaseBrowser();

    if (wishlistIds.includes(voucherId)) {
      // remove from wishlist
      await supabase
        .from("wishlist")
        .delete()
        .eq("voucher_id", voucherId)
        .eq("user_id", user.id);
      setWishlistIds((prev) => prev.filter((id) => id !== voucherId));
    } else {
      // add to wishlist
      await supabase.from("wishlist").insert({
        user_id: user.id,
        voucher_id: voucherId,
      });
      setWishlistIds((prev) => [...prev, voucherId]);
    }
  };

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

  const filteredVouchers =
    activeCategory === "All"
      ? vouchers
      : vouchers.filter((v) => {
          if (activeCategory === "Sport") return v.category_id === 1;
          if (activeCategory === "Food") return v.category_id === 2;
          if (activeCategory === "Entertainment") return v.category_id === 3;
          return true;
        });

  const searchedVouchers = filteredVouchers.filter((voucher) =>
    voucher.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Navbar */}
      <Navbar user={user ?? undefined} />

      {/* Page Layout: Sidebar + Main */}
      <div className="flex flex-1 min-h-screen">
        {/* Sidebar */}
        <aside className="w-40 h-full border-r border-gray-200 flex flex-col pt-6">
          <h2 className="px-4 text-lg font-bold text-[#512da8] mb-4">Categories</h2>
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
          {/* Search Bar */}
          <div className="mb-6 flex justify-center">
            <input
              type="text"
              placeholder="Search vouchers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full max-w-2xl px-4 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-[#512da8] focus:outline-none"
            />
          </div>

          {/* Voucher grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {searchedVouchers.map((voucher) => (
              <div key={voucher.id} className="bg-white rounded-lg shadow-md p-4">
                <img
                  src={`/images/${voucher.image || "default.jpg"}`}
                  alt={voucher.title}
                  className="w-full h-32 object-cover rounded-md mb-3 cursor-pointer"
                  onClick={() => router.push(`/voucherdetails?id=${voucher.id}`)}
                />

                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-800">{voucher.title}</h3>
                  {/* Heart toggle */}
                  {wishlistIds.includes(voucher.id) ? (
                    <FaHeart
                      className="text-red-500 cursor-pointer text-2xl transition-transform transform hover:scale-110"
                      onClick={() => toggleWishlist(voucher.id)}
                    />
                  ) : (
                    <FaRegHeart
                      className="text-gray-500 cursor-pointer text-2xl hover:text-red-500 transition-transform transform hover:scale-110"
                      onClick={() => toggleWishlist(voucher.id)}
                    />
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <span className="flex items-center text-yellow-500 font-semibold text-sm">
                    <GiTwoCoins className="mr-1" /> {voucher.points}
                  </span>
                  <FaShoppingCart
                    className="cursor-pointer hover:text-[#512da8] text-lg"
                    onClick={() => alert(`Added ${voucher.title} to cart`)}
                  />
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
