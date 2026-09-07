'use client'

import type { ReactNode } from 'react'
import {
  BadgeCheck,
  CalendarCheck2,
  Check,
  CheckCircle2,
  Clock3,
  Eye,
  Mic,
  Send,
  Sparkles,
  UtensilsCrossed,
  WalletCards,
  WandSparkles,
} from 'lucide-react'
import { ProductTourPlayer, type ProductTourStep } from '@/components/product-tour/tour-player'
import { TourField, TourHeader, TourPanel, TourPrimaryButton, TourSidebar } from '@/components/product-tour/tour-primitives'

function FeatureCanvas({ activeNav, title, subtitle, action, children, accent = false }: { activeNav: string; title: string; subtitle: string; action?: ReactNode; children: ReactNode; accent?: boolean }) {
  return (
    <>
      <TourSidebar activeNav={activeNav} showAccent={accent} />
      <div className="absolute inset-y-0 left-[20%] right-0 animate-in fade-in duration-300">
        <TourHeader title={title} subtitle={subtitle} action={action} />
        <div className="relative h-[85%] overflow-hidden px-[4%] py-[3%]">{children}</div>
      </div>
    </>
  )
}

function SuccessToast({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="absolute right-[4%] top-[3%] z-10 flex items-center gap-2 rounded-[8px] border border-emerald-200 bg-emerald-50 px-3 py-2 text-emerald-800 shadow-lg">
      <CheckCircle2 className="w-3.5" />
      <div><p className="text-[clamp(5px,.8vw,8px)] font-semibold">{title}</p><p className="text-[clamp(4px,.62vw,6px)] font-semibold text-emerald-700">{detail}</p></div>
    </div>
  )
}

function SummaryCards({ cards }: { cards: Array<{ label: string; value: string }> }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {cards.map((card) => (
        <div key={card.label} className="rounded-[8px] border border-[#dce7ea] bg-white px-3 py-2 shadow-sm">
          <p className="text-[clamp(4px,.62vw,6px)] font-bold text-[#71839a]">{card.label}</p>
          <p className="mt-1 text-[clamp(7px,1.05vw,11px)] font-semibold text-[#123748]">{card.value}</p>
        </div>
      ))}
    </div>
  )
}

const depositSteps = [
  { id: 'open', title: 'Open Payments', detail: 'Choose the current Payments module from the manager sidebar.', x: 10, y: 53, duration: 2100 },
  { id: 'add', title: 'Deposit form opens', detail: 'A clean entry form is ready for the new contribution.', x: 31, y: 18, duration: 1800 },
  { id: 'member', title: 'Choose the member', detail: 'Select who made this contribution.', x: 48, y: 38, duration: 1900 },
  { id: 'amount', title: 'Enter the amount', detail: 'Record the exact amount received.', x: 73, y: 38, duration: 2200, typeText: '2000' },
  { id: 'date', title: 'Confirm the date', detail: 'Keep the deposit in the correct billing month.', x: 48, y: 57, duration: 1800 },
  { id: 'note', title: 'Add a useful note', detail: 'A short note keeps the ledger easy to audit.', x: 72, y: 57, duration: 2600, typeText: 'Monthly contribution' },
  { id: 'save', title: 'Save the deposit', detail: 'The member balance updates immediately.', x: 82, y: 83, duration: 2100 },
  { id: 'success', title: 'Deposit added', detail: 'The new contribution is visible in the ledger.', x: 76, y: 22, duration: 2800 },
] as const satisfies readonly ProductTourStep[]

type DepositStepId = (typeof depositSteps)[number]['id']
const depositIndex = Object.fromEntries(depositSteps.map((step, index) => [step.id, index])) as Record<DepositStepId, number>

function DepositLedger({ success }: { success: boolean }) {
  const entries = [
    ...(success ? [{ member: 'Rahim Ahmed', note: 'Monthly contribution', date: '23 Aug 2026', amount: '৳ 2,000' }] : []),
    { member: 'Sabbir Hossain', note: 'August deposit', date: '20 Aug 2026', amount: '৳ 1,500' },
    { member: 'Nayeem Khan', note: 'Monthly contribution', date: '18 Aug 2026', amount: '৳ 1,800' },
    { member: 'Mahabur Rahman', note: 'Advance contribution', date: '12 Aug 2026', amount: '৳ 2,200' },
  ]

  return (
    <FeatureCanvas
      activeNav="payments"
      title="Deposits"
      subtitle="Member contribution ledger"
    >
      {success ? <SuccessToast title="Deposit added successfully" detail="Rahim's balance increased by ৳2,000" /> : null}
      <SummaryCards cards={[{ label: 'Total deposits', value: success ? '৳ 8,500' : '৳ 6,500' }, { label: 'This month', value: success ? '4 entries' : '3 entries' }, { label: 'Average deposit', value: success ? '৳ 2,125' : '৳ 2,167' }]} />
      <TourPanel title="Deposit ledger" className="mt-[3%] !p-0">
        <div className="grid grid-cols-[1.1fr_1.2fr_.8fr_.65fr] bg-[#f6f9fa] px-[3%] py-2 text-[clamp(4px,.6vw,6px)] font-semibold uppercase text-[#71839a]"><span>Member</span><span>Note</span><span>Date</span><span className="text-right">Amount</span></div>
        {entries.map((entry, index) => (
          <div key={`${entry.member}-${entry.date}`} className={`grid grid-cols-[1.1fr_1.2fr_.8fr_.65fr] items-center border-t border-[#edf2f3] px-[3%] py-[2.3%] text-[clamp(5px,.73vw,8px)] ${success && index === 0 ? 'bg-emerald-50/70' : ''}`}>
            <span className="flex items-center gap-2 font-semibold"><span className="grid size-6 place-items-center rounded-full bg-[#dff4f3] text-[5px] text-[#00777a]">{entry.member.split(' ').map((word) => word[0]).join('')}</span>{entry.member}</span>
            <span className="font-bold text-[#647a82]">{entry.note}</span><span className="font-bold text-[#647a82]">{entry.date}</span><span className="text-right font-semibold text-[#00777a]">{entry.amount}</span>
          </div>
        ))}
      </TourPanel>
    </FeatureCanvas>
  )
}

function DepositForm({ activeId, currentStep, typedValue }: { activeId: DepositStepId; currentStep: number; typedValue: string }) {
  const amount = activeId === 'amount' ? typedValue : currentStep > depositIndex.amount ? '2000' : ''
  const note = activeId === 'note' ? typedValue : currentStep > depositIndex.note ? 'Monthly contribution' : ''
  return (
    <FeatureCanvas activeNav="payments" title="Add Deposit" subtitle="Record a member contribution" accent>
      <div className="mx-auto max-w-[78%]">
        <TourPanel title="Deposit Details">
          <div className="grid grid-cols-2 gap-3">
            <TourField label="Deposit For" value={currentStep >= depositIndex.member ? 'Rahim Ahmed' : ''} placeholder="Select member" active={activeId === 'member'} select />
            <TourField label="Amount" value={amount} placeholder="1500" active={activeId === 'amount'} />
            <TourField label="Date" value="23 Aug 2026" active={activeId === 'date'} />
            <TourField label="Note" value={note} placeholder="Monthly contribution" active={activeId === 'note'} />
          </div>
          <div className="mt-3 flex items-start gap-2 rounded-[8px] bg-[#eff9f8] px-3 py-2"><BadgeCheck className="mt-0.5 w-3 text-[#008d8c]" /><p className="text-[clamp(4px,.62vw,6px)] font-semibold leading-4 text-[#526b72]">Deposits are added directly to the selected member&apos;s contribution ledger.</p></div>
        </TourPanel>
        <div className="mt-3 flex justify-end"><TourPrimaryButton active={activeId === 'save'}><WalletCards className="w-3" /> Add Deposit</TourPrimaryButton></div>
      </div>
    </FeatureCanvas>
  )
}

type TourPlaybackProps = { loop?: boolean; onComplete?: () => void }

export function MarketingDepositTour({ loop, onComplete }: TourPlaybackProps = {}) {
  return (
    <ProductTourPlayer steps={depositSteps} address="app.messzen.com/deposits" ariaLabel="Animated walkthrough showing how to add a member deposit" loop={loop} onComplete={onComplete}>
      {({ activeStep, stepIndex, typedValue }) => activeStep.id === 'open'
        ? <DepositLedger success={false} />
        : activeStep.id === 'success'
          ? <DepositLedger success />
          : <DepositForm activeId={activeStep.id} currentStep={stepIndex} typedValue={typedValue} />}
    </ProductTourPlayer>
  )
}

const mealSteps = [
  { id: 'open', title: 'Open Meal Sheet', detail: 'Choose the current Meal Sheet module from the manager sidebar.', x: 10, y: 35, duration: 2100 },
  { id: 'add', title: 'Manual meal form opens', detail: 'Choose the member, meal, status, and date.', x: 31, y: 18, duration: 1800 },
  { id: 'member', title: 'Select the member', detail: 'Choose whose meal record will change.', x: 39, y: 35, duration: 1900 },
  { id: 'meal', title: 'Choose Dinner', detail: 'Breakfast, lunch, and dinner are tracked separately.', x: 70, y: 36, duration: 2000 },
  { id: 'count', title: 'Set the meal count', detail: 'Add regular or guest meal quantities.', x: 82, y: 50, duration: 1900 },
  { id: 'status', title: 'Confirm meal status', detail: 'Mark it as a regular meal for this member.', x: 40, y: 57, duration: 1900 },
  { id: 'date', title: 'Choose the date', detail: 'The meal lands in the correct daily sheet.', x: 70, y: 65, duration: 1800 },
  { id: 'save', title: 'Save the meal', detail: 'Totals and monthly calculations update together.', x: 83, y: 84, duration: 2100 },
  { id: 'success', title: 'Meal saved', detail: 'Dinner now appears in Rahim’s daily record.', x: 76, y: 21, duration: 2800 },
] as const satisfies readonly ProductTourStep[]

type MealStepId = (typeof mealSteps)[number]['id']
const mealIndex = Object.fromEntries(mealSteps.map((step, index) => [step.id, index])) as Record<MealStepId, number>

function MealSheet({ success }: { success: boolean }) {
  const members = [
    { name: 'Rahim Ahmed', breakfast: '0.5', lunch: '1', dinner: success ? '2' : '1', total: success ? '3.5' : '2.5' },
    { name: 'Sabbir Hossain', breakfast: '1', lunch: '1', dinner: '1', total: '3' },
    { name: 'Nayeem Khan', breakfast: '0', lunch: '1', dinner: '1', total: '2' },
  ]
  return (
    <FeatureCanvas activeNav="meals" title="Meal Sheet" subtitle="Daily member meal records">
      {success ? <SuccessToast title="Meal saved successfully" detail="Rahim's dinner count is now 2" /> : null}
      <SummaryCards cards={[{ label: 'Today’s meals', value: success ? '8.5' : '7.5' }, { label: 'Breakfast', value: '1.5' }, { label: 'Lunch & dinner', value: success ? '7' : '6' }]} />
      <TourPanel title="23 August meal sheet" className="mt-[3%] !p-0">
        <div className="grid grid-cols-[1.4fr_repeat(4,.65fr)] bg-[#f6f9fa] px-[3%] py-2 text-[clamp(4px,.6vw,6px)] font-semibold uppercase text-[#71839a]"><span>Member</span><span>Breakfast</span><span>Lunch</span><span>Dinner</span><span>Total</span></div>
        {members.map((member, index) => <div key={member.name} className={`grid grid-cols-[1.4fr_repeat(4,.65fr)] items-center border-t border-[#edf2f3] px-[3%] py-[2.6%] text-[clamp(5px,.75vw,8px)] ${success && index === 0 ? 'bg-emerald-50/70' : ''}`}><span className="font-semibold">{member.name}</span><span>{member.breakfast}</span><span>{member.lunch}</span><span className="font-semibold text-[#008d8c]">{member.dinner}</span><span className="font-semibold">{member.total}</span></div>)}
      </TourPanel>
    </FeatureCanvas>
  )
}

function MealForm({ activeId, currentStep }: { activeId: MealStepId; currentStep: number }) {
  return (
    <FeatureCanvas activeNav="meals" title="Add Meal" subtitle="Manual meal entry" accent>
      <div className="grid grid-cols-[.8fr_1.2fr] gap-[3%]">
        <TourPanel title="Member & Status">
          <div className="space-y-2">
            <TourField label="Member" value={currentStep >= mealIndex.member ? 'Rahim Ahmed' : ''} placeholder="Select member" active={activeId === 'member'} select />
            <div className={`rounded-[8px] border p-2 ${activeId === 'status' ? 'border-[#008d8c] ring-2 ring-[#008d8c]/10' : 'border-[#dce7ea]'}`}><p className="text-[4px] font-bold text-[#71839a]">Meal Status</p><div className="mt-1.5 grid grid-cols-2 gap-1.5"><span className="rounded-[6px] bg-[#008d8c] px-2 py-1.5 text-center text-[5px] font-semibold text-white">I will take meal</span><span className="rounded-[6px] bg-[#f3f6f7] px-2 py-1.5 text-center text-[5px] font-semibold text-[#71839a]">Guest meal</span></div></div>
            <TourField label="Date" value="23 Aug 2026" active={activeId === 'date'} />
          </div>
        </TourPanel>
        <TourPanel title="Meal Name" active={activeId === 'meal' || activeId === 'count'}>
          <div className="space-y-2">
            {[
              { name: 'Breakfast', count: '0.5', selected: false },
              { name: 'Lunch', count: '1', selected: false },
              { name: 'Dinner', count: currentStep >= mealIndex.count ? '2' : '1', selected: currentStep >= mealIndex.meal },
            ].map((meal) => <div key={meal.name} className={`flex items-center justify-between rounded-[8px] border px-3 py-2 ${meal.selected ? 'border-[#008d8c] bg-[#f0fbf9]' : 'border-[#dce7ea]'}`}><span className="flex items-center gap-2 text-[clamp(5px,.72vw,8px)] font-semibold"><span className="grid size-6 place-items-center rounded-[6px] bg-[#e6f7f6]"><UtensilsCrossed className="w-3 text-[#008d8c]" /></span>{meal.name}</span><span className="flex overflow-hidden rounded-[6px] border border-[#bfe7e6] text-[clamp(5px,.7vw,7px)] font-semibold"><b className="px-2 py-1 text-[#00777a]">−</b><b className="border-x border-[#bfe7e6] px-2 py-1">{meal.count}</b><b className={`px-2 py-1 ${meal.selected ? 'bg-[#008d8c] text-white' : 'text-[#00777a]'}`}>+</b></span></div>)}
          </div>
        </TourPanel>
      </div>
      <div className="mt-3 flex justify-end"><TourPrimaryButton active={activeId === 'save'}><UtensilsCrossed className="w-3" /> Save Meal</TourPrimaryButton></div>
    </FeatureCanvas>
  )
}

export function MarketingManualMealTour({ loop, onComplete }: TourPlaybackProps = {}) {
  return <ProductTourPlayer steps={mealSteps} address="app.messzen.com/meals" ariaLabel="Animated walkthrough showing how to add a meal manually" loop={loop} onComplete={onComplete}>{({ activeStep, stepIndex }) => activeStep.id === 'open' ? <MealSheet success={false} /> : activeStep.id === 'success' ? <MealSheet success /> : <MealForm activeId={activeStep.id} currentStep={stepIndex} />}</ProductTourPlayer>
}

const patternSteps = [
  { id: 'open', title: 'Open Meal Sheet', detail: 'Meal automation starts from the current meal workspace.', x: 10, y: 35, duration: 2100 },
  { id: 'create', title: 'Pattern builder opens', detail: 'Start a recurring daily or weekly schedule.', x: 31, y: 18, duration: 1800 },
  { id: 'weekly', title: 'Choose Weekly', detail: 'Set a different routine for each weekday.', x: 67, y: 39, duration: 2100 },
  { id: 'monday', title: 'Plan Monday', detail: 'Breakfast, lunch, and dinner counts are flexible.', x: 49, y: 56, duration: 2100 },
  { id: 'friday', title: 'Adjust Friday', detail: 'Only lunch and dinner will run on Friday.', x: 76, y: 56, duration: 2100 },
  { id: 'activate', title: 'Save and activate', detail: 'Messzen will repeat this schedule automatically.', x: 83, y: 84, duration: 2200 },
  { id: 'success', title: 'Pattern is active', detail: 'Future meals will be created from this weekly routine.', x: 72, y: 24, duration: 3000 },
] as const satisfies readonly ProductTourStep[]
type PatternStepId = (typeof patternSteps)[number]['id']

const patternDays = [
  { day: 'Monday', short: 'Mon', meals: ['B', 'L', 'D'] },
  { day: 'Tuesday', short: 'Tue', meals: ['L', 'D'] },
  { day: 'Wednesday', short: 'Wed', meals: ['B', 'L', 'D'] },
  { day: 'Thursday', short: 'Thu', meals: ['B', 'L', 'D'] },
  { day: 'Friday', short: 'Fri', meals: ['L', 'D'] },
  { day: 'Saturday', short: 'Sat', meals: ['B', 'L', 'D'] },
  { day: 'Sunday', short: 'Sun', meals: ['B', 'D'] },
]

function PatternOverview({ success }: { success: boolean }) {
  return (
    <FeatureCanvas activeNav="meals" title="Meal Pattern" subtitle="Simple, automatic meal planning">
      {success ? <SuccessToast title="Weekly pattern activated" detail="Your schedule will continue automatically" /> : null}
      <TourPanel title={success ? 'Active weekly pattern' : 'Meal automation'} aside={success ? <span className="rounded-full bg-emerald-100 px-2 py-1 text-[5px] font-semibold text-emerald-700">Active</span> : null}>
        {success ? <div className="grid grid-cols-7 gap-2">{patternDays.map((day) => <div key={day.day} className="rounded-[8px] bg-[#f3f8f8] p-2 text-center"><p className="text-[5px] font-semibold text-[#61787e]">{day.short}</p><div className="mt-2 space-y-1">{['B','L','D'].map((meal) => <span key={meal} className={`mx-auto grid size-5 place-items-center rounded-[5px] text-[5px] font-semibold ${day.meals.includes(meal) ? 'bg-[#008d8c] text-white' : 'bg-[#e2e9ea] text-[#9aabad]'}`}>{meal}</span>)}</div></div>)}</div> : <div className="grid grid-cols-3 gap-3">{[{ icon: CalendarCheck2, title: 'Weekly routines', text: 'Different meals for every day' }, { icon: Clock3, title: 'Runs automatically', text: 'No repetitive daily entry' }, { icon: UtensilsCrossed, title: 'Always editable', text: 'Change whenever plans change' }].map(({icon:Icon,title,text}) => <div key={title} className="rounded-[8px] bg-[#f4f9f9] p-3"><Icon className="w-4 text-[#008d8c]" /><p className="mt-2 text-[6px] font-semibold">{title}</p><p className="mt-1 text-[5px] font-semibold text-[#71839a]">{text}</p></div>)}</div>}
        {success ? <div className="mt-3 flex items-center gap-2 rounded-[8px] bg-[#e8f8f7] px-3 py-2"><CheckCircle2 className="w-3.5 text-[#008d8c]" /><p className="text-[6px] font-semibold text-[#17605d]">Next week continues automatically—no new entry needed.</p></div> : null}
      </TourPanel>
    </FeatureCanvas>
  )
}

function PatternBuilder({ activeId }: { activeId: PatternStepId }) {
  return (
    <FeatureCanvas activeNav="meals" title="Create Meal Pattern" subtitle="Build your recurring routine" accent>
      <div className="grid grid-cols-[.62fr_1.38fr] gap-[3%]">
        <TourPanel title="Pattern Type" active={activeId === 'weekly'}>
          <div className="space-y-2"><div className="rounded-[8px] border border-[#dce7ea] p-3"><p className="text-[6px] font-semibold">Daily</p><p className="mt-1 text-[5px] text-[#71839a]">Same meals every day</p></div><div className="rounded-[8px] border border-[#008d8c] bg-[#effaf9] p-3 ring-2 ring-[#008d8c]/10"><p className="flex items-center justify-between text-[6px] font-semibold text-[#00777a]">Weekly <Check className="w-3" /></p><p className="mt-1 text-[5px] text-[#5e777c]">Customize each weekday</p></div></div>
        </TourPanel>
        <TourPanel title="Plan each day">
          <div className="grid grid-cols-2 gap-2">{patternDays.slice(0, 6).map((day) => { const active = (activeId === 'monday' && day.short === 'Mon') || (activeId === 'friday' && day.short === 'Fri'); return <div key={day.day} className={`rounded-[8px] border px-2.5 py-2 ${active ? 'border-[#008d8c] bg-[#f0fbf9] ring-2 ring-[#008d8c]/10' : 'border-[#dce7ea]'}`}><div className="flex items-center justify-between"><p className="text-[5px] font-semibold">{day.day}</p><span className="text-[4px] font-bold text-[#71839a]">{day.meals.length} meals</span></div><div className="mt-1.5 flex gap-1">{['B','L','D'].map((meal) => <span key={meal} className={`grid size-5 place-items-center rounded-[5px] text-[5px] font-semibold ${day.meals.includes(meal) ? 'bg-[#008d8c] text-white' : 'bg-[#edf2f2] text-[#94a6a9]'}`}>{meal}</span>)}</div></div>})}</div>
        </TourPanel>
      </div>
      <div className="mt-3 flex justify-end"><TourPrimaryButton active={activeId === 'activate'}><Check className="w-3" /> Save & Activate</TourPrimaryButton></div>
    </FeatureCanvas>
  )
}

export function MarketingMealPatternTour({ loop, onComplete }: TourPlaybackProps = {}) {
  return <ProductTourPlayer steps={patternSteps} address="app.messzen.com/meal-pattern" ariaLabel="Animated walkthrough showing how to create a weekly meal pattern" loop={loop} onComplete={onComplete}>{({ activeStep }) => activeStep.id === 'open' ? <PatternOverview success={false} /> : activeStep.id === 'success' ? <PatternOverview success /> : <PatternBuilder activeId={activeStep.id} />}</ProductTourPlayer>
}

const aiSteps = [
  { id: 'open', title: 'Start from Dashboard', detail: 'AI-assisted actions stay connected to the current workspace.', x: 10, y: 23, duration: 2200 },
  { id: 'command', title: 'Write a natural command', detail: 'Bangla, English, and Banglish are supported.', x: 62, y: 49, duration: 3600, typeText: 'Add Rahim deposit 2000' },
  { id: 'analyze', title: 'Let AI prepare the entry', detail: 'Messzen detects the action and extracts each detail.', x: 78, y: 69, duration: 2400 },
  { id: 'review', title: 'Review the preview', detail: 'Nothing is saved until every field is checked.', x: 58, y: 45, duration: 2500 },
  { id: 'confirm', title: 'Confirm the AI entry', detail: 'Approve the structured deposit when it looks right.', x: 83, y: 83, duration: 2200 },
  { id: 'success', title: 'AI command completed', detail: 'Rahim’s ৳2,000 deposit is saved successfully.', x: 70, y: 40, duration: 3000 },
] as const satisfies readonly ProductTourStep[]
type AiStepId = (typeof aiSteps)[number]['id']

function AiComposer({ activeId, typedValue }: { activeId: AiStepId; typedValue: string }) {
  const analyzing = activeId === 'analyze'
  return (
    <FeatureCanvas activeNav="dashboard" title="AI Quick Add" subtitle="Speak or type what happened" action={<span className="flex items-center gap-1 rounded-full bg-violet-100 px-2 py-1 text-[5px] font-semibold text-violet-700"><Sparkles className="w-2.5" /> AI assisted</span>} accent>
      <div className="mx-auto max-w-[78%]">
        <div className="relative overflow-hidden rounded-[12px] bg-gradient-to-br from-[#102f39] via-[#075d5c] to-[#008d8c] p-[5%] text-white shadow-xl">
          <WandSparkles className="absolute right-[6%] top-[15%] w-12 text-white/10" />
          <p className="flex items-center gap-1.5 text-[5px] font-semibold uppercase tracking-[.12em] text-teal-200"><Sparkles className="w-3" /> Messzen AI Assistant</p>
          <h2 className="mt-2 text-[clamp(10px,1.5vw,16px)] font-semibold">What would you like to add?</h2>
          <div className={`mt-4 rounded-[9px] border bg-white/95 p-3 text-[#123748] ${activeId === 'command' ? 'border-teal-300 ring-4 ring-white/10' : 'border-white/20'}`}>
            <p className="text-[4px] font-bold text-[#71839a]">Write a command</p>
            <div className="mt-1 flex min-h-8 items-center justify-between"><span className={`text-[clamp(6px,.9vw,10px)] font-semibold ${typedValue ? 'text-[#123748]' : 'text-[#9aabad]'}`}>{typedValue || 'e.g. Add Rahim deposit 2000'}{activeId === 'command' && typedValue ? <span className="ml-0.5 inline-block h-[1em] w-px animate-pulse bg-[#008d8c]" /> : null}</span><button type="button" className="grid size-7 place-items-center rounded-full bg-[#e7f5f4] text-[#008d8c]"><Mic className="w-3.5" /></button></div>
          </div>
          <div className="mt-3 flex items-center justify-between"><span className="flex items-center gap-1 text-[5px] font-bold text-white/70"><BadgeCheck className="w-3" /> Review before anything is saved</span><TourPrimaryButton active={analyzing} tone="ai"><Send className="w-3" /> {analyzing ? 'Analyzing...' : 'Analyze Command'}</TourPrimaryButton></div>
        </div>
        <div className="mt-3 grid grid-cols-4 gap-2">{['Expense','Utility','Deposit','Meal'].map((item) => <div key={item} className="rounded-[7px] border border-[#dce7ea] bg-white py-2 text-center text-[5px] font-semibold text-[#607981]">{item}</div>)}</div>
      </div>
    </FeatureCanvas>
  )
}

function AiReview({ activeId }: { activeId: AiStepId }) {
  const success = activeId === 'success'
  return (
    <FeatureCanvas activeNav="dashboard" title={success ? 'AI Quick Add' : 'Submit Deposit'} subtitle={success ? 'Command completed' : 'AI-prefilled entry · Review before saving'} accent>
      <div className="mx-auto max-w-[74%]">
        {success ? <div className="rounded-[12px] border border-emerald-200 bg-emerald-50 p-[7%] text-center shadow-sm"><span className="mx-auto grid size-12 place-items-center rounded-full bg-emerald-500 text-white"><CheckCircle2 className="w-6" /></span><h2 className="mt-3 text-[clamp(9px,1.4vw,15px)] font-semibold text-emerald-900">Deposit saved successfully</h2><p className="mt-1 text-[clamp(5px,.72vw,8px)] font-semibold text-emerald-700">Rahim Ahmed · ৳2,000 · 23 August 2026</p><div className="mx-auto mt-3 max-w-[65%] rounded-[8px] bg-white px-3 py-2 text-[5px] font-bold text-[#607981]">Member balance and deposit ledger updated together</div></div> : <><TourPanel title="AI Preview" aside={<span className="flex items-center gap-1 rounded-full bg-violet-100 px-2 py-1 text-[5px] font-semibold text-violet-700"><Sparkles className="w-2.5" /> Deposit detected</span>} active={activeId === 'review'}><div className="grid grid-cols-2 gap-2"><TourField label="Deposit For" value="Rahim Ahmed" select /><TourField label="Amount" value="2000" /><TourField label="Date" value="23 Aug 2026" /><TourField label="Note" value="AI Quick Add" /></div><div className="mt-3 flex items-center gap-2 rounded-[8px] bg-[#eff9f8] px-3 py-2"><Eye className="w-3 text-[#008d8c]" /><p className="text-[5px] font-bold text-[#526b72]">Check member, amount, and date before confirming.</p></div></TourPanel><div className="mt-3 flex justify-between"><button type="button" className="rounded-[7px] border border-[#cbdadc] bg-white px-4 py-2 text-[6px] font-semibold text-[#5e747c]">Back to Edit</button><TourPrimaryButton active={activeId === 'confirm'} tone="ai"><Check className="w-3" /> Confirm & Save</TourPrimaryButton></div></>}
      </div>
    </FeatureCanvas>
  )
}

export function MarketingAiQuickAddTour({ loop, onComplete }: TourPlaybackProps = {}) {
  return <ProductTourPlayer steps={aiSteps} address="app.messzen.com/quick-add" ariaLabel="Animated walkthrough showing how to use Messzen AI Quick Add" loop={loop} onComplete={onComplete}>{({ activeStep, typedValue }) => activeStep.id === 'open' || activeStep.id === 'command' || activeStep.id === 'analyze' ? <AiComposer activeId={activeStep.id} typedValue={activeStep.id === 'open' ? '' : typedValue || (activeStep.id === 'analyze' ? 'Add Rahim deposit 2000' : '')} /> : <AiReview activeId={activeStep.id} />}</ProductTourPlayer>
}
