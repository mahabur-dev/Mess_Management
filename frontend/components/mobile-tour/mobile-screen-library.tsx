import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import {
  Banknote,
  Bell,
  BookOpenCheck,
  CalendarDays,
  CalendarClock,
  Camera,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  ClipboardList,
  Clock3,
  Coins,
  ContactRound,
  CreditCard,
  Crown,
  Eye,
  FileCheck2,
  FileText,
  Hash,
  House,
  Landmark,
  LayoutGrid,
  Languages,
  LogOut,
  MessageSquareWarning,
  Mic,
  Package,
  Plus,
  ReceiptText,
  Scale,
  ScrollText,
  Settings,
  ShieldCheck,
  Sparkles,
  Tag,
  User,
  UserRound,
  Users,
  UtensilsCrossed,
  Wallet2,
  WalletCards,
  X,
} from 'lucide-react'
import {
  TourChoiceGrid,
  TourField,
  TourPrimaryAction,
  TourScrollContent,
  TourSectionCard,
  TourStatusBanner,
} from '@/components/mobile-tour/mobile-tour-primitives'
import {
  CurrentCostEntryScreen,
  CurrentCostPreviewScreen,
  CurrentCostSuccessScreen,
  CurrentDepositEntryScreen,
  CurrentDepositScreen,
  CurrentExpensesScreen,
} from '@/components/mobile-tour/current-finance-screens'
import {
  CurrentAiQuickAddScreen,
  CurrentAiSuccessScreen,
  CurrentMealPatternScreen,
} from '@/components/mobile-tour/current-automation-screens'
import {
  CurrentMealsOverviewScreen,
  CurrentMonthlyBillOverviewScreen,
} from '@/components/mobile-tour/current-overview-screens'
import {
  CurrentMembersScreen,
  CurrentNoticesScreen,
} from '@/components/mobile-tour/current-community-screens'
import {
  CurrentMenuDestinationScreen,
  type CurrentMenuScreenId,
} from '@/components/mobile-tour/current-menu-screens'

export type MobileScreenId =
  | 'home'
  | 'meals'
  | 'expenses'
  | 'expense-actions'
  | 'add-expense'
  | 'expense-preview'
  | 'expense-success'
  | 'add-utility'
  | 'utility-preview'
  | 'utility-success'
  | 'deposits'
  | 'add-deposit'
  | 'deposit-success'
  | 'monthly-bill'
  | 'notices'
  | 'members'
  | 'ai'
  | 'ai-review'
  | 'ai-preview'
  | 'ai-success'
  | 'meal-pattern'
  | 'meal-pattern-type'
  | 'meal-pattern-schedule'
  | 'meal-pattern-success'
  | 'more'
  | 'profile'
  | 'settings'
  | 'complaints'
  | 'mess-management'
  | 'subscription'
  | 'how-it-works'
  | 'contact-us'
  | 'privacy-policy'
  | 'terms'

function MobileStatusBar() {
  return <div className="flex h-[4.4%] items-center justify-between bg-[#008986] px-[4%] text-[12px] font-semibold text-white"><span>10:15</span><span className="tracking-[.12em]">▰ ◆ ◢ ▯20%</span></div>
}

function MobileHeader({ title, subtitle, back = true }: { title: string; subtitle?: string; back?: boolean }) {
  return (
    <header className="flex min-h-[9.2%] items-center bg-gradient-to-br from-[#007f7c] to-[#17aaa5] px-[4%] pb-[2%] text-white">
      <span className={`grid shrink-0 place-items-center rounded-full border border-white/15 bg-white/10 ${back ? 'size-9' : 'size-11'}`}>{back ? <ChevronLeft className="w-4" /> : <span className="text-[12px] font-black">MR</span>}</span>
      <div className={`min-w-0 flex-1 px-2 ${back ? 'text-center' : 'text-left'}`}><h1 className="truncate text-[18px] font-bold leading-6">{title}</h1>{subtitle ? <p className="mt-0.5 truncate text-[12px] font-medium leading-4 text-white/80">{subtitle}</p> : null}</div>
      <span className={`grid shrink-0 place-items-center rounded-full border border-white/15 bg-white/10 ${back ? 'size-9' : 'size-11'}`}><Bell className="w-[19px]" /></span>
    </header>
  )
}

const bottomTabs = [
  { id: 'home', label: 'Home', icon: House },
  { id: 'expenses', label: 'Expenses', icon: ReceiptText },
  { id: 'meal-pattern', label: 'Meal Pattern', icon: CalendarClock },
  { id: 'more', label: 'More', icon: LayoutGrid },
]

function MobileBottomNav({ active }: { active: string }) {
  return (
    <nav className="absolute inset-x-0 bottom-0 z-20 grid h-[8.3%] grid-cols-4 border-t border-[#dfe9ea] bg-white px-2.5 py-1.5 shadow-[0_-8px_25px_rgba(18,55,72,.07)]">
      {bottomTabs.map(({ id, label, icon: Icon }) => <div key={id} className={`flex min-h-[54px] flex-col items-center justify-center gap-1 text-[12px] font-semibold leading-4 ${active === id ? 'text-[#008d8c]' : 'text-[#708388]'}`}><Icon className="w-[18px]" strokeWidth={2.5} /><span>{label}</span></div>)}
    </nav>
  )
}

function MobileCodeShell({ title, subtitle, activeTab, children }: { title: string; subtitle?: string; activeTab?: string; children: ReactNode }) {
  return (
    <div className="absolute inset-0 bg-[#f7fbfb] text-[#123748]">
      <MobileStatusBar />
      <MobileHeader title={title} subtitle={subtitle} />
      <main className={`absolute inset-x-0 top-[13.6%] overflow-hidden px-[4%] py-[4%] ${activeTab ? 'bottom-[8.3%]' : 'bottom-0'}`}>{children}</main>
      {activeTab ? <MobileBottomNav active={activeTab} /> : null}
    </div>
  )
}

function MetricGrid({ cards }: { cards: Array<{ label: string; value: string; icon: LucideIcon }> }) {
  return <div className="grid grid-cols-2 gap-2">{cards.map(({ label, value, icon: Icon }) => <article key={label} className="flex min-h-[62px] gap-2 rounded-xl border border-[#dfe8ea] bg-white p-3 shadow-[0_3px_12px_rgba(18,55,72,.045)]"><span className="grid size-8 shrink-0 place-items-center rounded-lg bg-[#edfafa] text-[#008d8c]"><Icon className="w-4" /></span><div><p className="text-[8px] font-semibold text-[#6b848a]">{label}</p><p className="mt-1 text-[12px] font-black text-[#123748]">{value}</p></div></article>)}</div>
}

const homeQuickActions = [
  { label: 'Meals', icon: UtensilsCrossed },
  { label: 'Expenses', icon: Wallet2 },
  { label: 'Deposits', icon: Landmark },
  { label: 'Monthly Bill', icon: ClipboardList },
  { label: 'Notices', icon: Bell },
  { label: 'Members', icon: Users },
]

const homeMetrics = [
  { label: 'Total Member', value: '7', icon: Users, accent: '#008d8c' },
  { label: 'Today Meal', value: '2.5', icon: UtensilsCrossed, accent: '#4bbfc0' },
  { label: 'Total Meals', value: '67.5', icon: ReceiptText, accent: '#0aa0a0' },
  { label: 'Meal Rate', value: '৳ 111.26', icon: WalletCards, accent: '#008d8c' },
  { label: 'Food Expenses', value: '৳ 7,509.94', icon: CreditCard, accent: '#00777a' },
  { label: 'Utility Expenses', value: '৳ 1,600', icon: Landmark, accent: '#0aa0a0' },
  { label: 'Per Member Utility', value: '৳ 228.57', icon: Coins, accent: '#0aa0a0' },
  { label: 'Total Deposit', value: '৳ 9,267.94', icon: ClipboardList, accent: '#4bbfc0' },
  { label: 'Due Amount', value: '৳ 1,892.06', icon: MessageSquareWarning, accent: '#00777a' },
  { label: 'Remaining Amount', value: '৳ 158', icon: ShieldCheck, accent: '#008d8c' },
] satisfies Array<{ label: string; value: string; icon: LucideIcon; accent: string }>

const homeRecentExpenses = [
  { name: 'Fresh vegetables', date: '24 Aug 2026', payment: 'Mess Deposit', amount: '৳ 920', icon: ReceiptText, accent: '#008d8c' },
  { name: 'Cooking oil', date: '19 Aug 2026', payment: 'Personal', amount: '৳ 1,350', icon: CreditCard, accent: '#00777a' },
  { name: 'Gas refill', date: '16 Aug 2026', payment: 'Mess Deposit', amount: '৳ 1,600', icon: Landmark, accent: '#0aa0a0' },
]

function HomeQuickActions({ activeItem }: { activeItem?: string }) {
  return (
    <section className="py-1 pb-2" aria-label="Quick actions">
      <div className="grid grid-cols-3 gap-1.5">
        {homeQuickActions.map(({ label, icon: Icon }) => {
          const active = activeItem === label.toLowerCase().replace(' ', '-')
          return (
            <div
              key={label}
              className={`flex min-h-[72px] flex-col items-center justify-center gap-1.5 rounded-[12px] px-1 py-2 transition-all ${active ? 'bg-[#edfafa] ring-2 ring-[#008d8c]/15' : ''}`}
            >
              <span className="grid size-10 place-items-center rounded-[8px] bg-[#edfafa] text-[#008d8c]"><Icon className="w-[19px]" /></span>
              <span className="text-[12px] font-medium leading-4 text-[#3d5560]">{label}</span>
            </div>
          )
        })}
      </div>
    </section>
  )
}

function HomeAiEntry({ active = false }: { active?: boolean }) {
  return (
    <section className={`relative mt-[14px] overflow-hidden rounded-[14px] border border-[#e4eaec] bg-gradient-to-br from-white to-[#f5fbfb] px-3 pb-2.5 pt-2.5 text-left shadow-[0_4px_14px_rgba(18,55,72,.055)] ${active ? 'ring-3 ring-[#008d8c]/15' : ''}`}>
      <span className="absolute -right-7 -top-11 size-[116px] rounded-full bg-[radial-gradient(circle,rgba(75,191,192,.2),rgba(75,191,192,0))]" />
      <span className="relative inline-flex items-center gap-1 rounded-full border border-[#008d8c]/15 bg-white/80 px-2 py-0.5 text-[8px] font-extrabold tracking-[.09em] text-[#00777a]"><Sparkles className="w-2.5" /> AI ASSISTED</span>
      <div className="relative mt-2 flex items-center gap-2.5">
        <span className="grid size-[42px] shrink-0 place-items-center rounded-[13px] bg-gradient-to-br from-[#00a5a3] to-[#007b7d] text-white shadow-[0_8px_18px_rgba(0,119,122,.2)]"><Sparkles className="w-5" /></span>
        <div className="min-w-0 flex-1"><h2 className="text-[15px] font-extrabold leading-[18px] text-[#123748]">Quick Add with AI</h2><p className="truncate text-[11px] font-medium leading-4 text-[#65838b]">Review-ready entries from text or voice</p></div>
        <span className="grid size-7 shrink-0 place-items-center rounded-[9px] border border-[#008d8c]/15 bg-white/80 text-[#008d8c]"><ChevronRight className="w-4" /></span>
      </div>
      <div className="relative mt-1.5 flex gap-1.5 pl-[52px]">
        <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-[#008d8c]/[.075] px-[7px] py-0.5 text-[8px] font-bold leading-none text-[#397078]"><Languages className="w-3" /> বাংলা + English</span>
        <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-[#008d8c]/[.075] px-[7px] py-0.5 text-[8px] font-bold leading-none text-[#397078]"><Mic className="w-3" /> Voice enabled</span>
      </div>
    </section>
  )
}

function HomeMetricCards() {
  return (
    <div className="grid grid-cols-2 gap-2">
      {homeMetrics.map(({ label, value, icon: Icon, accent }) => (
        <article key={label} className="flex min-h-[68px] items-start gap-[9px] rounded-[12px] border border-[#e4eaec] bg-white p-2.5 shadow-[0_3px_10px_rgba(18,55,72,.05)]">
          <span className="grid size-7 shrink-0 place-items-center rounded-[8px]" style={{ backgroundColor: `${accent}12`, color: accent }}><Icon className="w-4" /></span>
          <div className="min-w-0"><p className="min-h-[25px] text-[12px] font-semibold leading-[1.2] text-[#69838a]">{label}</p><p className="mt-[3px] truncate text-[16px] font-semibold leading-[1.1] text-[#1d3a42]">{value}</p></div>
        </article>
      ))}
    </div>
  )
}

function HomeSectionHeader({ title, caption, month, action }: { title: string; caption?: string; month?: string; action?: string }) {
  return (
    <div className="mb-2.5 flex items-center justify-between gap-3">
      <div className="min-w-0 flex-1">
        <h2 className="text-[12px] font-bold uppercase leading-4 tracking-[.16em] text-[#526b73]">{title}</h2>
        {caption ? <p className="mt-1 text-[12px] font-semibold leading-4 text-[#65838b]">{caption}</p> : null}
      </div>
      {month ? <span className="inline-flex min-h-[34px] min-w-[118px] shrink-0 items-center justify-center gap-2 rounded-full border border-[#d8eeee] bg-white px-3 py-[7px] text-[12px] font-bold leading-4 text-[#1d3a42] shadow-[0_8px_18px_rgba(18,55,72,.04)]"><CalendarDays className="w-[15px] text-[#008d8c]" /> {month}<ChevronDown className="w-[15px] text-[#008d8c]" /></span> : null}
      {action ? <span className="inline-flex min-h-9 shrink-0 items-center justify-center gap-1 rounded-[8px] bg-[#edfafa] px-3 py-2 text-[12px] font-semibold text-[#008d8c]">{action}<ChevronRight className="w-3.5" /></span> : null}
    </div>
  )
}

function HomeRecentExpenses() {
  return (
    <div className="border-t border-[#e4eaec]">
      {homeRecentExpenses.map(({ name, date, payment, amount, icon: Icon, accent }) => (
        <div key={name} className="flex min-h-[76px] items-center gap-3 border-b border-[#e4eaec] px-2 py-3 last:border-0">
          <span className="grid size-10 shrink-0 place-items-center rounded-full" style={{ backgroundColor: `${accent}12`, color: accent }}><Icon className="w-[17px]" /></span>
          <div className="min-w-0 flex-1"><p className="truncate text-[14px] font-semibold uppercase leading-5 text-[#1d3a42]">{name}</p><div className="mt-1.5 flex items-center gap-1.5"><span className="truncate text-[12px] font-medium text-[#667d87]">{date}</span><span className="truncate rounded-full bg-[#e8f8f7] px-2 py-0.5 text-[10px] font-bold text-[#008d8c]">{payment}</span><span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">Approved</span></div></div>
          <span className="shrink-0 whitespace-nowrap text-right text-[16px] font-semibold" style={{ color: accent }}>{amount}</span>
        </div>
      ))}
    </div>
  )
}

function CurrentHomeScreen({ scrollY = 0, activeItem }: { scrollY?: number; activeItem?: string }) {
  return (
    <div className="absolute inset-0 bg-[#f7fbfb] text-[#123748]">
      <MobileStatusBar />
      <MobileHeader title="Mahabur Rahman" subtitle="Here's what's happening today" back={false} />
      <main className="absolute inset-x-0 bottom-[8.3%] top-[13.6%] overflow-hidden bg-white px-4 py-3">
        <TourScrollContent scrollY={scrollY} className="pb-[22px]">
          <HomeQuickActions activeItem={activeItem} />
          <HomeAiEntry active={activeItem === 'ai'} />

          <section className="mt-3.5 py-2.5">
            <HomeSectionHeader title="Overview" month="August 2026" />
            <HomeMetricCards />
          </section>

          <section className="mt-3.5 py-2.5">
            <HomeSectionHeader title="Recent Expenses" caption="Latest 3 entries in August 2026" action="View All" />
            <HomeRecentExpenses />
          </section>
        </TourScrollContent>
      </main>
      <MobileBottomNav active="home" />
    </div>
  )
}

function CurrentMealsScreen() {
  return <MobileCodeShell title="Meal Management" subtitle="Together We Dine"><div className="flex items-center justify-between"><h2 className="text-[8px] font-black uppercase tracking-[.15em] text-[#607981]">Today Overview</h2><span className="rounded-full bg-[#e8f8f7] px-3 py-1 text-[7px] font-black text-[#607981]">CLOSED</span></div><div className="mt-3"><MetricGrid cards={[{label:'Breakfast',value:'0.5',icon:UtensilsCrossed},{label:'Lunch',value:'1',icon:UtensilsCrossed},{label:'Dinner',value:'1',icon:UtensilsCrossed},{label:'Total',value:'2.5',icon:ReceiptText}]} /></div><div className="mt-3 flex items-center gap-3 rounded-xl border border-[#a9dddd] bg-[#f0fbfa] p-3"><span className="grid size-10 place-items-center rounded-xl bg-[#dff4f3] text-[#008d8c]"><CalendarClock className="w-5" /></span><div className="flex-1"><p className="text-[7px] font-black uppercase text-[#607981]">Total meals this month</p><p className="mt-1 text-[13px] font-black">67.5 <small className="text-[7px] text-[#008d8c]">meals</small></p></div><span className="rounded-lg border border-[#a9dddd] bg-white px-3 py-2 text-[7px] font-black">Details ›</span></div><section className="mt-4"><div className="flex items-center justify-between"><h2 className="text-[12px] font-black">My Meal Status</h2><span className="rounded-full bg-rose-50 px-3 py-1 text-[7px] font-black text-rose-600">CLOSED</span></div><p className="mt-1 text-[7px] font-black text-[#008d8c]">◷ 10:00 PM - 3:00 PM</p><div className="mt-2 rounded-xl border border-[#d9e8e8] bg-white p-3"><div className="flex items-center justify-between"><div><p className="text-[9px] font-black">Breakfast, Lunch, Dinner</p><p className="mt-1 text-[7px] text-[#71858a]">Your meal is added</p></div><span className="rounded-full bg-[#e5f6f4] px-3 py-1 text-[7px] font-black text-[#008d8c]">ADDED</span></div></div></section></MobileCodeShell>
}

function CurrentDepositsScreen() {
  return <MobileCodeShell title="Deposit" subtitle="Deposit submissions"><div className="mx-auto flex w-[78%] items-center justify-between rounded-full border border-[#dfe8ea] bg-white px-4 py-2.5 text-[#008d8c]"><span>‹</span><span className="text-[10px] font-black text-[#123748]">▣ August 2026⌄</span><span>›</span></div><div className="mt-4"><MetricGrid cards={[{label:'My Deposit',value:'৳ 3,000',icon:User},{label:'Total Deposit',value:'৳ 3,998',icon:WalletCards},{label:'Pending Deposit',value:'৳ 0',icon:Clock3}]} /></div><section className="mt-5"><div className="flex items-center justify-between"><h2 className="text-[12px] font-black">Recent Deposits</h2><span className="text-[8px] font-black">View All</span></div><div className="mt-2 overflow-hidden border-y border-[#e5eded]">{[['Md Nazmul Hossain','৳ 998'],['Mahabur Rahman','৳ 3,000']].map(([name,amount]) => <div key={name} className="flex items-center gap-3 border-b border-[#edf2f3] py-3 last:border-0"><span className="grid size-9 place-items-center rounded-full bg-[#e5f6f4] text-[7px] font-black text-[#00777a]">{name.split(' ').map(part=>part[0]).join('').slice(0,2)}</span><div className="flex-1"><p className="text-[9px] font-black">{name}</p><p className="mt-1 text-[7px] font-black text-emerald-600">● Approved</p></div><span className="text-[10px] font-black text-[#00777a]">{amount}</span></div>)}</div></section><span className="absolute bottom-4 right-4 grid size-12 place-items-center rounded-full bg-[#008d8c] text-white shadow-xl"><Plus className="w-5" /></span></MobileCodeShell>
}

function CurrentMonthlyBillScreen() {
  return <MobileCodeShell title="Monthly Bill Management" subtitle="August 2026" activeTab="monthly-bill"><div className="mx-auto flex w-[78%] items-center justify-between rounded-full border border-[#dfe8ea] bg-white px-4 py-2.5 text-[#008d8c]"><span>‹</span><span className="text-[10px] font-black text-[#123748]">▣ August 2026⌄</span><span>›</span></div><h2 className="mt-4 text-[8px] font-black uppercase tracking-[.15em] text-[#607981]">My Overview</h2><div className="mt-2"><MetricGrid cards={[{label:'Total Deposit',value:'৳ 7,570',icon:CircleDollarSign},{label:'Total Cost',value:'৳ 2,135.71',icon:ReceiptText},{label:'Total Due',value:'৳ 0',icon:WalletCards},{label:'Total Remaining',value:'৳ 6,927.29',icon:ShieldCheck}]} /></div><div className="mt-3 flex items-center gap-3 rounded-xl border border-[#a9dddd] bg-[#f0fbfa] p-3"><span className="grid size-10 place-items-center rounded-xl bg-[#dff4f3] text-[#008d8c]"><CalendarClock className="w-5" /></span><div className="flex-1"><p className="text-[7px] font-black uppercase text-[#00777a]">My Bill Summary</p><p className="mt-1 truncate text-[8px] font-black">Meals, deposits, expenses...</p></div><span className="rounded-lg bg-white px-3 py-2 text-[7px] font-black">Details ›</span></div><h2 className="mt-4 text-[11px] font-black">Member overview <span className="ml-2 rounded-lg bg-white px-2 py-1 text-[7px]">7</span></h2></MobileCodeShell>
}

function CurrentAiScreen() {
  return <MobileCodeShell title="Quick Add with AI" subtitle="Speak or type, review, then confirm"><section className="rounded-2xl bg-gradient-to-br from-[#063a43] via-[#007b78] to-[#13a6a1] p-4 text-white"><span className="text-[6px] font-black tracking-[.12em] text-teal-100">MESSZEN AI ASSISTANT</span><h2 className="mt-2 text-[13px] font-black">What would you like to add?</h2><div className="mt-3 rounded-xl bg-white p-3 text-[#123748]"><p className="text-[6px] font-black uppercase text-[#00777a]">Write a command</p><div className="mt-2 min-h-[76px] rounded-lg border border-[#c5e3e2] p-3"><p className="text-[10px] font-black">Add Rahim deposit 2000</p><p className="mt-8 text-[6px] font-bold text-[#008d8c]">Bangla · English · Banglish</p></div><div className="mt-3 flex items-center justify-between"><span className="text-[6px] font-bold text-[#607981]">Nothing saves before review</span><span className="rounded-lg bg-[#008d8c] px-3 py-2 text-[7px] font-black text-white">Analyze ›</span></div></div></section><div className="mt-3 grid grid-cols-4 gap-1.5">{['Expense','Utility','Deposit','Meal'].map(item => <div key={item} className="rounded-lg border border-[#dfe8ea] bg-white py-2 text-center text-[6px] font-black text-[#607981]">{item}</div>)}</div></MobileCodeShell>
}

function ExpensesScreen() {
  return <MobileCodeShell title="Manage Expenses" subtitle="Monitor member costs and dues" activeTab="expenses"><div className="flex items-center justify-between rounded-full border border-[#dbe9ea] bg-white px-4 py-2"><span className="text-[10px] font-black">August 2026</span><span className="text-[8px] font-bold text-[#008d8c]">All expenses</span></div><div className="mt-4"><MetricGrid cards={[{label:'Food Expenses',value:'৳ 7,509.94',icon:ReceiptText},{label:'Utility Expenses',value:'৳ 0',icon:Landmark}]} /></div><section className="mt-5"><div className="flex items-center justify-between"><h2 className="text-[13px] font-black">Recent Expenses</h2><span className="text-[8px] font-black text-[#008d8c]">View All</span></div><div className="mt-2 overflow-hidden rounded-xl border border-[#dfe8ea] bg-white">{[['Fresh vegetables','Grocery','৳ 920'],['Cooking oil','Food','৳ 1,350'],['Rice','Food','৳ 1,850'],['Gas refill','Utility','৳ 1,600']].map(([name,category,amount]) => <div key={name} className="flex items-center gap-3 border-b border-[#edf2f3] px-3 py-3 last:border-0"><span className="grid size-9 place-items-center rounded-xl bg-[#edfafa] text-[#008d8c]"><ReceiptText className="w-4" /></span><div className="min-w-0 flex-1"><p className="truncate text-[9px] font-black">{name}</p><p className="mt-0.5 text-[7px] font-semibold text-[#71858a]">{category} · Approved</p></div><span className="text-[9px] font-black text-[#00777a]">{amount}</span></div>)}</div></section><span className="absolute bottom-4 right-4 grid size-12 place-items-center rounded-full bg-[#008d8c] text-white shadow-xl"><ReceiptText className="w-5" /></span></MobileCodeShell>
}

function NoticesScreen() {
  return <MobileCodeShell title="Notices" subtitle="Announcement center"><div className="flex items-center justify-between"><h2 className="text-[12px] font-black">Latest Notices</h2><span className="rounded-full bg-[#e5f6f4] px-3 py-1 text-[7px] font-black text-[#008d8c]">3 active</span></div><div className="mt-3 space-y-2.5">{[['Dinner will be served at 9 PM','Meal','Today'],['Payment deadline: 28 August','Payment','Yesterday'],['Friday cleaning schedule','General','20 Aug']].map(([title,type,date],index) => <article key={title} className="rounded-xl border border-[#dfe8ea] bg-white p-4 shadow-sm"><div className="flex gap-3"><span className={`grid size-9 shrink-0 place-items-center rounded-xl ${index === 1 ? 'bg-amber-50 text-amber-600' : 'bg-[#edfafa] text-[#008d8c]'}`}><Bell className="w-4" /></span><div><h3 className="text-[9px] font-black leading-4">{title}</h3><p className="mt-1 text-[7px] font-semibold text-[#70858a]">{type} · {date}</p></div></div></article>)}</div></MobileCodeShell>
}

function MembersScreen() {
  return <MobileCodeShell title="Members" subtitle="All members in your mess"><MetricGrid cards={[{label:'Total Members',value:'7',icon:Users},{label:'Active Members',value:'7',icon:CheckCircle2}]} /><div className="mt-4 flex items-center justify-between"><h2 className="text-[12px] font-black">Member List</h2><span className="rounded-lg bg-[#008d8c] px-3 py-2 text-[7px] font-black text-white">+ Add Member</span></div><div className="mt-2 overflow-hidden rounded-xl border border-[#dfe8ea] bg-white">{['Mahabur Rahman','Rahim Ahmed','Sabbir Hossain','Nayeem Khan'].map((name,index) => <div key={name} className="flex items-center gap-3 border-b border-[#edf2f3] px-3 py-3 last:border-0"><span className="grid size-9 place-items-center rounded-full bg-[#e5f6f4] text-[8px] font-black text-[#00777a]">{name.split(' ').map((part)=>part[0]).join('')}</span><div className="flex-1"><p className="text-[9px] font-black">{name}</p><p className="text-[7px] font-semibold text-[#71858a]">{index === 0 ? 'Manager' : 'Member'} · Active</p></div><span className="size-2 rounded-full bg-emerald-500" /></div>)}</div></MobileCodeShell>
}

function MealPatternScreen() {
  const days = [['Mon','B','L','D'],['Tue','','L','D'],['Wed','B','L','D'],['Thu','B','L','D'],['Fri','','L','D'],['Sat','B','L','D'],['Sun','B','','D']]
  return <MobileCodeShell title="Meal Pattern" subtitle="Simple, automatic meal planning" activeTab="meal-pattern"><div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 p-3"><div><p className="text-[7px] font-bold text-emerald-700">ACTIVE PATTERN</p><p className="mt-1 text-[11px] font-black">Weekly pattern</p></div><span className="rounded-full bg-emerald-500 px-3 py-1 text-[7px] font-black text-white">Active</span></div><section className="mt-4 rounded-xl border border-[#dfe8ea] bg-white p-3"><h2 className="text-[11px] font-black">Your schedule</h2><p className="mt-1 text-[7px] font-semibold text-[#71858a]">Change this whenever your routine changes.</p><div className="mt-3 grid grid-cols-7 gap-1">{days.map(([day,...meals]) => <div key={day} className="rounded-lg bg-[#f2f8f8] p-1.5 text-center"><p className="text-[6px] font-black">{day}</p><div className="mt-2 space-y-1">{['B','L','D'].map(meal => <span key={meal} className={`mx-auto grid size-5 place-items-center rounded text-[5px] font-black ${meals.includes(meal) ? 'bg-[#008d8c] text-white' : 'bg-[#dfe8e9] text-[#9badb0]'}`}>{meal}</span>)}</div></div>)}</div></section><div className="mt-3 flex items-center gap-2 rounded-xl bg-[#e8f8f7] p-3"><CalendarClock className="w-4 text-[#008d8c]" /><p className="text-[8px] font-black text-[#17605d]">Next week continues automatically.</p></div></MobileCodeShell>
}

const expenseStages = ['payment', 'category', 'paid-by', 'date', 'item-name', 'quantity', 'unit', 'amount', 'advanced', 'note', 'attachment', 'preview'] as const
const depositStages = ['method', 'amount', 'date', 'paid-by', 'transaction', 'note', 'submit'] as const

function stageReached(stages: readonly string[], activeItem: string | undefined, target: string) {
  const currentIndex = Math.max(0, stages.indexOf(activeItem ?? stages[0]))
  return currentIndex >= stages.indexOf(target)
}

function TourRecordRows({
  records,
  icon: Icon,
}: {
  records: Array<{ title: string; meta: string; value: string; fresh?: boolean }>
  icon: LucideIcon
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-[#dfe8ea] bg-white">
      {records.map(({ title, meta, value, fresh }) => (
        <div key={`${title}-${value}`} className={`flex items-center gap-2.5 border-b border-[#edf2f3] px-3 py-2.5 last:border-0 ${fresh ? 'bg-emerald-50/70' : ''}`}>
          <span className={`grid size-8 shrink-0 place-items-center rounded-xl ${fresh ? 'bg-emerald-100 text-emerald-700' : 'bg-[#edfafa] text-[#008d8c]'}`}><Icon className="w-3.5" /></span>
          <div className="min-w-0 flex-1"><p className="truncate text-[8px] font-black text-[#123748]">{title}</p><p className="mt-0.5 truncate text-[6px] font-semibold text-[#71858a]">{meta}</p></div>
          <span className="text-[8px] font-black text-[#00777a]">{value}</span>
        </div>
      ))}
    </div>
  )
}

function ExpenseActionMenuScreen() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <ExpensesScreen />
      <div className="absolute inset-0 z-30 bg-[#062b35]/18" />
      <div className="absolute bottom-[5%] right-[4%] z-40 flex flex-col items-end gap-2">
        <div className="flex items-center gap-2"><span className="rounded-lg bg-[#123748] px-3 py-2 text-[8px] font-black text-white shadow-lg">Add Utility</span><span className="grid size-11 place-items-center rounded-full bg-white text-[#008d8c] shadow-xl"><CircleDollarSign className="w-4" /></span></div>
        <div className="flex items-center gap-2"><span className="rounded-lg bg-[#123748] px-3 py-2 text-[8px] font-black text-white shadow-lg">Add Expense</span><span className="grid size-11 place-items-center rounded-full bg-white text-[#008d8c] shadow-xl ring-3 ring-[#008d8c]/15"><ReceiptText className="w-4" /></span></div>
        <span className="grid size-12 rotate-45 place-items-center rounded-full bg-[#008d8c] text-white shadow-xl"><Plus className="w-5" /></span>
      </div>
    </div>
  )
}

function AddExpenseTourScreen({ activeItem, scrollY = 0 }: { activeItem?: string; scrollY?: number }) {
  const has = (target: string) => stageReached(expenseStages, activeItem, target)
  const amount = has('amount') ? '1,850' : ''

  return (
    <MobileCodeShell title="Add Expense" subtitle="Manual entry">
      <TourScrollContent scrollY={scrollY} className="space-y-2.5 pb-6">
        <TourSectionCard title="Payment Details">
          <TourChoiceGrid
            selected="deposit"
            active={activeItem === 'payment'}
            options={[
              { value: 'deposit', label: 'Mess Deposit', caption: 'Pay from shared balance', icon: WalletCards },
              { value: 'personal', label: 'Personal', caption: 'Member paid directly', icon: Banknote },
            ]}
          />
        </TourSectionCard>

        <TourSectionCard title="Expense Details">
          <div className="space-y-2">
            <TourField label="Category" value={has('category') ? 'Food' : ''} placeholder="Select category" icon={Tag} select active={activeItem === 'category'} />
            <TourField label="Paid By" value={has('paid-by') ? 'Mahabur Rahman' : ''} placeholder="Select member" icon={UserRound} select active={activeItem === 'paid-by'} />
            <TourField label="Expense Date" value={has('date') ? '23 Aug 2026' : ''} placeholder="Select date" icon={CalendarDays} active={activeItem === 'date'} />
          </div>
        </TourSectionCard>

        <TourSectionCard title="Items" caption="Item 1">
          <div className="space-y-2">
            <TourField label="Item Name" value={has('item-name') ? 'Rice' : ''} placeholder="e.g. Rice" icon={Package} active={activeItem === 'item-name'} />
            <div className="grid grid-cols-2 gap-2">
              <TourField label="Quantity (Optional)" value={has('quantity') ? '25' : ''} placeholder="0" icon={Scale} active={activeItem === 'quantity'} />
              <TourField label="Unit (Optional)" value={has('unit') ? 'kg' : ''} placeholder="kg" icon={Hash} active={activeItem === 'unit'} />
            </div>
            <TourField label="Line Amount" value={amount} placeholder="Final paid amount" icon={CircleDollarSign} active={activeItem === 'amount'} />
            <div className="flex items-center justify-between rounded-xl bg-[#e8f8f7] px-3 py-2.5"><div><p className="text-[6px] font-semibold text-[#65838b]">Purchase total</p><p className="mt-0.5 text-[8px] font-black">1 item</p></div><span className="text-[11px] font-black text-[#00777a]">৳ {amount || '0'}</span></div>
          </div>
        </TourSectionCard>

        <TourSectionCard title="Advanced Split Options" caption="Current defaults can be adjusted">
          <div className={`grid grid-cols-2 gap-2 rounded-xl ${activeItem === 'advanced' ? 'ring-3 ring-[#008d8c]/15' : ''}`}>
            <TourField label="Used By" value="All Members" icon={Users} select />
            <TourField label="Split Method" value="Meal Count" icon={UtensilsCrossed} select />
          </div>
        </TourSectionCard>

        <TourSectionCard title="Note">
          <TourField label="Note (Optional)" value={has('note') ? 'Monthly grocery purchase' : ''} placeholder="Add a note" icon={FileText} multiline active={activeItem === 'note'} />
        </TourSectionCard>

        <TourSectionCard title="Attachment">
          <TourField label="Receipt (Optional)" value={has('attachment') ? 'rice-receipt.jpg' : ''} placeholder="Upload receipt" icon={Camera} active={activeItem === 'attachment'} />
        </TourSectionCard>

        <TourPrimaryAction active={activeItem === 'preview'}><Eye className="w-4" /> Preview Split</TourPrimaryAction>
      </TourScrollContent>
    </MobileCodeShell>
  )
}

function ExpensePreviewTourScreen({ activeItem }: { activeItem?: string }) {
  const shares = [
    ['Mahabur Rahman', '22.5 meals', '৳ 617'],
    ['Rahim Ahmed', '18 meals', '৳ 493'],
    ['Sabbir Hossain', '15 meals', '৳ 411'],
    ['Nayeem Khan', '12 meals', '৳ 329'],
  ]

  return (
    <MobileCodeShell title="Split Preview" subtitle="Review before saving">
      <div className="space-y-2.5">
        <TourSectionCard title="Rice" caption="Food · Mess Deposit" action={<span className="text-[12px] font-black text-[#00777a]">৳ 1,850</span>}>
          <div className="grid grid-cols-2 gap-2"><div className="rounded-xl bg-[#f2f8f8] p-2"><p className="text-[6px] font-semibold text-[#71858a]">Used By</p><p className="mt-1 text-[8px] font-black">All Members</p></div><div className="rounded-xl bg-[#f2f8f8] p-2"><p className="text-[6px] font-semibold text-[#71858a]">Split Method</p><p className="mt-1 text-[8px] font-black">Meal Count</p></div></div>
        </TourSectionCard>
        <TourSectionCard title="Member allocation" caption="Calculated from this month’s meal count">
          <div className="overflow-hidden rounded-xl border border-[#e1e9ea]">
            {shares.map(([name, meals, share]) => <div key={name} className="flex items-center gap-2 border-b border-[#edf2f3] px-2.5 py-2 last:border-0"><span className="grid size-7 place-items-center rounded-full bg-[#e8f8f7] text-[7px] font-black text-[#00777a]">{name.split(' ').map((part) => part[0]).join('')}</span><div className="min-w-0 flex-1"><p className="truncate text-[8px] font-black">{name}</p><p className="text-[6px] font-semibold text-[#71858a]">{meals}</p></div><span className="text-[8px] font-black text-[#00777a]">{share}</span></div>)}
          </div>
          <div className="mt-2 flex items-center justify-between rounded-xl bg-[#e8f8f7] px-3 py-2"><span className="text-[8px] font-black">Total shared cost</span><span className="text-[10px] font-black text-[#00777a]">৳ 1,850</span></div>
        </TourSectionCard>
        <div className="grid grid-cols-[.7fr_1.3fr] gap-2"><div className="grid place-items-center rounded-xl border border-[#dce8ea] bg-white text-[8px] font-black">Edit</div><TourPrimaryAction active={activeItem === 'save'}><CheckCircle2 className="w-4" /> Save Expense</TourPrimaryAction></div>
      </div>
    </MobileCodeShell>
  )
}

function ExpenseSuccessTourScreen() {
  return (
    <MobileCodeShell title="Manage Expenses" subtitle="Monitor member costs and dues" activeTab="expenses">
      <div className="space-y-2.5">
        <TourStatusBanner title="Expense saved successfully" detail="The ledger and member balances were updated." />
        <div className="grid grid-cols-2 gap-2"><MetricGrid cards={[{ label: 'Food Expenses', value: '৳ 9,359.94', icon: ReceiptText }, { label: 'Total Expenses', value: '৳ 10,959.94', icon: CircleDollarSign }]} /></div>
        <TourSectionCard title="Recent Expenses" caption="The new expense is now first in the ledger">
          <TourRecordRows icon={ReceiptText} records={[{ title: 'Rice', meta: 'Food · Just now · Approved', value: '৳ 1,850', fresh: true }, { title: 'Fresh vegetables', meta: 'Grocery · Today', value: '৳ 920' }, { title: 'Cooking oil', meta: 'Food · 19 Aug', value: '৳ 1,350' }]} />
        </TourSectionCard>
      </div>
    </MobileCodeShell>
  )
}

function AddDepositTourScreen({ activeItem, scrollY = 0 }: { activeItem?: string; scrollY?: number }) {
  const has = (target: string) => stageReached(depositStages, activeItem, target)
  return (
    <MobileCodeShell title="Submit Deposit" subtitle="Manual entry">
      <TourScrollContent scrollY={scrollY} className="space-y-2.5 pb-6">
        <TourSectionCard title="Submit Deposit" caption="Deposits are paid manually first, then entered here.">
          <div className="space-y-2">
            <TourField label="Deposit Method" value={has('method') ? 'bKash' : ''} placeholder="Select method" icon={WalletCards} select active={activeItem === 'method'} />
            <div className="grid grid-cols-2 gap-2">
              <TourField label="Amount" value={has('amount') ? '2,000' : ''} placeholder="2500" icon={CircleDollarSign} active={activeItem === 'amount'} />
              <TourField label="Deposit Date" value={has('date') ? '23 Aug 2026' : ''} placeholder="Select date" icon={CalendarDays} active={activeItem === 'date'} />
            </div>
            <TourField label="Deposit For" value={has('paid-by') ? 'Rahim Ahmed' : ''} placeholder="Self" icon={UserRound} select active={activeItem === 'paid-by'} />
            <TourField label="Transaction ID" value={has('transaction') ? 'TXN-846291' : ''} placeholder="TXN123456" hint="Optional" icon={Hash} active={activeItem === 'transaction'} />
            <TourField label="Note" value={has('note') ? 'August mess deposit' : ''} placeholder="Deposit for monthly bill" icon={FileText} multiline active={activeItem === 'note'} />
          </div>
        </TourSectionCard>
        <div className="flex items-start gap-2 rounded-xl border border-[#bfe7e6] bg-[#edfafa] p-3"><CircleDollarSign className="mt-0.5 w-4 shrink-0 text-[#008d8c]" /><p className="text-[7px] font-semibold leading-3 text-[#397078]">This records a payment already made outside Messzen. Managers approve their own entries automatically.</p></div>
        <TourPrimaryAction active={activeItem === 'submit'}><Plus className="w-4" /> Submit Deposit</TourPrimaryAction>
      </TourScrollContent>
    </MobileCodeShell>
  )
}

function DepositSuccessTourScreen() {
  return (
    <MobileCodeShell title="Deposit" subtitle="Deposit submissions">
      <div className="space-y-2.5">
        <TourStatusBanner title="Deposit added and approved" detail="Rahim Ahmed’s contribution is reflected in the August balance." />
        <MetricGrid cards={[{ label: 'My Deposit', value: '৳ 3,000', icon: User }, { label: 'Total Deposit', value: '৳ 5,998', icon: WalletCards }, { label: 'Pending Deposit', value: '৳ 0', icon: Clock3 }]} />
        <TourSectionCard title="Recent Deposits">
          <TourRecordRows icon={CircleDollarSign} records={[{ title: 'Rahim Ahmed', meta: 'bKash · Just now · Approved', value: '৳ 2,000', fresh: true }, { title: 'Md Nazmul Hossain', meta: 'Cash · Approved', value: '৳ 998' }, { title: 'Mahabur Rahman', meta: 'Bank · Approved', value: '৳ 3,000' }]} />
        </TourSectionCard>
      </div>
    </MobileCodeShell>
  )
}

const moreGroups = [
  {
    label: 'Account',
    items: [
      { id: 'profile', label: 'Profile', description: 'Personal details and account', icon: User },
      { id: 'settings', label: 'Settings', description: 'Security and preferences', icon: ShieldCheck },
    ],
  },
  {
    label: 'Workspace',
    items: [
      { id: 'complaints', label: 'Complaints', description: 'Raise and follow up issues', icon: MessageSquareWarning },
      { id: 'mess-management', label: 'Mess Management', description: 'Rooms, rules and billing setup', icon: Settings },
      { id: 'subscription', label: 'Subscription', description: 'Current plan and available plans', icon: Crown },
    ],
  },
  {
    label: 'Help & legal',
    items: [
      { id: 'how-it-works', label: 'How It Works', description: 'A quick guide to Messzen', icon: BookOpenCheck },
      { id: 'contact-us', label: 'Contact Us', description: 'Get help from our support team', icon: ContactRound },
      { id: 'privacy-policy', label: 'Privacy Policy', description: 'How your information is handled', icon: ScrollText },
      { id: 'terms', label: 'Terms & Conditions', description: 'Rules for using Messzen', icon: FileCheck2 },
    ],
  },
]

function MoreDrawerScreen({ activeItem, scrollY = 0 }: { activeItem?: string; scrollY?: number }) {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <CurrentHomeScreen />
      <div className="absolute inset-0 bg-[#062b35]/50 backdrop-blur-[1px]" />
      <aside className="absolute inset-y-0 right-0 flex w-[78%] max-w-[336px] flex-col border-l border-[#dfe8ea] bg-white text-[#123748] shadow-[-18px_0_50px_rgba(18,55,72,.16)]">
        <div className="flex min-h-16 items-center justify-between border-b border-[#edf1f2] bg-white px-[18px]">
          <h2 className="text-[14px] font-black text-[#123748]">Messzen Menu</h2>
          <span className="grid size-[42px] place-items-center rounded-full border border-[#dfe8ea] bg-[#f7f9f9]"><X className="w-4 text-[#00777a]" /></span>
        </div>

        <div className="mx-3.5 mb-1.5 mt-3.5 flex min-h-[76px] items-center gap-3 rounded-[14px] border border-[#dfe8ea] bg-white p-3 shadow-[0_4px_14px_rgba(18,55,72,.055)]">
          <span className="grid size-[46px] place-items-center rounded-full border border-[#008d8c]/15 bg-[#edfafa] text-[10px] font-black text-[#00777a]">M</span>
          <div className="min-w-0 flex-1"><p className="truncate text-[10px] font-black text-[#123748]">Mahabur Rahman</p><p className="mt-0.5 truncate text-[7px] font-semibold text-[#71858a]">mahabur@example.com</p></div>
          <User className="w-4 text-[#4d6970]" />
        </div>

        <div className="min-h-0 flex-1 overflow-hidden px-3.5 pb-2 pt-1">
          <TourScrollContent scrollY={scrollY} className="pb-3">
            {moreGroups.map((group) => (
              <section key={group.label} className="mt-3">
                <h3 className="mb-1.5 px-1 text-[7px] font-black uppercase tracking-[.12em] text-[#5f777e]">{group.label}</h3>
                <div className="overflow-hidden rounded-[14px] border border-[#d8e5e7] bg-white">
                  {group.items.map(({ id, label, description, icon: Icon }) => (
                    <div key={id} className={`flex min-h-14 items-center gap-3 border-b border-[#edf2f3] px-3 py-2 last:border-0 transition-all ${activeItem === id ? 'bg-[#e4f7f5] ring-2 ring-inset ring-[#008d8c]/20' : 'bg-white'}`}>
                      <span className="grid size-9 shrink-0 place-items-center rounded-[11px] bg-[#008d8c]/10 text-[#111827]"><Icon className="w-4" /></span>
                      <div className="min-w-0 flex-1"><p className="truncate text-[9px] font-black text-[#123748]">{label}</p><p className="mt-0.5 truncate text-[6px] font-semibold text-[#71858a]">{description}</p></div>
                      <span className="text-[12px] font-bold text-[#789096]">›</span>
                    </div>
                  ))}
                </div>
              </section>
            ))}
            <div className="mt-3 flex min-h-12 items-center gap-2.5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-rose-600"><span className="grid size-9 place-items-center rounded-lg bg-white"><LogOut className="w-4" /></span><span className="text-[9px] font-black">Log out</span></div>
            <p className="py-3 text-center text-[7px] font-semibold text-[#789096]">Messzen version 0.1.0</p>
          </TourScrollContent>
        </div>
      </aside>
    </div>
  )
}

export function MobileTourScreen({ screen, activeItem, scrollY }: { screen: MobileScreenId; activeItem?: string; scrollY?: number }) {
  if (screen === 'home') return <CurrentHomeScreen activeItem={activeItem} scrollY={scrollY} />
  if (screen === 'meals') return <CurrentMealsOverviewScreen scrollY={scrollY} />
  if (screen === 'expenses') return <CurrentExpensesScreen scrollY={scrollY} view={activeItem === 'manager-view' ? 'manager' : 'my'} />
  if (screen === 'expense-actions') return <CurrentExpensesScreen actionsOpen />
  if (screen === 'add-expense') return <CurrentCostEntryScreen kind="expense" activeItem={activeItem} scrollY={scrollY} />
  if (screen === 'expense-preview') return <CurrentCostPreviewScreen kind="expense" activeItem={activeItem} />
  if (screen === 'expense-success') return <CurrentCostSuccessScreen kind="expense" />
  if (screen === 'add-utility') return <CurrentCostEntryScreen kind="utility" activeItem={activeItem} scrollY={scrollY} />
  if (screen === 'utility-preview') return <CurrentCostPreviewScreen kind="utility" activeItem={activeItem} />
  if (screen === 'utility-success') return <CurrentCostSuccessScreen kind="utility" />
  if (screen === 'deposits') return <CurrentDepositScreen />
  if (screen === 'add-deposit') return <CurrentDepositEntryScreen activeItem={activeItem} scrollY={scrollY} />
  if (screen === 'deposit-success') return <CurrentDepositScreen success />
  if (screen === 'monthly-bill') return <CurrentMonthlyBillOverviewScreen scrollY={scrollY} />
  if (screen === 'notices') return <CurrentNoticesScreen activeItem={activeItem} scrollY={scrollY} />
  if (screen === 'members') return <CurrentMembersScreen activeItem={activeItem} scrollY={scrollY} />
  if (screen === 'ai') return <CurrentAiQuickAddScreen stage={activeItem === 'voice' ? 'voice' : activeItem === 'ready' ? 'ready' : activeItem === 'command' ? 'command' : 'intro'} scrollY={scrollY} />
  if (screen === 'ai-review') return <CurrentCostEntryScreen kind="expense" activeItem={activeItem} scrollY={scrollY} aiPrefilled />
  if (screen === 'ai-preview') return <CurrentCostPreviewScreen kind="expense" activeItem={activeItem} />
  if (screen === 'ai-success') return <CurrentAiSuccessScreen />
  if (screen === 'meal-pattern') return <CurrentMealPatternScreen stage="overview" activeItem={activeItem} scrollY={scrollY} />
  if (screen === 'meal-pattern-type') return <CurrentMealPatternScreen stage="type" activeItem={activeItem} scrollY={scrollY} />
  if (screen === 'meal-pattern-schedule') return <CurrentMealPatternScreen stage="schedule" activeItem={activeItem} scrollY={scrollY} />
  if (screen === 'meal-pattern-success') return <CurrentMealPatternScreen stage="success" />
  if (screen === 'more') return <MoreDrawerScreen activeItem={activeItem} scrollY={scrollY} />
  return <CurrentMenuDestinationScreen screen={screen as CurrentMenuScreenId} scrollY={scrollY} />
}
