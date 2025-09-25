"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import toast, { Toaster } from "react-hot-toast"
import { adjustUserPoints, createVoucher, listUsers, listVouchers, type VoucherRow, deleteVoucher, listCategories, createCategory, updateCategory, deleteCategory, type CategoryRow } from "./actions"
import { GiTwoCoins } from "react-icons/gi"
import { supabaseBrowser } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { LogOut, Trash2, Edit, Save, X } from "lucide-react"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"

type UserRow = { id: string; email: string; totalpoints: number; is_admin: boolean }

type VoucherForm = {
  title: string
  description?: string
  points: number
  category_id: 1 | 2 | 3
  image?: string
  terms?: string
  stock?: number
}

export default function AdminPage() {
  const router = useRouter()
  const [tab, setTab] = useState<"users" | "vouchers" | "categories">("users")

  // Users state
  const [q, setQ] = useState("")
  const [users, setUsers] = useState<UserRow[]>([])
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [deltas, setDeltas] = useState<Record<string, number>>({})
  const [reasons, setReasons] = useState<Record<string, string>>({})
  const [pointAdjustments, setPointAdjustments] = useState<Record<string, number>>({})
  const [editingPoints, setEditingPoints] = useState<Record<string, boolean>>({})
  const [tempPointValues, setTempPointValues] = useState<Record<string, number>>({})

  // Vouchers state
  const [vouchers, setVouchers] = useState<VoucherRow[]>([])
  const [loadingVouchers, setLoadingVouchers] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [showHiddenOnly, setShowHiddenOnly] = useState(false)
  const [categoriesDb, setCategoriesDb] = useState<CategoryRow[]>([])
  const [newCategoryName, setNewCategoryName] = useState("")
  const [editingCategory, setEditingCategory] = useState<number | null>(null)
  const [editingCategoryName, setEditingCategoryName] = useState("")
  const [confirmingDeleteCategory, setConfirmingDeleteCategory] = useState<number | null>(null)
  const [form, setForm] = useState<VoucherForm>({
    title: "",
    description: "",
    points: 0,
    category_id: 1,
    image: "",
  })

  // Edit voucher modal state
  const [editingVoucher, setEditingVoucher] = useState<VoucherRow | null>(null)
  const [editForm, setEditForm] = useState<VoucherForm>({
    title: "",
    description: "",
    points: 0,
    category_id: 1,
    image: "",
  })
  const [showEditModal, setShowEditModal] = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  
  // Create voucher modal state
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [isCreating, setIsCreating] = useState(false)

  const loadUsers = async () => {
    setLoadingUsers(true)
    try {
      const rows = await listUsers(q)
      setUsers(rows)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to load users"
      toast.error(msg)
    } finally {
      setLoadingUsers(false)
    }
  }

  const onImageSelect = async (ev: React.ChangeEvent<HTMLInputElement>) => {
    const file = ev.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file")
      return
    }
    setUploading(true)
    const supabase = supabaseBrowser()
    try {
      // Use existing bucket name: "voucher-images"
      const filePath = `${Date.now()}-${file.name}`
      const { error: upErr } = await supabase.storage.from("voucher-images").upload(filePath, file, {
        contentType: file.type,
        cacheControl: "3600",
        upsert: false,
      })
      if (upErr) throw upErr
      const { data } = supabase.storage.from("voucher-images").getPublicUrl(filePath)
      setForm((p) => ({ ...p, image: data.publicUrl }))
      toast.success("Image uploaded")
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Upload failed"
      toast.error(msg)
    } finally {
      setUploading(false)
      // Reset input so same file can be reselected
      try {
        (ev.currentTarget ?? (undefined as unknown as HTMLInputElement)).value = ""
      } catch {}
    }
  }

  const loadVouchers = async () => {
    setLoadingVouchers(true)
    try {
      const rows = await listVouchers()
      setVouchers(rows)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to load vouchers"
      toast.error(msg)
    } finally {
      setLoadingVouchers(false)
    }
  }

  const onSignOut = async () => {
    const supabase = supabaseBrowser()
    try {
      await supabase.auth.signOut()
    } finally {
      router.replace("/auth")
    }
  }

  // Filter vouchers by selected category and search query
  const filteredVouchers = vouchers.filter(v => {
    const matchesCategory = !selectedCategory || v.category_id === selectedCategory
    const matchesSearch = !searchQuery.trim() || 
      (v.title?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
    const matchesHidden = showHiddenOnly ? Boolean(v.is_hidden) : true
    return matchesCategory && matchesSearch && matchesHidden
  })

  const categories = (
    categoriesDb.length ? categoriesDb : [
      { id: 1, name: 'Sport' },
      { id: 2, name: 'Food' },
      { id: 3, name: 'Entertainment' }
    ]
  ).map((c) => ({
    ...c,
    icon: c.name === 'Sport' ? '⚽' : c.name === 'Food' ? '🍔' : '🎬',
    color: c.name === 'Sport' ? 'bg-blue-500/20 text-blue-300' : c.name === 'Food' ? 'bg-orange-500/20 text-orange-300' : 'bg-pink-500/20 text-pink-300'
  }))

  useEffect(() => {
    // load both lists on mount
    void loadUsers()
    void loadVouchers()
    // try loading categories from DB if table exists
    ;(async () => {
      try {
        const rows = await listCategories()
        setCategoriesDb(rows)
      } catch {
        // ignore if table not present
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const adjustPoints = (userId: string, change: number) => {
    setPointAdjustments(prev => ({
      ...prev,
      [userId]: (prev[userId] || 0) + change
    }))
  }

  const startEditingPoints = (userId: string, currentPoints: number) => {
    setEditingPoints(prev => ({ ...prev, [userId]: true }))
    setTempPointValues(prev => ({ ...prev, [userId]: currentPoints }))
  }

  const finishEditingPoints = (userId: string) => {
    const user = users.find(u => u.id === userId)
    if (user) {
      const newValue = tempPointValues[userId] || user.totalpoints
      const adjustment = newValue - user.totalpoints
      setPointAdjustments(prev => ({ ...prev, [userId]: adjustment }))
    }
    setEditingPoints(prev => ({ ...prev, [userId]: false }))
  }

  const cancelEditingPoints = (userId: string) => {
    setEditingPoints(prev => ({ ...prev, [userId]: false }))
    setTempPointValues(prev => ({ ...prev, [userId]: 0 }))
  }

  const applyDelta = async (userId: string) => {
    const delta = Math.trunc(pointAdjustments[userId] ?? 0)
    const reason = (reasons[userId] ?? "").trim()
    if (!delta) {
      toast.error("No points adjustment made")
      return
    }
    if (!reason) {
      toast.error("Reason is required")
      return
    }
    const tId = toast.loading("Updating points...")
    try {
      const res = await adjustUserPoints(userId, delta, reason)
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, totalpoints: res.newBalance } : u)))
      setPointAdjustments(prev => ({ ...prev, [userId]: 0 }))
      setReasons(prev => ({ ...prev, [userId]: "" }))
      toast.success("Points updated", { id: tId })
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to update points"
      toast.error(msg, { id: tId })
    }
  }

  const openCreateModal = () => {
    setForm({ title: "", description: "", points: 0, category_id: 1, image: "" })
    setShowCreateModal(true)
  }

  const closeCreateModal = () => {
    setShowCreateModal(false)
    setForm({ title: "", description: "", points: 0, category_id: 1, image: "" })
  }

  const submitVoucher = async () => {
    setIsCreating(true)
    const tId = toast.loading("Creating voucher...")
    try {
      await createVoucher(form)
      toast.success("Voucher created", { id: tId })
      closeCreateModal()
      loadVouchers()
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to create voucher"
      toast.error(msg, { id: tId })
    } finally {
      setIsCreating(false)
    }
  }

  const openEditModal = (voucher: VoucherRow) => {
    setEditingVoucher(voucher)
    setEditForm({
      title: voucher.title ?? "",
      description: voucher.description ?? "",
      points: voucher.points ?? 0,
      category_id: voucher.category_id as 1 | 2 | 3,
      image: voucher.image ?? "",
    })
    setShowEditModal(true)
  }

  const closeEditModal = () => {
    setShowEditModal(false)
    setEditingVoucher(null)
    setEditForm({ title: "", description: "", points: 0, category_id: 1, image: "" })
  }

  const updateVoucher = async () => {
    if (!editingVoucher) return
    
    const tId = toast.loading("Updating voucher...")
    try {
      // Update voucher in database
      const supabase = supabaseBrowser()
      const { error } = await supabase
        .from("voucher")
        .update({
          title: editForm.title,
          description: editForm.description,
          points: editForm.points,
          category_id: editForm.category_id,
          image: editForm.image,
          ...(typeof editingVoucher?.is_hidden === "boolean" ? { is_hidden: editingVoucher?.is_hidden } : {}),
        })
        .eq("id", editingVoucher.id)
      
      if (error) throw error
      
      toast.success("Voucher updated", { id: tId })
      closeEditModal()
      loadVouchers()
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to update voucher"
      toast.error(msg, { id: tId })
    }
  }

  const fireConfetti = () => {
    try {
      const doc = document
      const containerId = "confetti-mini-container"
      let container = doc.getElementById(containerId)
      if (!container) {
        container = doc.createElement("div")
        container.id = containerId
        container.style.position = "fixed"
        container.style.inset = "0px"
        container.style.pointerEvents = "none"
        container.style.zIndex = "9999"
        doc.body.appendChild(container)
        const style = doc.createElement("style")
        style.textContent = `@keyframes confetti-fall{0%{transform:translateY(-100vh) rotate(0)}100%{transform:translateY(0) rotate(720deg)}}`
        doc.head.appendChild(style)
      }
      const colors = ["#a78bfa","#f472b6","#34d399","#f59e0b","#60a5fa"]
      for (let i = 0; i < 60; i++) {
        const piece = doc.createElement("div")
        const size = 6 + Math.random() * 6
        piece.style.position = "absolute"
        piece.style.top = "-10px"
        piece.style.left = `${Math.random()*100}%`
        piece.style.width = `${size}px`
        piece.style.height = `${size*0.6}px`
        piece.style.background = colors[Math.floor(Math.random()*colors.length)]
        piece.style.opacity = "0.9"
        piece.style.transform = `translateY(-100vh) rotate(0deg)`
        piece.style.animation = `confetti-fall ${1.2 + Math.random()*0.8}s ease-out forwards`
        piece.style.borderRadius = "2px"
        container.appendChild(piece)
        setTimeout(() => piece.remove(), 2200)
      }
    } catch {}
  }

  const onConfirmDelete = async () => {
    if (!editingVoucher) return
    setDeleting(true)
    const tId = toast.loading("Deleting voucher...")
    try {
      await deleteVoucher(editingVoucher.id)
      toast.success("Voucher deleted", { id: tId })
      setConfirmingDelete(false)
      closeEditModal()
      fireConfetti()
      loadVouchers()
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to delete voucher"
      toast.error(msg, { id: tId })
    } finally {
      setDeleting(false)
    }
  }

  const startEditCategory = (category: CategoryRow) => {
    setEditingCategory(category.id)
    setEditingCategoryName(category.name)
  }

  const cancelEditCategory = () => {
    setEditingCategory(null)
    setEditingCategoryName("")
  }

  const saveEditCategory = async () => {
    if (!editingCategory) return
    const tId = toast.loading("Updating category...")
    try {
      await updateCategory(editingCategory, editingCategoryName)
      const rows = await listCategories()
      setCategoriesDb(rows)
      setEditingCategory(null)
      setEditingCategoryName("")
      toast.success("Category updated", { id: tId })
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to update category"
      toast.error(msg, { id: tId })
    }
  }

  const onConfirmDeleteCategory = async () => {
    if (!confirmingDeleteCategory) return
    const tId = toast.loading("Deleting category...")
    try {
      await deleteCategory(confirmingDeleteCategory)
      const rows = await listCategories()
      setCategoriesDb(rows)
      setConfirmingDeleteCategory(null)
      toast.success("Category deleted", { id: tId })
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to delete category"
      toast.error(msg, { id: tId })
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-black">
      <Toaster position="top-center" />

      {/* Header */}
      <header className="sticky top-0 z-10 bg-purple-900/90 backdrop-blur border-b border-purple-700/50">
        <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Optima Bank Logo */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  src="/logo-optima.jpg" 
                  alt="Optima Bank Logo" 
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Optima Bank</h1>
                <p className="text-purple-200 text-sm">Admin Console</p>
              </div>
            </div>
          </div>
          
          {/* Welcome Message */}
          <div className="flex items-center gap-6">
            <div className="text-right leading-tight">
              <p className="text-purple-200 text-sm">Welcome, admin!</p>
              <p className="text-white font-medium">Manage users and vouchers</p>
            </div>
            <Button
              onClick={onSignOut}
              className="bg-red-600 hover:bg-red-700 text-white border-0 h-9 w-9 rounded-md flex items-center justify-center shadow-sm"
              aria-label="Log out"
              title="Log out"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-6">
        {/* Tab Navigation - Centered */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex rounded-lg bg-purple-800/50 p-1 relative">
            {/* Animated Background Slider */}
            <div 
              className={`absolute top-1 bottom-1 rounded-md bg-purple-600 shadow-lg transition-all duration-300 ease-in-out ${
                tab === "users" 
                  ? "left-1 w-[calc(33.333%-0.25rem)]" 
                  : tab === "vouchers" 
                  ? "left-[calc(33.333%+0.25rem)] w-[calc(33.333%-0.25rem)]"
                  : "left-[calc(66.666%+0.25rem)] w-[calc(33.333%-0.25rem)]"
              }`}
            />
            <button
              className={`relative z-10 px-8 py-3 text-sm font-semibold rounded-md transition-all duration-300 ease-in-out flex items-center justify-center min-w-[100px] ${
                tab === "users" 
                  ? "text-white" 
                  : "text-purple-200 hover:text-white"
              }`}
              onClick={() => setTab("users")}
            >
              Users
            </button>
            <button
              className={`relative z-10 px-8 py-3 text-sm font-semibold rounded-md transition-all duration-300 ease-in-out flex items-center justify-center min-w-[100px] ${
                tab === "vouchers" 
                  ? "text-white" 
                  : "text-purple-200 hover:text-white"
              }`}
              onClick={() => setTab("vouchers")}
            >
              Vouchers
            </button>
            <button
              className={`relative z-10 px-8 py-3 text-sm font-semibold rounded-md transition-all duration-300 ease-in-out flex items-center justify-center min-w-[100px] ${
                tab === "categories" 
                  ? "text-white" 
                  : "text-purple-200 hover:text-white"
              }`}
              onClick={() => setTab("categories")}
            >
              Categories
            </button>
          </div>
        </div>

        {/* Content with Smooth Transitions */}
        <div className="relative">
          <div 
            className={`transition-all duration-500 ease-in-out ${
              tab === "users" 
                ? "opacity-100 translate-y-0" 
                : "opacity-0 translate-y-4 absolute inset-0 pointer-events-none"
            }`}
          >
            {tab === "users" && (
              <section className="space-y-6">
                <div className="flex flex-wrap items-center gap-3">
                  <input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Search by email"
                    className="w-full md:w-80 bg-purple-800/50 border border-purple-600/50 rounded-lg px-4 py-3 text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                  <Button 
                    onClick={loadUsers} 
                    className="shrink-0 bg-purple-600 hover:bg-purple-700 text-white border-0"
                  >
                    Refresh
                  </Button>
                </div>

                <div className="rounded-xl border border-gray-700 bg-gray-800/50 backdrop-blur shadow-xl overflow-hidden">
                  {loadingUsers ? (
                    <div className="p-6 text-sm text-gray-200 font-medium">Loading users…</div>
                  ) : users.length === 0 ? (
                    <div className="p-6 text-sm text-gray-200 font-medium">No users found.</div>
                  ) : (
                    <div className="overflow-auto">
                      <table className="min-w-full text-sm">
                        <thead className="bg-purple-700">
                          <tr>
                            <th className="text-center px-4 py-3 font-semibold text-gray-100">Email</th>
                            <th className="text-center px-4 py-3 font-semibold text-gray-100">Points</th>
                            <th className="text-center px-4 py-3 font-semibold text-gray-100">Adjust</th>
                            <th className="text-center px-4 py-3 font-semibold text-gray-100">Reason</th>
                            <th className="text-center px-4 py-3 font-semibold text-gray-100">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700">
                          {users.map((u) => (
                            <tr key={u.id} className="hover:bg-gray-700 transition-colors">
                              <td className="px-4 py-3 font-medium text-gray-100">{u.email}</td>
                              <td className="px-4 py-3 text-gray-200 flex items-center gap-1">
                                <GiTwoCoins className="text-yellow-400" /> {u.totalpoints}
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center bg-gray-700 rounded-lg border border-gray-600 overflow-hidden w-32">
                                  <button
                                    onClick={() => adjustPoints(u.id, -1)}
                                    className="bg-gray-600 hover:bg-gray-500 text-white px-3 py-2 transition-colors duration-200 flex items-center justify-center"
                                  >
                                    <span className="text-lg font-bold">−</span>
                                  </button>
                                  {editingPoints[u.id] ? (
                                    <div className="flex items-center px-2 py-1">
                                      <input
                                        type="text"
                                        value={tempPointValues[u.id] || u.totalpoints}
                                        onChange={(e) => {
                                          const value = e.target.value.replace(/[^0-9]/g, '')
                                          setTempPointValues(prev => ({ ...prev, [u.id]: Number(value) || 0 }))
                                        }}
                                        onBlur={() => finishEditingPoints(u.id)}
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter') {
                                            finishEditingPoints(u.id)
                                          } else if (e.key === 'Escape') {
                                            cancelEditingPoints(u.id)
                                          }
                                        }}
                                        className="w-full bg-gray-600 text-center font-semibold text-white focus:outline-none focus:ring-2 focus:ring-purple-400 rounded border-0"
                                        autoFocus
                                        style={{ 
                                          WebkitAppearance: 'none',
                                          MozAppearance: 'textfield'
                                        } as React.CSSProperties}
                                      />
                                    </div>
                                  ) : (
                                    <div 
                                      className={`px-4 py-2 min-w-[60px] text-center font-semibold cursor-pointer hover:bg-gray-600 transition-colors ${
                                        (pointAdjustments[u.id] || 0) > 0 ? 'text-green-400' :
                                        (pointAdjustments[u.id] || 0) < 0 ? 'text-red-400' :
                                        'text-gray-300'
                                      }`}
                                      onClick={() => startEditingPoints(u.id, u.totalpoints + (pointAdjustments[u.id] || 0))}
                                      onWheel={(e) => {
                                        e.preventDefault()
                                        const delta = e.deltaY > 0 ? -1 : 1
                                        adjustPoints(u.id, delta)
                                      }}
                                    >
                                      {u.totalpoints + (pointAdjustments[u.id] || 0)}
                                    </div>
                                  )}
                                  <button
                                    onClick={() => adjustPoints(u.id, 1)}
                                    className="bg-gray-600 hover:bg-gray-500 text-white px-3 py-2 transition-colors duration-200 flex items-center justify-center"
                                  >
                                    <span className="text-lg font-bold">+</span>
                                  </button>
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <input
                                  className="w-80 bg-gray-700 border border-gray-600 rounded-lg px-2 py-1 text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400"
                                  placeholder="Reason for adjustment (required)"
                                  value={reasons[u.id] ?? ""}
                                  onChange={(e) => setReasons((p) => ({ ...p, [u.id]: e.target.value }))}
                                />
                              </td>
                              <td className="px-4 py-3 text-right">
                                <Button 
                                  onClick={() => applyDelta(u.id)}
                                  disabled={!pointAdjustments[u.id] && !reasons[u.id]}
                                  className={`${
                                    pointAdjustments[u.id] && reasons[u.id]?.trim()
                                      ? 'bg-purple-600 hover:bg-purple-700 text-white'
                                      : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                                  } border-0 shadow-lg`}
                                >
                                  Apply
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </section>
            )}
          </div>
          
          <div 
            className={`transition-all duration-500 ease-in-out ${
              tab === "vouchers" 
                ? "opacity-100 translate-y-0" 
                : "opacity-0 translate-y-4 absolute inset-0 pointer-events-none"
            }`}
          >
            {tab === "vouchers" && (
              <section className="max-w-7xl mx-auto">
                {/* Search and Controls Header */}
                <div className="flex items-center justify-between mb-4 bg-gray-800/30 backdrop-blur rounded-lg p-4 border border-gray-700/50">
                  {/* Search Bar */}
                  <div className="relative w-80">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      placeholder="Search vouchers..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 text-sm"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery("")}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white transition-colors duration-200"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2">
                    <Button 
                      onClick={openCreateModal}
                      className="bg-purple-600 hover:bg-purple-700 text-white transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-purple-500/25 text-sm px-4 py-2 group"
                    >
                      <svg className="w-4 h-4 mr-1 transition-transform duration-300 group-hover:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      <span className="transition-all duration-300 group-hover:tracking-wide">Create</span>
                    </Button>
                    <Button 
                      onClick={loadVouchers} 
                      variant="outline"
                      className="border-gray-600 text-gray-200 hover:bg-gray-700 transition-all duration-300 hover:scale-105 p-2"
                      title="Refresh vouchers"
                    >
                      <svg className="w-4 h-4 transition-transform duration-300 hover:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    </Button>
                    <label className="flex items-center gap-2 text-sm text-gray-300 pl-2">
                      <input
                        type="checkbox"
                        checked={showHiddenOnly}
                        onChange={(e) => setShowHiddenOnly(e.target.checked)}
                      />
                      Show hidden only
                    </label>
                  </div>
                </div>

                {/* Category Filter - Standalone */}
                <div className="mb-6 bg-gray-800/20 backdrop-blur rounded-lg p-4 border border-gray-700/30">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-gray-300 text-sm font-medium">Filter by Category:</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setSelectedCategory(null)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 hover:scale-105 hover:shadow-lg ${
                        selectedCategory === null 
                          ? 'bg-purple-600 text-white shadow-purple-500/25' 
                          : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50 hover:shadow-gray-500/25'
                      }`}
                    >
                      <span className="transition-all duration-300">All ({vouchers.length})</span>
                    </button>
                    {categories.map((category) => {
                      const count = vouchers.filter(v => v.category_id === category.id).length
                      return (
                        <button
                          key={category.id}
                          onClick={() => setSelectedCategory(category.id)}
                          className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 hover:scale-105 hover:shadow-lg group ${
                            selectedCategory === category.id
                              ? `${category.color} border border-current shadow-lg`
                              : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50 hover:shadow-gray-500/25'
                          }`}
                        >
                          <span className="text-lg transition-transform duration-300 group-hover:scale-110">{category.icon}</span>
                          <span className="transition-all duration-300 group-hover:tracking-wide">{category.name}</span>
                          <span className="text-xs opacity-75 transition-all duration-300 group-hover:opacity-100 bg-black/20 px-1.5 py-0.5 rounded-full">({count})</span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {loadingVouchers ? (
                  <div className="p-8 text-center text-gray-200 font-medium">Loading vouchers…</div>
                ) : filteredVouchers.length === 0 ? (
                  <div className="p-8 text-center text-gray-200 font-medium">
                    {searchQuery.trim() 
                      ? `No vouchers found matching "${searchQuery}"`
                      : selectedCategory 
                        ? `No vouchers found in ${categories.find(c => c.id === selectedCategory)?.name} category`
                        : 'No vouchers found'
                    }
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {filteredVouchers.map((v, index) => (
                      <div 
                        key={v.id} 
                        className="group bg-gradient-to-br from-gray-800/60 to-gray-900/60 backdrop-blur-sm rounded-lg p-4 hover:from-purple-900/40 hover:to-purple-800/40 transition-all duration-500 border border-gray-600/50 hover:border-purple-500/50 hover:shadow-xl hover:shadow-purple-500/10 hover:-translate-y-2 hover:scale-105 cursor-pointer animate-in fade-in slide-in-from-bottom-4"
                        style={{ animationDelay: `${index * 100}ms` }}
                        onClick={() => openEditModal(v)}
                      >
                        {/* Image Section */}
                        <div className="relative mb-3">
                          {v.image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={v.image.startsWith("http") ? v.image : `/images/${v.image}`}
                              alt={v.title ?? "voucher"}
                              className="w-full h-24 rounded-lg object-cover border border-gray-600/50 group-hover:border-purple-500/50 transition-all duration-300"
                              onError={(e) => {
                                const img = e.currentTarget as HTMLImageElement
                                img.onerror = null
                                img.src = "/placeholder.jpg"
                              }}
                            />
                          ) : (
                            <div className="w-full h-24 rounded-lg bg-gradient-to-br from-gray-700 to-gray-800 border border-gray-600/50 flex items-center justify-center text-gray-400 text-sm group-hover:from-purple-800/50 group-hover:to-purple-900/50 transition-all duration-300">
                              <div className="text-center">
                                <div className="text-xl mb-1">📷</div>
                                <div className="text-xs">No Image</div>
                              </div>
                            </div>
                          )}
                        {/* Stock/Hidden Badge */}
                          <div className={`absolute top-1 right-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                            v.is_hidden ? 'bg-gray-500/90 text-white' : (v.stock > 0 
                              ? 'bg-green-500/90 text-white' 
                              : 'bg-red-500/90 text-white')
                          }`}>
                            {v.is_hidden ? 'Hidden' : (v.stock > 0 ? `${v.stock}` : 'Out')}
                          </div>
                        </div>

                        {/* Content Section */}
                        <div className="space-y-3">
                          {/* Title */}
                          <div className="h-10 flex items-start">
                            <h3 className="font-semibold text-white text-sm group-hover:text-purple-200 transition-colors duration-300 line-clamp-2 leading-tight">
                              {v.title ?? "Untitled"}
                            </h3>
                          </div>

                          {/* Category & Points */}
                          <div className="flex items-center justify-between">
                            <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                              v.category_id === 1 ? 'bg-blue-500/20 text-blue-300' :
                              v.category_id === 2 ? 'bg-orange-500/20 text-orange-300' :
                              'bg-pink-500/20 text-pink-300'
                            }`}>
                              {v.category_id === 1 ? 'Sport' : v.category_id === 2 ? 'Food' : 'Entertainment'}
                            </div>
                            <div className="flex items-center gap-1 text-yellow-400">
                              <GiTwoCoins className="text-sm" />
                              <span className="font-semibold text-sm">{v.points ?? 0}</span>
                            </div>
                          </div>

                          {/* View & Edit Button */}
                          <button 
                            onClick={() => openEditModal(v)}
                            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-3 rounded-lg transition-all duration-300 hover:shadow-lg hover:shadow-green-500/25 flex items-center justify-center gap-1 text-sm group-hover:scale-105 hover:scale-110 active:scale-95"
                          >
                            <svg className="w-3 h-3 transition-transform duration-300 group-hover:rotate-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            <span className="transition-all duration-300 group-hover:tracking-wide">Edit</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}
          </div>
          <div 
            className={`transition-all duration-500 ease-in-out ${
              tab === "categories" 
                ? "opacity-100 translate-y-0" 
                : "opacity-0 translate-y-4 absolute inset-0 pointer-events-none"
            }`}
          >
            {tab === "categories" && (
              <section className="max-w-3xl mx-auto">
                <div className="bg-gray-800/30 backdrop-blur rounded-lg p-4 border border-gray-700/50 mb-4 flex items-center gap-3">
                  <input
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="New category name"
                    className="flex-1 bg-gray-700/50 border border-gray-600/50 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                  />
                  <Button
                    onClick={async () => {
                      const name = newCategoryName.trim()
                      if (!name) { toast.error('Enter category name'); return }
                      const tId = toast.loading('Adding category...')
                      try {
                        await createCategory(name)
                        const rows = await listCategories()
                        setCategoriesDb(rows)
                        setNewCategoryName("")
                        toast.success('Category added', { id: tId })
                      } catch (e: unknown) {
                        const msg = e instanceof Error ? e.message : 'Failed to add category'
                        toast.error(msg, { id: tId })
                      }
                    }}
                    className="bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    Add
                  </Button>
                  <Button
                    onClick={async () => {
                      const tId = toast.loading('Refreshing...')
                      try {
                        const rows = await listCategories()
                        setCategoriesDb(rows)
                        toast.success('Categories refreshed', { id: tId })
                      } catch (e: unknown) {
                        const msg = e instanceof Error ? e.message : 'Failed to refresh'
                        toast.error(msg, { id: tId })
                      }
                    }}
                    variant="outline"
                    className="border-gray-600 text-gray-200"
                  >
                    Refresh
                  </Button>
                </div>
                <div className="rounded-xl border border-gray-700 bg-gray-800/50">
                  {categories.length === 0 ? (
                    <div className="p-6 text-gray-300 text-sm">No categories yet.</div>
                  ) : (
                    <ul className="divide-y divide-gray-700">
                      {categories.map((c) => (
                        <li key={c.id} className="flex items-center justify-between px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{c.icon}</span>
                            {editingCategory === c.id ? (
                              <input
                                value={editingCategoryName}
                                onChange={(e) => setEditingCategoryName(e.target.value)}
                                className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                                autoFocus
                              />
                            ) : (
                              <>
                                <span className="text-white font-medium">{c.name}</span>
                                <span className="text-xs text-gray-400">#{c.id}</span>
                              </>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {editingCategory === c.id ? (
                              <>
                                <Button
                                  onClick={saveEditCategory}
                                  size="sm"
                                  className="bg-green-600 hover:bg-green-700 text-white h-8 w-8 p-0"
                                >
                                  <Save className="h-4 w-4" />
                                </Button>
                                <Button
                                  onClick={cancelEditCategory}
                                  size="sm"
                                  variant="outline"
                                  className="border-gray-600 text-gray-200 hover:bg-gray-700 h-8 w-8 p-0"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </>
                            ) : (
                              <>
                                <Button
                                  onClick={() => startEditCategory(c)}
                                  size="sm"
                                  variant="outline"
                                  className="border-gray-600 text-gray-200 hover:bg-gray-700 h-8 w-8 p-0"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  onClick={() => setConfirmingDeleteCategory(c.id)}
                                  size="sm"
                                  className="bg-red-600 hover:bg-red-700 text-white h-8 w-8 p-0"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-3">Tip: Categories are used to group vouchers. Add as many as you need.</p>
              </section>
            )}
          </div>
        </div>

        {/* Create Voucher Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
            <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-white">Create New Voucher</h3>
                <button
                  onClick={closeCreateModal}
                  className="text-gray-400 hover:text-white text-2xl"
                >
                  ×
                </button>
              </div>
              
              <div className="space-y-4">
                <label className="block text-sm text-purple-200">Title</label>
                <input
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Title"
                  value={form.title}
                  onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                />
                <label className="block text-sm text-purple-200">Description</label>
                <textarea
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Description (optional)"
                  value={form.description}
                  onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                />
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-purple-200">Points</label>
                    <input
                    type="number"
                    className="bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Points"
                    value={form.points}
                    min={0}
                    onChange={(e) => setForm((p) => ({ ...p, points: Number(e.target.value) }))}
                  />
                  </div>
                  <div>
                    <label className="block text-sm text-purple-200">Category</label>
                    <select
                    className="bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    value={form.category_id}
                    onChange={(e) => setForm((p) => ({ ...p, category_id: Number(e.target.value) as 1 | 2 | 3 }))}
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id} className="bg-gray-800">{c.name}</option>
                    ))}
                  </select>
                  </div>
                </div>
                <label className="block text-sm text-purple-200">Image URL (optional)</label>
                <input
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Image filename (e.g., legoland.png)"
                  value={form.image}
                  onChange={(e) => setForm((p) => ({ ...p, image: e.target.value }))}
                />
                <div className="flex items-center gap-3">
                  <span className="text-sm text-purple-200">Upload image file</span>
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={onImageSelect} 
                    disabled={uploading}
                    className="text-gray-200"
                  />
                  {uploading && <span className="text-xs text-gray-300">Uploading…</span>}
                </div>
                {form.image && (
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-purple-200">Preview</span>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                      src={form.image.startsWith("http") ? form.image : `/images/${form.image}`} 
                      alt="preview" 
                      className="w-16 h-16 rounded object-cover border border-gray-600" 
                      onError={(e) => {
                        const img = e.currentTarget as HTMLImageElement
                        img.onerror = null
                        img.src = "/placeholder.jpg"
                      }}
                    />
                    <Button 
                      variant="outline" 
                      onClick={() => setForm((p) => ({ ...p, image: "" }))}
                      className="border-gray-600 text-gray-200 hover:bg-gray-700"
                    >
                      Remove
                    </Button>
                  </div>
                )}
                <label className="block text-sm text-purple-200">Terms (optional)</label>
                <input
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Terms (optional)"
                  value={form.terms ?? ""}
                  onChange={(e) => setForm((p) => ({ ...p, terms: e.target.value }))}
                />
                <label className="block text-sm text-purple-200">Stock (optional)</label>
                <input
                  type="number"
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Stock (optional)"
                  min={0}
                  value={Number.isFinite(form.stock as number) ? (form.stock as number) : 0}
                  onChange={(e) => setForm((p) => ({ ...p, stock: Number(e.target.value) }))}
                />
                <div className="flex gap-3 pt-4">
                  <Button 
                    onClick={submitVoucher}
                    disabled={isCreating}
                    className="flex-1 bg-purple-600 hover:bg-purple-700 text-white transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-purple-500/25 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isCreating ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <span>Creating...</span>
                      </div>
                    ) : (
                      <span className="transition-all duration-300 hover:tracking-wide">Create Voucher</span>
                    )}
                  </Button>
                  <Button 
                    onClick={closeCreateModal}
                    variant="outline"
                    className="border-gray-600 text-gray-200 hover:bg-gray-700 transition-all duration-300 hover:scale-105 active:scale-95"
                  >
                    <span className="transition-all duration-300 hover:tracking-wide">Cancel</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Voucher Modal */}
        {showEditModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
            <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-white">Edit Voucher</h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setConfirmingDelete(true)}
                    className="h-9 w-9 rounded-md bg-red-600 hover:bg-red-700 text-white flex items-center justify-center shadow"
                    title="Delete voucher"
                    aria-label="Delete voucher"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={closeEditModal}
                    className="text-gray-400 hover:text-white text-2xl"
                  >
                    ×
                  </button>
                </div>
              </div>
              
              <div className="space-y-4">
                <input
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Title"
                  value={editForm.title}
                  onChange={(e) => setEditForm((p) => ({ ...p, title: e.target.value }))}
                />
                <textarea
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Description"
                  value={editForm.description}
                  onChange={(e) => setEditForm((p) => ({ ...p, description: e.target.value }))}
                />
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="number"
                    className="bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Points"
                    value={editForm.points}
                    min={0}
                    onChange={(e) => setEditForm((p) => ({ ...p, points: Number(e.target.value) }))}
                  />
                  <select
                    className="bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    value={editForm.category_id}
                    onChange={(e) => setEditForm((p) => ({ ...p, category_id: Number(e.target.value) as 1 | 2 | 3 }))}
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id} className="bg-gray-800">{c.name}</option>
                    ))}
                  </select>
                </div>
                <input
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Image filename (e.g., legoland.png)"
                  value={editForm.image}
                  onChange={(e) => setEditForm((p) => ({ ...p, image: e.target.value }))}
                />
                {editForm.image && (
                  <div className="flex items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                      src={editForm.image.startsWith("http") ? editForm.image : `/images/${editForm.image}`} 
                      alt="preview" 
                      className="w-16 h-16 rounded object-cover border border-gray-600" 
                      onError={(e) => {
                        const img = e.currentTarget as HTMLImageElement
                        img.onerror = null
                        img.src = "/placeholder.jpg"
                      }}
                    />
                    <span className="text-gray-300 text-sm">Preview</span>
                  </div>
                )}
                {/* Hidden toggle for voucher */}
                {editingVoucher && (
                  <div className="flex items-center gap-2 pt-2">
                    <input
                      id="is-hidden-toggle"
                      type="checkbox"
                      checked={Boolean(editingVoucher?.is_hidden)}
                      onChange={(e) => {
                        const isHidden = e.target.checked
                        if (editingVoucher) {
                          setEditingVoucher({ ...(editingVoucher as VoucherRow), is_hidden: isHidden })
                        }
                      }}
                    />
                    <label htmlFor="is-hidden-toggle" className="text-sm text-gray-200">Hidden from users</label>
                  </div>
                )}
                <div className="flex gap-3 pt-4">
                  <Button 
                    onClick={updateVoucher}
                    className="flex-1 bg-purple-600 hover:bg-purple-700 text-white transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-purple-500/25 active:scale-95"
                  >
                    <span className="transition-all duration-300 hover:tracking-wide">Update Voucher</span>
                  </Button>
                  <Button 
                    onClick={closeEditModal}
                    variant="outline"
                    className="border-gray-600 text-gray-200 hover:bg-gray-700 transition-all duration-300 hover:scale-105 active:scale-95"
                  >
                    <span className="transition-all duration-300 hover:tracking-wide">Cancel</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
        {/* Delete confirmation dialog */}
        <AlertDialog open={confirmingDelete} onOpenChange={setConfirmingDelete}>
          <AlertDialogContent className="bg-gray-800 border-gray-700 text-white">
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this voucher?</AlertDialogTitle>
              <AlertDialogDescription className="text-gray-300">
                This action cannot be undone. The voucher will be permanently removed.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="border-gray-600 text-gray-200 hover:bg-gray-700">Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={onConfirmDelete}
                className="bg-red-600 hover:bg-red-700 text-white"
                disabled={deleting}
              >
                {deleting ? "Deleting..." : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Delete category confirmation dialog */}
        <AlertDialog open={!!confirmingDeleteCategory} onOpenChange={(open) => !open && setConfirmingDeleteCategory(null)}>
          <AlertDialogContent className="bg-gray-800 border-gray-700 text-white">
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this category?</AlertDialogTitle>
              <AlertDialogDescription className="text-gray-300">
                This action cannot be undone. The category will be permanently removed. Vouchers using this category will need to be reassigned.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="border-gray-600 text-gray-200 hover:bg-gray-700">Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={onConfirmDeleteCategory}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
}