"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  FaUserCircle,
  FaHeart,
  FaShoppingCart,
  FaBasketballBall,
  FaUtensils,
  FaFilm,
} from "react-icons/fa";
import { GiTwoCoins } from "react-icons/gi";
import { getUser, fetchVouchers, signOutUser } from "./action";

export default function HomePage() {
  const [user, setUser] = useState<{ email?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("All");
  const [vouchers, setVouchers] = useState<any[]>([]);
  const [profileOpen, setProfileOpen] = useState(false);
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

  // Fetch vouchers
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

  // Filter vouchers
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
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-40 bg-white shadow-md flex flex-col py-6">
        <h2 className="px-4 text-lg font-bold text-[#512da8] mb-4">Categories</h2>
        <nav className="flex flex-col space-y-4">
          {["All", "Sport", "Food", "Entertainment"].map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`flex items-center px-4 py-2 rounded-r-full ${
                activeCategory === cat
                  ? "bg-[#512da8] text-white"
                  : "text-gray-700 hover:bg-gray-100"
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
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="flex items-center justify-between bg-white px-6 py-4 shadow-md relative">
          <div className="text-2xl font-bold text-[#512da8]">Optima Bank</div>

          <div className="flex-1 px-6">
            <input
              type="text"
              placeholder="Search..."
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#512da8]"
            />
          </div>

          <div className="flex items-center space-x-6 relative">
            <div className="flex items-center space-x-1 text-gray-700">
              <GiTwoCoins className="text-yellow-500 text-xl" />
              <span className="font-semibold">1200</span>
            </div>

            <FaShoppingCart
              className="text-2xl text-gray-700 cursor-pointer hover:text-[#512da8]"
              onClick={() => router.push("/cart")}
            />

            {/* Profile Dropdown */}
            <div className="relative">
              <FaUserCircle
                className="text-3xl text-gray-700 cursor-pointer"
                onClick={() => setProfileOpen(!profileOpen)}
              />
              {profileOpen && (
                <div className="absolute right-0 mt-2 w-40 bg-white border rounded-md shadow-lg z-10">
                  <button
                    className="w-full text-left px-4 py-2 hover:bg-gray-100"
                    onClick={() => {
                      router.push("/profile");
                      setProfileOpen(false);
                    }}
                  >
                    User Profile
                  </button>
                  <button
                    className="w-full text-left px-4 py-2 hover:bg-gray-100"
                    onClick={async () => {
                      await signOutUser();
                      router.push("/auth");
                      setProfileOpen(false);
                    }}
                  >
                    Log Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Products Grid */}
        <main className="p-6">
          <h2 className="text-xl font-semibold mb-4">{activeCategory} Vouchers</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredVouchers.length > 0 ? (
              filteredVouchers.map((voucher, index) => (
                <div key={index} className="bg-white rounded-lg shadow-md p-4 ">
                  <img
                    src={`/images/${voucher.image || "default.jpg"}`}
                    alt={voucher.title}
                    className="w-full h-32 object-cover rounded-md mb-3 cursor-pointer"
                    onClick={() => router.push(`/voucherdetails?id=${voucher.id}`)}
                  />
                  <h3 className="font-semibold text-gray-800 mb-2">{voucher.title}</h3>
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
                        onClick={() => alert(`Added ${voucher.title} to cart`)}
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
