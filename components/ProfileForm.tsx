'use client'

import { useState } from 'react'
import Image from 'next/image'
import { supabaseBrowser } from '../lib/supabase/client' // ✅ updated import

type Props = {
  userId: string
  initial: {
    username: string | null
    full_name: string | null
    email: string | null
    avatar_url: string | null
    totalpoints: number | null
  }
}

export default function ProfileForm({ userId, initial }: Props) {
  const [form, setForm] = useState({
    username: initial.username ?? '',
    full_name: initial.full_name ?? '',
    email: initial.email ?? '',
  })
  const [avatarUrl, setAvatarUrl] = useState<string | null>(initial.avatar_url)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target
    setForm((f) => ({ ...f, [name]: value }))
  }

  // Save profile
  async function onSave(e: React.FormEvent) {
    e.preventDefault()
    setMsg(null)
    setSaving(true)
    try {
      // Update email in Supabase Auth
      if (form.email && form.email !== (initial.email ?? '')) {
        const { error } = await supabaseBrowser().auth.updateUser({ email: form.email })
        if (error) throw error
      }

      // Upsert profile row in "profiles" table
      const { error: upsertErr } = await supabaseBrowser()
        .from('profiles')
        .upsert(
          {
            id: userId,
            username: form.username,
            full_name: form.full_name,
            email: form.email,
            avatar_url: avatarUrl ?? null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'id' }
        )
      if (upsertErr) throw upsertErr

      setMsg('✅ Profile saved successfully!')
    } catch (err: unknown) {
      setMsg(`❌ ${err instanceof Error ? err.message : 'An error occurred'}`)
    } finally {
      setSaving(false)
    }
  }

  // Upload avatar
  async function onAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setMsg(null)
    try {
      const ext = file.name.split('.').pop()
      const fileName = `${crypto.randomUUID()}.${ext}`
      const path = `${userId}/${fileName}`

      // Upload to "avatars" bucket
      const { error: uploadErr } = await supabaseBrowser()
        .storage
        .from('avatars')
        .upload(path, file, { upsert: true })
      if (uploadErr) throw uploadErr

      // Get public URL
      const { data } = supabaseBrowser().storage.from('avatars').getPublicUrl(path)
      const publicUrl = data.publicUrl

      setAvatarUrl(publicUrl)

      // Save new avatar_url in "profiles" table
      const { error: updErr } = await supabaseBrowser()
        .from('profiles')
        .update({ avatar_url: publicUrl, updated_at: new Date().toISOString() })
        .eq('id', userId)
      if (updErr) throw updErr

      setMsg('✅ Avatar updated!')
    } catch (err: unknown) {
      setMsg(`❌ ${err instanceof Error ? err.message : 'An error occurred'}`)
    } finally {
      setUploading(false)
    }
  }

  return (
    <form onSubmit={onSave} className="space-y-6">
      {/* Avatar */}
      <div className="flex flex-col items-center gap-3">
        <div className="relative h-24 w-24 rounded-full overflow-hidden border-4 border-gray-200 shadow">
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt="avatar"
              fill
              className="object-cover"
              unoptimized
            />
          ) : (
            <div className="h-full w-full grid place-items-center text-gray-400">
              No Image
            </div>
          )}
        </div>
        <label className="cursor-pointer text-sm font-medium text-blue-600 hover:underline">
          {uploading ? 'Uploading…' : 'Change Photo'}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={onAvatarChange}
            disabled={uploading}
          />
        </label>
      </div>

      {/* Username */}
      <div>
        <label className="block text-sm font-medium text-gray-700">Username</label>
        <input
          name="username"
          className="mt-1 block w-full rounded-lg border px-3 py-2"
          value={form.username}
          onChange={onChange}
          placeholder="Enter username"
        />
      </div>

      {/* Full Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700">Full Name</label>
        <input
          name="full_name"
          className="mt-1 block w-full rounded-lg border px-3 py-2"
          value={form.full_name}
          onChange={onChange}
          placeholder="Enter full name"
        />
      </div>

      {/* Email */}
      <div>
        <label className="block text-sm font-medium text-gray-700">Email</label>
        <input
          name="email"
          type="email"
          className="mt-1 block w-full rounded-lg border px-3 py-2"
          value={form.email}
          onChange={onChange}
          placeholder="Enter email"
        />
      </div>

      {/* Total Points */}
      <div>
        <label className="block text-sm font-medium text-gray-700">Total Points</label>
        <input
          className="mt-1 block w-full rounded-lg border bg-gray-100 px-3 py-2 text-gray-600"
          value={initial.totalpoints ?? 0}
          readOnly
        />
      </div>

      {/* Save Button */}
      <button
        type="submit"
        disabled={saving}
        className="w-full rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {saving ? 'Saving…' : 'Save Changes'}
      </button>

      {msg && <p className="text-center text-sm font-medium">{msg}</p>}
    </form>
  )
}