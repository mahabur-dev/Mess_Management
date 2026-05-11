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


const emptyForm: CreateMessDto = {
  messName: '',
  description: '',
  messLocation: '',
  meal_rate: '',
  currency: 'BDT',
}

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

export default function MessManagementPage() {
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

  const openAdd = () => {
    setEditingId(null)
    setForm(emptyForm)
    setFormError(null)
    setModalOpen(true)
  }

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
      alert(message)
    } finally {
      setDeletingId(null)
    }
  }


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

          {!loading && messes.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {messes.map((mess) => (
                <Card
                  key={mess.id}
                  className="overflow-hidden border border-white/10 rounded-2xl shadow-xl"
                  style={{ background: 'linear-gradient(135deg, #0d1b2e 0%, #162035 50%, #1a2640 100%)' }}
                >
                  {/* Top: label + name + badge */}
                  <div className="p-[18px] pb-[14px] border-b border-white/[0.07]">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="text-[10px] font-bold tracking-[0.12em] uppercase text-white/35 mb-2">Mess</p>
                        <h3 className="text-[17px] font-semibold text-white leading-snug mb-1">
                          {mess.name}
                        </h3>
                        {mess.description && (
                          <p className="text-xs text-white/45 line-clamp-2">{mess.description}</p>
                        )}
                      </div>
                      <span
                        className={`shrink-0 ml-3 text-[11px] font-bold tracking-wide uppercase px-3 py-1 rounded-full ${mess.is_active
                            ? 'bg-[#00c97a] text-[#003d22]'
                            : 'bg-[#ff4d4d] text-[#3d0000]'
                          }`}
                      >
                        ● {mess.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>

                  {/* Address */}
                  {mess.address && (
                    <div className="flex items-start gap-2 px-[18px] py-3 border-b border-white/[0.07]">
                      <MapPin size={14} className="text-white/35 mt-0.5 shrink-0" />
                      <span className="text-xs text-white/50 leading-relaxed">{mess.address}</span>
                    </div>
                  )}

                  {/* Meal rate */}
                  <div className="flex items-center gap-2 px-[18px] py-3 border-b border-white/[0.07]">
                    <Tag size={14} className="text-white/35 shrink-0" />
                    <span className="text-xs text-white/45">Meal rate</span>
                    <span className="ml-auto text-sm font-bold text-white">
                      {mess.currency.toUpperCase()} {parseFloat(mess.meal_rate).toFixed(2)}
                    </span>
                  </div>

                  {/* Stats */}
                  {mess._count && (
                    <div className="grid grid-cols-3 divide-x divide-white/[0.07]">
                      {[
                        { label: 'Members', value: mess._count.memberships, icon: '👥' },
                        { label: 'Deposits', value: mess._count.deposits, icon: '💰' },
                        { label: 'Meals', value: mess._count.meals, icon: '🍽️' },
                      ].map(({ label, value, icon }) => (
                        <div key={label} className="text-center py-3 px-2">
                          <p className="text-base mb-1">{icon}</p>
                          <p className="text-[15px] font-bold text-white leading-none mb-1">{value}</p>
                          <p className="text-[10px] uppercase tracking-wide text-white/35">{label}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Footer buttons */}
                  <div className="flex border-t border-white/[0.07] divide-x divide-white/[0.07]">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex-1 flex items-center justify-center gap-1 text-xs text-white/50 hover:text-white hover:bg-white/5 rounded-none"
                      onClick={() => handleView(mess.id)}
                    >
                      <Eye size={13} /> View
                    </Button>
                    {canEdit && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="flex-1 flex items-center justify-center gap-1 text-xs text-violet-400 hover:text-violet-200 hover:bg-violet-500/15 rounded-none"
                        onClick={() => openEdit(mess)}
                      >
                        <Pencil size={13} /> Edit
                      </Button>
                    )}
                    {canDelete && (
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={deletingId === mess.id}
                        className="flex-1 flex items-center justify-center gap-1 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/12 rounded-none disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={() => handleDelete(mess.id)}
                      >
                        {deletingId === mess.id ? (
                          <Loader2 size={13} className="animate-spin" />
                        ) : (
                          <Trash2 size={13} />
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