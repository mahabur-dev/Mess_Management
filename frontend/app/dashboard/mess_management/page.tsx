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
} from 'lucide-react'
import { useState } from 'react'

interface Mess {
  id: string
  name: string
  description?: string
  address?: string
  meal_rate: string
  currency: string
  is_active: boolean
  created_at: string
}

const initialMesses: Mess[] = [
  {
    id: '1',
    name: 'Green House Mess',
    description: 'A comfortable mess for students near the university campus.',
    address: '12 Baker Street, London, W1U 6TJ',
    meal_rate: '45.00',
    currency: 'GBP',
    is_active: true,
    created_at: '2024-01-15',
  },
  {
    id: '2',
    name: 'Blue Sky Hostel',
    description: 'Budget-friendly accommodation with daily meal service.',
    address: '7 Elm Road, Manchester, M1 2AB',
    meal_rate: '38.50',
    currency: 'GBP',
    is_active: true,
    created_at: '2024-02-20',
  },
  {
    id: '3',
    name: 'Sunrise Mess',
    meal_rate: '1200.00',
    currency: 'BDT',
    is_active: false,
    created_at: '2024-03-05',
  },
]

const emptyForm = {
  name: '',
  description: '',
  address: '',
  meal_rate: '',
  currency: 'BDT',
}

export default function MessManagementPage() {
  const [messes, setMesses] = useState<Mess[]>(initialMesses)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)

  const openAdd = () => {
    setEditingId(null)
    setForm(emptyForm)
    setModalOpen(true)
  }

  const openEdit = (mess: Mess) => {
    setEditingId(mess.id)
    setForm({
      name: mess.name,
      description: mess.description ?? '',
      address: mess.address ?? '',
      meal_rate: mess.meal_rate,
      currency: mess.currency,
    })
    setModalOpen(true)
  }

  const handleDelete = (id: string) => {
    setMesses((prev) => prev.filter((m) => m.id !== id))
  }

  const handleSubmit = () => {
    if (!form.name.trim() || !form.meal_rate) return
    if (editingId) {
      setMesses((prev) =>
        prev.map((m) =>
          m.id === editingId
            ? { ...m, ...form, meal_rate: parseFloat(form.meal_rate).toFixed(2) }
            : m
        )
      )
    } else {
      const newMess: Mess = {
        id: Date.now().toString(),
        ...form,
        meal_rate: parseFloat(form.meal_rate).toFixed(2),
        is_active: true,
        created_at: new Date().toISOString().split('T')[0],
      }
      setMesses((prev) => [...prev, newMess])
    }
    setModalOpen(false)
  }

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

          {/* Mess Cards Grid */}
          {messes.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground text-sm">
              No messes yet. Click "Add Mess" to create one.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {messes.map((mess) => (
                <Card key={mess.id} className="border-border overflow-hidden">
                  {/* Card Top */}
                  <div className="p-5 bg-gradient-to-br from-green-500/10 to-accent/10">
                    <span
                      className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full mb-3 ${
                        mess.is_active
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                      }`}
                    >
                      <CircleDot size={10} />
                      {mess.is_active ? 'Active' : 'Inactive'}
                    </span>
                    <h3 className="text-base font-semibold text-foreground mb-1">
                      {mess.name}
                    </h3>
                    {mess.description && (
                      <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                        {mess.description}
                      </p>
                    )}
                  </div>

                  {/* Card Body */}
                  <div className="px-5 py-4 space-y-2">
                    {mess.address && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin size={14} className="opacity-60 shrink-0" />
                        <span className="truncate">{mess.address}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Tag size={14} className="opacity-60 shrink-0" />
                      <span>
                        Meal rate:{' '}
                        <strong className="text-foreground">
                          {mess.currency} {parseFloat(mess.meal_rate).toFixed(2)}
                        </strong>
                      </span>
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div className="px-5 py-3 border-t border-border flex justify-end gap-2">
                    <Button variant="outline" size="sm" className="flex items-center gap-1 text-xs">
                      <Eye size={13} /> View
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-1 text-xs"
                      onClick={() => openEdit(mess)}
                    >
                      <Pencil size={13} /> Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-1 text-xs text-red-600 border-red-200 hover:bg-red-50 dark:hover:bg-red-900/20"
                      onClick={() => handleDelete(mess.id)}
                    >
                      <Trash2 size={13} /> Delete
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add / Edit Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit mess' : 'Add new mess'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-muted-foreground">Mess name *</label>
              <Input
                placeholder="e.g. Green House Mess"
                maxLength={100}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-muted-foreground">Description</label>
              <Textarea
                placeholder="Short description about the mess..."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-muted-foreground">Address</label>
              <Input
                placeholder="Full address"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-muted-foreground">Meal rate *</label>
                <Input
                  type="number"
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  value={form.meal_rate}
                  onChange={(e) => setForm({ ...form, meal_rate: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-muted-foreground">Currency</label>
                <select
                  className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                  value={form.currency}
                  onChange={(e) => setForm({ ...form, currency: e.target.value })}
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
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit}>Save mess</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}