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

// Add to cart functionality (with quantity support)
export const addToCart = async (
  userId: string,
  voucherId: number,
  quantity: number
) => {
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
    // Update quantity by adding selected amount
    const { error: updateError } = await supabase
      .from("cart")
      .update({ quantity: existingItem.quantity + quantity })
      .eq("id", existingItem.id);

    if (updateError) {
      console.error("Error updating cart:", updateError);
      return { success: false, message: "Error updating cart" };
    }
    return { success: true, message: "Item quantity updated in cart" };
  } else {
    // Add new item with selected quantity
    const { error: insertError } = await supabase.from("cart").insert({
      user_id: userId,
      voucher_id: voucherId,
      quantity: quantity,
    });

    if (insertError) {
      console.error("Error adding to cart:", insertError);
      return { success: false, message: "Error adding to cart" };
    }
    return { success: true, message: "Item added to cart" };
  }
};


// Add to wishlist functionality
export const addToWishlist = async (userId: string, voucherId: number) => {
  const supabase = supabaseBrowser();

  try {
    // Check if item already exists in wishlist
    const { data: existingItem, error: checkError } = await supabase
      .from("wishlist")
      .select("*")
      .eq("user_id", userId)
      .eq("voucher_id", voucherId)
      .single();

    // Handle the case where no record is found (PGRST116 is "not found" error)
    if (checkError && checkError.code !== "PGRST116") {
      console.error("Error checking wishlist:", checkError);
      return { success: false, message: "Error checking wishlist" };
    }

    if (existingItem) {
      return { success: false, message: "Item already in wishlist" };
    }

    // Add new item to wishlist
    const { data: insertData, error: insertError } = await supabase
      .from("wishlist")
      .insert({
        user_id: userId,
        voucher_id: voucherId,
      })
      .select(); // Add select to get the inserted data

    if (insertError) {
      console.error("Error adding to wishlist:", {
        error: insertError,
        message: insertError.message,
        code: insertError.code,
        details: insertError.details,
        hint: insertError.hint,
      });
      return {
        success: false,
        message: insertError.message || "Error adding to wishlist",
      };
    }

    console.log("Successfully added to wishlist:", insertData);
    return { success: true, message: "Item added to wishlist" };
  } catch (error) {
    console.error("Unexpected error in addToWishlist:", error);
    return { success: false, message: "An unexpected error occurred" };
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

// Sign out user
export const signOutUser = async () => {
  const supabase = supabaseBrowser();
  const { error } = await supabase.auth.signOut();
  if (error) console.error("Error signing out:", error);
};
