"use server";

import { redirect } from "next/navigation";
import { supabaseServer } from "@/src/lib/supabase/server";

export async function requireAuth() {
  const supabase = await supabaseServer();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/auth");
  return data.user;
}


