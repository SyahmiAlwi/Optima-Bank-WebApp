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
import {
  getUser,
  fetchVouchers,
  addToCart,
  addToWishlist,
  removeFromWishlist,
  redeemVoucher,
} from "./action";
import { supabaseBrowser } from "@/lib/supabase/client";
import toast, { Toaster } from "react-hot-toast";

export default function HomePage() {
  const [user, setUser] = useState<{
    id?: string;
    email?: string;
    totalpoints?: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("All");
  const [vouchers, setVouchers] = useState<Record<string, unknown>[]>([]);
  const [wishlistIds, setWishlistIds] = useState<number[]>([]); // Store wishlist voucher IDs
  const [promoIndex, setPromoIndex] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const router = useRouter();

  // Fetch user
  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await getUser();
        if (userData) {
          setUser(userData);
          setLoading(false);
        } else {
          // If no user data, wait a bit and try again (for new users)
          console.log("No user data found, retrying in 1 second...");
          setTimeout(async () => {
            const retryUserData = await getUser();
            if (retryUserData) {
              setUser(retryUserData);
              setLoading(false);
            } else {
              console.log("Still no user data, redirecting to auth");
              setLoading(false);
              router.push("/auth");
            }
          }, 1000);
        }
      } catch (error) {
        console.error("Error loading user:", error);
        setLoading(false);
        router.push("/auth");
      }
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

  // Toggle wishlist add/remove
  const toggleWishlist = async (voucherId: number, voucherTitle: string) => {
    if (!user?.id) return router.push("/auth");

    if (wishlistIds.includes(voucherId)) {
      // Remove from wishlist
      const result = await removeFromWishlist(user.id, voucherId);
      if (result.success) {
        setWishlistIds((prev) => prev.filter((id) => id !== voucherId));
        toast.success(result.message, {
          duration: 3000,
          position: "top-center",
        });
      } else {
        toast.error(result.message, {
          duration: 4000,
          position: "top-center",
        });
      }
    } else {
      // Add to wishlist
      const result = await addToWishlist(user.id, voucherId);
      if (result.success) {
        setWishlistIds((prev) => [...prev, voucherId]);
        toast.success(result.message, {
          duration: 3000,
          position: "top-center",
        });
      } else {
        toast.error(result.message, {
          duration: 4000,
          position: "top-center",
        });
      }
    }
  };

  // Handle add to cart
  const handleAddToCart = async (
    voucherId: number,
    voucherTitle: string,
    voucherPoints: number
  ) => {
    if (!user?.id) return;

    const userPoints = user.totalpoints ?? 0;

    // Check if user has enough points to redeem the voucher
    if (userPoints < voucherPoints) {
      toast.error(
        `Cannot add to cart! You need ${voucherPoints} points but only have ${userPoints} points.`,
        {
          duration: 4000,
          position: "top-center",
        }
      );
      return;
    }

    const result = await addToCart(user.id, voucherId);
    if (result.success) {
      toast.success(result.message, {
        duration: 3000,
        position: "top-center",
      });
    } else {
      toast.error(result.message, {
        duration: 4000,
        position: "top-center",
      });
    }
  };

  // Handle redeem functionality
  const handleRedeem = async (voucher: Record<string, unknown>) => {
    if (!user?.id) return;

    const userPoints = user.totalpoints ?? 0;
    const voucherPoints = voucher.points as number;
    if (userPoints < voucherPoints) {
      toast.error(
        `Insufficient points! You need ${voucherPoints} points but only have ${userPoints}.`,
        {
          duration: 4000,
          position: "top-center",
        }
      );
      return;
    }

    const result = await redeemVoucher(user.id, voucher.id as number, voucherPoints);
    if (result.success) {
      toast.success(result.message, {
        duration: 3000,
        position: "top-center",
      });
      // Update user points in state
      setUser((prev) =>
        prev ? { ...prev, totalpoints: result.newBalance } : null
      );
    } else {
      toast.error(result.message, {
        duration: 4000,
        position: "top-center",
      });
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

  const userPoints = user.totalpoints ?? 0;
  const redeemableVouchers = vouchers.filter(
    (voucher) => (voucher.points as number) <= userPoints
  );
  const promoVouchers = redeemableVouchers.sort((a, b) => (b.points as number) - (a.points as number));

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
    (voucher.title as string).toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handlePrev = () => setPromoIndex((prev) => Math.max(prev - 1, 0));
  const handleNext = () =>
    setPromoIndex((prev) => Math.min(prev + 1, promoVouchers.length - 1));

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Toaster />
      <Navbar user={user ?? undefined} />

      <div className="flex flex-1 min-h-screen">
        <aside className="w-40 h-full border-r border-gray-200 flex flex-col pt-6">
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

        <main className="flex-1 p-6">
          <h2 className="text-xl font-semibold mb-4">
            {activeCategory} Vouchers
          </h2>

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

          {/* Promotional Banner - only show for "All" category and no search */}
          {activeCategory === "All" &&
            promoVouchers.length > 0 &&
            searchTerm === "" && (
              <div className="w-full flex flex-col items-center py-6 mb-6">
                <div
                  className="relative bg-gradient-to-r from-yellow-200 to-purple-200 rounded-xl shadow-lg flex items-center mb-6"
                  style={{
                    width: "700px",
                    minHeight: "190px",
                    padding: "24px 32px",
                    boxSizing: "border-box",
                  }}
                >
                  <button
                    onClick={handlePrev}
                    disabled={promoIndex === 0}
                    className="absolute left-[-22px] top-1/2 transform -translate-y-1/2 text-2xl bg-white rounded-full shadow border border-gray-200 hover:bg-yellow-100 disabled:opacity-50 w-11 h-11 flex items-center justify-center"
                  >
                    &#8592;
                  </button>

                  <div className="flex items-center gap-6 w-full">
                    <div className="w-60 h-28 rounded-2xl overflow-hidden flex-shrink-0 bg-white">
                      <img
                        src={`/images/${
                          promoVouchers[promoIndex].image || "default.jpg"
                        }`}
                        alt={promoVouchers[promoIndex].title as string}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex flex-col items-center justify-center flex-1 ml-2 text-center">
                      <h3 className="text-xl font-bold text-[#512da8] mb-1">
                        {promoVouchers[promoIndex].title as string}
                      </h3>
                      <div className="flex items-center justify-center text-yellow-500 font-semibold text-lg mb-3">
                        <GiTwoCoins className="mr-2" />
                        {promoVouchers[promoIndex].points as number} points
                      </div>
                      <Button
                        className="bg-yellow-400 text-[#512da8] font-bold px-4 py-2 text-base shadow-lg rounded-lg w-40"
                        onClick={() => handleRedeem(promoVouchers[promoIndex])}
                      >
                        Redeem Now
                      </Button>
                    </div>
                  </div>

                  <button
                    onClick={handleNext}
                    disabled={promoIndex === promoVouchers.length - 1}
                    className="absolute right-[-22px] top-1/2 transform -translate-y-1/2 text-2xl bg-white rounded-full shadow border border-gray-200 hover:bg-yellow-100 disabled:opacity-50 w-11 h-11 flex items-center justify-center"
                  >
                    &#8594;
                  </button>
                </div>
                <div className="flex items-center justify-center">
                  <span className="text-base font-bold text-[#512da8] drop-shadow">
                    {promoIndex + 1} / {promoVouchers.length} vouchers you can
                    redeem
                  </span>
                </div>
              </div>
            )}

          {/* Vouchers Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {searchedVouchers.length > 0 ? (
              searchedVouchers.map((voucher, index) => {
                const canRedeem = userPoints >= (voucher.points as number);
                const isInWishlist = wishlistIds.includes(voucher.id as number);

                return (
                  <div
                    key={voucher.id as number}
                    className="bg-white rounded-lg shadow-md p-4"
                  >
                    <img
                      src={`/images/${voucher.image || "default.jpg"}`}
                      alt={voucher.title as string}
                      className="w-full h-32 object-cover rounded-md mb-3 cursor-pointer"
                      onClick={() =>
                        router.push(`/voucherdetails?id=${voucher.id as number}`)
                      }
                    />

                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-gray-800">
                        {voucher.title as string}
                      </h3>
                      {/* Heart toggle with proper wishlist functionality */}
                      {isInWishlist ? (
                        <FaHeart
                          className="text-red-500 cursor-pointer text-xl transition-transform transform hover:scale-110"
                          onClick={() =>
                            toggleWishlist(voucher.id as number, voucher.title as string)
                          }
                          title="Remove from wishlist"
                        />
                      ) : (
                        <FaRegHeart
                          className="text-gray-500 cursor-pointer text-xl hover:text-red-500 transition-transform transform hover:scale-110"
                          onClick={() =>
                            toggleWishlist(voucher.id as number, voucher.title as string)
                          }
                          title="Add to wishlist"
                        />
                      )}
                    </div>

                    <div className="flex items-center justify-between mb-2">
                      <span className="flex items-center text-yellow-400 font-semibold text-sm">
                        <GiTwoCoins className="mr-1 text-yellow-400 text-base" />
                        {voucher.points as number}
                      </span>
                      {!canRedeem && (
                        <p className="text-red-500 text-xs">
                          Need {(voucher.points as number) - userPoints} more
                        </p>
                      )}
                    </div>

                    <div className="flex justify-between items-center mt-3">
                      <Button
                        className="bg-[#512da8] text-white px-3 py-1 text-sm disabled:bg-gray-400 disabled:cursor-not-allowed"
                        onClick={() => handleRedeem(voucher)}
                        disabled={!canRedeem}
                      >
                        Redeem
                      </Button>
                      <FaShoppingCart
                        className={`cursor-pointer text-lg ${
                          canRedeem
                            ? "hover:text-[#512da8] text-gray-600"
                            : "text-gray-400 cursor-not-allowed opacity-50"
                        }`}
                        onClick={() =>
                          canRedeem &&
                          handleAddToCart(
                            voucher.id as number,
                            voucher.title as string,
                            voucher.points as number
                          )
                        }
                        title={
                          canRedeem
                            ? "Add to cart"
                            : "Insufficient points to add to cart"
                        }
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-gray-500 col-span-full text-center py-8">
                No vouchers found
              </p>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
