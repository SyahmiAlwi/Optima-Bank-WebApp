"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { supabaseBrowser } from "@/lib/supabase/client";
import { Navbar } from "@/components/ui/navbar";
import {
  FaBasketballBall,
  FaUtensils,
  FaFilm,
  FaTrash,
  FaDownload,
  FaExclamationTriangle,
} from "react-icons/fa";
import {
  getUser,
  removeFromCart,
  removeAllFromCart,
  updateCartQuantity,
  processRedemption,
  generateVoucherPDF,
  generateAllVouchersPDF,
} from "./action";
import toast, { Toaster } from "react-hot-toast";

interface CartItem {
  id: number;
  quantity: number;
  voucher: {
    id: number;
    title: string;
    description: string;
    points: number;
    image: string;
  };
  selected?: boolean;
}

export default function CartPage() {
  const [user, setUser] = useState<{
    id: string;
    email?: string;
    totalpoints?: number;
  } | null>(null);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectAll, setSelectAll] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<number | null>(null);
  const [showCheckoutConfirm, setShowCheckoutConfirm] = useState(false);
  const router = useRouter();
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);
  const [redeemedVouchers, setRedeemedVouchers] = useState<
    Array<{
      title: string;
      description: string;
      points: number;
      quantity: number;
    }>
  >([]);

  // Fetch user and cart
  useEffect(() => {
    const loadUserAndCart = async () => {
      const userData = await getUser();
      if (!userData) {
        router.push("/auth");
        return;
      }
      setUser(userData);

      const { data, error } = await supabaseBrowser()
        .from("cart")
        .select(
          `
          id,
          quantity,
          voucher:voucher_id (
            id,
            title,
            description,
            points,
            image
          )
        `
        )
        .eq("user_id", userData.id);

      if (error) {
        console.error("Error fetching cart:", error);
        toast.error("Failed to load cart items");
      } else {
        console.log("Raw cart data:", data); // Debug log

        // Handle the response data and normalize it
        const itemsWithSelection: CartItem[] = (data || []).map(
          (item: Record<string, unknown>) => {
            // Handle case where voucher might be an array or object
            let voucherData;
            if (Array.isArray(item.voucher)) {
              voucherData = item.voucher[0]; // Take first element if array
            } else {
              voucherData = item.voucher;
            }

            return {
              id: Number(item.id),
              quantity: Number(item.quantity),
              voucher: {
                id: Number(voucherData?.id),
                title: String(voucherData?.title || ""),
                description: String(voucherData?.description || ""),
                points: Number(voucherData?.points || 0),
                image: String(voucherData?.image || ""),
              },
              selected: false,
            };
          }
        );

        setCartItems(itemsWithSelection);
      }

      setLoading(false);
    };

    loadUserAndCart();
  }, [router]);

  // Toggle individual item selection
  const toggleItemSelection = (cartId: number) => {
    setCartItems((prev) =>
      prev.map((item) =>
        item.id === cartId ? { ...item, selected: !item.selected } : item
      )
    );
  };

  // Smart select function - selects items that can be afforded
  const smartSelect = () => {
    const userPoints = user?.totalpoints ?? 0;

    // Sort items by points (ascending) to prioritize cheaper items
    const sortedItems = [...cartItems].sort(
      (a, b) => a.quantity * a.voucher.points - b.quantity * b.voucher.points
    );

    let remainingPoints = userPoints;
    const newCartItems = cartItems.map((item) => ({
      ...item,
      selected: false,
    }));

    // Select items that can be afforded
    for (const sortedItem of sortedItems) {
      const itemCost = sortedItem.quantity * sortedItem.voucher.points;
      if (itemCost <= remainingPoints) {
        const itemIndex = newCartItems.findIndex(
          (item) => item.id === sortedItem.id
        );
        if (itemIndex !== -1) {
          newCartItems[itemIndex].selected = true;
          remainingPoints -= itemCost;
        }
      }
    }

    setCartItems(newCartItems);

    const selectedCount = newCartItems.filter((item) => item.selected).length;
    if (selectedCount > 0) {
      toast.success(`Selected ${selectedCount} affordable item(s)`, {
        duration: 3000,
        position: "top-center",
      });
    } else {
      toast.error("No items can be afforded with current points", {
        duration: 3000,
        position: "top-center",
      });
    }
  };

  // Toggle select all (only for affordable items)
  const toggleSelectAll = () => {
    const userPoints = user?.totalpoints ?? 0;

    if (selectAll) {
      // Unselect all
      setSelectAll(false);
      setCartItems((prev) =>
        prev.map((item) => ({ ...item, selected: false }))
      );
    } else {
      // Check if user can afford all items
      const totalAllPoints = cartItems.reduce(
        (acc, item) => acc + item.quantity * item.voucher.points,
        0
      );

      if (totalAllPoints <= userPoints) {
        // Can afford all - select all
        setSelectAll(true);
        setCartItems((prev) =>
          prev.map((item) => ({ ...item, selected: true }))
        );
      } else {
        // Can't afford all - use smart select
        smartSelect();
      }
    }
  };

  // Update select all state when individual items change
  useEffect(() => {
    const userPoints = user?.totalpoints ?? 0;
    const affordableItems = cartItems.filter(
      (item) => item.quantity * item.voucher.points <= userPoints
    );
    const allAffordableSelected =
      affordableItems.length > 0 &&
      affordableItems.every((item) => item.selected);
    setSelectAll(allAffordableSelected);
  }, [cartItems, user]);

  // Update quantity (both frontend and backend)
  const updateQuantity = async (cartId: number, change: number) => {
    const item = cartItems.find((item) => item.id === cartId);
    if (!item) {
      toast.error("Item not found in cart");
      return;
    }

    const newQuantity = item.quantity + change;

    if (newQuantity < 1) {
      // Show confirmation for removing item when quantity reaches 0
      setItemToDelete(cartId);
      return;
    }

    // Update in database
    const result = await updateCartQuantity(cartId, newQuantity);

    if (result.success) {
      // Update frontend state
      setCartItems((prev) =>
        prev.map((item) =>
          item.id === cartId ? { ...item, quantity: newQuantity } : item
        )
      );
      toast.success("Quantity updated", {
        duration: 2000,
        position: "top-center",
      });
    } else {
      toast.error(result.message, {
        duration: 4000,
        position: "top-center",
      });
    }
  };

  // Remove item with confirmation (both frontend and backend)
  const removeItem = async (cartId: number) => {
    const item = cartItems.find((item) => item.id === cartId);
    if (!item) {
      toast.error("Item not found in cart");
      return;
    }

    const result = await removeFromCart(cartId);

    if (result.success) {
      // Update frontend state
      setCartItems((prev) => prev.filter((item) => item.id !== cartId));
      toast.success(`Removed ${item.voucher.title} from cart`, {
        duration: 3000,
        position: "top-center",
      });
    } else {
      toast.error(result.message, {
        duration: 4000,
        position: "top-center",
      });
    }
    setItemToDelete(null);
  };

  // Clear all items from cart
  const clearAllItems = async () => {
    if (!user) {
      toast.error("User not found");
      return;
    }

    if (cartItems.length === 0) {
      toast.error("Cart is already empty");
      return;
    }

    const result = await removeAllFromCart(user.id);

    if (result.success) {
      setCartItems([]);
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
    setShowClearConfirm(false);
  };

  // Show checkout confirmation
  const showCheckoutConfirmation = () => {
    const selectedItems = cartItems.filter((item) => item.selected);

    if (selectedItems.length === 0) {
      toast.error("Please select items to checkout", {
        duration: 3000,
        position: "top-center",
      });
      return;
    }

    const totalPointsNeeded = selectedItems.reduce(
      (acc, item) => acc + item.quantity * item.voucher.points,
      0
    );

    const userPoints = user?.totalpoints ?? 0;

    if (totalPointsNeeded > userPoints) {
      toast.error(
        `Insufficient points! You need ${totalPointsNeeded} points but only have ${userPoints}.`,
        {
          duration: 5000,
          position: "top-center",
        }
      );
      return;
    }

    setShowCheckoutConfirm(true);
  };

  // Handle checkout for selected items
  const handleCheckout = async () => {
    setShowCheckoutConfirm(false);

    // Add null check for user
    if (!user) {
      toast.error("User not found. Please log in again.");
      router.push("/auth");
      return;
    }

    const selectedItems = cartItems.filter((item) => item.selected);

    if (selectedItems.length === 0) {
      toast.error("Please select items to checkout", {
        duration: 3000,
        position: "top-center",
      });
      return;
    }

    const totalPointsNeeded = selectedItems.reduce(
      (acc, item) => acc + item.quantity * item.voucher.points,
      0
    );

    const userPoints = user.totalpoints ?? 0;

    if (totalPointsNeeded > userPoints) {
      toast.error(
        `Insufficient points! You need ${totalPointsNeeded} points but only have ${userPoints}.`,
        {
          duration: 5000,
          position: "top-center",
        }
      );
      return;
    }

    // Show loading toast
    const loadingToast = toast.loading("Processing checkout...");

    // Process checkout
    const supabase = supabaseBrowser();

    try {
      // Start transaction-like operations
      // 1. Deduct points from user
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ totalpoints: userPoints - totalPointsNeeded })
        .eq("id", user.id);

      if (updateError) {
        console.error("Error updating user points:", updateError);
        toast.dismiss(loadingToast);
        toast.error("Error processing checkout - could not update points", {
          duration: 4000,
          position: "top-center",
        });
        return;
      }

      // 2. Record redemptions for each selected item
      let allRedemptionsSuccessful = true;

      for (const item of selectedItems) {
        const redemptionResult = await processRedemption(
          user.id,
          item.voucher.id,
          item.voucher.points * item.quantity,
          item.quantity
        );

        if (!redemptionResult.success) {
          console.error("Failed to record redemption for item:", item.id);
          allRedemptionsSuccessful = false;
          // Continue with other items instead of failing completely
        }
      }

      if (!allRedemptionsSuccessful) {
        console.warn(
          "Some redemptions failed to record, but points were deducted"
        );
      }

      // 3. Remove selected items from cart
      const selectedIds = selectedItems.map((item) => item.id);
      const { error: removeError } = await supabase
        .from("cart")
        .delete()
        .in("id", selectedIds);

      if (removeError) {
        console.error("Error removing items from cart:", removeError);
        // Don't block the process, just log the error
      }

      // Store redeemed vouchers for PDF generation
      const vouchersForPDF = selectedItems.map((item) => ({
        title: item.voucher.title,
        description: item.voucher.description,
        points: item.voucher.points,
        quantity: item.quantity,
      }));
      setRedeemedVouchers(vouchersForPDF);

      // Update local state
      setCartItems((prev) =>
        prev.filter((item) => !selectedIds.includes(item.id))
      );
      setUser((prev) =>
        prev ? { ...prev, totalpoints: userPoints - totalPointsNeeded } : null
      );

      // Show checkout success state
      setCheckoutSuccess(true);

      // Dismiss loading toast and show success message
      toast.dismiss(loadingToast);

      if (allRedemptionsSuccessful) {
        toast.success(
          `Successfully redeemed ${selectedItems.length} voucher(s) for ${totalPointsNeeded} points!`,
          {
            duration: 5000,
            position: "top-center",
          }
        );
      } else {
        toast.success(
          `Redeemed ${selectedItems.length} voucher(s) for ${totalPointsNeeded} points! (Some redemption records may not have been saved)`,
          {
            duration: 6000,
            position: "top-center",
          }
        );
      }
    } catch (error) {
      console.error("Checkout error:", error);
      toast.dismiss(loadingToast);
      toast.error("An error occurred during checkout", {
        duration: 4000,
        position: "top-center",
      });

      // Try to rollback points if possible
      try {
        await supabase
          .from("profiles")
          .update({ totalpoints: userPoints })
          .eq("id", user.id);
        console.log("Points rollback successful");
        toast.success("Points have been restored due to checkout error", {
          duration: 4000,
          position: "top-center",
        });
      } catch (rollbackError) {
        console.error("Failed to rollback points:", rollbackError);
        toast.error(
          "Critical error: Unable to restore points. Please contact support.",
          {
            duration: 8000,
            position: "top-center",
          }
        );
      }
    }
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

  // Handle download all vouchers
  const downloadAllVouchers = () => {
    try {
      generateAllVouchersPDF(redeemedVouchers, user?.email || "Unknown User");
      toast.success("Downloaded all vouchers as bundle", {
        duration: 3000,
        position: "top-center",
      });
    } catch (error) {
      console.error("Error generating bundle PDF:", error);
      toast.error("Failed to generate voucher bundle PDF", {
        duration: 3000,
        position: "top-center",
      });
    }
  };

  // Reset checkout success state
  const resetCheckoutState = () => {
    setCheckoutSuccess(false);
    setRedeemedVouchers([]);
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

  // Sidebar category navigation (redirect to HomePage with category param)
  const goToCategory = (category: string) => {
    if (category === "All") router.push("/home");
    else router.push(`/home?category=${category}`);
  };

  const selectedItems = cartItems.filter((item) => item.selected);
  const totalSelectedPoints = selectedItems.reduce(
    (acc, item) => acc + item.quantity * item.voucher.points,
    0
  );

  // Calculate points after checkout and determine which items would be unaffordable
  const userPoints = user.totalpoints ?? 0;
  const pointsAfterCheckout = userPoints - totalSelectedPoints;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Toast Container */}
      <Toaster
        toastOptions={{
          // Default options for all toasts
          style: {
            background: "#363636",
            color: "#fff",
          },
          success: {
            style: {
              background: "#4ade80",
              color: "#fff",
            },
            iconTheme: {
              primary: "#fff",
              secondary: "#4ade80",
            },
          },
          error: {
            style: {
              background: "#ef4444",
              color: "#fff",
            },
            iconTheme: {
              primary: "#fff",
              secondary: "#ef4444",
            },
          },
          loading: {
            style: {
              background: "#512da8",
              color: "#fff",
            },
          },
        }}
      />

      {/* Confirmation Modals */}
      {itemToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md">
            <h3 className="text-lg font-semibold mb-4">Remove Item</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to remove this item from your cart?
            </p>
            <div className="flex gap-4">
              <Button
                className="bg-red-500 text-white hover:bg-red-600"
                onClick={() => removeItem(itemToDelete)}
              >
                Yes, Remove
              </Button>
              <Button
                className="bg-gray-300 text-gray-700 hover:bg-gray-400"
                onClick={() => setItemToDelete(null)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {showClearConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md">
            <h3 className="text-lg font-semibold mb-4">Clear Cart</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to remove all {cartItems.length} item(s)
              from your cart? This action cannot be undone.
            </p>
            <div className="flex gap-4">
              <Button
                className="bg-red-500 text-white hover:bg-red-600"
                onClick={clearAllItems}
              >
                Yes, Clear All
              </Button>
              <Button
                className="bg-gray-300 text-gray-700 hover:bg-gray-400"
                onClick={() => setShowClearConfirm(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Checkout Confirmation Modal */}
      {showCheckoutConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md">
            <div className="flex items-center mb-4">
              <FaExclamationTriangle className="text-yellow-500 mr-3 text-xl" />
              <h3 className="text-lg font-semibold">Confirm Checkout</h3>
            </div>
            <div className="mb-6">
              <p className="text-gray-600 mb-3">
                You are about to redeem {selectedItems.length} voucher(s):
              </p>
              <div className="bg-gray-50 p-3 rounded max-h-40 overflow-y-auto">
                {selectedItems.map((item, index) => (
                  <div key={index} className="text-sm mb-1">
                    • {item.voucher.title} (x{item.quantity}) -{" "}
                    {item.quantity * item.voucher.points} points
                  </div>
                ))}
              </div>
              <div className="mt-3 pt-3 border-t">
                <p className="font-semibold text-gray-800">
                  Total Points: {totalSelectedPoints}
                </p>
                <p className="text-sm text-gray-600">
                  Remaining Points: {pointsAfterCheckout}
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <Button
                className="bg-[#512da8] text-white hover:bg-[#6a3fe3]"
                onClick={handleCheckout}
              >
                Confirm Checkout
              </Button>
              <Button
                className="bg-gray-300 text-gray-700 hover:bg-gray-400"
                onClick={() => setShowCheckoutConfirm(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Navbar with totalpoints */}
      <Navbar user={user} />

      {/* Page Layout */}
      <div className="flex flex-1 min-h-screen">
        {/* Sidebar */}
        <aside className="w-40 h-full border-r border-gray-200 flex flex-col pt-6">
          <h2 className="px-4 text-lg font-bold text-[#512da8] mb-4">
            Categories
          </h2>
          <nav className="flex flex-col space-y-2">
            {["All", "Sport", "Food", "Entertainment"].map((cat) => (
              <button
                key={cat}
                onClick={() => goToCategory(cat)}
                className="flex items-center px-4 py-2 rounded-r-full transition text-gray-700 hover:bg-purple-50 hover:text-[#512da8]"
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
        <main className="flex-1 p-6 flex gap-6">
          {/* Left: Cart items */}
          <div className="flex-1">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Your Cart</h2>
              <div className="flex items-center gap-4">
                {cartItems.length > 0 && (
                  <>
                    <Button
                      className="bg-red-500 text-white hover:bg-red-600 flex items-center gap-2"
                      onClick={() => setShowClearConfirm(true)}
                    >
                      <FaTrash className="text-sm" />
                      Clear All
                    </Button>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectAll}
                        onChange={toggleSelectAll}
                        className="w-4 h-4 text-[#512da8] border-gray-300 rounded focus:ring-[#512da8]"
                      />
                      <span className="text-sm font-medium">Select All</span>
                    </label>
                  </>
                )}
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg shadow">
              {cartItems.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-500 text-lg">Your cart is empty</p>
                  <button
                    onClick={() => router.push("/home")}
                    className="mt-4 text-[#512da8] hover:underline"
                  >
                    Browse vouchers
                  </button>
                </div>
              )}

              {cartItems.map((item) => {
                // Determine if this item would be unaffordable after checkout
                const itemTotalPoints = item.quantity * item.voucher.points;
                const isCurrentlyAffordable = itemTotalPoints <= userPoints;
                const wouldBeUnaffordableAfterCheckout =
                  !item.selected && // Only check unselected items
                  selectedItems.length > 0 && // Only if some items are selected
                  itemTotalPoints > pointsAfterCheckout; // Would be unaffordable after checkout

                const isGreyedOut = wouldBeUnaffordableAfterCheckout;

                return (
                  <div
                    key={item.id}
                    className={`flex items-center justify-between p-4 mb-4 rounded-lg transition-colors ${
                      item.selected
                        ? "bg-purple-50 border border-[#512da8]"
                        : isGreyedOut
                        ? "bg-gray-100 opacity-60"
                        : "bg-gray-50"
                    }`}
                  >
                    {/* Selection checkbox + Remove button + Voucher image */}
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={item.selected}
                        onChange={() =>
                          !isGreyedOut && toggleItemSelection(item.id)
                        }
                        disabled={isGreyedOut}
                        className={`w-4 h-4 text-[#512da8] border-gray-300 rounded focus:ring-[#512da8] ${
                          isGreyedOut ? "cursor-not-allowed opacity-50" : ""
                        }`}
                      />
                      <button
                        onClick={() => setItemToDelete(item.id)}
                        className="bg-[#E34234] text-white rounded-full w-8 h-8 flex items-center justify-center text-sm hover:bg-red-600 transition-colors"
                        title="Remove item"
                      >
                        ×
                      </button>
                      <img
                        src={`/images/${item.voucher.image || "default.jpg"}`}
                        alt={item.voucher.title}
                        className={`w-24 h-24 rounded-md object-cover ${
                          isGreyedOut ? "grayscale" : ""
                        }`}
                      />
                    </div>

                    {/* Voucher info */}
                    <div className="flex-1 ml-4">
                      <h3
                        className={`font-semibold ${
                          isGreyedOut ? "text-gray-500" : ""
                        }`}
                      >
                        {item.voucher.title}
                      </h3>
                      <p
                        className={`text-sm ${
                          isGreyedOut ? "text-gray-400" : "text-gray-500"
                        }`}
                      >
                        {item.voucher.description}
                      </p>
                      <p
                        className={`text-sm ${
                          isGreyedOut ? "text-gray-400" : "text-gray-600"
                        }`}
                      >
                        Redeem for {item.voucher.points} points
                      </p>
                      <p
                        className={`text-sm font-medium mt-1 ${
                          isGreyedOut ? "text-gray-400" : "text-gray-800"
                        }`}
                      >
                        Total points: {item.quantity * item.voucher.points}
                      </p>
                      {isGreyedOut && (
                        <p className="text-red-400 text-xs mt-1">
                          Unaffordable after checkout (need{" "}
                          {itemTotalPoints - pointsAfterCheckout} more points)
                        </p>
                      )}
                    </div>

                    {/* Quantity controls */}
                    <div className="flex flex-col items-center">
                      <div className="flex items-center space-x-2">
                        <Button
                          className={`w-8 h-8 p-0 transition-colors ${
                            isGreyedOut
                              ? "bg-gray-400 text-gray-600 cursor-not-allowed"
                              : "bg-[#512da8] text-white hover:bg-[#6a3fe3]"
                          }`}
                          onClick={() =>
                            !isGreyedOut && updateQuantity(item.id, -1)
                          }
                          disabled={isGreyedOut}
                        >
                          -
                        </Button>
                        <span
                          className={`px-2 min-w-[2rem] text-center ${
                            isGreyedOut ? "text-gray-500" : ""
                          }`}
                        >
                          {item.quantity}
                        </span>
                        <Button
                          className={`w-8 h-8 p-0 transition-colors ${
                            isGreyedOut
                              ? "bg-gray-400 text-gray-600 cursor-not-allowed"
                              : "bg-[#512da8] text-white hover:bg-[#6a3fe3]"
                          }`}
                          onClick={() =>
                            !isGreyedOut && updateQuantity(item.id, 1)
                          }
                          disabled={isGreyedOut}
                        >
                          +
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: Summary or Download Section */}
          <div className="w-64 bg-white p-4 rounded-lg shadow">
            {checkoutSuccess && redeemedVouchers.length > 0 ? (
              // Show download options after successful checkout
              <div>
                <h3 className="font-semibold mb-4 text-green-600">
                  Checkout Complete! 🎉
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Your vouchers are ready for download:
                </p>

                {/* Download All Button */}
                <Button
                  className="w-full mb-3 bg-[#512da8] text-white hover:bg-[#6a3fe3] flex items-center justify-center gap-2"
                  onClick={downloadAllVouchers}
                >
                  <FaDownload />
                  Download All ({redeemedVouchers.length})
                </Button>

                {/* Individual voucher downloads */}
                <div className="space-y-2 mb-4">
                  <p className="text-xs text-gray-500 font-medium">
                    Individual Downloads:
                  </p>
                  {redeemedVouchers.map((voucher, index) => (
                    <button
                      key={index}
                      onClick={() => downloadVoucher(voucher)}
                      className="w-full text-left p-2 text-xs bg-gray-50 hover:bg-gray-100 rounded border flex items-center justify-between group"
                    >
                      <span className="truncate">
                        {voucher.title} (x{voucher.quantity})
                      </span>
                      <FaDownload className="opacity-0 group-hover:opacity-100 transition-opacity text-[#512da8]" />
                    </button>
                  ))}
                </div>

                {/* Reset button */}
                <Button
                  className="w-full text-sm bg-gray-200 text-gray-700 hover:bg-gray-300"
                  onClick={resetCheckoutState}
                >
                  Continue Shopping
                </Button>
              </div>
            ) : (
              // Show regular summary
              <div>
                <h3 className="font-semibold mb-4">Summary</h3>
                <p>
                  Total items:{" "}
                  {cartItems.reduce((acc, i) => acc + i.quantity, 0)}
                </p>
                <p className="mt-2">
                  Selected items:{" "}
                  {selectedItems.reduce((acc, i) => acc + i.quantity, 0)}
                </p>
                <p className="mt-2">
                  Selected points needed: {totalSelectedPoints}
                </p>
                <p className="mt-2 font-semibold">
                  Your total points: {user.totalpoints ?? 0}
                </p>
                {totalSelectedPoints > 0 && (
                  <p
                    className={`mt-2 text-sm ${
                      pointsAfterCheckout < 0 ? "text-red-500" : ""
                    }`}
                  >
                    Points after checkout: {pointsAfterCheckout}
                  </p>
                )}
                {/* Show warning if some items would become unaffordable */}
                {pointsAfterCheckout >= 0 && selectedItems.length > 0 && (
                  <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded">
                    <p className="text-yellow-700 text-xs">
                      {
                        cartItems.filter(
                          (item) =>
                            !item.selected &&
                            item.quantity * item.voucher.points >
                              pointsAfterCheckout
                        ).length
                      }{" "}
                      item(s) will become unaffordable after checkout
                    </p>
                  </div>
                )}
                <Button
                  className="mt-4 w-full bg-[#512da8] text-white hover:bg-[#6a3fe3] disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                  onClick={showCheckoutConfirmation}
                  disabled={
                    selectedItems.length === 0 ||
                    totalSelectedPoints > (user.totalpoints ?? 0)
                  }
                >
                  Checkout Selected ({selectedItems.length})
                </Button>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
