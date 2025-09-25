"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabaseBrowser } from "@/lib/supabase/client"

export default function AdminGate({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [allowed, setAllowed] = useState(false)
  const [checking, setChecking] = useState(true)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const run = async () => {
      try {
        const supabase = supabaseBrowser()
        const { data: auth } = await supabase.auth.getUser()
        const uid = auth.user?.id
        if (!uid) {
          router.replace("/auth")
          return
        }
        const { data: prof } = await supabase
          .from("profiles")
          .select("is_admin")
          .eq("id", uid)
          .single()
        if (prof?.is_admin) {
          setAllowed(true)
        } else {
          router.replace("/")
          return
        }
      } finally {
        setChecking(false)
      }
    }
    run()
  }, [router])

  // After we know we're allowed, wait briefly to ensure cookies are fully persisted for server actions
  useEffect(() => {
    if (allowed) {
      const t = setTimeout(() => setReady(true), 250)
      return () => clearTimeout(t)
    }
  }, [allowed])

  if (checking || (allowed && !ready)) {
    return (
      <div className="h-svh flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#512da8]" />
      </div>
    )
  }

  if (!allowed) return null

  return <>{children}</>
}


