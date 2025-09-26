"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/ui/navbar";
import { GiTwoCoins } from "react-icons/gi";
import {
  FaTrash,
  FaShoppingCart,
  FaHeart,
  FaDownload,
  FaTimes,
} from "react-icons/fa";
import {
  getUser,
  fetchWishlistItems,
  removeFromWishlistById,
  addToCart,
  redeemVoucher,
  generateVoucherPDF,
} from "./action";
import toast, { Toaster } from "react-hot-toast";
import { resolveVoucherImage } from "@/lib/utils";

export default function WishlistPage() {
  const [user, setUser] = useState<{
    id?: string;
    email?: string;
    totalpoints?: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [wishlistItems, setWishlistItems] = useState<Record<string, unknown>[]>(
    []
  );
  const [showRedeemConfirm, setShowRedeemConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [voucherToRedeem, setVoucherToRedeem] = useState<Record<
    string,
    unknown
  > | null>(null);
  const [itemToDelete, setItemToDelete] = useState<{
    wishlistId: number;
    voucherTitle: string;
  } | null>(null);
  const [showRedemptionSuccess, setShowRedemptionSuccess] = useState(false);
  const [redeemedVoucher, setRedeemedVoucher] = useState<{
    title: string;
    description: string;
    points: number;
    quantity: number;
    image?: string;
  } | null>(null);
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

  // Handle remove from wishlist with confirmation
  const handleDeleteClick = (wishlistId: number, voucherTitle: string) => {
    setItemToDelete({ wishlistId, voucherTitle });
    setShowDeleteConfirm(true);
  };

  // Confirm delete
  const confirmDelete = async () => {
    if (!itemToDelete) return;

    const result = await removeFromWishlistById(itemToDelete.wishlistId);
    if (result.success) {
      toast.success(result.message, {
        duration: 3000,
        position: "top-center",
      });
      // Remove item from local state
      setWishlistItems((prev) =>
        prev.filter((item) => (item.id as number) !== itemToDelete.wishlistId)
      );
    } else {
      toast.error(result.message, {
        duration: 4000,
        position: "top-center",
      });
    }

    setShowDeleteConfirm(false);
    setItemToDelete(null);
  };

  // Cancel delete
  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setItemToDelete(null);
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

  // Handle redeem functionality with confirmation
  const handleRedeemClick = (voucher: Record<string, unknown>) => {
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

    setVoucherToRedeem(voucher);
    setShowRedeemConfirm(true);
  };

  // Confirm redemption
  const confirmRedemption = async () => {
    if (!user?.id || !voucherToRedeem) return;

    const voucherPoints = voucherToRedeem.points as number;
    const result = await redeemVoucher(
      user.id,
      voucherToRedeem.id as number,
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
        title: voucherToRedeem.title as string,
        description: voucherToRedeem.description as string,
        points: voucherPoints,
        quantity: 1,
        image: resolveVoucherImage(voucherToRedeem.image), // Add resolved image
      });

      // Close confirm modal and show success modal
      setShowRedeemConfirm(false);
      setVoucherToRedeem(null);
      setShowRedemptionSuccess(true);
    } else {
      toast.error(result.message, {
        duration: 4000,
        position: "top-center",
      });
      setShowRedeemConfirm(false);
      setVoucherToRedeem(null);
    }
  };

  // Cancel redemption
  const cancelRedemption = () => {
    setShowRedeemConfirm(false);
    setVoucherToRedeem(null);
  };

  // Handle individual voucher download
  const downloadVoucher = (voucher: {
    title: string;
    description: string;
    points: number;
    quantity: number;
    image?: string; // Add image property
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
      <Toaster position="top-center" />
      <Navbar user={user ?? undefined} />

      {/* Redeem Confirmation Modal */}
      {showRedeemConfirm && voucherToRedeem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4 text-[#512da8]">
              Confirm Redemption
            </h3>
            <div className="mb-4">
              <img
                src={resolveVoucherImage(voucherToRedeem.image)}
                alt={voucherToRedeem.title as string}
                className="w-full h-32 object-cover rounded-md mb-3"
              />
              <h4 className="font-semibold text-gray-800">
                {voucherToRedeem.title as string}
              </h4>
              <p className="text-sm text-gray-600 mt-1">
                {voucherToRedeem.description as string}
              </p>
              <div className="flex items-center justify-between mt-3">
                <div className="flex items-center text-yellow-500 font-semibold">
                  <GiTwoCoins className="mr-1" />
                  {voucherToRedeem.points as number} points
                </div>
                <div className="text-sm text-gray-600">
                  Balance after:{" "}
                  {(user.totalpoints ?? 0) - (voucherToRedeem.points as number)}{" "}
                  points
                </div>
              </div>
            </div>
            <p className="text-gray-600 mb-6">
              Are you sure you want to redeem this voucher for{" "}
              {voucherToRedeem.points as number} points?
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

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && itemToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4 text-red-600">
              Confirm Removal
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to remove &quot;{itemToDelete.voucherTitle}
              &quot; from your wishlist?
            </p>
            <div className="flex gap-4">
              <Button
                className="flex-1 bg-red-500 text-white hover:bg-red-600"
                onClick={confirmDelete}
              >
                Yes, Remove
              </Button>
              <Button
                className="flex-1 bg-gray-300 text-gray-700 hover:bg-gray-400"
                onClick={cancelDelete}
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
                      src={resolveVoucherImage(voucher.image)}
                      alt={voucher.title as string}
                      className="w-full h-32 object-cover rounded-md mb-3 cursor-pointer"
                      onClick={() =>
                        router.push(
                          `/voucherdetails?id=${voucher.id as number}`
                        )
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
                          handleDeleteClick(
                            item.id as number,
                            voucher.title as string
                          )
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
                        Need {(voucher.points as number) - userPoints} more
                        points
                      </p>
                    )}

                    <div className="flex justify-between items-center mt-3">
                      <Button
                        className="bg-[#512da8] text-white px-3 py-1 text-sm disabled:bg-gray-400 disabled:cursor-not-allowed"
                        onClick={() => handleRedeemClick(voucher)}
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
                            handleDeleteClick(
                              item.id as number,
                              voucher.title as string
                            )
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
