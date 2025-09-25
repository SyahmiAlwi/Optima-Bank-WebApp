import { NextResponse } from "next/server"
import { supabaseServer } from "@/lib/supabase/server"

export async function POST(req: Request) {
  try {
    const { access_token, refresh_token } = await req.json()
    if (!access_token || !refresh_token) {
      return NextResponse.json({ error: "missing tokens" }, { status: 400 })
    }
    const supabase = await supabaseServer()
    const { error } = await supabase.auth.setSession({ access_token, refresh_token })
    if (error) return NextResponse.json({ error: error.message }, { status: 401 })
    // Touch getUser to force cookie write via @supabase/ssr cookie adapter
    await supabase.auth.getUser()
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: "server" }, { status: 500 })
  }
}


