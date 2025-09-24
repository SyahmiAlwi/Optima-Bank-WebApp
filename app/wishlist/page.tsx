"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/ui/navbar";
import { GiTwoCoins } from "react-icons/gi";
import { FaTrash, FaShoppingCart, FaHeart } from "react-icons/fa";
import {
  getUser,
  fetchWishlistItems,
  removeFromWishlistById,
  addToCart,
  redeemVoucher,
} from "./action";
import toast, { Toaster } from "react-hot-toast";

export default function WishlistPage() {
  const [user, setUser] = useState<{
    id?: string;
    email?: string;
    totalpoints?: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [wishlistItems, setWishlistItems] = useState<Record<string, unknown>[]>([]);
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

  // Fetch wishlist items
  useEffect(() => {
    const loadWishlistItems = async () => {
      if (!user?.id) return;
      const items = await fetchWishlistItems(user.id);
      setWishlistItems(items);
    };
    if (user?.id) {
      loadWishlistItems();
    }
  }, [user?.id]);

  // Handle remove from wishlist
  const handleRemoveFromWishlist = async (
    wishlistId: number,
    voucherTitle: string
  ) => {
    const result = await removeFromWishlistById(wishlistId);
    if (result.success) {
      toast.success(result.message, {
        duration: 3000,
        position: "top-center",
      });
      // Remove item from local state
      setWishlistItems((prev) => prev.filter((item) => (item.id as number) !== wishlistId));
    } else {
      toast.error(result.message, {
        duration: 4000,
        position: "top-center",
      });
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

    // Check if user has enough points
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

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Toaster />
      <Navbar user={user ?? undefined} />

      <div className="flex-1 p-6">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">My Wishlist</h1>

          {wishlistItems.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg mb-4">
                Your wishlist is empty
              </p>
              <Button
                onClick={() => router.push("/home")}
                className="bg-[#512da8] text-white px-6 py-2"
              >
                Browse Vouchers
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {wishlistItems.map((item) => {
                const voucher = item.voucher as Record<string, unknown>;
                const canRedeem = userPoints >= (voucher.points as number);

                return (
                  <div
                    key={item.id as number}
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
                    
                    {/* Title + Heart icon aligned horizontally */}
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-gray-800 text-sm flex-1 mr-2">
                        {voucher.title as string}
                      </h3>
                      <FaHeart
                        className="text-red-500 cursor-pointer hover:scale-110 transition-transform text-lg flex-shrink-0"
                        onClick={() =>
                          handleRemoveFromWishlist(item.id as number, voucher.title as string)
                        }
                        title="Remove from wishlist"
                      />
                    </div>

                    {/* Points display */}
                    <div className="flex items-center text-yellow-400 font-semibold text-sm mb-2">
                      <GiTwoCoins className="mr-1 text-yellow-400 text-base" />
                      {voucher.points as number} points
                    </div>

                    <p className="text-gray-600 text-xs mb-3 line-clamp-2">
                      {voucher.description as string}
                    </p>

                    {!canRedeem && (
                      <p className="text-red-500 text-xs mb-2">
                        Need {(voucher.points as number) - userPoints} more points
                      </p>
                    )}

                    <div className="flex justify-between items-center mt-3">
                      <Button
                        className="bg-[#512da8] text-white px-3 py-1 text-sm disabled:bg-gray-400 disabled:cursor-not-allowed"
                        onClick={() => handleRedeem(voucher)}
                        disabled={!canRedeem}
                      >
                        Redeem
                      </Button>
                      <div className="flex space-x-3 text-gray-600 text-lg">
                        <FaShoppingCart
                          className={`cursor-pointer ${
                            canRedeem
                              ? "hover:text-[#512da8]"
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
                        <FaTrash
                          className="cursor-pointer hover:text-red-500"
                          onClick={() =>
                            handleRemoveFromWishlist(item.id as number, voucher.title as string)
                          }
                          title="Remove from wishlist"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}