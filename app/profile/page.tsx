// app/profile/page.tsx
import { redirect } from "next/navigation"
import { supabaseServer } from "../../lib/supabase/server"
import ProfileForm from "../../components/ProfileForm"
import Link from "next/link"
import { User, Coins } from "lucide-react"

// Local Navbar used only on this page (copies your purple bar)
function PurpleNavbar({ points = 0 }: { points?: number }) {
  return (
    <header className="w-full bg-[#5A33B6] text-white shadow">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        {/* Brand */}
        <Link href="/home" className="text-xl font-semibold">Optima Bank</Link>

        {/* Links */}
        <nav className="hidden gap-8 md:flex">
          <Link href="/home" className="font-medium text-[#FFD44D]">Home</Link>
          <Link href="/rewards" className="font-medium hover:text-[#FFD44D]">Rewards</Link>
          <Link href="/voucher" className="font-medium hover:text-[#FFD44D]">Voucher</Link>
          <Link href="/wishlist" className="font-medium hover:text-[#FFD44D]">Wishlist</Link>
          <Link href="/cart" className="font-medium hover:text-[#FFD44D]">Cart</Link>
        </nav>

        {/* Right cluster: points + user icon */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-1">
            <Coins className="h-4 w-4 text-[#FFD44D]" />
            <span className="text-sm font-semibold">{points}</span>
          </div>
          <Link
            href="/profile"
            aria-label="Open profile"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white text-[#5A33B6] hover:opacity-90"
          >
            <User className="h-5 w-5" />
          </Link>
        </div>
      </div>
    </header>
  )
}

export const dynamic = "force-dynamic"

export default async function ProfilePage() {
  const supabase = await supabaseServer()

  type ProfileRow = {
    username: string | null
    full_name: string | null
    email: string | null
    avatar_url: string | null
    totalpoints: number | null
    phone?: string | null
    about_me?: string | null
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/auth")

  // get profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("username, full_name, email, avatar_url, totalpoints, phone, about_me")
    .eq("id", user.id)
    .single()

  const typedProfile: ProfileRow | null = (profile as unknown) as ProfileRow | null

  return (
    <div className="min-h-screen bg-gray-50">
      <PurpleNavbar points={typedProfile?.totalpoints ?? 0} />

      <main className="mx-auto w-full max-w-7xl px-6 py-8">
        <h1 className="mb-6 text-2xl font-semibold text-gray-800">Your Profile</h1>

        <ProfileForm
          userId={user.id}
          initial={{
            username: typedProfile?.username ?? "",
            full_name: typedProfile?.full_name ?? "",
            email: typedProfile?.email ?? user.email ?? "",
            avatar_url: typedProfile?.avatar_url ?? null,
            totalpoints: typedProfile?.totalpoints ?? 0,
            // the next two are used by the wireframe
            // (add these columns if you don't have them yet)
            phone: typedProfile?.phone ?? "",
            
            about_me: typedProfile?.about_me ?? "",
          }}
        />
      </main>
    </div>
  )
}