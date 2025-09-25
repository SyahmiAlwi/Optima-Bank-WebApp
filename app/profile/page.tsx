// app/profile/page.tsx
import { redirect } from "next/navigation"
import { supabaseServer } from "../../lib/supabase/server"
import ProfileForm from "../../components/ProfileForm"
import { Navbar } from "../../components/ui/navbar"

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
      <Navbar user={{ id: user.id, totalpoints: typedProfile?.totalpoints ?? 0 }} />

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