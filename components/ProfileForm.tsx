"use client"

import { useState } from "react"
import Image from "next/image"
import { supabaseBrowser } from "../lib/supabase/client"

type Props = {
  userId: string
  initial: {
    username: string | null
    full_name: string | null
    email: string | null
    avatar_url: string | null
    totalpoints: number | null
    phone?: string | null         // wireframe fields
    about_me?: string | null
  }
}

export default function ProfileForm({ userId, initial }: Props) {
  const supabase = supabaseBrowser()

  const [editing, setEditing] = useState(true) // start editable; toggle if you prefer
  const [msg, setMsg] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)

  const [avatarUrl, setAvatarUrl] = useState<string | null>(initial.avatar_url)
  const [form, setForm] = useState({
    full_name: initial.full_name ?? "",
    email: initial.email ?? "",
    phone: initial.phone ?? "",
    about_me: initial.about_me ?? "",
  })

  function onChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    const { name, value } = e.target
    setForm((f) => ({ ...f, [name]: value }))
  }

  async function onSave(e: React.FormEvent) {
    e.preventDefault()
    if (!editing) {
      setEditing(true)
      return
    }

    setSaving(true)
    setMsg(null)
    try {
      // Update auth email if changed
      if (form.email && form.email !== (initial.email ?? "")) {
        const { error } = await supabase.auth.updateUser({ email: form.email })
        if (error) throw error
      }

      // Upsert profile (includes optional phone/about_me)
      const { error: upsertErr } = await supabase
        .from("profiles")
        .upsert(
          {
            id: userId,
            full_name: form.full_name,
            email: form.email,
            avatar_url: avatarUrl ?? null,
            phone: form.phone,          // make sure column exists
            about_me: form.about_me,    // make sure column exists
            updated_at: new Date().toISOString(),
          },
          { onConflict: "id" }
        )
      if (upsertErr) throw upsertErr

      setEditing(false)
      setMsg("✅ Saved")
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      setMsg(`❌ ${message}`)
    } finally {
      setSaving(false)
    }
  }

  async function onAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setMsg(null)
    try {
      const ext = file.name.split(".").pop()
      const fileName = `${crypto.randomUUID()}.${ext}`
      const path = `${userId}/${fileName}`

      const { error: uploadErr } = await supabase
        .storage
        .from("avatars")
        .upload(path, file, { upsert: true })
      if (uploadErr) throw uploadErr

      const { data } = supabase.storage.from("avatars").getPublicUrl(path)
      const publicUrl = data.publicUrl

      setAvatarUrl(publicUrl)

      await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl, updated_at: new Date().toISOString() })
        .eq("id", userId)
      setMsg("✅ Photo updated")
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      setMsg(`❌ ${message}`)
    } finally {
      setUploading(false)
    }
  }

  return (
    <form onSubmit={onSave} className="rounded-2xl bg-gray-100 p-6 sm:p-8">
      {/* TOP ROW: avatar | name/email/phone | points */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
        {/* Avatar (left) */}
        <div className="md:col-span-3">
          <div className="relative h-40 w-40 overflow-hidden rounded-md border bg-white">
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt="avatar"
                fill
                className="object-cover"
                unoptimized
              />
            ) : (
              <div className="grid h-full w-full place-items-center text-xs text-gray-400">
                No image
              </div>
            )}
          </div>
          <label className="mt-3 inline-block cursor-pointer text-sm font-medium text-indigo-600 hover:underline">
            {uploading ? "Uploading…" : "Change photo"}
            <input
              type="file"
              accept="image/*"
              onChange={onAvatarChange}
              className="hidden"
              disabled={uploading || !editing}
            />
          </label>
        </div>

        {/* Fields (center) */}
        <div className="md:col-span-7 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Name</label>
            <input
              name="full_name"
              className="mt-1 w-full rounded-md border bg-white px-3 py-2 shadow-sm disabled:bg-gray-100"
              value={form.full_name}
              onChange={onChange}
              disabled={!editing}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              name="email"
              type="email"
              className="mt-1 w-full rounded-md border bg-white px-3 py-2 shadow-sm disabled:bg-gray-100"
              value={form.email}
              onChange={onChange}
              disabled={!editing}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Phone No.</label>
            <input
              name="phone"
              className="mt-1 w-full rounded-md border bg-white px-3 py-2 shadow-sm disabled:bg-gray-100"
              value={form.phone}
              onChange={onChange}
              disabled={!editing}
            />
          </div>
        </div>

        {/* Points (right) */}
        <div className="md:col-span-2">
          <div className="flex h-10 items-center justify-center rounded-md bg-white px-3 text-sm font-semibold shadow-sm">
            Points: {initial.totalpoints ?? 0}
          </div>
        </div>
      </div>

      {/* About me + Save row */}
      <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-12">
        <div className="md:col-span-8">
          <label className="block text-sm font-medium text-gray-700">About me</label>
          <textarea
            name="about_me"
            rows={5}
            className="mt-1 w-full resize-none rounded-md border bg-white px-3 py-2 shadow-sm disabled:bg-gray-100"
            value={form.about_me}
            onChange={onChange}
            disabled={!editing}
          />
        </div>

        <div className="md:col-span-4 flex items-end">
          <button
            type="submit"
            disabled={saving}
            className="ml-auto inline-flex items-center rounded-md bg-gray-900 px-6 py-3 font-semibold text-white hover:bg-black disabled:opacity-50"
          >
            {editing ? (saving ? "Saving…" : "Save") : "Edit"}
          </button>
        </div>
      </div>

      {msg && <p className="mt-4 text-sm">{msg}</p>}
    </form>
  )
}
