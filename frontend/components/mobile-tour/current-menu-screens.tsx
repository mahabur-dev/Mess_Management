import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import {
  BookOpenCheck,
  Building2,
  CalendarDays,
  Camera,
  Check,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  ContactRound,
  Crown,
  Edit3,
  FileCheck2,
  FileImage,
  Fingerprint,
  KeyRound,
  Mail,
  Map,
  MapPin,
  Navigation,
  Pencil,
  Phone,
  Plus,
  Save,
  ScrollText,
  ShieldCheck,
  UserRound,
} from 'lucide-react'
import {
  CurrentAppScreen,
  TourField,
  TourPrimaryAction,
  TourScrollContent,
} from '@/components/mobile-tour/mobile-tour-primitives'

export type CurrentMenuScreenId =
  | 'profile'
  | 'settings'
  | 'complaints'
  | 'mess-management'
  | 'subscription'
  | 'how-it-works'
  | 'contact-us'
  | 'privacy-policy'
  | 'terms'

function SectionSurface({ title, children, action }: { title: string; children: ReactNode; action?: ReactNode }) {
  return (
    <section className="overflow-hidden rounded-[16px] border border-[#007f83]/15 bg-white p-4 shadow-[0_8px_22px_rgba(18,55,72,.05)]">
      <header className="mb-3 flex min-h-8 items-center justify-between gap-3"><h2 className="text-[7px] font-black uppercase tracking-[.1em] text-[#123748]">{title}</h2>{action}</header>
      {children}
    </section>
  )
}

function DetailRow({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="grid min-h-[58px] grid-cols-[38px_1fr] items-center gap-3 rounded-[12px] border border-[#007f83]/10 bg-gradient-to-br from-[#fbfefe] to-[#f8fcfc] px-3 py-2.5">
      <span className="grid size-[38px] place-items-center rounded-[10px] border border-[#4f70a5]/15 bg-gradient-to-br from-[#f1efff] to-[#dff4f3] text-[#4f70a5]"><Icon className="w-4" /></span>
      <span className="min-w-0"><small className="block text-[6px] font-semibold text-[#789096]">{label}</small><strong className="mt-1 block truncate text-[8px] font-bold text-[#123748]">{value}</strong></span>
    </div>
  )
}

function AssistantMetrics({ icon: Icon, eyebrow, title, subtitle, status, metrics }: { icon: LucideIcon; eyebrow: string; title: string; subtitle?: string; status?: string; metrics: Array<{ label: string; value: string }> }) {
  return (
    <section className="relative overflow-hidden rounded-[18px] border border-violet-200/70 bg-[radial-gradient(circle_at_94%_7%,rgba(197,188,255,.5),transparent_26%),radial-gradient(circle_at_7%_100%,rgba(223,244,243,.72),transparent_31%),linear-gradient(135deg,#fff_0%,#faf9ff_52%,#f1efff_100%)] p-[17px] shadow-[0_10px_28px_rgba(73,61,145,.12)]">
      <span className="absolute -right-8 -top-9 size-28 rounded-full border-[18px] border-white/30 bg-violet-200/20" />
      <div className="relative flex items-start gap-3"><span className="grid size-12 shrink-0 place-items-center rounded-[14px] border border-[#4f70a5]/15 bg-gradient-to-br from-[#f1efff] to-[#dff4f3] text-[#4f70a5] shadow-[0_7px_16px_rgba(58,82,125,.11)]"><Icon className="w-5" /></span><div className="min-w-0 flex-1"><p className="text-[6px] font-black uppercase tracking-[.13em] text-[#008d8c]">{eyebrow}</p><h2 className="mt-1 text-[12px] font-black text-[#123748]">{title}</h2>{subtitle ? <p className="mt-1 text-[7px] font-semibold leading-3 text-[#65838b]">{subtitle}</p> : null}</div>{status ? <span className="rounded-full bg-[#dff4f3] px-2.5 py-1.5 text-[6px] font-black text-[#00777a]">{status}</span> : null}</div>
      {metrics.length ? <div className="relative mt-4 grid grid-cols-3 overflow-hidden rounded-[14px] border border-violet-200/60 bg-white/65">{metrics.map((metric, index) => <div key={metric.label} className={`min-w-0 px-2 py-3 text-center ${index ? 'border-l border-violet-200/60' : ''}`}><p className="truncate text-[6px] font-semibold text-[#65838b]">{metric.label}</p><strong className="mt-1 block truncate text-[9px] font-black text-[#123748]">{metric.value}</strong></div>)}</div> : null}
    </section>
  )
}

export function CurrentProfileScreen({ scrollY = 0 }: { scrollY?: number }) {
  return (
    <CurrentAppScreen title="Profile" subtitle="Account overview">
      <TourScrollContent scrollY={scrollY} className="space-y-4 pb-6">
        <section className="relative overflow-hidden rounded-[16px] border border-violet-200/70 bg-[radial-gradient(circle_at_92%_5%,rgba(197,188,255,.44),transparent_27%),radial-gradient(circle_at_5%_100%,rgba(218,245,242,.76),transparent_32%),linear-gradient(145deg,#fff_0%,#faf9ff_55%,#f3f1ff_100%)] px-[18px] pb-[18px] pt-[22px] text-center shadow-[0_10px_28px_rgba(73,61,145,.1)]">
          <span className="relative mx-auto grid size-[90px] place-items-center rounded-full border-4 border-white bg-gradient-to-br from-[#f1efff] to-[#dff4f3] text-[18px] font-black text-[#4f70a5] shadow-[0_10px_24px_rgba(58,82,125,.15)]">MR<span className="absolute bottom-0 right-0 grid size-8 place-items-center rounded-full border-[3px] border-white bg-gradient-to-br from-[#008d8c] to-[#00777a] text-white"><Camera className="w-3.5" /></span></span>
          <h2 className="mt-3 text-[12px] font-black">Mahabur Rahman</h2>
          <div className="mt-2 flex justify-center gap-2"><span className="flex min-h-[25px] items-center gap-1.5 rounded-full bg-[#dff4f3] px-2.5 text-[6px] font-bold text-[#00777a]"><i className="size-1.5 rounded-full bg-[#008d8c]" />Active</span><span className="flex min-h-[25px] items-center rounded-full border border-[#4f70a5]/15 bg-[#f1efff]/90 px-2.5 text-[6px] font-bold text-[#4f5e8f]">Manager</span></div>
          <div className="mt-[18px] flex min-h-[44px] items-center justify-center gap-2 rounded-[12px] bg-gradient-to-br from-[#008d8c] to-[#00777a] text-[8px] font-bold text-white shadow-[0_10px_22px_rgba(0,119,122,.18)]"><Pencil className="w-3.5" /> Edit profile</div>
        </section>

        <SectionSurface title="Contact information"><div className="space-y-[7px]"><DetailRow icon={Mail} label="Email address" value="mahabur@example.com" /><DetailRow icon={Phone} label="Phone number" value="+880 1700 000000" /></div></SectionSurface>
        <SectionSurface title="Identity verification"><div className="space-y-3"><DetailRow icon={Fingerprint} label="NID number" value="1998 1234 5678 9012" /><div className="grid min-h-[66px] grid-cols-[34px_1fr] items-center gap-3 rounded-[12px] border border-violet-200/60 bg-gradient-to-br from-[#fbfaff] to-[#f6fbfb] px-3 text-[#789096]"><FileImage className="w-5 text-[#4f70a5]" /><span className="text-[7px] font-semibold">NID image not uploaded</span></div></div></SectionSurface>
        <SectionSurface title="Address information"><div className="space-y-[7px]"><DetailRow icon={MapPin} label="Location" value="Mirpur" /><DetailRow icon={Map} label="State" value="Dhaka" /><DetailRow icon={Building2} label="City" value="Dhaka" /><DetailRow icon={Navigation} label="Zip code" value="1216" /></div></SectionSurface>
        <SectionSurface title="Workspace access"><div className="space-y-[7px]"><DetailRow icon={Building2} label="Workspace" value="Together We Dine" /><DetailRow icon={MapPin} label="Location" value="Mirpur, Dhaka" /><DetailRow icon={ShieldCheck} label="Access level" value="Manager" /><DetailRow icon={CalendarDays} label="Joined on" value="01 Jan 2026" /></div></SectionSurface>
        <div className="grid min-h-[68px] grid-cols-[40px_1fr_auto] items-center gap-3 rounded-[16px] border border-[#007f83]/15 bg-white px-3.5 shadow-[0_8px_22px_rgba(18,55,72,.05)]"><span className="grid size-10 place-items-center rounded-[10px] border border-[#4f70a5]/15 bg-gradient-to-br from-[#f1efff] to-[#dff4f3] text-[#4f70a5]"><ShieldCheck className="w-4" /></span><span><strong className="block text-[8px]">Account settings</strong><small className="mt-1 block text-[6px] text-[#789096]">Profile details and security</small></span><ChevronRight className="w-4 text-[#789096]" /></div>
      </TourScrollContent>
    </CurrentAppScreen>
  )
}

export function CurrentSettingsScreen() {
  return (
    <CurrentAppScreen title="Settings" subtitle="Account preferences">
      <section className="overflow-hidden rounded-[20px] border border-[#dfe9ea] bg-white shadow-[0_10px_24px_rgba(0,119,122,.08)]">
        <div className="flex items-center gap-3 border-b border-[#e4eaec] px-4 py-3.5"><span className="grid size-12 place-items-center rounded-[16px] bg-[#dff4f3] text-[#008d8c]"><ShieldCheck className="w-6" /></span><div><p className="text-[10px] font-bold">Account &amp; Security</p><p className="mt-1 text-[7px] text-[#65838b]">Manage your profile and password</p></div></div>
        {[{ icon: UserRound, title: 'Profile', copy: 'Name, email, phone and profile photo' }, { icon: KeyRound, title: 'Password', copy: 'Update your account password' }].map(({ icon: Icon, title, copy }) => <div key={title} className="flex items-center gap-3 border-b border-[#e4eaec] px-4 py-3.5 last:border-0"><span className="grid size-10 place-items-center rounded-[12px] bg-[#edfafa] text-[#008d8c]"><Icon className="w-[19px]" /></span><div className="min-w-0 flex-1"><p className="text-[8px] font-bold">{title}</p><p className="mt-1 truncate text-[6px] font-semibold text-[#65838b]">{copy}</p></div><ChevronRight className="w-4 text-[#78a4a9]" /></div>)}
      </section>
    </CurrentAppScreen>
  )
}

function ComplaintRow({ title, category, status, tone, response }: { title: string; category: string; status: string; tone: 'neutral' | 'warning' | 'success'; response?: string }) {
  const badge = tone === 'success' ? 'bg-[#dff4f3] text-[#00777a]' : tone === 'warning' ? 'bg-[#fff2d8] text-[#b76d00]' : 'bg-[#edf2f3] text-[#607981]'
  return <article className="border-b border-[#dfe9ea] py-4 last:border-0"><div className="flex items-start justify-between gap-2"><div className="min-w-0 flex-1"><p className="truncate text-[8px] font-semibold">{title}</p><p className="mt-1 text-[6px] text-[#65838b]">{category}</p></div><div className="flex items-center gap-1.5"><span className={`rounded-full px-2 py-1 text-[5px] font-bold ${badge}`}>{status}</span><span className="grid size-8 place-items-center rounded-[10px] bg-[#edfafa] text-[#008d8c]"><Edit3 className="w-3.5" /></span></div></div><p className="mt-2 text-[7px] leading-3 text-[#65838b]">My dinner was off but counted as on.</p>{response ? <div className="mt-2 rounded-xl bg-[#edfafa] px-3 py-2 text-[7px]">{response}</div> : null}</article>
}

export function CurrentComplaintsScreen({ scrollY = 0 }: { scrollY?: number }) {
  return (
    <CurrentAppScreen title="Complaints" subtitle="Request and issue board">
      <TourScrollContent scrollY={scrollY} className="space-y-4 pb-6">
        <section className="space-y-3 border-t border-[#dfe9ea] bg-white pt-4"><TourField label="Category" value="Meal" select /><TourField label="Title" value="Dinner count correction" /><TourField label="Description" value="My dinner was off but counted as on." multiline /><TourPrimaryAction>Submit Complaint</TourPrimaryAction></section>
        <SectionSurface title="Recent" action={<span className="rounded-[12px] border border-[#dfe9ea] bg-white px-3 py-2 text-[7px] font-semibold">Pending⌄</span>}><ComplaintRow title="Dinner count correction" category="Meal" status="Pending" tone="neutral" /><ComplaintRow title="Water supply issue" category="Maintenance" status="Processing" tone="warning" response="Manager is checking the pump." /><ComplaintRow title="Kitchen cleaning" category="General" status="Solved" tone="success" /></SectionSurface>
      </TourScrollContent>
    </CurrentAppScreen>
  )
}

function ManagementField({ label, value }: { label: string; value: string }) {
  return <div><p className="mb-2 text-[7px] font-bold text-[#123748]">{label}</p><div className="flex min-h-[50px] items-center rounded-[12px] border border-[#007f83]/20 bg-white px-3.5 text-[8px] font-medium">{value}</div></div>
}

export function CurrentMessManagementScreen({ scrollY = 0 }: { scrollY?: number }) {
  return (
    <CurrentAppScreen title="Mess Management" subtitle="Setup, rooms and billing defaults">
      <TourScrollContent scrollY={scrollY} className="space-y-4 pb-6">
        <AssistantMetrics icon={Building2} eyebrow="Workspace" title="Together We Dine" subtitle="Mirpur, Dhaka" status="ACTIVE" metrics={[{ label: 'Plan', value: 'Monthly' }, { label: 'Days Left', value: '24d' }, { label: 'Members', value: '7' }]} />
        <SectionSurface title="Subscription"><div className="flex min-h-[58px] items-center justify-between gap-3 rounded-[12px] border border-violet-200/50 bg-gradient-to-br from-[#fbfaff] to-[#f4fbfb] px-3"><div className="flex items-center gap-2.5"><span className="grid size-9 place-items-center rounded-[10px] bg-gradient-to-br from-[#f1efff] to-[#dff4f3] text-[#4f70a5]"><CircleDollarSign className="w-4" /></span><div><p className="text-[6px] text-[#789096]">Plan</p><p className="mt-1 text-[8px] font-bold">Monthly</p></div></div><span className="rounded-full bg-[#dff4f3] px-2.5 py-1 text-[6px] font-black text-[#00777a]">ACTIVE</span></div><div className="mt-3 grid grid-cols-2 gap-px overflow-hidden rounded-[12px] border border-[#007f83]/15 bg-[#007f83]/10"><div className="bg-[#fbfefe] p-3"><p className="text-[6px] text-[#789096]">Started</p><p className="mt-1 text-[8px] font-bold">01 Aug 2026</p></div><div className="bg-[#fbfefe] p-3"><p className="text-[6px] text-[#789096]">Ends</p><p className="mt-1 text-[8px] font-bold">31 Aug 2026</p></div></div></SectionSurface>
        <SectionSurface title="Mess settings"><div className="space-y-4"><ManagementField label="Mess Name" value="Together We Dine" /><ManagementField label="Address" value="Mirpur, Dhaka" /><div className="grid grid-cols-2 gap-3"><ManagementField label="Mess Category" value="Flat" /><ManagementField label="Total Seats" value="8" /></div><div className="grid grid-cols-2 gap-3"><ManagementField label="Monthly Rent (৳)" value="35,000" /><ManagementField label="Payment Deadline Day" value="10" /></div><ManagementField label="Meal Off Deadline" value="10:00 PM" /><ManagementField label="Bazar Rules" value="Manager assigns weekly bazar turns." /></div></SectionSurface>
        <SectionSurface title="Rooms" action={<span className="flex items-center gap-1 rounded-[10px] bg-[#edfafa] px-2.5 py-2 text-[7px] font-bold text-[#00777a]"><Plus className="w-3" /> Add Room</span>}><div><p className="mb-3 text-[8px] font-bold">Room 1</p><div className="space-y-3"><ManagementField label="Room Name" value="Room A" /><div className="grid grid-cols-2 gap-3"><ManagementField label="Total Person" value="2" /><ManagementField label="Room Price (৳)" value="12,000" /></div></div></div></SectionSurface>
        <TourPrimaryAction><Save className="w-4" /> Save Setup</TourPrimaryAction>
      </TourScrollContent>
    </CurrentAppScreen>
  )
}

function PlanCard({ title, price, days, current, features }: { title: string; price: string; days: string; current?: boolean; features: string[] }) {
  return <article className={`rounded-[20px] border bg-[#f9fdfd]/80 p-4 shadow-[0_8px_22px_rgba(18,55,72,.05)] ${current ? 'border-[#008d8c]/35 ring-1 ring-[#008d8c]/10' : 'border-[#007f83]/15'}`}><div className="flex items-start justify-between gap-3"><div><h3 className="text-[10px] font-bold">{title}</h3><p className="mt-1 text-[6px] text-[#65838b]">Full Messzen workspace access</p></div>{current ? <span className="flex items-center gap-1 rounded-full bg-[#dff4f3] px-2 py-1.5 text-[6px] font-bold text-[#00777a]"><Check className="w-3" /> Current</span> : null}</div><div className="mt-3 flex items-baseline gap-1.5"><strong className="text-[12px] text-[#00777a]">BDT {price}</strong><span className="text-[6px] text-[#65838b]">/ {days} days</span></div><ul className="mt-3 space-y-2">{features.map((feature) => <li key={feature} className="flex items-start gap-2 text-[7px] text-[#526477]"><Check className="mt-0.5 w-3 shrink-0 text-[#008d8c]" />{feature}</li>)}</ul></article>
}

export function CurrentSubscriptionScreen({ scrollY = 0 }: { scrollY?: number }) {
  return <CurrentAppScreen title="Subscription" subtitle="Plan and billing access"><TourScrollContent scrollY={scrollY} className="space-y-4 pb-6"><AssistantMetrics icon={Crown} eyebrow="TOGETHER WE DINE" title="Monthly" status="ACTIVE" metrics={[{ label: 'Started', value: '01 Aug' }, { label: 'Ends', value: '31 Aug' }, { label: 'Days left', value: '24' }]} /><section><h2 className="text-[7px] font-black uppercase tracking-[.16em] text-[#65838b]">Available plans</h2><p className="mt-1 text-[7px] text-[#789096]">Choose the plan that fits your mess.</p><div className="mt-3 space-y-3"><PlanCard title="Monthly" price="499" days="30" current features={['All meal and expense tools', 'AI Quick Add access', 'Monthly member billing']} /><PlanCard title="Yearly" price="4,999" days="365" features={['Everything in Monthly', 'Lower annual cost', 'Priority support']} /></div></section><div className="flex min-h-[54px] items-center justify-between rounded-[17px] border border-[#007f83]/15 bg-[#edfafa]/80 px-4 text-[8px] font-bold text-[#006c69]"><span>Contact support about your plan</span><Crown className="w-4" /></div></TourScrollContent></CurrentAppScreen>
}

type InfoConfig = { title: string; subtitle: string; eyebrow: string; introduction: string; icon: LucideIcon; sections: Array<{ title: string; body?: string; points?: string[] }>; actions: string[] }

const infoPages: Record<Extract<CurrentMenuScreenId, 'how-it-works' | 'contact-us' | 'privacy-policy' | 'terms'>, InfoConfig> = {
  'how-it-works': { title: 'How It Works', subtitle: 'A simple guide to Messzen', eyebrow: 'GET STARTED', introduction: 'Manage shared meals, expenses and monthly accounts from one reliable workspace.', icon: BookOpenCheck, sections: [{ title: 'Create or join a mess', body: 'A manager creates the workspace. Members join it and use the same live records.' }, { title: 'Record daily activity', body: 'Add meals, bazar expenses, utilities and deposits manually or through Quick Add with AI.' }, { title: 'Review before saving', body: 'Preview every AI-generated entry, correct the details, then confirm it.' }, { title: 'Close the month clearly', body: 'Messzen combines meals, costs and deposits into transparent monthly bills.' }], actions: ['Need more help? Contact us'] },
  'contact-us': { title: 'Contact Us', subtitle: 'Help when you need it', eyebrow: 'SUPPORT', introduction: 'Tell us what happened and include the affected month or feature so the team can help quickly.', icon: ContactRound, sections: [{ title: 'Account and access', body: 'Get help with sign-in, profile details, mess membership or manager access.' }, { title: 'Meals and billing', body: 'Report a mismatch in meals, expenses, deposits, utilities or monthly calculations.' }, { title: 'AI Quick Add', body: 'Share the transcript and expected result when voice transcription needs attention.' }], actions: ['Email support@messzen.com', 'Read How It Works'] },
  'privacy-policy': { title: 'Privacy Policy', subtitle: 'Your information and choices', eyebrow: 'PRIVACY', introduction: 'This summary explains what Messzen uses to operate your workspace and keep records available to authorized members.', icon: ScrollText, sections: [{ title: 'Information we use', points: ['Account and contact details you provide', 'Mess membership, meals, expenses and payment records', 'Technical information needed for security'] }, { title: 'Why we use it', body: 'We use information to provide features, calculate shared accounts and protect access.' }, { title: 'Who can see records', body: 'Workspace records are available according to each member or manager role.' }, { title: 'Your choices', body: 'Update account information from Profile or contact support.' }, { title: 'Policy updates', body: 'Material policy changes will be made available in the app.' }], actions: ['Contact us about privacy'] },
  terms: { title: 'Terms & Conditions', subtitle: 'Rules for using Messzen', eyebrow: 'TERMS OF USE', introduction: 'These terms explain the responsibilities that keep every shared workspace accurate, secure and dependable.', icon: FileCheck2, sections: [{ title: 'Accepting these terms', body: 'By creating an account or using Messzen, you agree to follow these terms.' }, { title: 'Your account', points: ['Provide accurate account information', 'Keep your password confidential', 'Report unauthorized access'] }, { title: 'Workspace responsibilities', body: 'Members and managers review records before relying on them.' }, { title: 'Acceptable use', points: ['Do not misuse the service', 'Do not submit harmful information', 'Respect other members’ privacy'] }, { title: 'Subscriptions and availability', body: 'Current plan details shown in the app apply to the connected workspace.' }, { title: 'Changes and support', body: 'Material updates will be available in the app.' }], actions: ['Read our Privacy Policy', 'Contact us about these terms'] },
}

function CurrentInfoPageScreen({ screen, scrollY = 0 }: { screen: keyof typeof infoPages; scrollY?: number }) {
  const page = infoPages[screen]
  const Icon = page.icon
  return <CurrentAppScreen title={page.title} subtitle={page.subtitle}><TourScrollContent scrollY={scrollY} className="space-y-4 pb-6"><AssistantMetrics icon={Icon} eyebrow={page.eyebrow} title={page.title} subtitle={page.introduction} metrics={[]} /><div className="space-y-3">{page.sections.map((section, index) => <section key={section.title} className="grid grid-cols-[34px_1fr] gap-3 rounded-[20px] border border-[#dfe9ea] bg-[#f9fdfd]/80 p-4 shadow-[0_10px_24px_rgba(0,119,122,.08)]"><span className="grid size-[34px] place-items-center rounded-[12px] bg-[#008d8c]/10 text-[7px] font-black text-[#00777a]">{String(index + 1).padStart(2, '0')}</span><div><h2 className="text-[8px] font-bold">{section.title}</h2>{section.body ? <p className="mt-1.5 text-[7px] leading-3.5 text-[#526477]">{section.body}</p> : null}{section.points ? <ul className="mt-1.5 list-disc space-y-1 pl-3 text-[7px] leading-3 text-[#526477]">{section.points.map((point) => <li key={point}>{point}</li>)}</ul> : null}</div></section>)}</div><div className="space-y-2">{page.actions.map((action) => <div key={action} className="flex min-h-[54px] items-center justify-between rounded-[17px] border border-[#007f83]/15 bg-[#edfafa]/80 px-4 text-[8px] font-bold text-[#006c69]"><span>{action}</span><ChevronRight className="w-4" /></div>)}</div></TourScrollContent></CurrentAppScreen>
}

export function CurrentMenuDestinationScreen({ screen, scrollY = 0 }: { screen: CurrentMenuScreenId; scrollY?: number }) {
  if (screen === 'profile') return <CurrentProfileScreen scrollY={scrollY} />
  if (screen === 'settings') return <CurrentSettingsScreen />
  if (screen === 'complaints') return <CurrentComplaintsScreen scrollY={scrollY} />
  if (screen === 'mess-management') return <CurrentMessManagementScreen scrollY={scrollY} />
  if (screen === 'subscription') return <CurrentSubscriptionScreen scrollY={scrollY} />
  return <CurrentInfoPageScreen screen={screen} scrollY={scrollY} />
}
