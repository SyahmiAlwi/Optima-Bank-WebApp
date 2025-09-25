"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import toast, { Toaster } from "react-hot-toast"
import { adjustUserPoints, createVoucher, listUsers, listVouchers, type VoucherRow } from "./actions"
import { GiTwoCoins } from "react-icons/gi"
import { supabaseBrowser } from "@/lib/supabase/client"

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
  const [tab, setTab] = useState<"users" | "vouchers">("users")

  // Users state
  const [q, setQ] = useState("")
  const [users, setUsers] = useState<UserRow[]>([])
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [deltas, setDeltas] = useState<Record<string, number>>({})
  const [reasons, setReasons] = useState<Record<string, string>>({})

  // Vouchers state
  const [vouchers, setVouchers] = useState<VoucherRow[]>([])
  const [loadingVouchers, setLoadingVouchers] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
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
      const inputEl = ev.currentTarget
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

  // Filter vouchers by selected category and search query
  const filteredVouchers = vouchers.filter(v => {
    const matchesCategory = !selectedCategory || v.category_id === selectedCategory
    const matchesSearch = !searchQuery.trim() || 
      (v.title?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
    return matchesCategory && matchesSearch
  })

  const categories = [
    { id: 1, name: 'Sport', icon: '⚽', color: 'bg-blue-500/20 text-blue-300' },
    { id: 2, name: 'Food', icon: '🍔', color: 'bg-orange-500/20 text-orange-300' },
    { id: 3, name: 'Entertainment', icon: '🎬', color: 'bg-pink-500/20 text-pink-300' }
  ]

  useEffect(() => {
    // load both lists on mount
    void loadUsers()
    void loadVouchers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const applyDelta = async (userId: string) => {
    const delta = Math.trunc(deltas[userId] ?? 0)
    const reason = (reasons[userId] ?? "").trim()
    if (!delta) {
      toast.error("Enter a non-zero delta")
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
          <div className="text-right">
            <p className="text-purple-200 text-sm">Welcome, admin!</p>
            <p className="text-white font-medium">Manage users and vouchers</p>
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
                tab === "users" ? "left-1 w-[calc(50%-0.25rem)]" : "left-[calc(50%+0.25rem)] w-[calc(50%-0.25rem)]"
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
                        <thead className="bg-blue-600">
                          <tr>
                            <th className="text-left px-4 py-3 font-semibold text-gray-100">Email</th>
                            <th className="text-left px-4 py-3 font-semibold text-gray-100">Points</th>
                            <th className="text-left px-4 py-3 font-semibold text-gray-100">Delta</th>
                            <th className="text-left px-4 py-3 font-semibold text-gray-100">Reason</th>
                            <th className="px-4 py-3" />
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
                                <input
                                  type="number"
                                  className="w-28 bg-gray-700 border border-gray-600 rounded-lg px-2 py-1 text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400"
                                  value={deltas[u.id] ?? 0}
                                  onChange={(e) => setDeltas((p) => ({ ...p, [u.id]: Number(e.target.value) }))}
                                />
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
                                  className="bg-white hover:bg-gray-100 text-gray-800 border-0 shadow-lg"
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
                {/* Compact Header with Search and Controls */}
                <div className="flex items-center justify-between mb-6 bg-gray-800/30 backdrop-blur rounded-lg p-4 border border-gray-700/50">
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

                  {/* Category Filter - Compact */}
                  <div className="flex items-center gap-2">
                    <span className="text-gray-300 text-sm">Filter:</span>
                    <div className="flex gap-1">
                      <button
                        onClick={() => setSelectedCategory(null)}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-300 hover:scale-105 hover:shadow-lg ${
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
                            className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-all duration-300 hover:scale-105 hover:shadow-lg group ${
                              selectedCategory === category.id
                                ? `${category.color} border border-current shadow-lg`
                                : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50 hover:shadow-gray-500/25'
                            }`}
                          >
                            <span className="text-sm transition-transform duration-300 group-hover:scale-110">{category.icon}</span>
                            <span className="transition-all duration-300 group-hover:tracking-wide">{category.name}</span>
                            <span className="text-xs opacity-75 transition-all duration-300 group-hover:opacity-100">({count})</span>
                          </button>
                        )
                      })}
                    </div>
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
                          {/* Stock Badge */}
                          <div className={`absolute top-1 right-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                            v.stock > 0 
                              ? 'bg-green-500/90 text-white' 
                              : 'bg-red-500/90 text-white'
                          }`}>
                            {v.stock > 0 ? `${v.stock}` : 'Out'}
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
                <input
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Title"
                  value={form.title}
                  onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                />
                <textarea
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Description (optional)"
                  value={form.description}
                  onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                />
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="number"
                    className="bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Points"
                    value={form.points}
                    min={0}
                    onChange={(e) => setForm((p) => ({ ...p, points: Number(e.target.value) }))}
                  />
                  <select
                    className="bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    value={form.category_id}
                    onChange={(e) => setForm((p) => ({ ...p, category_id: Number(e.target.value) as 1 | 2 | 3 }))}
                  >
                    <option value={1} className="bg-gray-800">Sport</option>
                    <option value={2} className="bg-gray-800">Food</option>
                    <option value={3} className="bg-gray-800">Entertainment</option>
                  </select>
                </div>
                <input
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Image filename (e.g., legoland.png)"
                  value={form.image}
                  onChange={(e) => setForm((p) => ({ ...p, image: e.target.value }))}
                />
                <div className="flex items-center gap-3">
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
                <input
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Terms (optional)"
                  value={form.terms ?? ""}
                  onChange={(e) => setForm((p) => ({ ...p, terms: e.target.value }))}
                />
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
                <button
                  onClick={closeEditModal}
                  className="text-gray-400 hover:text-white text-2xl"
                >
                  ×
                </button>
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
                    <option value={1} className="bg-gray-800">Sport</option>
                    <option value={2} className="bg-gray-800">Food</option>
                    <option value={3} className="bg-gray-800">Entertainment</option>
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
      </div>
    </div>
  )
}