"use client";

import { supabaseBrowser } from "@/lib/supabase/client";

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

// Remove from wishlist functionality
export const removeFromWishlist = async (wishlistId: number) => {
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

    // Record the redemption
    const { error: redemptionError } = await supabase
      .from("redemptions")
      .insert({
        user_id: userId,
        voucher_id: voucherId,
        points_used: points,
        redeemed_at: new Date().toISOString(),
      });

    if (redemptionError) {
      // Rollback points if redemption recording fails
      await supabase
        .from("profiles")
        .update({ totalpoints: profile.totalpoints })
        .eq("id", userId);

      return { success: false, message: "Error recording redemption" };
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
