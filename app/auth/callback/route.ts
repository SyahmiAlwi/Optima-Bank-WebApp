import { NextResponse, type NextRequest } from "next/server"
import { supabaseServer } from "@/lib/supabase/server"

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const code = url.searchParams.get("code")
  const next = url.searchParams.get("next")

  if (!code) {
    return NextResponse.redirect(new URL("/auth", req.url))
  }

  try {
    const supabase = await supabaseServer()
    // Use full URL; Supabase can parse verifier/params as needed
    const { error } = await supabase.auth.exchangeCodeForSession(req.url)
    if (error) {
      return NextResponse.redirect(new URL("/auth?error=oauth", req.url))
    }

    // Decide destination (admin or home)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.redirect(new URL("/auth?error=no-user", req.url))
    }

    let dest = next ?? "/home"
    try {
      const { data: prof } = await supabase
        .from("profiles")
        .select("is_admin")
        .eq("id", user.id)
        .single()
      if (prof?.is_admin) dest = "/admin"
    } catch {}

    return NextResponse.redirect(new URL(dest, req.url))
  } catch {
    return NextResponse.redirect(new URL("/auth?error=server", req.url))
  }
}