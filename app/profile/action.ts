"use server";

import { supabaseServer } from "@/lib/supabase/server";

// Update profile (server action)
export async function updateProfile(userId: string, values: {
  full_name?: string;
  email?: string;
  phone?: string;
  about_me?: string;
  avatar_url?: string | null;
}) {
  const supabase = await supabaseServer();

  // Update email in Auth if changed
  if (values.email) {
    const { error: authErr } = await supabase.auth.updateUser({ email: values.email });
    if (authErr) throw new Error(authErr.message);
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: values.full_name,
      email: values.email,
      phone: values.phone,
      about_me: values.about_me,
      avatar_url: values.avatar_url,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);

  if (error) throw new Error(error.message);

  return { success: true };
}