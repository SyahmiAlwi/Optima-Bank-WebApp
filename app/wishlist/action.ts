"use client";

import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export async function getUser() {
  const supabase = createServerComponentClient({ cookies });
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("email, totalpoints")
    .eq("id", user.id)
    .single();

  return profile;
}

export async function fetchWishlistVouchers() {
  const supabase = createServerComponentClient({ cookies });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("wishlist")
    .select("vouchers(*)")
    .eq("user_id", user.id);

  if (error) {
    console.error(error);
    return [];
  }

  return data.map((item: any) => item.vouchers);
}

export async function removeFromWishlist(voucherId: number) {
  const supabase = createServerComponentClient({ cookies });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("wishlist")
    .delete()
    .eq("user_id", user.id)
    .eq("voucher_id", voucherId);
}
