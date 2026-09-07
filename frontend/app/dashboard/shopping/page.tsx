'use client'

import { DashboardHeader } from '@/components/dashboard-header'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { EnterpriseTableActionCell, EnterpriseTableActionHeader } from '@/components/ui/enterprise-table-actions'
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
    <div className="min-h-screen bg-background">
      <DashboardHeader
        title="Shopping"
        description="Manage shopping lists and track purchases"
      />

      <div className="p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl r bg-primary/10  ">
              <ShoppingCart size={24} className="text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Shopping List</h2>
              <p className="mt-0.5 text-xs font-semibold text-muted-foreground">
                {completedCount} of {items.length} items completed
              </p>
            </div>
          </div>
          <Button className="h-[45px] gap-2 rounded-xl  bg-primary  px-5 font-semibold text-primary-foreground  transition ">
            <Plus size={18} />
            Add Item
          </Button>
        </div>

        {/* Progress Card */}
        <div className="rounded-xl border border-border bg-background p-5 ">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg r bg-primary/10 ">
                <TrendingDown size={16} className="text-primary" />
              </div>
              <p className="text-sm font-bold text-foreground">Overall Progress</p>
            </div>
            <span className="text-2xl font-semibold text-foreground">{progress}%</span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full  bg-primary  transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Shopping Items Table - Desktop */}
        <div className="dashboard-table-frame hidden lg:block">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted">
                  <th className="w-12 px-4 py-4"></th>
                  <th className="whitespace-nowrap px-4 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Item</th>
                  <th className="whitespace-nowrap px-4 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Quantity</th>
                  <th className="whitespace-nowrap px-4 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Assigned To</th>
                  <th className="whitespace-nowrap px-4 py-4 text-center text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Status</th>
                  <EnterpriseTableActionHeader size="compact" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {items.map((item) => (
                  <tr
                    key={item.id}
                    className={`transition hover:bg-muted group ${
                      item.completed ? 'opacity-60' : ''
                    }`}
                  >
                    <td className="px-4 py-4">
                      <button
                        onClick={() => toggleComplete(item.id)}
                        className={`flex h-7 w-7 items-center justify-center rounded-lg border transition ${
                          item.completed
                            ? 'border-primary/40 bg-primary/10 text-primary'
                            : 'border-border text-transparent hover:border-primary/30 hover:bg-primary/10 hover:text-primary'
                        }`}
                      >
                        <CheckCircle2 size={16} />
                      </button>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`text-sm font-bold text-foreground ${item.completed ? 'line-through text-muted-foreground' : ''}`}>
                        {item.name}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="inline-flex items-center rounded-lg border border-border bg-muted px-2.5 py-1 text-xs font-bold text-primary">
                        <Package size={12} className="mr-1" />
                        {item.quantity} {item.unit}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      {item.assignedTo ? (
                        <div className="flex items-center gap-2">
                          <div
                            className="flex h-7 w-7 items-center justify-center rounded-full r bg-primary  text-[10px] font-semibold text-primary-foreground "
                          >
                            {item.assignedTo[0].toUpperCase()}
                          </div>
                          <span className="text-sm font-semibold text-muted-foreground">{item.assignedTo}</span>
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-lg border border-primary/30 bg-primary/10 px-2.5 py-1 text-[11px] font-bold text-primary">
                          Unassigned
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex justify-center">
                        <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-bold ${
                          item.completed
                            ? 'border-primary/30 bg-primary/10 text-primary'
                            : 'border-border bg-muted text-muted-foreground'
                        }`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${item.completed ? 'bg-primary/100' : 'bg-muted'}`} />
                          {item.completed ? 'Done' : 'Pending'}
                        </span>
                      </div>
                    </td>
                    <EnterpriseTableActionCell size="compact">
                        <button
                          onClick={() => deleteItem(item.id)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-destructive/30 bg-destructive/10 text-destructive opacity-0 transition hover:border-destructive/30 hover:bg-destructive/10 group-hover:opacity-100"
                          title="Delete item"
                        >
                          <Trash2 size={14} />
                        </button>
                    </EnterpriseTableActionCell>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {items.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16">
              <ShoppingCart size={48} className="mb-3 text-muted-foreground" />
              <p className="text-sm font-bold text-muted-foreground">No items in the list</p>
              <p className="mt-1 text-xs font-semibold text-muted-foreground">Click &quot;Add Item&quot; to get started</p>
            </div>
          )}
        </div>

        {/* Shopping Items - Mobile/Tablet Cards */}
        <div className="space-y-3 lg:hidden">
          {items.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12">
              <ShoppingCart size={40} className="mb-2 text-muted-foreground" />
              <p className="text-sm font-bold text-muted-foreground">No items in the list</p>
              <p className="mt-1 text-xs font-semibold text-muted-foreground">Click &quot;Add Item&quot; to get started</p>
            </div>
          )}
          {items.map((item) => (
            <div
              key={item.id}
              className="rounded-xl border border-border bg-background p-4  transition hover:border-primary "
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    onClick={() => toggleComplete(item.id)}
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition ${
                      item.completed
                        ? 'border-primary/40 bg-primary/10 text-primary'
                        : 'border-border text-transparent hover:border-primary/30 hover:bg-primary/10 hover:text-primary'
                    }`}
                  >
                    <CheckCircle2 size={16} />
                  </button>
                  <div className="min-w-0">
                    <p className={`truncate text-sm font-bold text-foreground ${item.completed ? 'line-through text-muted-foreground' : ''}`}>
                      {item.name}
                    </p>
                    <p className="text-xs font-semibold text-muted-foreground">
                      {item.quantity} {item.unit}
                    </p>
                  </div>
                </div>
                <span className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-bold ${
                  item.completed
                    ? 'border-primary/30 bg-primary/10 text-primary'
                    : 'border-border bg-muted text-muted-foreground'
                }`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${item.completed ? 'bg-primary/100' : 'bg-muted'}`} />
                  {item.completed ? 'Done' : 'Pending'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  {item.assignedTo ? (
                    <div className="flex items-center gap-2">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full r bg-primary  text-[9px] font-semibold text-primary-foreground ">
                        {item.assignedTo[0].toUpperCase()}
                      </div>
                      <span className="text-xs font-semibold text-muted-foreground">{item.assignedTo}</span>
                    </div>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-lg border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                      Unassigned
                    </span>
                  )}
                </div>
                <button
                  onClick={() => deleteItem(item.id)}
                  className="flex h-7 w-7 items-center justify-center rounded-lg border border-destructive/30 bg-destructive/10 text-destructive transition hover:border-destructive/30 hover:bg-destructive/10"
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
          <div className="rounded-xl border border-border bg-background p-4 ">
            <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              <ShoppingCart size={13} className="text-primary" />
              Total Items
            </p>
            <p className="mt-1.5 text-2xl font-semibold text-foreground">{items.length}</p>
          </div>
          <div className="rounded-xl border border-primary/30 bg-primary/10 p-4 ">
            <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
              <CircleCheckBig size={13} />
              Completed
            </p>
            <p className="mt-1.5 text-2xl font-semibold text-primary">{completedCount}</p>
          </div>
          <div className="rounded-xl border border-primary/30 bg-primary/10 p-4 ">
            <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
              <ListChecks size={13} />
              Pending
            </p>
            <p className="mt-1.5 text-2xl font-semibold text-primary">{items.length - completedCount}</p>
          </div>
          <div className="rounded-xl border border-border bg-background p-4 ">
            <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              <Users size={13} className="text-primary" />
              Assigned
            </p>
            <p className="mt-1.5 text-2xl font-semibold text-foreground">{items.filter((i) => i.assignedTo).length}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
