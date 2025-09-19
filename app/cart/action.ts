"use client";

import { supabaseBrowser } from "@/lib/supabase/client";

// // Fetch current logged-in user
// export const getUser = async () => {
//   const supabase = supabaseBrowser();
//   const { data: { user }, error } = await supabase.auth.getUser();
//   if (error) {
//     console.error("Error fetching user:", error);
//   }
//   return user;
// };

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

export async function getUser() {
  const { data: user, error } = await supabaseBrowser()
    .from("profiles")
    .select("id, email, totalpoints")
    .single();

  if (error) {
    console.error("Error fetching user:", error);
    return null;
  }
  return user; // Must include totalpoints
}




// Sign out user
export const signOutUser = async () => {
  const supabase = supabaseBrowser();
  const { error } = await supabase.auth.signOut();
  if (error) console.error("Error signing out:", error);
};
