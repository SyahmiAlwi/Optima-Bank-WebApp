// app/profile/page.tsx
import { redirect } from 'next/navigation'
import { supabaseServer } from '../../lib/supabase/server'
import ProfileForm from '../../components/ProfileForm'

export default async function ProfilePage() {
  // 🔑 supabaseServer is async → await it
  const supabase = await supabaseServer()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/auth') // redirect if not logged in

  const { data: profile } = await supabase
    .from('profiles')
    .select('username, full_name, email, avatar_url, totalpoints')
    .eq('id', user.id)
    .single()

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-2xl bg-white shadow-xl rounded-2xl p-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-6 border-b pb-4">
          Your Profile
        </h1>
        <ProfileForm
          userId={user.id}
          initial={{
            username: profile?.username ?? '',
            full_name: profile?.full_name ?? '',
            email: profile?.email ?? user.email ?? '',
            avatar_url: profile?.avatar_url ?? null,
            totalpoints: profile?.totalpoints ?? 0,
          }}
        />
      </div>
    </div>
  )
}