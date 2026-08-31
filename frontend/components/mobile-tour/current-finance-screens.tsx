import type { LucideIcon } from 'lucide-react'
import {
  Banknote,
  CalendarDays,
  Camera,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  CookingPot,
  Eye,
  FileText,
  Hash,
  House,
  Landmark,
  Package,
  Plus,
  ReceiptText,
  Scale,
  Smartphone,
  Tag,
  UserRound,
  Users,
  UsersRound,
  UtensilsCrossed,
  WalletCards,
  Zap,
} from 'lucide-react'
import {
  CurrentAppScreen,
  TourChoiceGrid,
  TourField,
  TourPrimaryAction,
  TourScrollContent,
  TourSectionCard,
  TourStatusBanner,
} from '@/components/mobile-tour/mobile-tour-primitives'

type CostKind = 'expense' | 'utility'

const expenseRecords = [
  { title: 'Rice', detail: 'Food · Mahabur Rahman', date: '23 Aug 2026', amount: '৳ 1,850', tone: 'teal' },
  { title: 'Fresh vegetables', detail: 'Grocery · Sabbir Hossain', date: '21 Aug 2026', amount: '৳ 920', tone: 'green' },
  { title: 'Electricity', detail: 'Utility · Rahim Ahmed', date: '18 Aug 2026', amount: '৳ 1,600', tone: 'blue' },
]

const depositRecords = [
  { initials: 'MN', name: 'Md Nazmul Hossain', detail: 'Cash · 23 Aug 2026', amount: '৳ 998' },
  { initials: 'MR', name: 'Mahabur Rahman', detail: 'Bank · 20 Aug 2026', amount: '৳ 3,000' },
  { initials: 'RA', name: 'Rahim Ahmed', detail: 'bKash · 16 Aug 2026', amount: '৳ 2,000' },
]

const summaryTones = {
  teal: { background: '#edfafa', foreground: '#00777a' },
  blue: { background: '#edf4ff', foreground: '#1666d9' },
  green: { background: '#e8f6ed', foreground: '#0f8f42' },
  violet: { background: '#f1efff', foreground: '#6656c9' },
} as const

function FinanceSummaryCard({ icon: Icon, label, value, tone = 'teal', caption }: { icon: LucideIcon; label: string; value: string; tone?: keyof typeof summaryTones; caption?: string }) {
  const colors = summaryTones[tone]
  return (
    <article className="flex min-h-[76px] items-start gap-2.5 rounded-[16px] border border-[#cfeeed] bg-white p-3.5 shadow-[0_8px_20px_rgba(0,119,122,.06)]">
      <span className="grid size-[42px] shrink-0 place-items-center rounded-[12px]" style={{ backgroundColor: colors.background, color: colors.foreground }}><Icon className="w-4" /></span>
      <div className="min-w-0"><p className="truncate text-[7px] font-semibold text-[#789096]">{label}</p><p className="mt-1 truncate text-[10px] font-semibold" style={{ color: colors.foreground }}>{value}</p>{caption ? <p className="mt-0.5 text-[6px] font-semibold text-[#789096]">{caption}</p> : null}</div>
    </article>
  )
}

function ExpenseRecordList() {
  return (
    <div className="overflow-hidden rounded-xl border border-[#e1e9ea] bg-white">
      {expenseRecords.map((record) => {
        const colors = summaryTones[record.tone as keyof typeof summaryTones]
        return (
          <div key={record.title} className="flex min-h-[58px] items-center gap-2.5 border-b border-[#edf2f3] px-3 py-2 last:border-0">
            <span className="grid size-9 shrink-0 place-items-center rounded-xl" style={{ backgroundColor: colors.background, color: colors.foreground }}><ReceiptText className="w-4" /></span>
            <div className="min-w-0 flex-1"><p className="truncate text-[8px] font-semibold">{record.title}</p><p className="mt-0.5 truncate text-[6px] font-semibold text-[#71858a]">{record.detail}</p><p className="mt-0.5 text-[6px] text-[#8ba0a5]">{record.date}</p></div>
            <div className="text-right"><p className="text-[9px] font-semibold text-[#00777a]">{record.amount}</p><span className="mt-1 inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-[6px] font-semibold text-emerald-700">Approved</span></div>
          </div>
        )
      })}
    </div>
  )
}

export function CurrentExpensesScreen({ scrollY = 0, actionsOpen = false, view = 'my' }: { scrollY?: number; actionsOpen?: boolean; view?: 'my' | 'manager' }) {
  const managerView = view === 'manager' || actionsOpen
  return (
    <div className="absolute inset-0 overflow-hidden">
      <CurrentAppScreen title={managerView ? 'Manage Expenses' : 'Expense Management'} subtitle={managerView ? 'Monitor member costs and dues' : 'Together We Dine'} activeTab="expenses">
        <TourScrollContent scrollY={scrollY} className="space-y-2.5 pb-20">
          <div className="grid grid-cols-2 gap-1.5 rounded-[20px] bg-white p-[5px] shadow-[0_10px_24px_rgba(0,119,122,.08)]">
            <div className={`flex min-h-[46px] items-center justify-center gap-1.5 rounded-full text-[8px] font-bold ${!managerView ? 'bg-gradient-to-br from-[#008d8c] to-[#00777a] text-white shadow-[0_10px_22px_rgba(0,119,122,.22)]' : 'text-[#65838b]'}`}><UserRound className="w-3.5" /> My View</div>
            <div className={`flex min-h-[46px] items-center justify-center gap-1.5 rounded-full text-[8px] font-bold ${managerView ? 'bg-gradient-to-br from-[#008d8c] to-[#00777a] text-white shadow-[0_10px_22px_rgba(0,119,122,.22)]' : 'text-[#65838b]'}`}><UsersRound className="w-3.5" /> Manager View</div>
          </div>

          {!managerView ? (
            <TourSectionCard title="This Month Overview">
              <div className="grid grid-cols-2 gap-3"><FinanceSummaryCard icon={CookingPot} label="Food" value="৳ 1,457.14" /><FinanceSummaryCard icon={Zap} label="Utility" value="৳ 228.57" tone="blue" /><FinanceSummaryCard icon={House} label="Rent" value="৳ 450" tone="violet" /><FinanceSummaryCard icon={WalletCards} label="Total" value="৳ 2,135.71" caption="6 txns" tone="green" /></div>
              <div className="mt-4 flex min-h-[72px] items-center gap-3 rounded-[16px] border border-violet-200/70 bg-gradient-to-br from-white to-[#f1efff] p-3 shadow-[0_8px_20px_rgba(73,61,145,.08)]"><span className="grid size-10 place-items-center rounded-[13px] bg-gradient-to-br from-[#f1efff] to-[#dff4f3] text-[#4f70a5]"><ReceiptText className="w-4" /></span><div className="min-w-0 flex-1"><p className="text-[8px] font-bold">Total Expenses This Month</p><p className="mt-1 text-[6px] font-semibold text-[#65838b]">Food, utility and rent</p></div><span className="rounded-[10px] border border-violet-200 bg-white px-3 py-2 text-[7px] font-bold text-violet-700">Details</span></div>
            </TourSectionCard>
          ) : (
            <TourSectionCard><div className="grid grid-cols-2 gap-3"><FinanceSummaryCard icon={CircleDollarSign} label="Total" value="৳ 10,959.94" /><FinanceSummaryCard icon={Zap} label="Utility" value="৳ 1,600" tone="blue" /><FinanceSummaryCard icon={Landmark} label="Deposit" value="৳ 9,359.94" tone="green" /><FinanceSummaryCard icon={UsersRound} label="Members" value="7" tone="violet" /></div></TourSectionCard>
          )}

          {managerView ? <TourSectionCard title="Available Funds">
            <div className="grid grid-cols-2 gap-2">
              <FinanceSummaryCard icon={Landmark} label="Mess Deposit" value="৳ 158" tone="green" />
              <FinanceSummaryCard icon={UsersRound} label="Mess Fund" value="৳ 2,500" tone="violet" />
            </div>
            <div className="mt-2 space-y-2"><TourField label="Mess fund amount" placeholder="Enter amount" icon={CircleDollarSign} /><TourField label="Collection note (optional)" placeholder="Add note" icon={FileText} /><div className="grid min-h-10 place-items-center rounded-xl border border-[#58bfc0] bg-[#f6ffff] text-[8px] font-semibold text-[#00777a]"><span className="flex items-center gap-1.5"><Plus className="w-3.5" /> Record Mess Fund</span></div></div>
          </TourSectionCard> : null}

          <TourSectionCard title={managerView ? 'Expense Submissions' : 'All Expenses'} action={<span className="text-[7px] font-semibold text-[#008d8c]">All status⌄</span>}>
            <div className="mb-2 flex items-center justify-between rounded-xl border border-[#dce8ea] bg-[#f8fbfb] px-3 py-2"><span className="text-[7px] font-semibold text-[#71858a]">August 2026</span><span className="text-[7px] font-semibold text-[#008d8c]">3 shown</span></div>
            <ExpenseRecordList />
          </TourSectionCard>
        </TourScrollContent>
      </CurrentAppScreen>

      {actionsOpen ? <div className="absolute inset-0 z-30 bg-[#062b35]/18" /> : null}
      <div className="absolute bottom-[10%] right-[4%] z-40 flex flex-col items-end gap-2">
        {actionsOpen ? <><div className="flex items-center gap-2"><span className="rounded-lg bg-[#123748] px-3 py-2 text-[8px] font-semibold text-white">Add Utility</span><span className="grid size-11 place-items-center rounded-full bg-white text-[#1666d9] shadow-xl"><Zap className="w-4" /></span></div><div className="flex items-center gap-2"><span className="rounded-lg bg-[#123748] px-3 py-2 text-[8px] font-semibold text-white">Add Expense</span><span className="grid size-11 place-items-center rounded-full bg-white text-[#008d8c] shadow-xl"><ReceiptText className="w-4" /></span></div></> : null}
        <span className={`grid size-12 place-items-center rounded-full bg-gradient-to-br from-[#008d8c] to-[#006c69] text-white shadow-xl ${actionsOpen ? 'rotate-45' : ''}`}><Plus className="w-5" /></span>
      </div>
    </div>
  )
}

function DepositStatCard({ icon: Icon, label, value, tone }: { icon: LucideIcon; label: string; value: string; tone: 'teal' | 'blue' | 'orange' }) {
  const colors = tone === 'blue' ? { bg: '#f5f8ff', fg: '#1666d9' } : tone === 'orange' ? { bg: '#fff8f2', fg: '#ff6b00' } : { bg: '#f2ffff', fg: '#00777a' }
  return <article className="flex min-h-[78px] min-w-0 items-center gap-2.5 rounded-[14px] border border-[#e5ecee] bg-white px-3 py-2.5 shadow-[0_6px_18px_rgba(18,55,72,.07)]"><span className="grid size-9 shrink-0 place-items-center rounded-full" style={{ backgroundColor: colors.bg, color: colors.fg }}><Icon className="w-4" /></span><div className="min-w-0"><p className="truncate text-[7px] font-semibold text-[#789096]">{label}</p><p className="mt-1 truncate text-[9px] font-semibold text-[#1d3a42]">{value}</p></div></article>
}

function DepositRows({ includeNew = false }: { includeNew?: boolean }) {
  const records = includeNew ? [{ initials: 'RA', name: 'Rahim Ahmed', detail: 'bKash · Just now', amount: '৳ 2,000' }, ...depositRecords] : depositRecords
  return <div className="overflow-hidden border-y border-[#e5eded]">{records.slice(0, 4).map((record, index) => <div key={`${record.name}-${record.detail}`} className={`flex min-h-[64px] items-center gap-2.5 border-b border-[#edf2f3] py-2 last:border-0 ${includeNew && index === 0 ? 'bg-emerald-50/60' : ''}`}><span className={`grid size-10 shrink-0 place-items-center rounded-[14px] text-[8px] font-semibold ${index % 2 ? 'bg-[#fff1e7] text-[#ff6b00]' : 'bg-[#dff4f3] text-[#00777a]'}`}>{record.initials}</span><div className="min-w-0 flex-1"><p className="truncate text-[9px] font-semibold">{record.name}</p><p className="mt-0.5 truncate text-[6px] font-semibold text-[#71858a]">{record.detail}</p></div><div className="text-right"><p className="text-[9px] font-semibold text-[#00777a]">{record.amount}</p><span className="mt-1 inline-flex rounded-full bg-[#e8f6ed] px-2 py-0.5 text-[6px] font-semibold text-[#0f8f42]">Approved</span></div></div>)}</div>
}

export function CurrentDepositScreen({ success = false }: { success?: boolean }) {
  return (
    <CurrentAppScreen title="Deposit" subtitle="Deposit submissions">
      <div className="space-y-3">
        <div className="mx-auto grid min-h-[48px] w-[86%] grid-cols-[38px_1fr_38px] items-center rounded-full border border-[#dfe8ea] bg-white shadow-[0_8px_20px_rgba(18,55,72,.06)]"><span className="text-center text-[#008d8c]">‹</span><span className="text-center text-[9px] font-semibold">▣ August 2026⌄</span><span className="text-center text-[#008d8c]">›</span></div>
        {success ? <TourStatusBanner title="Deposit added and approved" detail="Rahim Ahmed’s August balance has been updated." /> : null}
        <div className="grid grid-cols-2 gap-2.5"><DepositStatCard icon={UserRound} label="My Deposit" value="৳ 3,000" tone="teal" /><DepositStatCard icon={WalletCards} label="Total Deposit" value={success ? '৳ 5,998' : '৳ 3,998'} tone="blue" /><DepositStatCard icon={Clock3} label="Pending Deposit" value="৳ 0" tone="orange" /></div>
        <section className="pt-1"><div className="mb-2.5 flex items-center justify-between"><h2 className="text-[12px] font-semibold">Recent Deposits</h2><span className="text-[8px] font-semibold text-[#008d8c]">View All</span></div><DepositRows includeNew={success} /></section>
      </div>
      {!success ? <span className="absolute bottom-4 right-4 grid size-12 place-items-center rounded-full border-[3px] border-white bg-gradient-to-br from-[#008d8c] to-[#006c69] text-white shadow-xl"><CircleDollarSign className="w-5" /></span> : null}
    </CurrentAppScreen>
  )
}

const costStages = {
  expense: ['payment', 'category', 'paid-by', 'date', 'item-name', 'quantity', 'unit', 'amount', 'advanced', 'note', 'attachment', 'preview'],
  utility: ['payment', 'paid-by', 'date', 'utility-type', 'utility-price', 'advanced', 'note', 'attachment', 'preview'],
} as const

function reached(kind: CostKind, activeItem: string | undefined, target: string, prefilled: boolean) {
  if (prefilled) return true
  const stages = costStages[kind] as readonly string[]
  return Math.max(0, stages.indexOf(activeItem ?? stages[0])) >= stages.indexOf(target)
}

export function CurrentCostEntryScreen({ kind, activeItem, scrollY = 0, aiPrefilled = false }: { kind: CostKind; activeItem?: string; scrollY?: number; aiPrefilled?: boolean }) {
  const isUtility = kind === 'utility'
  const has = (target: string) => reached(kind, activeItem, target, aiPrefilled)
  const amount = isUtility ? '1,600' : aiPrefilled ? '850' : '1,850'
  const item = isUtility ? 'Electricity' : aiPrefilled ? 'Today grocery' : 'Rice'

  return (
    <CurrentAppScreen title={isUtility ? 'Add Utility' : 'Add Expense'} subtitle={aiPrefilled ? 'AI-prefilled entry · Review before saving' : 'Manual entry'} trailing={<span className="grid size-9 place-items-center rounded-full border border-white/15 bg-white/10">{isUtility ? <Zap className="w-4" /> : <ReceiptText className="w-4" />}</span>}>
      <TourScrollContent scrollY={scrollY} className="space-y-2.5 pb-6">
        <TourSectionCard title="Payment Details"><TourChoiceGrid selected="deposit" active={activeItem === 'payment'} options={[{ value: 'deposit', label: 'Mess Deposit', caption: 'Shared balance', icon: WalletCards }, { value: 'personal', label: 'Personal', caption: 'Member paid', icon: Banknote }]} /></TourSectionCard>
        <TourSectionCard title={isUtility ? 'Utility Details' : 'Expense Details'}><div className="space-y-2">{!isUtility ? <TourField label="Category" value={has('category') ? 'Food' : ''} placeholder="Select category" icon={Tag} select active={activeItem === 'category'} /> : null}<TourField label="Paid By" value={has('paid-by') ? 'Mahabur Rahman' : ''} placeholder="Select member" icon={UserRound} select active={activeItem === 'paid-by'} /><TourField label={isUtility ? 'Bill Date' : 'Expense Date'} value={has('date') ? '23 Aug 2026' : ''} placeholder="Select date" icon={CalendarDays} active={activeItem === 'date'} /></div></TourSectionCard>
        <TourSectionCard title={isUtility ? 'Utility Items' : 'Items'} caption={isUtility ? 'Utility 1' : 'Item 1'}>
          {isUtility ? <><div className="grid grid-cols-2 gap-2"><TourField label="Type" value={has('utility-type') ? item : ''} placeholder="Select utility" icon={Zap} select active={activeItem === 'utility-type'} /><TourField label="Price" value={has('utility-price') ? amount : ''} placeholder="Enter price" icon={CircleDollarSign} active={activeItem === 'utility-price'} /></div><div className="mt-2 grid min-h-10 place-items-center rounded-xl border border-dashed border-[#58bfc0] bg-[#f6ffff] text-[8px] font-semibold text-[#00777a]"><span className="flex items-center gap-1.5"><Plus className="w-3.5" /> Add More</span></div></> : <div className="space-y-2"><TourField label="Item Name" value={has('item-name') ? item : ''} placeholder="e.g. Rice" icon={Package} active={activeItem === 'item-name'} /><div className="grid grid-cols-2 gap-2"><TourField label="Quantity (Optional)" value={has('quantity') ? '25' : ''} placeholder="0" icon={Scale} active={activeItem === 'quantity'} /><TourField label="Unit (Optional)" value={has('unit') ? 'kg' : ''} placeholder="kg" icon={Hash} active={activeItem === 'unit'} /></div><TourField label="Line Amount" value={has('amount') ? amount : ''} placeholder="Final paid amount" icon={CircleDollarSign} active={activeItem === 'amount'} /></div>}
          <div className="mt-2 flex items-center justify-between rounded-xl bg-[#e8f8f7] px-3 py-2.5"><div><p className="text-[6px] font-semibold text-[#65838b]">{isUtility ? 'Utility total' : 'Purchase total'}</p><p className="mt-0.5 text-[8px] font-semibold">1 {isUtility ? 'utility' : 'item'}</p></div><span className="text-[11px] font-semibold text-[#00777a]">৳ {has(isUtility ? 'utility-price' : 'amount') ? amount : '0'}</span></div>
        </TourSectionCard>
        <TourSectionCard title="Advanced Split Options" caption="Current defaults can be adjusted"><div className={`grid grid-cols-2 gap-2 ${activeItem === 'advanced' ? 'rounded-xl ring-3 ring-[#008d8c]/15' : ''}`}><TourField label="Used By" value="All Members" icon={Users} select /><TourField label="Split Method" value={isUtility ? 'Equal' : 'Meal Count'} icon={UtensilsCrossed} select /></div></TourSectionCard>
        <TourSectionCard title="Note"><TourField label="Note (Optional)" value={has('note') ? (isUtility ? 'August electricity bill' : 'Monthly grocery purchase') : ''} placeholder="Add a note" icon={FileText} multiline active={activeItem === 'note'} /></TourSectionCard>
        <TourSectionCard title="Attachment"><TourField label="Receipt (Optional)" value={has('attachment') ? `${isUtility ? 'electricity' : 'grocery'}-receipt.jpg` : ''} placeholder="Upload receipt" icon={Camera} active={activeItem === 'attachment'} /></TourSectionCard>
        {aiPrefilled ? <div className="grid grid-cols-[.8fr_1.2fr] gap-2"><div className="grid min-h-11 place-items-center rounded-xl border border-[#dce8ea] bg-white text-[8px] font-semibold">Cancel</div><TourPrimaryAction active={activeItem === 'preview'}><Eye className="w-4" /> Preview</TourPrimaryAction></div> : <TourPrimaryAction active={activeItem === 'preview'}><Eye className="w-4" /> Preview Split</TourPrimaryAction>}
      </TourScrollContent>
    </CurrentAppScreen>
  )
}

export function CurrentCostPreviewScreen({ kind, activeItem }: { kind: CostKind; activeItem?: string }) {
  const isUtility = kind === 'utility'
  const total = isUtility ? '৳ 1,600' : '৳ 1,850'
  const title = isUtility ? 'Electricity' : 'Rice'
  const split = isUtility ? 'Equal' : 'Meal Count'
  const shares = isUtility ? [['Mahabur Rahman', 'Equal share', '৳ 400'], ['Rahim Ahmed', 'Equal share', '৳ 400'], ['Sabbir Hossain', 'Equal share', '৳ 400'], ['Nayeem Khan', 'Equal share', '৳ 400']] : [['Mahabur Rahman', '22.5 meals', '৳ 617'], ['Rahim Ahmed', '18 meals', '৳ 493'], ['Sabbir Hossain', '15 meals', '৳ 411'], ['Nayeem Khan', '12 meals', '৳ 329']]
  return <CurrentAppScreen title="Split Preview" subtitle="Review before saving"><div className="space-y-2.5"><TourSectionCard title={title} caption={`${isUtility ? 'Utility' : 'Food'} · Mess Deposit`} action={<span className="text-[12px] font-semibold text-[#00777a]">{total}</span>}><div className="grid grid-cols-2 gap-2"><div className="rounded-xl bg-[#f2f8f8] p-2"><p className="text-[6px] text-[#71858a]">Used By</p><p className="mt-1 text-[8px] font-semibold">All Members</p></div><div className="rounded-xl bg-[#f2f8f8] p-2"><p className="text-[6px] text-[#71858a]">Split Method</p><p className="mt-1 text-[8px] font-semibold">{split}</p></div></div></TourSectionCard><TourSectionCard title="Member allocation"><div className="overflow-hidden rounded-xl border border-[#e1e9ea]">{shares.map(([name, meta, share]) => <div key={name} className="flex items-center gap-2 border-b border-[#edf2f3] px-2.5 py-2 last:border-0"><span className="grid size-7 place-items-center rounded-full bg-[#e8f8f7] text-[7px] font-semibold text-[#00777a]">{name.split(' ').map((part) => part[0]).join('')}</span><div className="min-w-0 flex-1"><p className="truncate text-[8px] font-semibold">{name}</p><p className="text-[6px] text-[#71858a]">{meta}</p></div><span className="text-[8px] font-semibold text-[#00777a]">{share}</span></div>)}</div><div className="mt-2 flex justify-between rounded-xl bg-[#e8f8f7] px-3 py-2 text-[8px] font-semibold"><span>Total shared cost</span><span className="text-[#00777a]">{total}</span></div></TourSectionCard><div className="grid grid-cols-[.7fr_1.3fr] gap-2"><div className="grid place-items-center rounded-xl border border-[#dce8ea] bg-white text-[8px] font-semibold">Edit</div><TourPrimaryAction active={activeItem === 'save'}><CheckCircle2 className="w-4" /> Save {isUtility ? 'Utility' : 'Expense'}</TourPrimaryAction></div></div></CurrentAppScreen>
}

export function CurrentCostSuccessScreen({ kind }: { kind: CostKind }) {
  const isUtility = kind === 'utility'
  return <CurrentAppScreen title="Manage Expenses" subtitle="Monitor member costs and dues" activeTab="expenses"><div className="space-y-2.5"><TourStatusBanner title={`${isUtility ? 'Utility' : 'Expense'} saved successfully`} detail="The ledger and member balances were updated." /><div className="grid grid-cols-2 gap-2"><FinanceSummaryCard icon={CircleDollarSign} label="Total" value={isUtility ? '৳ 12,559.94' : '৳ 10,959.94'} /><FinanceSummaryCard icon={Zap} label="Utility" value={isUtility ? '৳ 3,200' : '৳ 1,600'} tone="blue" /></div><TourSectionCard title="Expense Submissions"><ExpenseRecordList /></TourSectionCard></div></CurrentAppScreen>
}

const depositStages = ['method', 'amount', 'date', 'paid-by', 'transaction', 'note', 'submit'] as const

export function CurrentDepositEntryScreen({ activeItem, scrollY = 0, aiPrefilled = false }: { activeItem?: string; scrollY?: number; aiPrefilled?: boolean }) {
  const index = Math.max(0, depositStages.indexOf((activeItem ?? 'method') as (typeof depositStages)[number]))
  const has = (target: (typeof depositStages)[number]) => aiPrefilled || index >= depositStages.indexOf(target)
  return <CurrentAppScreen title="Submit Deposit" subtitle={aiPrefilled ? 'AI-prefilled entry · Review before saving' : 'Manual entry'} trailing={<span className="grid size-9 place-items-center rounded-full border border-white/15 bg-white/10"><WalletCards className="w-4" /></span>}><TourScrollContent scrollY={scrollY} className="space-y-2.5 pb-6"><TourSectionCard title="Submit Deposit" caption="Deposits are paid manually first, then entered here."><div className="space-y-2"><TourField label="Deposit Method" value={has('method') ? 'bKash' : ''} placeholder="Select method" icon={Smartphone} select active={activeItem === 'method'} /><div className="grid grid-cols-2 gap-2"><TourField label="Amount" value={has('amount') ? '2,000' : ''} placeholder="2500" icon={CircleDollarSign} active={activeItem === 'amount'} /><TourField label="Deposit Date" value={has('date') ? '23 Aug 2026' : ''} placeholder="Select date" icon={CalendarDays} active={activeItem === 'date'} /></div><TourField label="Deposit For" value={has('paid-by') ? 'Rahim Ahmed' : ''} placeholder="Self" icon={UserRound} select active={activeItem === 'paid-by'} /><TourField label="Transaction ID" value={has('transaction') ? 'TXN-846291' : ''} placeholder="TXN123456" hint="Optional" icon={Hash} active={activeItem === 'transaction'} /><TourField label="Note" value={has('note') ? 'August mess deposit' : ''} placeholder="Deposit for monthly bill" icon={FileText} multiline active={activeItem === 'note'} /></div></TourSectionCard><div className="flex items-start gap-2 rounded-[18px] border border-[#b8d7ff] bg-[#f2f8ff] p-3"><span className="grid size-9 shrink-0 place-items-center rounded-full border-2 border-[#1f6feb] text-[#1f6feb]">i</span><p className="text-[7px] font-semibold leading-3 text-[#123748]">Deposits are paid manually first, then entered here for tracking.</p></div>{aiPrefilled ? <div className="grid grid-cols-[.8fr_1.2fr] gap-2"><div className="grid min-h-11 place-items-center rounded-xl border bg-white text-[8px] font-semibold">Cancel</div><TourPrimaryAction active={activeItem === 'submit'}>Save</TourPrimaryAction></div> : <TourPrimaryAction active={activeItem === 'submit'}><Plus className="w-4" /> Submit Deposit</TourPrimaryAction>}</TourScrollContent></CurrentAppScreen>
}
