'use client'

import {
  ArrowLeft,
  BarChart3,
  Bell,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  CircleDollarSign,
  CreditCard,
  Eye,
  LayoutDashboard,
  LogOut,
  Plus,
  ReceiptText,
  Search,
  Settings,
  UsersRound,
  UtensilsCrossed,
  WalletCards,
} from 'lucide-react'
import { ProductTourPlayer } from '@/components/product-tour/tour-player'

const expenseTourSteps = [
  { id: 'expenses-nav', title: 'Open Bazar/Expenses', detail: 'Choose the current expense workspace from the manager sidebar.', x: 10, y: 41, duration: 2100 },
  { id: 'add-expense', title: 'Expense form opens', detail: 'The complete shared-cost form is ready.', x: 31, y: 18, duration: 1800 },
  { id: 'payment-source', title: 'Choose the payment source', detail: 'This purchase was paid from the mess deposit.', x: 36, y: 31, duration: 2100 },
  { id: 'category', title: 'Select a category', detail: 'Food expenses use meal-count based allocation by default.', x: 37, y: 49, duration: 1900 },
  { id: 'paid-by', title: 'Select who purchased it', detail: 'Managers can record the member who made the purchase.', x: 37, y: 64, duration: 1900 },
  { id: 'item-name', title: 'Enter the purchased item', detail: 'Add clear line items for a transparent record.', x: 69, y: 37, duration: 2300, typeText: 'Rice' },
  { id: 'quantity', title: 'Add the quantity', detail: 'Optional quantity makes the purchase easier to verify.', x: 66, y: 52, duration: 1800, typeText: '25' },
  { id: 'unit', title: 'Add the unit', detail: 'Use kg, litre, piece, or any useful unit.', x: 82, y: 52, duration: 1700, typeText: 'kg' },
  { id: 'amount', title: 'Enter the paid amount', detail: 'Messzen calculates the purchase total automatically.', x: 72, y: 66, duration: 2200, typeText: '1850' },
  { id: 'preview', title: 'Preview before saving', detail: 'Review the split before changing any balance.', x: 83, y: 88, duration: 2200 },
  { id: 'allocation', title: 'Check the member allocation', detail: 'Every member share is calculated from meal count.', x: 70, y: 60, duration: 2400 },
  { id: 'save', title: 'Confirm and save', detail: 'One final click records the expense.', x: 85, y: 88, duration: 2100 },
  { id: 'success', title: 'Expense added successfully', detail: 'The ledger and shared balances are now updated.', x: 76, y: 21, duration: 2800 },
] as const

type ExpenseTourStep = (typeof expenseTourSteps)[number]
type ExpenseTourStepId = ExpenseTourStep['id']

const stepIndex = Object.fromEntries(expenseTourSteps.map((step, index) => [step.id, index])) as Record<ExpenseTourStepId, number>

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'members', label: 'Members', icon: UsersRound },
  { id: 'meals', label: 'Meal Sheet', icon: UtensilsCrossed },
  { id: 'finance', label: 'Bazar/Expenses', icon: WalletCards },
  { id: 'monthly-bills', label: 'Monthly Bills', icon: CalendarDays },
  { id: 'payments', label: 'Payments', icon: CreditCard },
  { id: 'notices', label: 'Notices', icon: Bell },
  { id: 'reports', label: 'Reports', icon: BarChart3 },
  { id: 'mess-management', label: 'Mess Management', icon: Settings },
]

const expenseRows = [
  { name: 'Fresh vegetables', category: 'Grocery', date: '21 Aug 2026', amount: '৳ 920', payer: 'Sabbir' },
  { name: 'Cooking oil', category: 'Food', date: '19 Aug 2026', amount: '৳ 1,350', payer: 'Rahim' },
  { name: 'Gas refill', category: 'Utility', date: '16 Aug 2026', amount: '৳ 1,600', payer: 'Mahabur' },
]

function DemoField({
  label,
  value,
  placeholder,
  active,
  select,
}: {
  label: string
  value?: string
  placeholder?: string
  active?: boolean
  select?: boolean
}) {
  return (
    <div className={`rounded-[7px] border bg-white px-2.5 py-2 transition-all duration-300 ${active ? 'border-[#008d8c] shadow-[0_0_0_3px_rgba(0,141,140,.12)]' : 'border-[#dce7ea]'}`}>
      <p className="text-[clamp(4px,.62vw,7px)] font-bold text-[#668087]">{label}</p>
      <div className="mt-1 flex min-h-3 items-center justify-between gap-2">
        <span className={`truncate text-[clamp(5px,.82vw,9px)] font-extrabold ${value ? 'text-[#183f48]' : 'text-[#9aabb0]'}`}>
          {value || placeholder || 'Select'}
          {active && value ? <span className="ml-px inline-block h-[1em] w-px animate-pulse bg-[#008d8c] align-[-2px]" /> : null}
        </span>
        {select ? <ChevronDown className="w-2.5 shrink-0 text-[#668087]" /> : null}
      </div>
    </div>
  )
}

function Sidebar({ active }: { active: string }) {
  return (
    <aside className="absolute inset-y-0 left-0 w-[20%] border-r border-[#dce9ec] bg-white px-[2.1%] py-[3%]">
      <div className="flex items-center gap-[7%] px-[4%] text-[clamp(7px,1.25vw,12px)] font-semibold text-[#007f76]">
        <span className="grid aspect-square w-[18%] place-items-center rounded-[30%] border-2 border-[#008d8c] text-[.8em]">M</span>
        <span>messzen</span>
      </div>
      <div className="mt-[12%] space-y-[1.5%]">
        {navItems.map(({ id, label, icon: Icon }) => {
          const selected = id === active
          return (
            <div
              key={id}
              className={`flex items-center gap-[8%] rounded-[8px] px-[8%] py-[3.9%] text-[clamp(5px,.78vw,8px)] font-extrabold transition-all ${selected ? 'bg-gradient-to-r from-[#00777a] to-[#008d8c] text-white shadow-[0_6px_16px_rgba(0,127,118,.2)]' : 'text-[#526477]'}`}
            >
              <Icon className="w-[14%]" strokeWidth={2.2} />
              <span>{label}</span>
            </div>
          )
        })}
      </div>
      <div className="absolute inset-x-[8%] bottom-[10%] rounded-[8px] bg-[#f2f6fb] px-[8%] py-[6%]">
        <div className="flex items-center gap-[8%]">
          <span className="grid aspect-square w-[24%] place-items-center rounded-full bg-[#ddf5f2] text-[clamp(5px,.8vw,8px)] font-semibold text-[#007f76]">MR</span>
          <div className="min-w-0"><p className="truncate text-[clamp(5px,.82vw,8px)] font-semibold">Mahabur Rahman</p><p className="text-[clamp(4px,.65vw,6px)] font-bold uppercase text-[#74869b]">Manager</p></div>
        </div>
      </div>
      <div className="absolute inset-x-[8%] bottom-[3%] flex items-center justify-center gap-1.5 rounded-[8px] border border-rose-200 bg-rose-50 py-[4%] text-[clamp(4px,.65vw,7px)] font-semibold text-rose-600"><LogOut className="w-[10%]" /> Logout</div>
      {active === 'finance' ? <div className="absolute inset-x-0 top-0 h-1 bg-[#008d8c]" /> : null}
    </aside>
  )
}

function DemoHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <header className="flex h-[15%] items-center justify-between border-b border-[#dce9ec] bg-white px-[4%]">
      <div><p className="text-[clamp(8px,1.35vw,14px)] font-semibold">{title}</p><p className="mt-0.5 text-[clamp(4px,.7vw,7px)] font-semibold text-[#71839a]">{subtitle}</p></div>
      <div className="flex items-center gap-1.5">
        <span className="hidden items-center gap-1 rounded-[6px] border border-[#dbe7ee] bg-white px-2 py-1.5 text-[clamp(4px,.65vw,7px)] font-extrabold shadow-sm sm:flex"><CalendarDays className="w-2.5 text-[#008d8c]" /> August 2026</span>
        <span className="grid aspect-square w-6 place-items-center rounded-[6px] border border-[#dbe7ee] bg-white"><Bell className="w-2.5" /></span>
      </div>
    </header>
  )
}

function ExpensesList({ success }: { success: boolean }) {
  const rows = success
    ? [{ name: 'Rice', category: 'Food', date: '23 Aug 2026', amount: '৳ 1,850', payer: 'Mahabur' }, ...expenseRows]
    : expenseRows

  return (
    <>
      <DemoHeader title="Expenses" subtitle="Track bazar, food, and shared purchases" />
      <div className="relative h-[85%] overflow-hidden px-[4%] py-[3%]">
        {success ? (
          <div className="absolute right-[4%] top-[3%] z-10 flex items-center gap-2 rounded-[8px] border border-emerald-200 bg-emerald-50 px-3 py-2 text-emerald-800 shadow-lg">
            <CheckCircle2 className="w-3.5" />
            <div><p className="text-[clamp(5px,.8vw,8px)] font-semibold">Expense saved successfully</p><p className="text-[clamp(4px,.62vw,6px)] font-semibold text-emerald-700">Balances recalculated automatically</p></div>
          </div>
        ) : null}

        <div className="grid grid-cols-3 gap-2">
            {[
              ['This month', '৳ 5,720'],
              ['Food expenses', success ? '৳ 4,120' : '৳ 2,270'],
              ['Transactions', success ? '13' : '12'],
            ].map(([label, value]) => (
              <div key={label} className="min-w-[78px] rounded-[8px] border border-[#dce7ea] bg-white px-3 py-2 shadow-sm">
                <p className="text-[clamp(4px,.62vw,6px)] font-bold text-[#71839a]">{label}</p><p className="mt-1 text-[clamp(7px,1.05vw,11px)] font-semibold text-[#123748]">{value}</p>
              </div>
            ))}
        </div>

        <section className="mt-[3%] rounded-[9px] border border-[#dce7ea] bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-[#e7eef0] px-[3%] py-[2.2%]">
            <div><p className="text-[clamp(6px,.9vw,9px)] font-semibold">Expense history</p><p className="text-[clamp(4px,.62vw,6px)] font-semibold text-[#71839a]">Approved entries for August</p></div>
            <div className="flex items-center gap-1.5 rounded-[6px] border border-[#dce7ea] px-2 py-1.5 text-[#829499]"><Search className="w-2.5" /><span className="text-[clamp(4px,.6vw,6px)]">Search expenses</span></div>
          </div>
          <div className="grid grid-cols-[1.4fr_.75fr_.8fr_.8fr_.65fr] bg-[#f6f9fa] px-[3%] py-[1.7%] text-[clamp(4px,.6vw,6px)] font-semibold uppercase tracking-wide text-[#71839a]">
            <span>Expense</span><span>Category</span><span>Paid by</span><span>Date</span><span className="text-right">Amount</span>
          </div>
          {rows.map((row, index) => (
            <div key={`${row.name}-${row.date}`} className={`grid grid-cols-[1.4fr_.75fr_.8fr_.8fr_.65fr] items-center border-t border-[#edf2f3] px-[3%] py-[2.1%] text-[clamp(5px,.73vw,8px)] ${success && index === 0 ? 'bg-emerald-50/70' : ''}`}>
              <span className="flex items-center gap-2 font-semibold"><span className={`grid aspect-square w-6 place-items-center rounded-[6px] ${success && index === 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-[#e6f7f6] text-[#008d8c]'}`}><ReceiptText className="w-2.5" /></span>{row.name}</span>
              <span className="font-bold text-[#647a82]">{row.category}</span><span className="font-bold text-[#647a82]">{row.payer}</span><span className="font-bold text-[#647a82]">{row.date}</span><span className="text-right font-semibold text-[#123748]">{row.amount}</span>
            </div>
          ))}
        </section>
      </div>
    </>
  )
}

function ExpenseForm({ activeId, typedValue, currentStep }: { activeId: ExpenseTourStepId; typedValue: string; currentStep: number }) {
  const fieldValue = (id: Extract<ExpenseTourStepId, 'item-name' | 'quantity' | 'unit' | 'amount'>, finalValue: string) => {
    if (activeId === id) return typedValue
    return currentStep > stepIndex[id] ? finalValue : ''
  }

  return (
    <>
      <DemoHeader title="Add Expense" subtitle="Create a transparent shared-cost record" />
      <div className="relative h-[85%] overflow-hidden px-[4%] py-[2.5%]">
        <div className="mb-[2%] flex items-center gap-1 text-[clamp(4px,.62vw,6px)] font-bold text-[#71839a]"><ArrowLeft className="w-2.5" /> Expenses <span>/</span> <span className="text-[#008d8c]">Add Expense</span></div>
        <div className="grid grid-cols-[.82fr_1.18fr] gap-[2.5%]">
          <div className="space-y-[3%]">
            <section className="rounded-[9px] border border-[#dce7ea] bg-white p-[4%] shadow-sm">
              <p className="mb-[3%] text-[clamp(5px,.78vw,8px)] font-semibold">Payment Details</p>
              <div className="grid grid-cols-2 gap-2">
                <div className={`relative rounded-[7px] border px-2 py-2 transition-all ${activeId === 'payment-source' ? 'border-[#008d8c] bg-[#eefaf8] ring-2 ring-[#008d8c]/15' : 'border-[#008d8c] bg-[#f5fffd]'}`}>
                  <span className="absolute right-1.5 top-1.5 grid size-3 place-items-center rounded-full bg-[#008d8c] text-white"><Check className="w-2" /></span>
                  <WalletCards className="w-3 text-[#008d8c]" /><p className="mt-1 text-[clamp(4px,.66vw,7px)] font-semibold">From Mess Deposit</p><p className="text-[clamp(3px,.5vw,5px)] font-semibold text-[#71839a]">Use shared balance</p>
                </div>
                <div className="rounded-[7px] border border-[#dce7ea] px-2 py-2"><CircleDollarSign className="w-3 text-[#71839a]" /><p className="mt-1 text-[clamp(4px,.66vw,7px)] font-semibold">Personal</p><p className="text-[clamp(3px,.5vw,5px)] font-semibold text-[#71839a]">Member paid</p></div>
              </div>
            </section>

            <section className="rounded-[9px] border border-[#dce7ea] bg-white p-[4%] shadow-sm">
              <p className="mb-[3%] text-[clamp(5px,.78vw,8px)] font-semibold">Expense Details</p>
              <div className="space-y-2">
                <DemoField label="Category" value="Food" active={activeId === 'category'} select />
                <DemoField label="Paid By" value={currentStep >= stepIndex['paid-by'] ? 'Mahabur Rahman' : ''} placeholder="Select member" active={activeId === 'paid-by'} select />
                <DemoField label="Expense Date" value="23 Aug 2026" />
              </div>
            </section>

            <section className="rounded-[9px] border border-[#dce7ea] bg-white px-[4%] py-[3%] shadow-sm">
              <div className="flex items-center justify-between"><span className="text-[clamp(5px,.76vw,8px)] font-semibold">Split settings</span><span className="rounded-full bg-[#e6f7f6] px-2 py-1 text-[clamp(3px,.52vw,5px)] font-semibold text-[#007f76]">All members · Meal count</span></div>
            </section>
          </div>

          <div className="space-y-[2.5%]">
            <section className="rounded-[9px] border border-[#dce7ea] bg-white p-[3.5%] shadow-sm">
              <div className="mb-[2.5%] flex items-center justify-between"><p className="text-[clamp(5px,.78vw,8px)] font-semibold">Items</p><span className="text-[clamp(4px,.58vw,6px)] font-bold text-[#71839a]">Item 1</span></div>
              <DemoField label="Item Name" value={fieldValue('item-name', 'Rice')} placeholder="e.g. Rice" active={activeId === 'item-name'} />
              <div className="mt-2 grid grid-cols-2 gap-2">
                <DemoField label="Quantity (Optional)" value={fieldValue('quantity', '25')} placeholder="0" active={activeId === 'quantity'} />
                <DemoField label="Unit (Optional)" value={fieldValue('unit', 'kg')} placeholder="kg" active={activeId === 'unit'} />
              </div>
              <div className="mt-2"><DemoField label="Line Amount" value={fieldValue('amount', '1850')} placeholder="Final paid amount" active={activeId === 'amount'} /></div>
              <button type="button" className="mt-2 flex w-full items-center justify-center gap-1 rounded-[7px] border border-dashed border-[#58bfc0] bg-[#f6ffff] py-2 text-[clamp(4px,.65vw,7px)] font-semibold text-[#00777a]"><Plus className="w-2.5" /> Add another item</button>
              <div className="mt-2 flex items-center justify-between rounded-[7px] bg-[#e8f8f7] px-3 py-2"><div><p className="text-[clamp(3px,.52vw,5px)] font-bold text-[#668087]">Purchase total</p><p className="text-[clamp(4px,.62vw,6px)] font-semibold">1 item</p></div><span className="text-[clamp(6px,.95vw,10px)] font-semibold text-[#007f76]">{currentStep >= stepIndex.amount ? '৳ 1,850' : '৳ 0'}</span></div>
            </section>
            <section className="rounded-[9px] border border-[#dce7ea] bg-white px-[3.5%] py-[3%] shadow-sm">
              <p className="text-[clamp(4px,.68vw,7px)] font-semibold">Note <span className="font-semibold text-[#84969b]">(Optional)</span></p><p className="mt-1 text-[clamp(4px,.58vw,6px)] font-semibold text-[#71839a]">Monthly rice purchase</p>
            </section>
          </div>
        </div>
        <div className="absolute bottom-[3%] right-[4%] flex items-center gap-2">
          <span className="text-[clamp(4px,.6vw,6px)] font-bold text-[#71839a]">Nothing is saved before review</span>
          <button type="button" className={`flex items-center gap-1.5 rounded-[7px] bg-[#008d8c] px-4 py-2 text-[clamp(5px,.75vw,8px)] font-semibold text-white shadow-[0_7px_18px_rgba(0,141,140,.25)] transition-all ${activeId === 'preview' ? 'scale-105 ring-4 ring-[#008d8c]/15' : ''}`}><Eye className="w-3" /> Preview Split</button>
        </div>
      </div>
    </>
  )
}

function SplitPreview({ activeId }: { activeId: ExpenseTourStepId }) {
  const allocations = [
    ['Mahabur Rahman', '৳ 462.50', 'MR'],
    ['Rahim Ahmed', '৳ 555.00', 'RA'],
    ['Sabbir Hossain', '৳ 370.00', 'SH'],
    ['Nayeem Khan', '৳ 462.50', 'NK'],
  ]

  return (
    <>
      <DemoHeader title="Split Preview" subtitle="Review every detail before saving" />
      <div className="relative h-[85%] overflow-hidden px-[4%] py-[2.5%]">
        <div className="grid grid-cols-[.85fr_1.15fr] gap-[2.5%]">
          <div className="space-y-[3%]">
            <section className="rounded-[9px] border border-[#dce7ea] bg-white p-[5%] shadow-sm">
              <div className="flex items-center gap-3"><span className="grid aspect-square w-10 place-items-center rounded-full bg-[#e6f7f6] text-[#008d8c]"><CircleDollarSign className="w-5" /></span><div><p className="text-[clamp(5px,.75vw,8px)] font-bold text-[#668087]">Rice</p><p className="text-[clamp(9px,1.45vw,15px)] font-semibold text-[#008d8c]">৳ 1,850</p></div></div>
              <div className="mt-3 grid grid-cols-2 gap-2 border-t border-[#edf1f4] pt-3">
                <div><p className="text-[clamp(3px,.52vw,5px)] font-bold text-[#71839a]">Payment Source</p><p className="text-[clamp(4px,.65vw,7px)] font-semibold">Mess Deposit</p></div>
                <div><p className="text-[clamp(3px,.52vw,5px)] font-bold text-[#71839a]">Shared With</p><p className="text-[clamp(4px,.65vw,7px)] font-semibold">All Members</p></div>
                <div className="col-span-2"><p className="text-[clamp(3px,.52vw,5px)] font-bold text-[#71839a]">Split Rule</p><p className="text-[clamp(4px,.65vw,7px)] font-semibold">Meal Count</p></div>
              </div>
            </section>
            <section className="rounded-[9px] border border-[#dce7ea] bg-white p-[5%] shadow-sm">
              <div className="flex items-center justify-between"><p className="text-[clamp(5px,.76vw,8px)] font-semibold">Purchased Items</p><span className="rounded-full bg-[#e6f7f6] px-2 py-1 text-[clamp(3px,.5vw,5px)] font-semibold text-[#007f76]">1 item</span></div>
              <div className="mt-2 flex items-center justify-between rounded-[7px] border border-[#e4eaec] px-2.5 py-2"><div><p className="text-[clamp(4px,.65vw,7px)] font-semibold">Rice</p><p className="text-[clamp(3px,.5vw,5px)] font-bold text-[#71839a]">25 kg</p></div><span className="text-[clamp(5px,.75vw,8px)] font-semibold text-[#007f76]">৳ 1,850</span></div>
            </section>
          </div>

          <section className={`rounded-[9px] border bg-white p-[4%] shadow-sm transition-all ${activeId === 'allocation' ? 'border-[#008d8c] ring-3 ring-[#008d8c]/10' : 'border-[#dce7ea]'}`}>
            <div className="flex items-center justify-between"><p className="text-[clamp(5px,.78vw,8px)] font-semibold">Member Allocation</p><span className="rounded-full bg-[#e6f7f6] px-2 py-1 text-[clamp(3px,.5vw,5px)] font-semibold text-[#007f76]">4 members</span></div>
            <div className="mt-2 overflow-hidden rounded-[8px] border border-[#e4eaec]">
              {allocations.map(([name, amount, initials], index) => (
                <div key={name} className="flex items-center gap-2 border-b border-[#edf1f4] px-2.5 py-2 last:border-b-0">
                  <span className={`grid aspect-square w-6 place-items-center rounded-full text-[clamp(3px,.5vw,5px)] font-semibold ${index % 2 ? 'bg-sky-100 text-sky-700' : 'bg-[#dff4f3] text-[#00777a]'}`}>{initials}</span>
                  <div className="min-w-0 flex-1"><p className="truncate text-[clamp(4px,.65vw,7px)] font-semibold">{name}</p><p className="text-[clamp(3px,.48vw,5px)] font-semibold text-[#71839a]">Meal-count share</p></div>
                  <span className="text-[clamp(4px,.68vw,7px)] font-semibold text-[#00777a]">{amount}</span>
                </div>
              ))}
            </div>
            <div className="mt-2 grid grid-cols-2 overflow-hidden rounded-[8px] bg-[#f3f9f9]">
              <div className="border-r border-[#dce7ea] px-3 py-2"><p className="text-[clamp(3px,.5vw,5px)] font-bold text-[#71839a]">Payer Credit</p><p className="text-[clamp(6px,.9vw,9px)] font-semibold text-emerald-700">৳ 0</p></div>
              <div className="px-3 py-2"><p className="text-[clamp(3px,.5vw,5px)] font-bold text-[#71839a]">Shared Cost</p><p className="text-[clamp(6px,.9vw,9px)] font-semibold text-[#00777a]">৳ 1,850</p></div>
            </div>
          </section>
        </div>
        <div className="absolute bottom-[3%] right-[4%] flex gap-2">
          <button type="button" className="rounded-[7px] border border-[#bcd3d6] bg-white px-4 py-2 text-[clamp(5px,.72vw,8px)] font-semibold text-[#526b72]">Back to Edit</button>
          <button type="button" className={`flex items-center gap-1.5 rounded-[7px] bg-[#008d8c] px-4 py-2 text-[clamp(5px,.72vw,8px)] font-semibold text-white shadow-[0_7px_18px_rgba(0,141,140,.25)] ${activeId === 'save' ? 'scale-105 ring-4 ring-[#008d8c]/15' : ''}`}><Check className="w-3" /> Confirm & Save</button>
        </div>
      </div>
    </>
  )
}

export function MarketingExpenseTour({ loop, onComplete }: { loop?: boolean; onComplete?: () => void } = {}) {
  return (
    <ProductTourPlayer
      steps={expenseTourSteps}
      address="app.messzen.com/expenses"
      ariaLabel="Animated walkthrough showing how to add an expense in Messzen"
      loop={loop}
      onComplete={onComplete}
    >
      {({ activeStep, stepIndex: currentStep, typedValue }) => {
        const screen = activeStep.id === 'expenses-nav'
          ? 'expenses'
          : activeStep.id === 'allocation' || activeStep.id === 'save'
            ? 'preview'
            : activeStep.id === 'success'
              ? 'success'
              : 'form'

        return (
          <>
            <Sidebar active="finance" />
            <div key={screen} className="absolute inset-y-0 left-[20%] right-0 animate-in fade-in duration-300">
              {screen === 'expenses' ? <ExpensesList success={false} /> : null}
              {screen === 'form' ? <ExpenseForm activeId={activeStep.id} typedValue={typedValue} currentStep={currentStep} /> : null}
              {screen === 'preview' ? <SplitPreview activeId={activeStep.id} /> : null}
              {screen === 'success' ? <ExpensesList success /> : null}
            </div>
          </>
        )
      }}
    </ProductTourPlayer>
  )
}
