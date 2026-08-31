'use client'

import { DashboardHeader } from '@/components/dashboard-header'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Trash2, CheckCircle2, ShoppingCart, ListChecks, Users, Package, TrendingDown, CircleCheckBig } from 'lucide-react'
import { useState } from 'react'

const initialItems = [
  { id: 1, name: 'Rice (10kg)', quantity: 2, unit: 'bags', assignedTo: 'John', completed: false },
  { id: 2, name: 'Dal (2kg)', quantity: 3, unit: 'bags', assignedTo: 'Sarah', completed: true },
  { id: 3, name: 'Oil (1L)', quantity: 5, unit: 'bottles', assignedTo: 'Mike', completed: false },
  { id: 4, name: 'Salt (1kg)', quantity: 2, unit: 'packets', assignedTo: '', completed: false },
  { id: 5, name: 'Spices Mix', quantity: 1, unit: 'box', assignedTo: 'Emma', completed: true },
  { id: 6, name: 'Flour (5kg)', quantity: 3, unit: 'bags', assignedTo: '', completed: false },
]

export default function ShoppingPage() {
  const [items, setItems] = useState(initialItems)

  const toggleComplete = (id: number) => {
    setItems((prevItems) =>
      prevItems.map((item) => (item.id === id ? { ...item, completed: !item.completed } : item))
    )
  }

  const deleteItem = (id: number) => {
    setItems((prevItems) => prevItems.filter((item) => item.id !== id))
  }

  const completedCount = items.filter((item) => item.completed).length
  const progress = Math.round((completedCount / items.length) * 100)

  return (
    <div className="min-h-screen bg-[#fafcff]">
      <DashboardHeader
        title="Shopping"
        description="Manage shopping lists and track purchases"
      />

      <div className="p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#2f80ed]/15 to-[#58d68d]/15 shadow-sm">
              <ShoppingCart size={24} className="text-[#2f80ed]" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[#172554]">Shopping List</h2>
              <p className="mt-0.5 text-xs font-semibold text-[#6b7a99]">
                {completedCount} of {items.length} items completed
              </p>
            </div>
          </div>
          <Button className="h-[45px] gap-2 rounded-xl bg-gradient-to-r from-[#2f80ed] to-[#3b8cff] px-5 font-semibold text-white shadow-[0_8px_20px_rgba(47,128,237,0.25)] transition hover:shadow-[0_12px_28px_rgba(47,128,237,0.32)]">
            <Plus size={18} />
            Add Item
          </Button>
        </div>

        {/* Progress Card */}
        <div className="rounded-xl border border-[#e6ebf4] bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#2f80ed]/10 to-[#58d68d]/10">
                <TrendingDown size={16} className="text-[#2f80ed]" />
              </div>
              <p className="text-sm font-bold text-[#172554]">Overall Progress</p>
            </div>
            <span className="text-2xl font-semibold text-[#172554]">{progress}%</span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-[#e6ebf4]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#2f80ed] to-[#58d68d] transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Shopping Items Table - Desktop */}
        <div className="hidden lg:block overflow-hidden rounded-xl border border-[#e6ebf4] bg-white shadow-[0_8px_30px_rgba(65,103,153,0.08)]">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#e6ebf4] bg-[#f8faff]">
                  <th className="w-12 px-4 py-4"></th>
                  <th className="whitespace-nowrap px-4 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6b7a99]">Item</th>
                  <th className="whitespace-nowrap px-4 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6b7a99]">Quantity</th>
                  <th className="whitespace-nowrap px-4 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6b7a99]">Assigned To</th>
                  <th className="whitespace-nowrap px-4 py-4 text-center text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6b7a99]">Status</th>
                  <th className="whitespace-nowrap px-4 py-4 text-right text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6b7a99]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e6ebf4]">
                {items.map((item) => (
                  <tr
                    key={item.id}
                    className={`transition hover:bg-[#f8faff] group ${
                      item.completed ? 'opacity-60' : ''
                    }`}
                  >
                    <td className="px-4 py-4">
                      <button
                        onClick={() => toggleComplete(item.id)}
                        className={`flex h-7 w-7 items-center justify-center rounded-lg border transition ${
                          item.completed
                            ? 'border-emerald-500/40 bg-emerald-50 text-emerald-600'
                            : 'border-[#d8e6f8] text-transparent hover:border-emerald-400/60 hover:bg-emerald-50/50 hover:text-emerald-400'
                        }`}
                      >
                        <CheckCircle2 size={16} />
                      </button>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`text-sm font-bold text-[#172554] ${item.completed ? 'line-through text-[#6b7a99]' : ''}`}>
                        {item.name}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="inline-flex items-center rounded-lg border border-[#d8e6f8] bg-[#edf5ff] px-2.5 py-1 text-xs font-bold text-[#2f80ed]">
                        <Package size={12} className="mr-1" />
                        {item.quantity} {item.unit}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      {item.assignedTo ? (
                        <div className="flex items-center gap-2">
                          <div
                            className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-[#2f80ed] to-[#58d68d] text-[10px] font-semibold text-white shadow-sm"
                          >
                            {item.assignedTo[0].toUpperCase()}
                          </div>
                          <span className="text-sm font-semibold text-[#6b7a99]">{item.assignedTo}</span>
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-lg border border-amber-200/60 bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-700">
                          Unassigned
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex justify-center">
                        <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-bold ${
                          item.completed
                            ? 'border-emerald-200/60 bg-emerald-50 text-emerald-700'
                            : 'border-slate-200 bg-slate-50 text-slate-500'
                        }`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${item.completed ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                          {item.completed ? 'Done' : 'Pending'}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex justify-end">
                        <button
                          onClick={() => deleteItem(item.id)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#ff4d4f]/15 bg-[#fff0f0] text-[#ff4d4f] opacity-0 transition hover:border-[#ff4d4f]/40 hover:bg-[#ffe5e5] group-hover:opacity-100"
                          title="Delete item"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {items.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16">
              <ShoppingCart size={48} className="mb-3 text-[#d8e6f8]" />
              <p className="text-sm font-bold text-[#6b7a99]">No items in the list</p>
              <p className="mt-1 text-xs font-semibold text-[#8a9bb5]">Click "Add Item" to get started</p>
            </div>
          )}
        </div>

        {/* Shopping Items - Mobile/Tablet Cards */}
        <div className="space-y-3 lg:hidden">
          {items.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12">
              <ShoppingCart size={40} className="mb-2 text-[#d8e6f8]" />
              <p className="text-sm font-bold text-[#6b7a99]">No items in the list</p>
              <p className="mt-1 text-xs font-semibold text-[#8a9bb5]">Click "Add Item" to get started</p>
            </div>
          )}
          {items.map((item) => (
            <div
              key={item.id}
              className="rounded-xl border border-[#e6ebf4] bg-white p-4 shadow-sm transition hover:border-[#a9ccfb] hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    onClick={() => toggleComplete(item.id)}
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition ${
                      item.completed
                        ? 'border-emerald-500/40 bg-emerald-50 text-emerald-600'
                        : 'border-[#d8e6f8] text-transparent hover:border-emerald-400/60 hover:bg-emerald-50/50 hover:text-emerald-400'
                    }`}
                  >
                    <CheckCircle2 size={16} />
                  </button>
                  <div className="min-w-0">
                    <p className={`truncate text-sm font-bold text-[#172554] ${item.completed ? 'line-through text-[#6b7a99]' : ''}`}>
                      {item.name}
                    </p>
                    <p className="text-xs font-semibold text-[#6b7a99]">
                      {item.quantity} {item.unit}
                    </p>
                  </div>
                </div>
                <span className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-bold ${
                  item.completed
                    ? 'border-emerald-200/60 bg-emerald-50 text-emerald-700'
                    : 'border-slate-200 bg-slate-50 text-slate-500'
                }`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${item.completed ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                  {item.completed ? 'Done' : 'Pending'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  {item.assignedTo ? (
                    <div className="flex items-center gap-2">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-[#2f80ed] to-[#58d68d] text-[9px] font-semibold text-white shadow-sm">
                        {item.assignedTo[0].toUpperCase()}
                      </div>
                      <span className="text-xs font-semibold text-[#6b7a99]">{item.assignedTo}</span>
                    </div>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-lg border border-amber-200/60 bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                      Unassigned
                    </span>
                  )}
                </div>
                <button
                  onClick={() => deleteItem(item.id)}
                  className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#ff4d4f]/15 bg-[#fff0f0] text-[#ff4d4f] transition hover:border-[#ff4d4f]/40 hover:bg-[#ffe5e5]"
                  title="Delete item"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl border border-[#e6ebf4] bg-white p-4 shadow-sm">
            <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-[#6b7a99]">
              <ShoppingCart size={13} className="text-[#2f80ed]" />
              Total Items
            </p>
            <p className="mt-1.5 text-2xl font-semibold text-[#172554]">{items.length}</p>
          </div>
          <div className="rounded-xl border border-emerald-200/60 bg-emerald-50/50 p-4 shadow-sm">
            <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
              <CircleCheckBig size={13} />
              Completed
            </p>
            <p className="mt-1.5 text-2xl font-semibold text-emerald-700">{completedCount}</p>
          </div>
          <div className="rounded-xl border border-amber-200/60 bg-amber-50/50 p-4 shadow-sm">
            <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700">
              <ListChecks size={13} />
              Pending
            </p>
            <p className="mt-1.5 text-2xl font-semibold text-amber-700">{items.length - completedCount}</p>
          </div>
          <div className="rounded-xl border border-[#e6ebf4] bg-white p-4 shadow-sm">
            <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-[#6b7a99]">
              <Users size={13} className="text-[#58d68d]" />
              Assigned
            </p>
            <p className="mt-1.5 text-2xl font-semibold text-[#172554]">{items.filter((i) => i.assignedTo).length}</p>
          </div>
        </div>
      </div>
    </div>
  )
}