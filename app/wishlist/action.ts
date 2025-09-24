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

// Fetch all wishlist vouchers (alternative method)
export const fetchWishlistVouchers = async () => {
  const supabase = supabaseBrowser();
  
  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("wishlist")
    .select(`
      voucher:voucher_id (
        id,
        title,
        description,
        points,
        image,
        category_id,
        terms
      )
    `)
    .eq("user_id", user.id);

  if (error) {
    console.error("Error fetching wishlist vouchers:", error);
    return [];
  }

  // Return the voucher data from the nested relationship
  return data?.map((item: any) => item.voucher).filter(Boolean) || [];
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
        return { success: true, message: "Item added to cart (still in wishlist)" };
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