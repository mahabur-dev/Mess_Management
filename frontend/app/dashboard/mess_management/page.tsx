// 'use client'

// import { DashboardHeader } from '@/components/dashboard-header'
// import { Card } from '@/components/ui/card'
// import { Button } from '@/components/ui/button'
// import { Input } from '@/components/ui/input'
// import { Textarea } from '@/components/ui/textarea'
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
// } from '@/components/ui/dialog'
// import {
//   MapPin,
//   Tag,
//   Plus,
//   Eye,
//   Pencil,
//   Trash2,
//   CircleDot,
// } from 'lucide-react'
// import { useState } from 'react'

// interface Mess {
//   id: string
//   name: string
//   description?: string
//   address?: string
//   meal_rate: string
//   currency: string
//   is_active: boolean
//   created_at: string
// }

// const initialMesses: Mess[] = [
//   {
//     id: '1',
//     name: 'Green House Mess',
//     description: 'A comfortable mess for students near the university campus.',
//     address: '12 Baker Street, London, W1U 6TJ',
//     meal_rate: '45.00',
//     currency: 'GBP',
//     is_active: true,
//     created_at: '2024-01-15',
//   },
//   {
//     id: '2',
//     name: 'Blue Sky Hostel',
//     description: 'Budget-friendly accommodation with daily meal service.',
//     address: '7 Elm Road, Manchester, M1 2AB',
//     meal_rate: '38.50',
//     currency: 'GBP',
//     is_active: true,
//     created_at: '2024-02-20',
//   },
//   {
//     id: '3',
//     name: 'Sunrise Mess',
//     meal_rate: '1200.00',
//     currency: 'BDT',
//     is_active: false,
//     created_at: '2024-03-05',
//   },
// ]

// const emptyForm = {
//   name: '',
//   description: '',
//   address: '',
//   meal_rate: '',
//   currency: 'BDT',
// }

// export default function MessManagementPage() {
//   const [messes, setMesses] = useState<Mess[]>(initialMesses)
//   const [modalOpen, setModalOpen] = useState(false)
//   const [editingId, setEditingId] = useState<string | null>(null)
//   const [form, setForm] = useState(emptyForm)

//   const openAdd = () => {
//     setEditingId(null)
//     setForm(emptyForm)
//     setModalOpen(true)
//   }

//   const openEdit = (mess: Mess) => {
//     setEditingId(mess.id)
//     setForm({
//       name: mess.name,
//       description: mess.description ?? '',
//       address: mess.address ?? '',
//       meal_rate: mess.meal_rate,
//       currency: mess.currency,
//     })
//     setModalOpen(true)
//   }

//   const handleDelete = (id: string) => {
//     setMesses((prev) => prev.filter((m) => m.id !== id))
//   }

//   const handleSubmit = () => {
//     if (!form.name.trim() || !form.meal_rate) return
//     if (editingId) {
//       setMesses((prev) =>
//         prev.map((m) =>
//           m.id === editingId
//             ? { ...m, ...form, meal_rate: parseFloat(form.meal_rate).toFixed(2) }
//             : m
//         )
//       )
//     } else {
//       const newMess: Mess = {
//         id: Date.now().toString(),
//         ...form,
//         meal_rate: parseFloat(form.meal_rate).toFixed(2),
//         is_active: true,
//         created_at: new Date().toISOString().split('T')[0],
//       }
//       setMesses((prev) => [...prev, newMess])
//     }
//     setModalOpen(false)
//   }

//   return (
//     <div className="flex flex-col min-h-screen">
//       <DashboardHeader
//         title="Mess Management"
//         description="Manage your messes, view details and settings"
//       />

//       <div className="flex-1 overflow-auto">
//         <div className="p-4 sm:p-6 lg:p-8 space-y-6">

//           {/* Top bar */}
//           <div className="flex items-center justify-between flex-wrap gap-3">
//             <h2 className="text-lg font-semibold text-foreground">Your Messes</h2>
//             <Button onClick={openAdd} className="flex items-center gap-2">
//               <Plus size={16} />
//               Add Mess
//             </Button>
//           </div>

//           {/* Mess Cards Grid */}
//           {messes.length === 0 ? (
//             <div className="text-center py-16 text-muted-foreground text-sm">
//               No messes yet. Click "Add Mess" to create one.
//             </div>
//           ) : (
//             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
//               {messes.map((mess) => (
//                 <Card key={mess.id} className="border-border overflow-hidden">
//                   {/* Card Top */}
//                   <div className="p-5 bg-gradient-to-br from-green-500/10 to-accent/10">
//                     <span
//                       className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full mb-3 ${
//                         mess.is_active
//                           ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
//                           : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
//                       }`}
//                     >
//                       <CircleDot size={10} />
//                       {mess.is_active ? 'Active' : 'Inactive'}
//                     </span>
//                     <h3 className="text-base font-semibold text-foreground mb-1">
//                       {mess.name}
//                     </h3>
//                     {mess.description && (
//                       <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
//                         {mess.description}
//                       </p>
//                     )}
//                   </div>

//                   {/* Card Body */}
//                   <div className="px-5 py-4 space-y-2">
//                     {mess.address && (
//                       <div className="flex items-center gap-2 text-sm text-muted-foreground">
//                         <MapPin size={14} className="opacity-60 shrink-0" />
//                         <span className="truncate">{mess.address}</span>
//                       </div>
//                     )}
//                     <div className="flex items-center gap-2 text-sm text-muted-foreground">
//                       <Tag size={14} className="opacity-60 shrink-0" />
//                       <span>
//                         Meal rate:{' '}
//                         <strong className="text-foreground">
//                           {mess.currency} {parseFloat(mess.meal_rate).toFixed(2)}
//                         </strong>
//                       </span>
//                     </div>
//                   </div>

//                   {/* Card Footer */}
//                   <div className="px-5 py-3 border-t border-border flex justify-end gap-2">
//                     <Button variant="outline" size="sm" className="flex items-center gap-1 text-xs">
//                       <Eye size={13} /> View
//                     </Button>
//                     <Button
//                       variant="outline"
//                       size="sm"
//                       className="flex items-center gap-1 text-xs"
//                       onClick={() => openEdit(mess)}
//                     >
//                       <Pencil size={13} /> Edit
//                     </Button>
//                     <Button
//                       variant="outline"
//                       size="sm"
//                       className="flex items-center gap-1 text-xs text-red-600 border-red-200 hover:bg-red-50 dark:hover:bg-red-900/20"
//                       onClick={() => handleDelete(mess.id)}
//                     >
//                       <Trash2 size={13} /> Delete
//                     </Button>
//                   </div>
//                 </Card>
//               ))}
//             </div>
//           )}
//         </div>
//       </div>

//       {/* Add / Edit Modal */}
//       <Dialog open={modalOpen} onOpenChange={setModalOpen}>
//         <DialogContent className="sm:max-w-md">
//           <DialogHeader>
//             <DialogTitle>{editingId ? 'Edit mess' : 'Add new mess'}</DialogTitle>
//           </DialogHeader>

//           <div className="space-y-4 py-2">
//             <div className="space-y-1.5">
//               <label className="text-sm font-medium text-muted-foreground">Mess name *</label>
//               <Input
//                 placeholder="e.g. Green House Mess"
//                 maxLength={100}
//                 value={form.name}
//                 onChange={(e) => setForm({ ...form, name: e.target.value })}
//               />
//             </div>

//             <div className="space-y-1.5">
//               <label className="text-sm font-medium text-muted-foreground">Description</label>
//               <Textarea
//                 placeholder="Short description about the mess..."
//                 value={form.description}
//                 onChange={(e) => setForm({ ...form, description: e.target.value })}
//               />
//             </div>

//             <div className="space-y-1.5">
//               <label className="text-sm font-medium text-muted-foreground">Address</label>
//               <Input
//                 placeholder="Full address"
//                 value={form.address}
//                 onChange={(e) => setForm({ ...form, address: e.target.value })}
//               />
//             </div>

//             <div className="grid grid-cols-2 gap-3">
//               <div className="space-y-1.5">
//                 <label className="text-sm font-medium text-muted-foreground">Meal rate *</label>
//                 <Input
//                   type="number"
//                   placeholder="0.00"
//                   step="0.01"
//                   min="0"
//                   value={form.meal_rate}
//                   onChange={(e) => setForm({ ...form, meal_rate: e.target.value })}
//                 />
//               </div>
//               <div className="space-y-1.5">
//                 <label className="text-sm font-medium text-muted-foreground">Currency</label>
//                 <select
//                   className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
//                   value={form.currency}
//                   onChange={(e) => setForm({ ...form, currency: e.target.value })}
//                 >
//                   <option value="BDT">BDT</option>
//                   <option value="GBP">GBP</option>
//                   <option value="USD">USD</option>
//                   <option value="EUR">EUR</option>
//                 </select>
//               </div>
//             </div>
//           </div>

//           <div className="flex justify-end gap-2 pt-2">
//             <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
//             <Button onClick={handleSubmit}>Save mess</Button>
//           </div>
//         </DialogContent>
//       </Dialog>
//     </div>
//   )
// }


'use client'

import { DashboardHeader } from '@/components/dashboard-header'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  MapPin,
  Tag,
  Plus,
  Eye,
  Pencil,
  Trash2,
  CircleDot,
  Loader2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react'
import { useState, useEffect, useCallback } from 'react'
import { useAuth, UserRole } from '@/app/context/auth-context'
import { apiClient, ApiError, type Mess, type CreateMessDto } from '@/lib/api-client'

// ─── Form state ───────────────────────────────────────────────────────────────
const emptyForm: CreateMessDto = {
  messName: '',
  description: '',
  messLocation: '',
  meal_rate: '',
  currency: 'BDT',
}

// ─── Reusable inline error banner ─────────────────────────────────────────────
function ErrorBanner({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
      <AlertCircle size={16} className="shrink-0" />
      <span className="flex-1">{message}</span>
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-1 text-xs underline underline-offset-2 hover:opacity-80"
        >
          <RefreshCw size={12} /> Retry
        </button>
      )}
    </div>
  )
}

// ─── Skeleton card for loading state ─────────────────────────────────────────
function SkeletonCard() {
  return (
    <Card className="overflow-hidden border-border">
      <div className="animate-pulse">
        <div className="p-5 bg-muted/30 space-y-3">
          <div className="h-5 w-16 rounded-full bg-muted" />
          <div className="h-4 w-3/4 rounded bg-muted" />
          <div className="h-3 w-full rounded bg-muted" />
        </div>
        <div className="px-5 py-4 space-y-2">
          <div className="h-3 w-2/3 rounded bg-muted" />
          <div className="h-3 w-1/2 rounded bg-muted" />
        </div>
        <div className="px-5 py-3 border-t border-border flex justify-end gap-2">
          <div className="h-8 w-14 rounded bg-muted" />
          <div className="h-8 w-14 rounded bg-muted" />
          <div className="h-8 w-16 rounded bg-muted" />
        </div>
      </div>
    </Card>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function MessManagementPage() {
  // List state
  const [messes, setMesses] = useState<Mess[]>([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)

  // Modal state
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<CreateMessDto>(emptyForm)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  // Delete state (tracks which id is being deleted)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [viewModalOpen, setViewModalOpen] = useState(false)
  const [viewLoading, setViewLoading] = useState(false)
  const [selectedMess, setSelectedMess] = useState<Mess | null>(null)
  const { user } = useAuth()

  const canEdit =
    user?.role === UserRole.ADMIN ||
    user?.role === UserRole.MANAGER ||
    user?.role === UserRole.ORGANIZER
  const canDelete =
    user?.role === UserRole.ADMIN ||
    user?.role === UserRole.MANAGER ||
    user?.role === UserRole.ORGANIZER

  // ─── Fetch all messes ───────────────────────────────────────────────────────
  const fetchMesses = useCallback(async () => {
    setLoading(true)
    setFetchError(null)
    try {
      const res = await apiClient.getMesses()
      const data = res.data
      setMesses(Array.isArray(data) ? data : data ? [data] : [])
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : 'Failed to load messes. Please try again.'
      setFetchError(message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchMesses()
  }, [fetchMesses])

  // ─── Open add modal ────────────────────────────────────────────────────────
  const openAdd = () => {
    setEditingId(null)
    setForm(emptyForm)
    setFormError(null)
    setModalOpen(true)
  }

  // ─── Open edit modal ───────────────────────────────────────────────────────
  const openEdit = (mess: Mess) => {
    setEditingId(mess.id)
    setForm({
      messName: mess.name,
      description: mess.description ?? '',
      messLocation: mess.address ?? '',
      meal_rate: mess.meal_rate,
      currency: mess.currency.toUpperCase(),
    })
    setFormError(null)
    setModalOpen(true)
  }

  const handleView = async (id: string) => {
    setViewLoading(true)
    setSelectedMess(null)
    setViewModalOpen(true)

    try {
      const res = await apiClient.getMess(id)
      setSelectedMess(res.data)
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : 'Failed to load mess details. Please try again.'
      setFormError(message)
      setViewModalOpen(false)
    } finally {
      setViewLoading(false)
    }
  }

  // ─── Delete a mess ─────────────────────────────────────────────────────────
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this mess?')) return
    setDeletingId(id)
    try {
      await apiClient.deleteMess(id)
      setMesses((prev) => {
        const list = Array.isArray(prev) ? prev : []
        return list.filter((m) => m.id !== id)
      })
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : 'Failed to delete mess. Please try again.'
      alert(message) // simple fallback; swap for a toast if you have one
    } finally {
      setDeletingId(null)
    }
  }

  // ─── Submit create / update ────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!form.messName.trim()) {
      setFormError('Mess name is required.')
      return
    }
    if (!form.meal_rate || isNaN(parseFloat(form.meal_rate))) {
      setFormError('A valid meal rate is required.')
      return
    }

    setSubmitting(true)
    setFormError(null)

    // Build payload — strip empty optional strings so backend gets undefined
    const payload: CreateMessDto = {
      messName: form.messName.trim(),
      messLocation: form.messLocation.trim(),
      meal_rate: parseFloat(form.meal_rate).toFixed(2),
      currency: form.currency,
      ...(form.description?.trim() && { description: form.description.trim() }),
    }

    try {
      if (editingId) {
        // ── UPDATE ──────────────────────────────────────────────────────────
        const res = await apiClient.updateMess(editingId, payload)
        setMesses((prev) => {
          const list = Array.isArray(prev) ? prev : []
          return list.map((m) => (m.id === editingId ? res.data : m))
        })
      } else {
        // ── CREATE ──────────────────────────────────────────────────────────
        const res = await apiClient.createMess(payload)
        setMesses((prev) => {
          const list = Array.isArray(prev) ? prev : []
          return [res.data, ...list]
        })
      }
      setModalOpen(false)
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : 'Something went wrong. Please try again.'
      setFormError(message)
    } finally {
      setSubmitting(false)
    }
  }

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col min-h-screen">
      <DashboardHeader
        title="Mess Management"
        description="Manage your messes, view details and settings"
      />

      <div className="flex-1 overflow-auto">
        <div className="p-4 sm:p-6 lg:p-8 space-y-6">

          {/* Top bar */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h2 className="text-lg font-semibold text-foreground">Your Messes</h2>
            <Button onClick={openAdd} className="flex items-center gap-2">
              <Plus size={16} />
              Add Mess
            </Button>
          </div>

          {/* Fetch error */}
          {fetchError && (
            <ErrorBanner message={fetchError} onRetry={fetchMesses} />
          )}

          {/* Loading skeletons */}
          {loading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => <SkeletonCard key={i} />)}
            </div>
          )}

          {/* Empty state */}
          {!loading && !fetchError && messes.length === 0 && (
            <div className="text-center py-16 text-muted-foreground text-sm">
              No messes yet. Click "Add Mess" to create one.
            </div>
          )}

          {/* Mess cards */}
          {!loading && messes.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {messes.map((mess) => (
                <Card 
                  key={mess.id} 
                  className="border-0 overflow-hidden bg-gradient-to-br from-slate-900 to-slate-800 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105"
                >
                  {/* Card header with brand accent */}
                  <div className="p-6 bg-gradient-to-r from-purple-600 to-purple-700">
                    <span
                      className={`inline-flex items-center gap-1 text-xs font-bold px-3 py-1 rounded-full mb-3 ${
                        mess.is_active
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      <CircleDot size={10} />
                      {mess.is_active ? 'Active' : 'Inactive'}
                    </span>
                    <h3 className="text-lg font-bold text-white mb-2 line-clamp-2">
                      {mess.name}
                    </h3>
                    {mess.description && (
                      <p className="text-sm text-purple-100 line-clamp-2">
                        {mess.description}
                      </p>
                    )}
                  </div>

                  {/* Card body */}
                  <div className="px-6 py-5 space-y-3">
                    {mess.address && (
                      <div className="flex items-start gap-3 pb-3 border-b border-slate-700">
                        <MapPin size={16} className="text-purple-400 shrink-0 mt-0.5" />
                        <span className="text-sm text-slate-300 truncate">{mess.address}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-3">
                      <Tag size={16} className="text-purple-400 shrink-0" />
                      <span className="text-sm text-slate-400">
                        Meal rate:{' '}
                        <span className="font-bold text-white">
                          {mess.currency.toUpperCase()} {parseFloat(mess.meal_rate).toFixed(2)}
                        </span>
                      </span>
                    </div>
                    
                    {/* Stats */}
                    {mess._count && (
                      <div className="grid grid-cols-3 gap-3 pt-3 border-t border-slate-700">
                        {[
                          { label: 'Members', value: mess._count.memberships, icon: '👥' },
                          { label: 'Deposits', value: mess._count.deposits, icon: '💰' },
                          { label: 'Meals', value: mess._count.meals, icon: '🍽️' },
                        ].map(({ label, value, icon }) => (
                          <div key={label} className="text-center p-2 bg-slate-700/50 rounded-lg">
                            <p className="text-lg font-bold text-white mb-1">{icon}</p>
                            <p className="text-lg font-bold text-white">{value}</p>
                            <p className="text-[10px] text-slate-400">{label}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Card footer */}
                  <div className="px-6 py-4 border-t border-slate-700 flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex-1 flex items-center justify-center gap-1 text-xs text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
                      onClick={() => handleView(mess.id)}
                    >
                      <Eye size={14} /> View
                    </Button>
                    {canEdit && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="flex-1 flex items-center justify-center gap-1 text-xs text-purple-400 hover:text-white hover:bg-purple-600/50 transition-colors"
                        onClick={() => openEdit(mess)}
                      >
                        <Pencil size={14} /> Edit
                      </Button>
                    )}
                    {canDelete && (
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={deletingId === mess.id}
                        className="flex-1 flex items-center justify-center gap-1 text-xs text-red-400 hover:text-white hover:bg-red-600/50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={() => handleDelete(mess.id)}
                      >
                        {deletingId === mess.id ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <Trash2 size={14} />
                        )}
                        Delete
                      </Button>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      <Dialog open={viewModalOpen} onOpenChange={(open) => {
        if (!open) {
          setSelectedMess(null)
          setViewModalOpen(false)
        }
      }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Mess details</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {viewLoading ? (
              <div className="space-y-3">
                <div className="h-5 w-32 rounded-full bg-muted" />
                <div className="h-4 w-full rounded bg-muted" />
                <div className="h-4 w-3/4 rounded bg-muted" />
              </div>
            ) : selectedMess ? (
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-semibold text-foreground">Name</p>
                  <p className="text-sm text-muted-foreground">{selectedMess.name}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Address</p>
                  <p className="text-sm text-muted-foreground">{selectedMess.address || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Description</p>
                  <p className="text-sm text-muted-foreground">{selectedMess.description || 'No description'}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-sm font-semibold text-foreground">Meal rate</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedMess.currency.toUpperCase()} {parseFloat(selectedMess.meal_rate).toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">Status</p>
                    <p className="text-sm text-muted-foreground">{selectedMess.is_active ? 'Active' : 'Inactive'}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Members</p>
                  <p className="text-sm text-muted-foreground">{selectedMess._count?.memberships ?? 0}</p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Unable to load mess details.</p>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => {
                setSelectedMess(null)
                setViewModalOpen(false)
              }}
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Add / Edit Modal ──────────────────────────────────────────────── */}
      <Dialog open={modalOpen} onOpenChange={(open) => !submitting && setModalOpen(open)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit mess' : 'Add new mess'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Form-level error */}
            {formError && <ErrorBanner message={formError} />}

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-muted-foreground">
                Mess name <span className="text-red-500">*</span>
              </label>
              <Input
                placeholder="e.g. Green House Mess"
                maxLength={100}
                value={form.messName}
                onChange={(e) => setForm({ ...form, messName: e.target.value })}
                disabled={submitting}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-muted-foreground">Description</label>
              <Textarea
                placeholder="Short description about the mess..."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                disabled={submitting}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-muted-foreground">Address</label>
              <Input
                placeholder="Full address"
                value={form.messLocation}
                onChange={(e) => setForm({ ...form, messLocation: e.target.value })}
                disabled={submitting}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-muted-foreground">
                  Meal rate <span className="text-red-500">*</span>
                </label>
                <Input
                  type="number"
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  value={form.meal_rate}
                  onChange={(e) => setForm({ ...form, meal_rate: e.target.value })}
                  disabled={submitting}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-muted-foreground">Currency</label>
                <select
                  className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm disabled:opacity-50"
                  value={form.currency}
                  onChange={(e) => setForm({ ...form, currency: e.target.value })}
                  disabled={submitting}
                >
                  <option value="BDT">BDT</option>
                  <option value="GBP">GBP</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => setModalOpen(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 size={14} className="animate-spin mr-2" />
                  {editingId ? 'Saving…' : 'Creating…'}
                </>
              ) : editingId ? (
                'Save changes'
              ) : (
                'Create mess'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}