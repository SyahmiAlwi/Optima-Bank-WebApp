"use client";

import { supabaseBrowser } from "@/lib/supabase/client";
import jsPDF from "jspdf";

// Fetch current logged-in user and their profile (including total_points)
export const getUser = async () => {
  const supabase = supabaseBrowser();

  // Get user from auth
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    console.error("Error fetching user:", error);
    return null;
  }

  // Fetch user profile from 'profiles' table
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, email, totalpoints")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    console.error("Error fetching profile:", profileError);
    return null;
  }

  // Return the relevant profile info
  return {
    id: profile.id,
    email: profile.email,
    totalpoints: profile.totalpoints,
  };
};

// Fetch wishlist items for a user
export const fetchWishlistItems = async (userId: string) => {
  const supabase = supabaseBrowser();

  const { data, error } = await supabase
    .from("wishlist")
    .select(
      `
      id,
      voucher_id,
      created_at,
      voucher (
        id,
        title,
        description,
        points,
        image,
        category_id,
        terms
      )
    `
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching wishlist items:", error);
    return [];
  }
  return data || [];
};

// Fetch all wishlist vouchers (alternative method)
export const fetchWishlistVouchers = async () => {
  const supabase = supabaseBrowser();

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("wishlist")
    .select(
      `
      voucher:voucher_id (
        id,
        title,
        description,
        points,
        image,
        category_id,
        terms
      )
    `
    )
    .eq("user_id", user.id);

  if (error) {
    console.error("Error fetching wishlist vouchers:", error);
    return [];
  }

  // Return the voucher data from the nested relationship
  return (
    data
      ?.map((item: Record<string, unknown>) => item.voucher)
      .filter(Boolean) || []
  );
};

// Remove from wishlist functionality (by wishlist ID)
export const removeFromWishlist = async (userId: string, voucherId: number) => {
  const supabase = supabaseBrowser();

  const { error } = await supabase
    .from("wishlist")
    .delete()
    .eq("user_id", userId)
    .eq("voucher_id", voucherId);

  if (error) {
    console.error("Error removing from wishlist:", error);
    return { success: false, message: "Error removing from wishlist" };
  }

  return { success: true, message: "Item removed from wishlist" };
};

// Remove from wishlist by wishlist item ID (alternative method)
export const removeFromWishlistById = async (wishlistId: number) => {
  const supabase = supabaseBrowser();

  const { error } = await supabase
    .from("wishlist")
    .delete()
    .eq("id", wishlistId);

  if (error) {
    console.error("Error removing from wishlist:", error);
    return { success: false, message: "Error removing from wishlist" };
  }

  return { success: true, message: "Item removed from wishlist" };
};

// Add to wishlist functionality
export const addToWishlist = async (userId: string, voucherId: number) => {
  const supabase = supabaseBrowser();

  // Check if item already exists in wishlist
  const { data: existingItem, error: checkError } = await supabase
    .from("wishlist")
    .select("*")
    .eq("user_id", userId)
    .eq("voucher_id", voucherId)
    .single();

  if (checkError && checkError.code !== "PGRST116") {
    console.error("Error checking wishlist:", checkError);
    return { success: false, message: "Error checking wishlist" };
  }

  if (existingItem) {
    return { success: false, message: "Item already in wishlist" };
  }

  // Add new item to wishlist
  const { error: insertError } = await supabase.from("wishlist").insert({
    user_id: userId,
    voucher_id: voucherId,
  });

  if (insertError) {
    console.error("Error adding to wishlist:", insertError);
    return { success: false, message: "Error adding to wishlist" };
  }

  return { success: true, message: "Item added to wishlist" };
};

// Add to cart functionality
export const addToCart = async (userId: string, voucherId: number) => {
  const supabase = supabaseBrowser();

  // Check if item already exists in cart
  const { data: existingItem, error: checkError } = await supabase
    .from("cart")
    .select("*")
    .eq("user_id", userId)
    .eq("voucher_id", voucherId)
    .single();

  if (checkError && checkError.code !== "PGRST116") {
    console.error("Error checking cart:", checkError);
    return { success: false, message: "Error checking cart" };
  }

  if (existingItem) {
    // Update quantity if item exists
    const { error: updateError } = await supabase
      .from("cart")
      .update({ quantity: existingItem.quantity + 1 })
      .eq("id", existingItem.id);

    if (updateError) {
      console.error("Error updating cart:", updateError);
      return { success: false, message: "Error updating cart" };
    }
    return { success: true, message: "Item quantity updated in cart" };
  } else {
    // Add new item to cart
    const { error: insertError } = await supabase.from("cart").insert({
      user_id: userId,
      voucher_id: voucherId,
      quantity: 1,
    });

    if (insertError) {
      console.error("Error adding to cart:", insertError);
      return { success: false, message: "Error adding to cart" };
    }
    return { success: true, message: "Item added to cart" };
  }
};

// Redeem voucher functionality
export const redeemVoucher = async (
  userId: string,
  voucherId: number,
  points: number
) => {
  const supabase = supabaseBrowser();

  try {
    // Check current user points
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("totalpoints")
      .eq("id", userId)
      .single();

    if (profileError || !profile) {
      return { success: false, message: "Error fetching user profile" };
    }

    if (profile.totalpoints < points) {
      return {
        success: false,
        message: `Insufficient points! You need ${points} points but only have ${profile.totalpoints}.`,
      };
    }

    // Deduct points from user profile
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ totalpoints: profile.totalpoints - points })
      .eq("id", userId);

    if (updateError) {
      return { success: false, message: "Error updating user points" };
    }

    // Record the redemption (with error handling for missing table)
    const { error: redemptionError } = await supabase
      .from("redemptions")
      .insert({
        user_id: userId,
        voucher_id: voucherId,
        points_used: points,
        redeemed_at: new Date().toISOString(),
      });

    if (redemptionError) {
      console.error("Error recording redemption:", redemptionError);

      // Don't rollback if it's just a table not found error
      if (redemptionError.code !== "42P01") {
        // Rollback points if redemption recording fails for other reasons
        await supabase
          .from("profiles")
          .update({ totalpoints: profile.totalpoints })
          .eq("id", userId);

        return { success: false, message: "Error recording redemption" };
      }

      // Continue if redemptions table doesn't exist
      console.log("Redemptions table not found, continuing without recording");
    }

    return {
      success: true,
      message: "Voucher redeemed successfully!",
      newBalance: profile.totalpoints - points,
    };
  } catch (error) {
    console.error("Redeem error:", error);
    return { success: false, message: "An unexpected error occurred" };
  }
};

// Move item from wishlist to cart
export const moveToCart = async (userId: string, voucherId: number) => {
  const supabase = supabaseBrowser();

  try {
    // Add to cart
    const cartResult = await addToCart(userId, voucherId);

    if (cartResult.success) {
      // Remove from wishlist if successfully added to cart
      const wishlistResult = await removeFromWishlist(userId, voucherId);

      if (wishlistResult.success) {
        return { success: true, message: "Item moved to cart" };
      } else {
        // Item was added to cart but couldn't be removed from wishlist
        return {
          success: true,
          message: "Item added to cart (still in wishlist)",
        };
      }
    }

    return cartResult;
  } catch (error) {
    console.error("Error moving to cart:", error);
    return { success: false, message: "Error moving item to cart" };
  }
};

// Clear all wishlist items for a user
export const clearWishlist = async (userId: string) => {
  const supabase = supabaseBrowser();

  const { error } = await supabase
    .from("wishlist")
    .delete()
    .eq("user_id", userId);

  if (error) {
    console.error("Error clearing wishlist:", error);
    return { success: false, message: "Error clearing wishlist" };
  }

  return { success: true, message: "Wishlist cleared successfully" };
};

// Add function to generate and download voucher PDF
export const generateVoucherPDF = async (
  voucher: {
    title: string;
    description: string;
    points: number;
    quantity: number;
    image?: string;
  },
  userEmail: string
) => {
  const doc = new jsPDF();

  // Helper function to convert image to base64
  const imageToBase64 = (url: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        canvas.width = img.width;
        canvas.height = img.height;
        ctx?.drawImage(img, 0, 0);
        const dataURL = canvas.toDataURL("image/jpeg", 0.8);
        resolve(dataURL);
      };
      img.onerror = reject;
      img.src = url;
    });
  };

  try {
    // Set up the PDF styling first
    doc.setFontSize(22);
    doc.setTextColor(81, 45, 168);
    doc.text("Optima Bank - Voucher", 105, 25, { align: "center" });

    // Add voucher image if available
    if (voucher.image) {
      try {
        const imageData = await imageToBase64(voucher.image);
        // Add a subtle shadow effect
        doc.setFillColor(200, 200, 200);
        doc.rect(47, 37, 116, 62, "F");

        // Main image - slightly smaller to fit better
        doc.addImage(imageData, "JPEG", 45, 35, 120, 65);
      } catch (imageError) {
        console.warn("Could not load voucher image for PDF:", imageError);
      }
    }

    // Add voucher details with better spacing
    const contentStartY = voucher.image ? 110 : 45;

    doc.setFontSize(18);
    doc.setTextColor(81, 45, 168);
    doc.text(`${voucher.title}`, 105, contentStartY, { align: "center" });

    // Add separator line
    doc.setDrawColor(81, 45, 168);
    doc.setLineWidth(1);
    doc.line(25, contentStartY + 5, 185, contentStartY + 5);

    // Voucher details with consistent spacing
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.text(`Description: ${voucher.description}`, 25, contentStartY + 18);
    doc.text(
      `Points Redeemed: ${voucher.points * voucher.quantity}`,
      25,
      contentStartY + 30
    );
    doc.text(`Quantity: ${voucher.quantity}`, 25, contentStartY + 42);
    doc.text(`Redeemed by: ${userEmail}`, 25, contentStartY + 54);
    doc.text(
      `Date: ${new Date().toLocaleDateString()}`,
      25,
      contentStartY + 66
    );

    // Voucher code section - smaller and better positioned
    const voucherCode = `OB-${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 9)
      .toUpperCase()}`;

    // Voucher code background - smaller height
    doc.setFillColor(81, 45, 168);
    doc.rect(25, contentStartY + 80, 160, 18, "F");

    // Voucher code text
    doc.setFontSize(12);
    doc.setTextColor(255, 255, 255);
    doc.text(`Voucher Code: ${voucherCode}`, 105, contentStartY + 92, {
      align: "center",
    });

    // Terms and conditions - better positioned and sized
    const termsStartY = contentStartY + 110;

    // Background box for terms & conditions - fits within borders
    doc.setFillColor(248, 249, 250);
    doc.rect(25, termsStartY, 160, 45, "F");

    // Border for terms section
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(1);
    doc.rect(25, termsStartY, 160, 45);

    // Terms title
    doc.setFontSize(11);
    doc.setTextColor(81, 45, 168);
    doc.text("Terms & Conditions:", 30, termsStartY + 10);

    // Terms content with proper spacing
    const terms = [
      "This voucher is valid for 6 months from the date of issue",
      "This voucher cannot be exchanged for cash",
      "Present this voucher at participating merchants",
    ];

    doc.setFontSize(9);
    doc.setTextColor(60, 60, 60);

    terms.forEach((term, index) => {
      const yPosition = termsStartY + 22 + index * 10;
      doc.text("•", 30, yPosition);
      doc.text(term, 35, yPosition);
    });

    // Main border
    doc.setDrawColor(81, 45, 168);
    doc.setLineWidth(4);
    doc.rect(15, 15, 180, 257);

    // Download the PDF
    const fileName = `${voucher.title.replace(/\s+/g, "_")}_${Date.now()}.pdf`;
    doc.save(fileName);

    return voucherCode;
  } catch (error) {
    console.error("Error generating PDF:", error);
    throw error;
  }
};
