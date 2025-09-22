"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { FaHeart, FaShoppingCart } from "react-icons/fa";
import { GiTwoCoins } from "react-icons/gi";
import { Navbar } from "@/components/ui/navbar";
import {
  getUser,
  fetchVouchers,
  addToCart,
  addToWishlist,
  redeemVoucher,
} from "./action";
import toast, { Toaster } from "react-hot-toast";

export default function VoucherDetailsPage() {
  const [user, setUser] = useState<{
    id?: string;
    email?: string;
    totalpoints?: number;
  } | null>(null);
  const [voucher, setVoucher] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const searchParams = useSearchParams();
  const router = useRouter();
  const supabase = supabaseBrowser();

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

  // Get voucher ID from query (?id=)
  const voucherId = searchParams.get("id");

  useEffect(() => {
    if (!voucherId) return;

    const fetchVoucher = async () => {
      const { data, error } = await supabase
        .from("voucher")
        .select("*")
        .eq("id", voucherId)
        .single();

      if (error) {
        console.error("Error fetching voucher:", error);
      } else {
        setVoucher(data);
      }
      setLoading(false);
    };

    fetchVoucher();
  }, [voucherId, supabase]);

  // Handle redeem
  const handleRedeem = async () => {
    if (!user?.id || !voucher) return;

    const result = await redeemVoucher(user.id, voucher.id, voucher.points);
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

  // Handle add to cart
  const handleAddToCart = async () => {
    if (!user?.id || !voucher) return;

    const userPoints = user.totalpoints ?? 0;

    // Check if user has enough points to redeem the voucher
    if (userPoints < voucher.points) {
      toast.error(
        `Cannot add to cart! You need ${voucher.points} points but only have ${userPoints} points.`,
        {
          duration: 4000,
          position: "top-center",
        }
      );
      return;
    }

    const result = await addToCart(user.id, voucher.id);
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

  // Handle add to wishlist
  const handleAddToWishlist = async () => {
    if (!user?.id || !voucher) return;

    const result = await addToWishlist(user.id, voucher.id);
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

  if (loading) {
    return (
      <div className="h-svh flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  if (!voucher) {
    return (
      <div className="h-svh flex items-center justify-center">
        <p className="text-gray-600">Voucher not found</p>
      </div>
    );
  }

  // Map category_id to names
  const categoryMap: Record<number, string> = {
    1: "Sport",
    2: "Food",
    3: "Entertainment",
  };

  const userPoints = user?.totalpoints ?? 0;
  const canRedeem = userPoints >= voucher.points;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Toaster />
      {/* Navbar */}
      <Navbar user={user ?? undefined} />

      {/* Page content */}
      <div className="flex-1 p-6">
        {/* Back Button */}
        <button
          className="self-start text-[#512da8] mb-4"
          onClick={() => router.back()}
        >
          ← Back
        </button>

        {/* Voucher Card */}
        <div className="w-full max-w-3xl bg-white rounded-lg shadow-md p-6 mx-auto">
          {/* Image */}
          <img
            src={`/images/${voucher.image || "default.jpg"}`}
            alt={voucher.title}
            className="w-full h-64 object-cover rounded-md mb-4"
          />

          {/* Title + Category */}
          <div className="flex justify-between items-center mb-2">
            <h1 className="text-2xl font-bold text-gray-800">
              {voucher.title}
            </h1>
            <span className="text-sm font-medium text-[#512da8]">
              {categoryMap[voucher.category_id] || "Other"}
            </span>
          </div>

          {/* Points */}
          <div className="flex items-center space-x-2 text-gray-700 mb-4">
            <GiTwoCoins className="text-yellow-500" />
            <p>Redeem for {voucher.points} points</p>
            {!canRedeem && (
              <span className="text-red-500 text-sm ml-4">
                (Need {voucher.points - userPoints} more points)
              </span>
            )}
          </div>

          {/* Description */}
          <p className="text-gray-600 mb-4">{voucher.description}</p>

          {/* Terms & Conditions */}
          <div className="mt-4 border-t pt-4">
            <h2 className="text-lg font-semibold text-gray-800 mb-2">
              Terms & Conditions
            </h2>
            <p className="text-sm text-gray-600 whitespace-pre-line">
              {voucher.terms || "No specific terms available."}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 flex justify-between items-center">
            <Button
              className={`px-6 py-2 rounded-md ${
                canRedeem
                  ? "bg-[#512da8] text-white hover:bg-[#6a3fe3]"
                  : "bg-gray-400 text-gray-600 cursor-not-allowed"
              }`}
              onClick={handleRedeem}
              disabled={!canRedeem}
            >
              {canRedeem ? "Redeem" : "Insufficient Points"}
            </Button>

            <div className="flex space-x-4 text-gray-600 text-xl">
              <FaHeart
                className="cursor-pointer hover:text-red-500"
                onClick={handleAddToWishlist}
              />
              <FaShoppingCart
                className={`cursor-pointer ${
                  canRedeem
                    ? "hover:text-[#512da8]"
                    : "text-gray-400 cursor-not-allowed opacity-50"
                }`}
                onClick={() => canRedeem && handleAddToCart()}
                title={
                  canRedeem
                    ? "Add to cart"
                    : "Insufficient points to add to cart"
                }
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
