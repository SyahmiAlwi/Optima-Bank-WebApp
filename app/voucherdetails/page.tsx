"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { FaHeart, FaShoppingCart, FaDownload, FaTimes } from "react-icons/fa";
import { GiTwoCoins } from "react-icons/gi";
import { Navbar } from "@/components/ui/navbar";
import { resolveVoucherImage } from "@/lib/utils";
import {
  getUser,
  fetchVouchers,
  addToCart,
  addToWishlist,
  redeemVoucher,
} from "./action";
import { generateVoucherPDF } from "../home/action";
import toast, { Toaster } from "react-hot-toast";
import {
  FaUserCheck,
  FaGift,
  FaCalendarTimes,
  FaBan,
  FaRedo,
  FaInfoCircle,
} from "react-icons/fa";

function VoucherDetailsContent() {
  const [user, setUser] = useState<{
    id?: string;
    email?: string;
    totalpoints?: number;
  } | null>(null);
  const [voucher, setVoucher] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [checkingWishlist, setCheckingWishlist] = useState(true);
  const [showRedeemConfirm, setShowRedeemConfirm] = useState(false);
  const [showRedemptionSuccess, setShowRedemptionSuccess] = useState(false);
  const [redeemedVoucher, setRedeemedVoucher] = useState<{
    title: string;
    description: string;
    points: number;
    quantity: number;
  } | null>(null);
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

  // Check if voucher is in user's wishlist
  useEffect(() => {
    const checkWishlistStatus = async () => {
      if (!user?.id || !voucherId) {
        setCheckingWishlist(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("wishlist")
          .select("id")
          .eq("user_id", user.id)
          .eq("voucher_id", voucherId)
          .single();

        if (!error && data) {
          setIsInWishlist(true);
        } else {
          setIsInWishlist(false);
        }
      } catch (error) {
        console.error("Error checking wishlist:", error);
        setIsInWishlist(false);
      } finally {
        setCheckingWishlist(false);
      }
    };

    if (user?.id && voucherId) {
      checkWishlistStatus();
    }
  }, [user?.id, voucherId, supabase]);

  // Add state at the top of VoucherDetailsContent
  const [quantity, setQuantity] = useState(1);

  const handleDecrease = () => {
    if (quantity > 1) setQuantity(quantity - 1);
  };

  const handleIncrease = () => {
    setQuantity(quantity + 1);
  };

  // Handle redeem click (show confirmation)
  const handleRedeemClick = () => {
    if (!user?.id || !voucher) return;

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

    setShowRedeemConfirm(true);
  };

  // Confirm redemption
  const confirmRedemption = async () => {
    if (!user?.id || !voucher) return;

    const voucherPoints = voucher.points as number;
    const result = await redeemVoucher(
      user.id,
      voucher.id as number,
      voucherPoints
    );

    if (result.success) {
      toast.success(result.message, {
        duration: 3000,
        position: "top-center",
      });

      // Update user points in state
      setUser((prev) =>
        prev ? { ...prev, totalpoints: result.newBalance } : null
      );

      // Set redeemed voucher for success modal
      setRedeemedVoucher({
        title: voucher.title as string,
        description: voucher.description as string,
        points: voucherPoints,
        quantity: 1,
      });

      // Close confirm modal and show success modal
      setShowRedeemConfirm(false);
      setShowRedemptionSuccess(true);
    } else {
      toast.error(result.message, {
        duration: 4000,
        position: "top-center",
      });
      setShowRedeemConfirm(false);
    }
  };

  // Cancel redemption
  const cancelRedemption = () => {
    setShowRedeemConfirm(false);
  };

  // Handle individual voucher download
  const downloadVoucher = (voucher: {
    title: string;
    description: string;
    points: number;
    quantity: number;
  }) => {
    try {
      generateVoucherPDF(voucher, user?.email || "Unknown User");
      toast.success(`Downloaded ${voucher.title} voucher`, {
        duration: 3000,
        position: "top-center",
      });
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to generate voucher PDF", {
        duration: 3000,
        position: "top-center",
      });
    }
  };

  // Close redemption success modal
  const closeRedemptionSuccess = () => {
    setShowRedemptionSuccess(false);
    setRedeemedVoucher(null);
  };

  // Handle add to cart
  const handleAddToCart = async () => {
    if (!user?.id || !voucher) return;

    const userPoints = user.totalpoints ?? 0;
    const requiredPoints = (voucher.points as number) * quantity;

    // Check if user has enough points for total quantity
    if (userPoints < requiredPoints) {
      toast.error(
        `Cannot add to cart! You need ${requiredPoints} points but only have ${userPoints} points.`,
        {
          duration: 4000,
          position: "top-center",
        }
      );
      return;
    }

    const result = await addToCart(user.id, voucher.id as number, quantity);
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

    if (isInWishlist) {
      toast("This item is already in your wishlist", {
        duration: 3000,
        position: "top-center",
      });
      return;
    }

    const result = await addToWishlist(user.id, voucher.id as number);
    if (result.success) {
      toast.success(result.message, {
        duration: 3000,
        position: "top-center",
      });
      setIsInWishlist(true);
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

  if (!voucher) {
    return (
      <div className="h-svh flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 text-lg mb-4">Voucher not found</p>
          <Button
            onClick={() => router.push("/home")}
            className="bg-[#512da8] text-white px-6 py-2"
          >
            Back to Home
          </Button>
        </div>
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
  const canRedeem = userPoints >= (voucher.points as number);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Toaster position="top-center" />
      {/* Navbar */}
      <Navbar user={user ?? undefined} />

      {/* Redeem Confirmation Modal */}
      {showRedeemConfirm && voucher && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4 text-[#512da8]">
              Confirm Redemption
            </h3>
            <div className="mb-4">
              <img
                src={resolveVoucherImage(voucher.image)}
                alt={voucher.title as string}
                className="w-full h-32 object-cover rounded-md mb-3"
              />
              <h4 className="font-semibold text-gray-800">
                {voucher.title as string}
              </h4>
              <p className="text-sm text-gray-600 mt-1">
                {voucher.description as string}
              </p>
              <div className="flex items-center justify-between mt-3">
                <div className="flex items-center text-yellow-500 font-semibold">
                  <GiTwoCoins className="mr-1" />
                  {voucher.points as number} points
                </div>
                <div className="text-sm text-gray-600">
                  Balance after:{" "}
                  {(user?.totalpoints ?? 0) - (voucher.points as number)} points
                </div>
              </div>
            </div>
            <p className="text-gray-600 mb-6">
              Are you sure you want to redeem this voucher for{" "}
              {voucher.points as number} points?
            </p>
            <div className="flex gap-4">
              <Button
                className="flex-1 bg-[#512da8] text-white hover:bg-[#6a3fe3]"
                onClick={confirmRedemption}
              >
                Yes, Redeem
              </Button>
              <Button
                className="flex-1 bg-gray-300 text-gray-700 hover:bg-gray-400"
                onClick={cancelRedemption}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Redemption Success Modal */}
      {showRedemptionSuccess && redeemedVoucher && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-green-600">
                Redemption Successful! 🎉
              </h3>
              <button
                onClick={closeRedemptionSuccess}
                className="text-gray-400 hover:text-gray-600"
              >
                <FaTimes />
              </button>
            </div>

            <div className="mb-4">
              <h4 className="font-semibold text-gray-800 mb-2">
                {redeemedVoucher.title}
              </h4>
              <p className="text-sm text-gray-600 mb-3">
                {redeemedVoucher.description}
              </p>
              <div className="flex items-center text-yellow-500 font-semibold mb-4">
                <GiTwoCoins className="mr-1" />
                {redeemedVoucher.points} points redeemed
              </div>
            </div>

            <p className="text-sm text-gray-600 mb-4">
              Your voucher is ready for download:
            </p>

            <Button
              className="w-full mb-3 bg-[#512da8] text-white hover:bg-[#6a3fe3] flex items-center justify-center gap-2"
              onClick={() => downloadVoucher(redeemedVoucher)}
            >
              <FaDownload />
              Download Voucher PDF
            </Button>

            <Button
              className="w-full text-sm bg-gray-200 text-gray-700 hover:bg-gray-300"
              onClick={closeRedemptionSuccess}
            >
              Continue Shopping
            </Button>
          </div>
        </div>
      )}

      {/* Page content */}
      <div className="flex-1 p-6">
        {/* Back Button */}
        <button
          className="self-start text-[#512da8] mb-4 hover:text-[#6a3fe3] font-medium"
          onClick={() => router.back()}
        >
          ← Back
        </button>

        {/* Voucher Card */}
        <div className="w-full max-w-3xl bg-white rounded-lg shadow-md p-6 mx-auto">
          {/* Image */}
          <img
            src={resolveVoucherImage(voucher.image)}
            alt={voucher.title as string}
            className="w-full h-64 object-cover rounded-md mb-4"
          />

          {/* Title + Category */}
          <div className="flex justify-between items-center mb-2">
            <h1 className="text-2xl font-bold text-gray-800">
              {voucher.title as string}
            </h1>
            <span className="text-sm font-medium text-[#512da8] bg-purple-50 px-3 py-1 rounded-full">
              {categoryMap[voucher.category_id as number] || "Other"}
            </span>
          </div>

          {/* Points */}
          <div className="flex items-center space-x-2 text-gray-700 mb-4">
            <GiTwoCoins className="text-yellow-500 text-xl" />
            <p className="text-lg">
              Redeem for{" "}
              <span className="font-semibold">{voucher.points as number}</span>{" "}
              points
            </p>
            {!canRedeem && (
              <span className="text-red-500 text-sm ml-4 bg-red-50 px-2 py-1 rounded">
                Need {(voucher.points as number) - userPoints} more points
              </span>
            )}
          </div>

          {/* Description */}
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Description
            </h3>
            <p className="text-gray-600 leading-relaxed">
              {voucher.description as string}
            </p>
          </div>

          {/* Terms & Conditions */}
          <div className="mt-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-2">
              Voucher Terms & Conditions
            </h2>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2">
                <FaUserCheck className="text-purple-600" />
                Only registered members with enough points can redeem vouchers.
              </li>
              <li className="flex items-center gap-2">
                <FaGift className="text-purple-600" />
                Each voucher is single-use and cannot be refunded or exchanged
                for cash.
              </li>
              <li className="flex items-center gap-2">
                <FaCalendarTimes className="text-purple-600" />
                Vouchers expire on the stated date and cannot be extended.
              </li>
              <li className="flex items-center gap-2">
                <FaBan className="text-purple-600" />
                Not valid with other offers or for restricted items.
              </li>
              <li className="flex items-center gap-2">
                <FaRedo className="text-purple-600" />
                Points are deducted immediately after redemption.
              </li>
              <li className="flex items-center gap-2">
                <FaInfoCircle className="text-purple-600" />
                Redeeming a voucher means you accept these terms.
              </li>
            </ul>
          </div>

          {/* Quantity Selector */}
          <div className="mt-6 flex items-center justify-center space-x-6">
            <Button
              onClick={handleDecrease}
              className="w-10 h-10 flex items-center justify-center bg-[#512da8] text-white rounded-md shadow hover:bg-[#6a3fe3]"
            >
              -
            </Button>
            <span className="text-xl font-semibold">{quantity}</span>
            <Button
              onClick={handleIncrease}
              className="w-10 h-10 flex items-center justify-center bg-[#512da8] text-white rounded-md shadow hover:bg-[#6a3fe3]"
            >
              +
            </Button>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 flex justify-between items-center">
            <Button
              className={`px-8 py-3 rounded-md font-semibold ${
                canRedeem
                  ? "bg-[#512da8] text-white hover:bg-[#6a3fe3] shadow-lg"
                  : "bg-gray-400 text-gray-600 cursor-not-allowed"
              }`}
              onClick={handleRedeemClick}
              disabled={!canRedeem}
            >
              {canRedeem ? "Redeem Now" : "Insufficient Points"}
            </Button>

            <div className="flex space-x-6 text-gray-600 text-2xl">
              <FaHeart
                className={`cursor-pointer transition-colors ${
                  checkingWishlist
                    ? "text-gray-400 animate-pulse"
                    : isInWishlist
                    ? "text-red-500 hover:text-red-600"
                    : "hover:text-red-500"
                }`}
                onClick={handleAddToWishlist}
                title={
                  checkingWishlist
                    ? "Checking wishlist..."
                    : isInWishlist
                    ? "Already in wishlist"
                    : "Add to wishlist"
                }
              />
              <FaShoppingCart
                className={`cursor-pointer transition-colors ${
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

          {/* Additional Info */}
          <div className="mt-4 pt-4 border-t text-center">
            <p className="text-sm text-gray-500">
              Your current balance:{" "}
              <span className="font-semibold text-[#512da8]">
                {userPoints} points
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VoucherDetailsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <VoucherDetailsContent />
    </Suspense>
  );
}
