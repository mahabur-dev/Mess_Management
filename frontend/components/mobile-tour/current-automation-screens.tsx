import {
  ArrowRight,
  BadgeCheck,
  CalendarCheck2,
  CalendarDays,
  CalendarRange,
  Check,
  CircleCheck,
  MessageSquareText,
  Mic,
  ReceiptText,
  RefreshCw,
  Sparkles,
  Square,
  UtensilsCrossed,
  WalletCards,
  WandSparkles,
  Zap,
} from 'lucide-react'
import {
  CurrentAppScreen,
  TourPrimaryAction,
  TourScrollContent,
  TourSectionCard,
} from '@/components/mobile-tour/mobile-tour-primitives'

type MealPatternStage = 'overview' | 'type' | 'schedule' | 'success'
type AiStage = 'intro' | 'command' | 'voice' | 'ready'

function AssistantInfoCard({ eyebrow, title, description, icon: Icon }: { eyebrow: string; title: string; description: string; icon: typeof CircleCheck }) {
  return (
    <section className="relative overflow-hidden rounded-[18px] border border-violet-200/70 bg-[radial-gradient(circle_at_94%_7%,rgba(197,188,255,.5),transparent_26%),radial-gradient(circle_at_7%_100%,rgba(223,244,243,.72),transparent_31%),linear-gradient(135deg,#fff_0%,#faf9ff_52%,#f1efff_100%)] p-4 shadow-[0_10px_28px_rgba(73,61,145,.12)]">
      <span className="absolute -right-8 -top-9 size-28 rounded-full border-[18px] border-white/30 bg-violet-200/20" />
      <div className="relative flex items-start gap-3"><div className="min-w-0 flex-1"><p className="text-[7px] font-black uppercase tracking-[.12em] text-[#008d8c]">{eyebrow}</p><h2 className="mt-1 text-[11px] font-black text-[#123748]">{title}</h2></div><span className="grid size-11 shrink-0 place-items-center rounded-[14px] border border-[#4f70a5]/15 bg-gradient-to-br from-[#f1efff] to-[#dff4f3] text-[#4f70a5] shadow-sm"><Icon className="w-5" /></span></div>
      <p className="relative mt-3 max-w-[82%] text-[7px] font-semibold leading-3 text-[#65838b]">{description}</p>
    </section>
  )
}

function PatternChoiceCard({ weekly = false, selected = false }: { weekly?: boolean; selected?: boolean }) {
  const Icon = weekly ? CalendarRange : CalendarDays
  return (
    <article className={`relative flex min-h-[285px] flex-col overflow-hidden rounded-[20px] border bg-[radial-gradient(circle_at_94%_7%,rgba(197,188,255,.5),transparent_26%),radial-gradient(circle_at_7%_100%,rgba(223,244,243,.72),transparent_31%),linear-gradient(135deg,#fff_0%,#faf9ff_52%,#f1efff_100%)] p-4 shadow-[0_10px_28px_rgba(73,61,145,.12)] ${selected ? 'border-violet-500 ring-2 ring-violet-500/15' : 'border-violet-200/70'}`}>
      <span className="grid size-12 place-items-center rounded-[14px] border border-[#4f70a5]/15 bg-gradient-to-br from-[#f1efff] to-[#dff4f3] text-[#4f70a5] shadow-[0_7px_16px_rgba(58,82,125,.11)]"><Icon className="w-5" /></span>
      <span className="absolute right-2.5 top-3 rounded-full border border-violet-200 bg-white/80 px-2 py-1 text-[6px] font-black text-violet-700">{weekly ? 'Flexible' : 'Popular'}</span>
      <h3 className="mt-2 text-[13px] font-black">{weekly ? 'Weekly' : 'Daily'}</h3>
      <p className="mt-2 text-[8px] font-semibold leading-4 text-[#607981]">{weekly ? 'Different meals for each day' : 'Same meals every day'}</p>
      <div className="mt-4 space-y-2 text-[7px] font-bold text-[#607981]"><p className="flex gap-1.5"><span className="grid size-5 place-items-center rounded-full bg-violet-100 text-violet-700"><Check className="w-2.5" /></span>{weekly ? 'Plan around your week' : 'Fast to set up'}</p><p className="flex gap-1.5"><span className="grid size-5 place-items-center rounded-full bg-violet-100 text-violet-700"><Check className="w-2.5" /></span>{weekly ? 'Changing routines' : 'Regular routines'}</p></div>
      <div className={`mt-auto grid min-h-9 place-items-center rounded-xl text-[7px] font-black ${selected ? 'bg-gradient-to-br from-violet-500 to-violet-700 text-white' : 'border border-violet-200 bg-white/80 text-violet-700'}`}>{selected ? '✓ Selected' : 'Choose plan'}</div>
    </article>
  )
}

function MealCounterRow({ label, hint, emoji, count, active }: { label: string; hint: string; emoji: string; count: string; active?: boolean }) {
  return (
    <div className={`flex min-h-[62px] items-center gap-3 border-b border-[#dce8e9] bg-white py-2.5 last:border-0 ${active ? 'rounded-xl px-2 ring-3 ring-[#008d8c]/12' : ''}`}>
      <span className="grid size-9 place-items-center rounded-xl bg-[#edfafa] text-[16px]">{emoji}</span>
      <div className="min-w-0 flex-1"><p className="text-[9px] font-black text-[#245d66]">{label}</p><p className="text-[6px] font-semibold text-[#65838b]">{hint}</p></div>
      <div className="grid h-9 grid-cols-[30px_42px_30px] overflow-hidden border border-[#9edddc] bg-[#f8fbfb] text-center text-[9px] font-black"><span className="grid place-items-center text-[#00777a]">−</span><span className="grid place-items-center border-x border-[#bfe7e6]">{count}</span><span className="grid place-items-center bg-[#008d8c] text-white">+</span></div>
    </div>
  )
}

function WeeklyDayCard({ day, total, active }: { day: string; total: string; active?: boolean }) {
  return <section className={`rounded-[12px] border border-[#dce8e9] bg-white p-3 ${active ? 'ring-3 ring-[#008d8c]/12' : ''}`}><div className="mb-2 flex items-center justify-between"><span className="text-[8px] font-bold text-[#245d66]">{day}</span><span className="text-[6px] font-semibold text-[#65838b]">{total} added</span></div><MealCounterRow label="Breakfast" hint="Morning meal" emoji="☀️" count={day === 'Sun' ? '0' : '0.5'} /><MealCounterRow label="Lunch" hint="Midday meal" emoji="🥗" count="1" /><MealCounterRow label="Dinner" hint="Evening meal" emoji="🍲" count={day === 'Fri' ? '0' : '1'} /></section>
}

export function CurrentMealPatternScreen({ stage, activeItem, scrollY = 0 }: { stage: MealPatternStage; activeItem?: string; scrollY?: number }) {
  const weeklySchedule = stage === 'schedule' && Boolean(activeItem?.startsWith('weekly'))
  return (
    <CurrentAppScreen title="Meal Pattern" subtitle="Simple, automatic meal planning" activeTab="meal-pattern">
      <TourScrollContent scrollY={scrollY} className="space-y-2.5 pb-6">
      {stage === 'overview' ? <div className="space-y-3"><AssistantInfoCard eyebrow="Active schedule" title="Daily pattern" description="Meals are added automatically from Aug 01." icon={CircleCheck} /><TourSectionCard title="Your schedule" caption="You can change this whenever your routine changes."><div className="space-y-2">{[['Breakfast','0.5'],['Lunch','1'],['Dinner','1']].map(([meal,count]) => <div key={meal} className="flex items-center gap-2 text-[8px] font-bold text-[#245d66]"><span className="grid size-6 place-items-center rounded-full bg-[#dff4f3] text-[#008d8c]"><Check className="w-3" /></span><span className="flex-1">{meal}</span><span>{count} meal</span></div>)}</div></TourSectionCard><TourPrimaryAction active={activeItem === 'change'}><RefreshCw className="w-4" /> Change pattern</TourPrimaryAction></div> : null}

      {stage === 'type' ? <div className="space-y-2.5"><div className="rounded-[18px] border border-[#dce8e9] bg-white p-4 shadow-sm"><div className="flex justify-between"><p className="text-[7px] font-black uppercase tracking-[.12em] text-[#008d8c]">Step 1 of 2</p><span className="text-[7px] font-semibold text-[#65838b]">Choose a plan</span></div><h2 className="mt-2 text-[13px] font-black text-[#245d66]">How do you schedule meals?</h2><p className="mt-1 text-[8px] font-semibold text-[#52727b]">Pick the routine that best matches your week.</p></div><div className="relative overflow-hidden rounded-[14px] border border-[#bfe7e6] bg-gradient-to-br from-[#edfafa] via-white to-[#fff9ed] p-3"><div className="flex items-center gap-2"><span className="grid size-8 place-items-center rounded-full bg-white text-[#008d8c]"><UtensilsCrossed className="w-4" /></span><span className="h-px w-3 bg-[#9edddc]" /><span className="grid size-8 place-items-center rounded-full bg-white text-[#008d8c]"><CalendarCheck2 className="w-4" /></span><div className="ml-1 border-l border-[#bfe7e6] pl-2"><p className="text-[8px] font-black">Set it once, stay on track.</p><p className="text-[6px] font-semibold text-[#52727b]">Messzen manages the routine automatically.</p></div></div></div><div className="grid grid-cols-2 gap-2.5"><PatternChoiceCard selected={activeItem !== 'weekly'} /><PatternChoiceCard weekly selected={activeItem === 'weekly'} /></div><TourPrimaryAction active={activeItem === 'continue'}>Continue <ArrowRight className="w-4" /></TourPrimaryAction></div> : null}

      {stage === 'schedule' ? <div className="space-y-2.5"><AssistantInfoCard eyebrow="Step 2 of 2" title={weeklySchedule ? 'Plan each day' : 'What meals do you take?'} description={weeklySchedule ? 'Add meals for each day. Empty days stay meal-free.' : 'Add the meals you normally take every day.'} icon={CalendarCheck2} />{weeklySchedule ? <div className="space-y-3"><WeeklyDayCard day="Sat" total="2.5" active={activeItem === 'weekly-saturday'} /><WeeklyDayCard day="Sun" total="2" active={activeItem === 'weekly-sunday'} /><WeeklyDayCard day="Mon" total="2.5" /><WeeklyDayCard day="Tue" total="2.5" /></div> : <TourSectionCard variant="flat"><div className="mb-2 flex items-center justify-between"><div><p className="text-[8px] font-black text-[#245d66]">Meals in this pattern</p><p className="text-[6px] font-semibold text-[#65838b]">Add one or more meals.</p></div><span className="rounded-full bg-[#dff4f3] px-2 py-1 text-[6px] font-black text-[#00777a]">2.5 added</span></div><MealCounterRow label="Breakfast" hint="Morning meal" emoji="☀️" count="0.5" active={activeItem === 'breakfast'} /><MealCounterRow label="Lunch" hint="Midday meal" emoji="🥗" count="1" active={activeItem === 'lunch'} /><MealCounterRow label="Dinner" hint="Evening meal" emoji="🍲" count="1" active={activeItem === 'dinner'} /></TourSectionCard>}<TourPrimaryAction active={activeItem === 'activate' || activeItem === 'weekly-activate'}>Activate pattern <ArrowRight className="w-4" /></TourPrimaryAction></div> : null}

      {stage === 'success' ? <section className="relative overflow-hidden rounded-[18px] border border-violet-200/70 bg-[radial-gradient(circle_at_94%_7%,rgba(197,188,255,.5),transparent_26%),linear-gradient(135deg,#fff_0%,#faf9ff_52%,#f1efff_100%)] px-4 py-8 text-center shadow-[0_10px_28px_rgba(73,61,145,.12)]"><span className="mx-auto grid size-[76px] place-items-center rounded-[24px] border border-[#4f70a5]/15 bg-gradient-to-br from-[#f1efff] to-[#dff4f3] text-[#4f70a5]"><Check className="w-9" strokeWidth={2.8} /></span><h2 className="mt-5 text-[13px] font-black">Meal pattern activated</h2><p className="mx-auto mt-2 max-w-[280px] text-[8px] font-semibold leading-4 text-[#65838b]">Your daily meal schedule is now active. Meals will be added automatically.</p><div className="mt-5"><TourPrimaryAction>View my schedule <ArrowRight className="w-4" /></TourPrimaryAction></div></section> : null}
      </TourScrollContent>
    </CurrentAppScreen>
  )
}

const aiExamples = [
  { language: 'EN', text: 'Today grocery 850 taka', icon: ReceiptText },
  { language: 'বাংলা', text: 'আজ বাজার ৮৫০ টাকা', icon: ReceiptText },
  { language: 'EN', text: 'Add Rahim deposit 2000', icon: WalletCards },
  { language: 'Banglish', text: 'Current bill 1600 utility add koro', icon: Zap },
  { language: 'বাংলা', text: 'আজ দুপুরের মিল ১টা যোগ করো', icon: UtensilsCrossed },
  { language: 'EN', text: 'Add 450 taka gas bill for today', icon: Zap },
]

export function CurrentAiQuickAddScreen({ stage, scrollY = 0 }: { stage: AiStage; scrollY?: number }) {
  const hasCommand = stage !== 'intro'
  const recording = stage === 'voice'
  return (
    <CurrentAppScreen title="Quick Add with AI" subtitle="Speak or type, review, then confirm" trailing={<span className="grid size-9 place-items-center rounded-xl border border-white/20 bg-white/10 text-[9px] font-black">En</span>}>
      <TourScrollContent scrollY={scrollY} className="space-y-2.5 pb-6">
        <section className="relative overflow-hidden rounded-[18px] border border-violet-200/70 bg-[radial-gradient(circle_at_94%_7%,rgba(197,188,255,.5),transparent_26%),radial-gradient(circle_at_7%_100%,rgba(223,244,243,.72),transparent_31%),linear-gradient(135deg,#fff_0%,#faf9ff_52%,#f1efff_100%)] p-4 shadow-[0_10px_28px_rgba(73,61,145,.12)]">
          <div className="flex items-start gap-3"><span className="grid size-11 shrink-0 place-items-center rounded-[14px] border border-[#4f70a5]/15 bg-gradient-to-br from-[#f1efff] to-[#dff4f3] text-[#4f70a5]"><WandSparkles className="w-5" /></span><div><p className="text-[7px] font-black tracking-[.12em] text-[#008d8c]">MESSZEN AI ASSISTANT</p><h2 className="mt-1 text-[9px] font-black leading-4">Add an expense, utility, deposit, or meal using Bangla, English, or Banglish.</h2></div></div>
          <div className="mt-3 grid grid-cols-4 gap-1.5">{[[ReceiptText,'Expense'],[Zap,'Utility'],[WalletCards,'Deposit'],[UtensilsCrossed,'Meal']].map(([RawIcon,label]) => { const Icon = RawIcon as typeof ReceiptText; return <div key={label as string} className="flex min-h-9 items-center justify-center gap-1 rounded-[10px] border border-violet-200/60 bg-white/75 text-[6px] font-black text-[#526477]"><Icon className="w-3" />{label as string}</div> })}</div>
          <div className="mt-3 flex items-center gap-2 border-t border-violet-200/60 pt-2.5 text-[6px] font-semibold text-[#65838b]"><BadgeCheck className="w-3.5 shrink-0 text-violet-600" /> Nothing is saved until you review and confirm every detail</div>
        </section>

        <section className="rounded-[20px] border border-[#cfe3e3] bg-[#f9fdfd]/90 p-4 shadow-[0_12px_30px_rgba(18,55,72,.08)]">
          <div className="flex items-center justify-between"><div className="flex items-center gap-2"><span className="grid size-9 place-items-center rounded-[12px] border border-[#4f70a5]/15 bg-gradient-to-br from-[#f1efff] to-[#dff4f3] text-[#4f70a5]"><MessageSquareText className="w-4" /></span><div><p className="text-[6px] font-black uppercase tracking-[.08em] text-[#00777a]">Write a command</p><h2 className="mt-0.5 text-[8px] font-black">What would you like to add?</h2></div></div><span className="text-[6px] font-bold text-[#8ba0a5]">{hasCommand ? 23 : 0}/2000</span></div>
          <div className={`relative mt-3 overflow-hidden rounded-[17px] border bg-white/80 ${hasCommand ? 'border-[#008d8c]/40 ring-3 ring-[#008d8c]/10' : 'border-[#bcd5d6]'}`}>
            <div className="min-h-[126px] p-3.5 text-[9px] font-bold leading-4 text-[#123748]">{hasCommand ? 'Today grocery 850 taka' : <span className="font-medium text-[#9aabb0]">Example: Add 850 taka grocery expense for today</span>}</div>
            {recording ? <div className="absolute inset-x-4 bottom-11 flex h-5 items-center gap-1">{Array.from({ length: 18 }, (_, index) => <span key={index} className="w-[3px] animate-pulse rounded-full bg-rose-500" style={{ height: `${6 + (index % 5) * 3}px` }} />)}</div> : null}
            <div className="flex min-h-[46px] items-center justify-between border-t border-[#dfe9ea] bg-[#f9fdfd] px-3"><span className="flex items-center gap-1 text-[6px] font-bold text-[#008d8c]"><Sparkles className="w-3" /> {recording ? 'Recording · 08s / 60s' : 'Bangla · English · Banglish'}</span><span className={`grid size-9 place-items-center rounded-xl text-white shadow-md ${recording ? 'bg-rose-600' : 'bg-gradient-to-br from-[#008d8c] to-[#006c69]'}`}>{recording ? <Square className="w-3.5 fill-current" /> : <Mic className="w-4" />}</span></div>
          </div>
          <div className={`mt-4 flex min-h-14 items-center rounded-[16px] bg-gradient-to-r from-[#006c69] to-[#008d8c] px-3 text-white shadow-[0_13px_28px_rgba(0,108,105,.2)] ${stage === 'ready' ? 'ring-4 ring-[#008d8c]/15' : hasCommand ? '' : 'opacity-50'}`}><span className="grid size-[38px] place-items-center rounded-xl border border-white/20 bg-white/15"><Sparkles className="w-4" /></span><span className="flex-1 text-center text-[8px] font-black">Create Preview</span><ArrowRight className="w-4" /></div>
        </section>

        <section className="rounded-[20px] border border-[#dfe8ea] bg-white px-2 py-3.5 shadow-[0_10px_28px_rgba(18,55,72,.055)]"><div className="mb-3 flex items-start justify-between px-1.5"><div><p className="text-[7px] font-black uppercase tracking-[.08em]">Quick examples</p><p className="mt-0.5 text-[6px] font-semibold text-[#71858a]">Tap an example to use it as your command</p></div><span className="rounded-full bg-[#edfafa] px-2 py-1 text-[6px] font-black text-[#00777a]">6 suggestions</span></div>{aiExamples.map(({ language, text, icon: Icon }) => <div key={text} className="grid min-h-[64px] grid-cols-[38px_1fr_28px] items-center gap-2.5 rounded-[12px] px-1.5"><span className="grid size-[38px] place-items-center rounded-[12px] border border-[#4f70a5]/15 bg-gradient-to-br from-[#f1efff] to-[#dff4f3] text-[#4f70a5] shadow-[0_7px_16px_rgba(58,82,125,.11)]"><Icon className="w-3.5" /></span><div><span className="rounded-full bg-[#edfafa] px-2 py-0.5 text-[5px] font-black text-[#00777a]">{language}</span><p className="mt-1 text-[7px] font-black leading-3">{text}</p></div><ArrowRight className="w-3.5 text-[#008d8c]" /></div>)}</section>
      </TourScrollContent>
    </CurrentAppScreen>
  )
}

export function CurrentAiSuccessScreen() {
  return <CurrentAppScreen title="Quick Add with AI" subtitle="Speak or type, review, then confirm"><section className="relative overflow-hidden rounded-[18px] border border-violet-200/70 bg-[radial-gradient(circle_at_94%_7%,rgba(197,188,255,.5),transparent_26%),linear-gradient(135deg,#fff_0%,#faf9ff_52%,#f1efff_100%)] px-4 py-8 text-center shadow-[0_10px_28px_rgba(73,61,145,.12)]"><span className="mx-auto grid size-[76px] place-items-center rounded-[24px] bg-gradient-to-br from-[#f1efff] to-[#dff4f3] text-[#4f70a5]"><Check className="w-9" /></span><h2 className="mt-5 text-[13px] font-black">Saved successfully</h2><p className="mt-2 text-[8px] font-semibold text-[#65838b]">Expense Create</p><div className="mt-5 grid grid-cols-2 gap-2"><div className="grid min-h-11 place-items-center rounded-xl border border-[#dce8ea] bg-white text-[8px] font-black">Add another</div><TourPrimaryAction>View</TourPrimaryAction></div></section></CurrentAppScreen>
}
