'use client'

import { DashboardHeader } from '@/components/dashboard-header'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Trash2, CheckCircle2 } from 'lucide-react'
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
    <div className="flex flex-col min-h-screen">
      <DashboardHeader
        title="Shopping"
        description="Manage shopping lists and track purchases"
      />

      <div className="flex-1 overflow-auto">
        <div className="p-4 sm:p-6 lg:p-8 space-y-6">
          {/* Progress & Action */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Shopping List</h2>
              <p className="text-sm text-muted-foreground mt-1">
                {completedCount} of {items.length} items completed
              </p>
            </div>
            <Button className="bg-accent hover:bg-accent/90 text-accent-foreground flex items-center gap-2">
              <Plus size={18} />
              Add Item
            </Button>
          </div>

          {/* Progress Bar */}
          <Card className="p-6 border-border">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-foreground">Overall Progress</p>
              <span className="text-2xl font-bold text-accent">{progress}%</span>
            </div>
            <div className="w-full h-3 bg-border rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </Card>

          {/* Shopping Items */}
          <div className="space-y-3">
            {items.map((item) => (
              <Card
                key={item.id}
                className={`p-4 border-border transition ${
                  item.completed ? 'bg-card/50 opacity-70' : 'hover:shadow-md'
                }`}
              >
                <div className="flex items-start gap-4">
                  <button
                    onClick={() => toggleComplete(item.id)}
                    className={`flex-shrink-0 mt-1 ${
                      item.completed ? 'text-accent' : 'text-muted-foreground hover:text-accent'
                    }`}
                  >
                    <CheckCircle2 size={24} className="transition" />
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                      <p
                        className={`font-medium ${
                          item.completed
                            ? 'line-through text-muted-foreground'
                            : 'text-foreground'
                        }`}
                      >
                        {item.name}
                      </p>
                      <span className="text-sm px-2 py-1 rounded bg-accent/10 text-accent w-fit">
                        {item.quantity} {item.unit}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      {item.assignedTo ? (
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                            {item.assignedTo[0]}
                          </div>
                          <span>Assigned to {item.assignedTo}</span>
                        </div>
                      ) : (
                        <span className="text-amber-600">Unassigned</span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => deleteItem(item.id)}
                    className="flex-shrink-0 p-2 text-muted-foreground hover:text-destructive transition"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </Card>
            ))}
          </div>

          {/* Summary */}
          <Card className="p-6 border-border bg-gradient-to-r from-primary/5 to-accent/5">
            <h3 className="font-semibold text-foreground mb-4">Summary</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Total Items</p>
                <p className="text-2xl font-bold text-foreground">{items.length}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Completed</p>
                <p className="text-2xl font-bold text-green-600">{completedCount}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Pending</p>
                <p className="text-2xl font-bold text-amber-600">{items.length - completedCount}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Assigned</p>
                <p className="text-2xl font-bold text-accent">
                  {items.filter((i) => i.assignedTo).length}
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
