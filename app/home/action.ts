"use client";

import { supabaseBrowser } from "@/lib/supabase/client";

// Fetch current logged-in user and their profile (including total_points)
export const getUser = async () => {
  const supabase = supabaseBrowser();
  // Get user from auth
  const { data: { user }, error } = await supabase.auth.getUser();
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


// Add voucher to user's cart
export async function addToCart(userId: string, voucherId: number) {
  const supabase = supabaseBrowser();

  console.log("Attempting to add to cart:", { userId, voucherId });

  try {
    const { data, error } = await supabase
      .from("cart")
      .insert([{ user_id: userId, voucher_id: voucherId }]);

    if (error) {
      console.error("Supabase insert error:", error.message, error.details);
      return { success: false, error };
    }

    console.log("Added to cart:", data);
    return { success: true, data };
  } catch (err) {
    console.error("Unexpected error adding to cart:", err);
    return { success: false, error: err };
  }
}


// Sign out user
export const signOutUser = async () => {
  const supabase = supabaseBrowser();
  const { error } = await supabase.auth.signOut();
  if (error) console.error("Error signing out:", error);
};