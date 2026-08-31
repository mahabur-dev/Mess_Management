import {
  Bell,
  CheckCircle2,
  MoreVertical,
  Pin,
  Search,
  Send,
  UserPlus,
  UserRoundPlus,
  Users,
} from 'lucide-react'
import {
  CurrentAppScreen,
  TourField,
  TourPrimaryAction,
  TourScrollContent,
  TourSectionCard,
} from '@/components/mobile-tour/mobile-tour-primitives'

const notices = [
  { title: 'Dinner will be served at 9 PM', type: 'MEAL', body: 'Dinner time has been moved to 9:00 PM for today.', pinned: true },
  { title: 'Payment deadline: 28 August', type: 'PAYMENT', body: 'Please clear all monthly dues before the deadline.', pinned: false },
  { title: 'Friday cleaning schedule', type: 'GENERAL', body: 'Kitchen and common areas will be cleaned after Jummah.', pinned: false },
] as const

const members = [
  { initials: 'MR', name: 'Mahabur Rahman', meta: 'Manager · Room 2A' },
  { initials: 'RA', name: 'Rahim Ahmed', meta: 'Member · Room 3B' },
  { initials: 'SH', name: 'Sabbir Hossain', meta: 'Member · Room 4A' },
  { initials: 'NH', name: 'Nayeem Hasan', meta: 'Member · Room 4B' },
] as const

export function CurrentNoticesScreen({ activeItem, scrollY = 0 }: { activeItem?: string; scrollY?: number }) {
  const formOpen = activeItem === 'notice-form' || activeItem === 'notice-send'
  return (
    <CurrentAppScreen title="Notices" subtitle="Announcement center">
      <TourScrollContent scrollY={scrollY} className="space-y-4 pb-6">
        {!formOpen ? (
          <div className={`flex min-h-[78px] items-center gap-3 border-y border-[#dfe9ea] bg-white py-3 ${activeItem === 'notice-open' ? 'ring-3 ring-[#008d8c]/12' : ''}`}><span className="grid size-12 shrink-0 place-items-center rounded-[16px] bg-[#edfafa] text-[#008d8c]"><Send className="w-5" /></span><div className="min-w-0 flex-1"><p className="text-[9px] font-bold">Send Notice</p><p className="mt-1 text-[7px] font-semibold leading-3 text-[#65838b]">Create an announcement when you need to notify members.</p></div><span className="rounded-[12px] bg-gradient-to-br from-[#008d8c] to-[#00777a] px-3 py-2 text-[7px] font-bold text-white">Send Notice</span></div>
        ) : (
          <TourSectionCard title="Send Notice" caption="Create an announcement for every member.">
            <div className="space-y-2.5"><TourField label="Notice Type" value="General" select /><TourField label="Title" value="Payment deadline" /><TourField label="Message" value="Please clear all dues by the 28th." multiline /><div className="flex min-h-[50px] items-center justify-between rounded-[16px] border border-[#dce8ea] bg-white px-3.5"><div><p className="text-[8px] font-bold">Pinned</p><p className="mt-1 text-[6px] text-[#65838b]">Shown at the top of notice board</p></div><span className="flex h-7 w-12 items-center justify-end rounded-full bg-[#008d8c] p-1"><i className="size-5 rounded-full bg-white shadow" /></span></div><TourPrimaryAction active={activeItem === 'notice-send'}><Send className="w-4" /> Send Notice</TourPrimaryAction></div>
          </TourSectionCard>
        )}

        <section className="bg-white"><div className="border-t border-[#dfe9ea]">{notices.map((notice) => <article key={notice.title} className="border-b border-[#dfe9ea] py-4"><div className="flex items-start gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-[16px] bg-[#edfafa] text-[#008d8c]"><Bell className="w-4" /></span><div className="min-w-0 flex-1"><div className="flex items-center gap-2"><h2 className="truncate text-[8px] font-bold">{notice.title}</h2>{notice.pinned ? <span className="flex items-center gap-1 rounded-full bg-[#dff4f3] px-2 py-1 text-[5px] font-semibold text-[#008d8c]"><Pin className="w-2.5" /> PINNED</span> : null}</div><p className="mt-1 text-[6px] font-bold uppercase tracking-[.12em] text-[#65838b]">{notice.type}</p><p className="mt-2 text-[7px] font-medium leading-3 text-[#65838b]">{notice.body}</p></div></div></article>)}</div></section>
      </TourScrollContent>
    </CurrentAppScreen>
  )
}

function MemberRow({ initials, name, meta }: (typeof members)[number]) {
  return <div className="flex min-h-[76px] items-center gap-3 border-b border-[#dfe9ea] bg-white py-3"><span className="relative grid size-11 shrink-0 place-items-center rounded-full bg-[#dff4f3] text-[8px] font-semibold text-[#00777a]">{initials}<i className="absolute bottom-0 right-0 size-2.5 rounded-full border-2 border-white bg-emerald-500" /></span><div className="min-w-0 flex-1"><p className="truncate text-[9px] font-bold">{name}</p><p className="mt-1 text-[7px] font-semibold text-[#65838b]">{meta}</p></div><MoreVertical className="w-4 text-[#789096]" /></div>
}

export function CurrentMembersScreen({ activeItem, scrollY = 0 }: { activeItem?: string; scrollY?: number }) {
  const requests = activeItem === 'join-requests'
  return (
    <div className="absolute inset-0 overflow-hidden">
      <CurrentAppScreen title="Members" subtitle="All members in your mess">
        <TourScrollContent scrollY={scrollY} className="space-y-3 pb-6">
          <div className="flex min-h-12 items-center gap-2 rounded-[15px] border border-[#bfe7e6] bg-[#fbffff] px-3 shadow-[inset_0_1px_0_rgba(255,255,255,.92)]"><Search className="w-4 text-[#008d8c]" /><span className="text-[8px] font-semibold text-[#8ba0a5]">{requests ? 'Search join request...' : 'Search member...'}</span></div>
          <div className="grid grid-cols-2 gap-1.5 rounded-[12px] border border-[#dfe9ea] bg-[#f8fbfb] p-1"><div className={`flex min-h-11 items-center justify-center gap-1.5 rounded-[14px] text-[7px] font-bold ${!requests ? 'bg-white text-[#00777a] shadow-[0_8px_18px_rgba(0,119,122,.12)]' : 'text-[#65838b]'}`}><Users className="w-3.5" /> Member <span className="rounded-full bg-[#edfafa] px-2 py-0.5">7</span></div><div className={`flex min-h-11 items-center justify-center gap-1.5 rounded-[14px] text-[7px] font-bold ${requests ? 'bg-white text-[#00777a] shadow-[0_8px_18px_rgba(0,119,122,.12)]' : 'text-[#65838b]'}`}><UserRoundPlus className="w-3.5" /> Join Request <span className="rounded-full bg-white/80 px-2 py-0.5">2</span></div></div>
          {!requests ? <section>{members.map((member) => <MemberRow key={member.name} {...member} />)}</section> : <section className="space-y-3">{[{ initials: 'AS', name: 'Arif Sarker', email: 'arif@example.com' }, { initials: 'TK', name: 'Tanvir Khan', email: 'tanvir@example.com' }].map((request) => <TourSectionCard key={request.name} variant="flat"><div className="flex items-center gap-3"><span className="grid size-11 place-items-center rounded-full bg-[#edfafa] text-[8px] font-semibold text-[#00777a]">{request.initials}</span><div className="min-w-0 flex-1"><p className="text-[9px] font-bold">{request.name}</p><p className="mt-1 text-[6px] text-[#65838b]">{request.email}</p></div></div><div className="mt-3 grid grid-cols-2 gap-2"><div className="grid min-h-10 place-items-center rounded-[12px] border border-rose-200 bg-rose-50 text-[7px] font-bold text-rose-600">Reject</div><div className="flex min-h-10 items-center justify-center gap-1 rounded-[12px] bg-[#008d8c] text-[7px] font-bold text-white"><CheckCircle2 className="w-3.5" /> Approve</div></div></TourSectionCard>)}</section>}
        </TourScrollContent>
      </CurrentAppScreen>
      {!requests ? <span className="absolute bottom-4 right-4 z-30 grid size-14 place-items-center rounded-full border-[3px] border-white bg-gradient-to-br from-[#008d8c] to-[#00777a] text-white shadow-[0_14px_26px_rgba(0,119,122,.34)]"><UserPlus className="w-5" /></span> : null}
    </div>
  )
}
