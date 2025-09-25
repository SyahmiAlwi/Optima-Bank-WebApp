"use server"

import { cookies } from "next/headers"
import { createServerClient } from "@supabase/ssr"

type Profile = {
  id: string
  email: string | null
  totalpoints: number | null
  is_admin: boolean | null
}

function getEnv(name: string): string {
  const v = process.env[name]
  if (!v) throw new Error(`${name} is not set`)
  return v
}

export async function supabaseServer() {
  const cookieStore = await cookies()
  return createServerClient(
    getEnv("NEXT_PUBLIC_SUPABASE_URL"),
    getEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options)
          })
        },
      },
    },
  )
}

export async function requireAdmin() {
  const supabase = await supabaseServer()
  const { data: auth, error: authErr } = await supabase.auth.getUser()
  if (authErr || !auth.user) {
    console.error("requireAdmin auth error:", authErr)
    throw new Error("Unauthorized: sign in required")
  }
  const { data: profile, error: profErr } = await supabase
    .from("profiles")
    .select("id,email,totalpoints,is_admin")
    .eq("id", auth.user.id)
    .single<Profile>()
  if (profErr) {
    console.error("requireAdmin profile error:", profErr)
    throw profErr
  }
  if (!profile?.is_admin) {
    console.error("requireAdmin forbidden: not admin", { userId: auth.user.id })
    throw new Error("Forbidden: admin only")
  }
  return { supabase, admin: profile }
}

export async function listUsers(q?: string) {
  try {
    const supabase = await supabaseServer()
    let query = supabase
      .from("profiles")
      .select("id,email,totalpoints,is_admin")
      .limit(200)
      .order("email", { ascending: true })

    if (q && q.trim()) {
      query = query.ilike("email", `%${q.trim()}%`)
    }
    const { data, error } = await query
    if (error) throw error
    return (data ?? []).map((p) => ({
      id: p.id,
      email: p.email ?? "",
      totalpoints: p.totalpoints ?? 0,
      is_admin: Boolean(p.is_admin),
    }))
  } catch (e) {
    console.error("listUsers failed:", e)
    throw e
  }
}

export async function adjustUserPoints(userId: string, delta: number, reason: string) {
  if (!userId) throw new Error("userId required")
  if (!Number.isInteger(delta) || delta === 0) throw new Error("delta must be a non-zero integer")
  if (!reason || !reason.trim()) throw new Error("reason required")

  // Ensure caller is an authenticated admin and get server client bound to their cookies
  const { supabase, admin } = await requireAdmin()

  // Fetch current balance
  const { data: prof, error: profErr } = await supabase
    .from("profiles")
    .select("id,totalpoints")
    .eq("id", userId)
    .single<{ id: string; totalpoints: number | null }>()
  if (profErr) throw profErr
  const current = prof?.totalpoints ?? 0
  const next = Math.max(0, current + delta)

  // Update points
  const { error: updErr } = await supabase
    .from("profiles")
    .update({ totalpoints: next })
    .eq("id", userId)
  if (updErr) throw updErr

  // Record audit trail
  const { error: auditErr } = await supabase.from("points_audit").insert({
    user_id: userId,
    delta,
    reason: reason.trim(),
    admin_id: admin.id,
  })
  if (auditErr) throw auditErr

  return { ok: true as const, newBalance: next }
}

export type VoucherRow = {
  id: number
  title: string | null
  description: string | null
  points: number | null
  category_id: number
  image: string | null
  terms: string | null
  stock: number
  is_hidden?: boolean | null
}

export async function listVouchers(): Promise<VoucherRow[]> {
  const supabase = await supabaseServer()
  const { data, error } = await supabase
    .from("voucher")
    // Select all columns so this keeps working whether or not is_hidden exists yet
    .select("*")
    .order("id", { ascending: false })
  if (error) throw error
  return (data ?? []) as VoucherRow[]
}

export async function createVoucher(v: {
  title: string
  description?: string
  points: number
  category_id: number
  image?: string
  terms?: string
  stock?: number
  is_hidden?: boolean
}) {
  const supabase = await supabaseServer()
  if (!v.title || !v.title.trim()) throw new Error("Title is required")
  if (!Number.isFinite(v.points) || v.points < 0) throw new Error("Points must be >= 0")
  // Allow any numeric category_id as per existing table

  const payload = {
    title: v.title.trim(),
    description: v.description?.trim() ?? null,
    points: Number(v.points),
    category_id: v.category_id,
    image: v.image?.trim() || null,
    terms: v.terms?.trim() ?? null,
    stock: typeof v.stock === "number" && v.stock >= 0 ? Math.floor(v.stock) : 0,
    // Only send is_hidden if defined to avoid errors on older schemas
    ...(typeof v.is_hidden === "boolean" ? { is_hidden: v.is_hidden } : {}),
  }

  const { error } = await supabase.from("voucher").insert(payload)
  if (error) throw error
  return { ok: true as const }
}

export async function deleteVoucher(id: number) {
  if (!Number.isFinite(id)) throw new Error("Voucher id is required")
  const supabase = await supabaseServer()
  const { error } = await supabase.from("voucher").delete().eq("id", id)
  if (error) throw error
  return { ok: true as const }
}

export type CategoryRow = {
  id: number
  name: string
}

export async function listCategories(): Promise<CategoryRow[]> {
  const supabase = await supabaseServer()
  const { data, error } = await supabase.from("voucher_cat").select("id,category").order("id", { ascending: true })
  if (error) throw error
  return (data ?? []).map(row => ({ id: row.id, name: row.category })) as CategoryRow[]
}

export async function createCategory(name: string) {
  if (!name || !name.trim()) throw new Error("Category name is required")
  const supabase = await supabaseServer()
  const { error } = await supabase.from("voucher_cat").insert({ category: name.trim() })
  if (error) throw error
  return { ok: true as const }
}

export async function updateCategory(id: number, name: string) {
  if (!Number.isFinite(id)) throw new Error("Category id is required")
  if (!name || !name.trim()) throw new Error("Category name is required")
  const supabase = await supabaseServer()
  const { error } = await supabase.from("voucher_cat").update({ category: name.trim() }).eq("id", id)
  if (error) throw error
  return { ok: true as const }
}

export async function deleteCategory(id: number) {
  if (!Number.isFinite(id)) throw new Error("Category id is required")
  const supabase = await supabaseServer()
  const { error } = await supabase.from("voucher_cat").delete().eq("id", id)
  if (error) throw error
  return { ok: true as const }
}


