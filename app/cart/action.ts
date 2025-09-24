"use client";

import { supabaseBrowser } from "@/lib/supabase/client";
import jsPDF from "jspdf";

// Fetch all vouchers
export const fetchVouchers = async () => {
  const supabase = supabaseBrowser();
  const { data, error } = await supabase.from("voucher").select("*");
  if (error) {
    console.error("Error fetching vouchers:", error);
    return [];
  }
  return data || [];
};

// Fix: Get authenticated user and their profile
export async function getUser() {
  const supabase = supabaseBrowser();

  // First, get the authenticated user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    console.error("Error fetching authenticated user:", authError);
    return null;
  }

  // Then get their profile data
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, email, totalpoints")
    .eq("id", user.id)
    .single();

  if (profileError) {
    console.error("Error fetching user profile:", profileError);
    return null;
  }

  return profile;
}

// Add function to remove item from cart with validation
export const removeFromCart = async (cartId: number) => {
  const supabase = supabaseBrowser();

  // First validate that the cart item exists
  const { data: existingItem, error: checkError } = await supabase
    .from("cart")
    .select("id, voucher_id")
    .eq("id", cartId)
    .single();

  if (checkError || !existingItem) {
    console.error("Error checking cart item:", checkError);
    return {
      success: false,
      message: "Cart item not found or already removed",
    };
  }

  // Proceed with deletion
  const { error } = await supabase.from("cart").delete().eq("id", cartId);

  if (error) {
    console.error("Error removing from cart:", error);
    return {
      success: false,
      message: "Failed to remove item from cart. Please try again.",
    };
  }

  return { success: true, message: "Item removed from cart" };
};

// Add function to remove all items from cart
export const removeAllFromCart = async (userId: string) => {
  const supabase = supabaseBrowser();

  // First check if user has any items in cart
  const { data: cartItems, error: checkError } = await supabase
    .from("cart")
    .select("id")
    .eq("user_id", userId);

  if (checkError) {
    console.error("Error checking cart items:", checkError);
    return {
      success: false,
      message: "Failed to check cart items",
    };
  }

  if (!cartItems || cartItems.length === 0) {
    return {
      success: false,
      message: "Cart is already empty",
    };
  }

  // Remove all items for the user
  const { error } = await supabase.from("cart").delete().eq("user_id", userId);

  if (error) {
    console.error("Error removing all items from cart:", error);
    return {
      success: false,
      message: "Failed to clear cart. Please try again.",
    };
  }

  return {
    success: true,
    message: `Successfully removed ${cartItems.length} item(s) from cart`,
  };
};

// Add function to update cart item quantity
export const updateCartQuantity = async (
  cartId: number,
  newQuantity: number
) => {
  const supabase = supabaseBrowser();

  if (newQuantity < 1) {
    // If quantity is less than 1, remove the item
    return await removeFromCart(cartId);
  }

  // Validate that the cart item exists before updating
  const { data: existingItem, error: checkError } = await supabase
    .from("cart")
    .select("id, quantity")
    .eq("id", cartId)
    .single();

  if (checkError || !existingItem) {
    console.error("Error checking cart item:", checkError);
    return {
      success: false,
      message: "Cart item not found",
    };
  }

  const { error } = await supabase
    .from("cart")
    .update({ quantity: newQuantity })
    .eq("id", cartId);

  if (error) {
    console.error("Error updating cart quantity:", error);
    return {
      success: false,
      message: "Failed to update quantity. Please try again.",
    };
  }

  return { success: true, message: "Quantity updated" };
};

// Add function to handle redemptions (with fallback)
export const processRedemption = async (
  userId: string,
  voucherId: number,
  pointsUsed: number,
  quantity: number = 1
) => {
  const supabase = supabaseBrowser();

  // Try to insert into redemptions table
  const { error: redemptionError } = await supabase.from("redemptions").insert({
    user_id: userId,
    voucher_id: voucherId,
    points_used: pointsUsed,
    quantity: quantity,
    redeemed_at: new Date().toISOString(),
  });

  if (redemptionError) {
    console.error("Error recording redemption:", redemptionError);

    // If redemptions table doesn't exist, try alternative approach
    if (redemptionError.code === "42P01") {
      // Table doesn't exist
      console.log(
        "Redemptions table doesn't exist, using alternative tracking"
      );

      // You could store redemptions in user_vouchers table or another table
      // For now, we'll just log it and continue
      console.log(
        `Redemption processed: User ${userId} redeemed voucher ${voucherId} for ${pointsUsed} points`
      );
      return { success: true, message: "Redemption processed (logged)" };
    }

    return {
      success: false,
      message: "Error recording redemption",
      error: redemptionError,
    };
  }

  return { success: true, message: "Redemption recorded successfully" };
};

// Sign out user
export const signOutUser = async () => {
  const supabase = supabaseBrowser();
  const { error } = await supabase.auth.signOut();
  if (error) console.error("Error signing out:", error);
};

// Add function to generate and download voucher PDF
export const generateVoucherPDF = (
  voucher: {
    title: string;
    description: string;
    points: number;
    quantity: number;
  },
  userEmail: string
) => {
  const doc = new jsPDF();

  // Set up the PDF styling
  doc.setFontSize(20);
  doc.setTextColor(81, 45, 168); // Purple color #512da8
  doc.text("Optima Bank - Voucher", 20, 30);

  // Add voucher details
  doc.setFontSize(16);
  doc.setTextColor(0, 0, 0);
  doc.text(`Voucher: ${voucher.title}`, 20, 50);

  doc.setFontSize(12);
  doc.text(`Description: ${voucher.description}`, 20, 70);
  doc.text(`Points Redeemed: ${voucher.points * voucher.quantity}`, 20, 85);
  doc.text(`Quantity: ${voucher.quantity}`, 20, 100);
  doc.text(`Redeemed by: ${userEmail}`, 20, 115);
  doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, 130);

  // Add a voucher code (you can make this more sophisticated)
  const voucherCode = `OB-${Date.now()}-${Math.random()
    .toString(36)
    .substr(2, 9)
    .toUpperCase()}`;
  doc.setFontSize(14);
  doc.setTextColor(81, 45, 168);
  doc.text(`Voucher Code: ${voucherCode}`, 20, 150);

  // Add terms and conditions
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text("Terms & Conditions:", 20, 170);
  doc.text(
    "- This voucher is valid for 6 months from the date of issue",
    20,
    180
  );
  doc.text("- This voucher cannot be exchanged for cash", 20, 190);
  doc.text("- Present this voucher at participating merchants", 20, 200);

  // Add a border
  doc.setDrawColor(81, 45, 168);
  doc.setLineWidth(2);
  doc.rect(10, 10, 190, 267);

  // Download the PDF
  const fileName = `${voucher.title.replace(/\s+/g, "_")}_${Date.now()}.pdf`;
  doc.save(fileName);

  return voucherCode;
};

// Add function to download all redeemed vouchers as a single PDF
export const generateAllVouchersPDF = (
  vouchers: Array<{
    title: string;
    description: string;
    points: number;
    quantity: number;
  }>,
  userEmail: string
) => {
  const doc = new jsPDF();

  vouchers.forEach((voucher, index) => {
    // Add new page for each voucher except the first one
    if (index > 0) {
      doc.addPage();
    }

    // Set up the PDF styling (same as single voucher)
    doc.setFontSize(20);
    doc.setTextColor(81, 45, 168); // Purple color #512da8
    doc.text("Optima Bank - Voucher", 20, 30);

    // Add voucher details (same layout as single voucher)
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text(`Voucher: ${voucher.title}`, 20, 50);

    doc.setFontSize(12);
    doc.text(`Description: ${voucher.description}`, 20, 70);
    doc.text(`Points Redeemed: ${voucher.points * voucher.quantity}`, 20, 85);
    doc.text(`Quantity: ${voucher.quantity}`, 20, 100);
    doc.text(`Redeemed by: ${userEmail}`, 20, 115);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, 130);

    // Add a voucher code (same format as single voucher)
    const voucherCode = `OB-${Date.now()}-${index}-${Math.random()
      .toString(36)
      .substr(2, 9)
      .toUpperCase()}`;
    doc.setFontSize(14);
    doc.setTextColor(81, 45, 168);
    doc.text(`Voucher Code: ${voucherCode}`, 20, 150);

    // Add terms and conditions (same as single voucher)
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text("Terms & Conditions:", 20, 170);
    doc.text(
      "- This voucher is valid for 6 months from the date of issue",
      20,
      180
    );
    doc.text("- This voucher cannot be exchanged for cash", 20, 190);
    doc.text("- Present this voucher at participating merchants", 20, 200);

    // Add a border (same as single voucher)
    doc.setDrawColor(81, 45, 168);
    doc.setLineWidth(2);
    doc.rect(10, 10, 190, 267);
  });

  // Download the PDF
  const fileName = `Voucher_Bundle_${Date.now()}.pdf`;
  doc.save(fileName);
};
