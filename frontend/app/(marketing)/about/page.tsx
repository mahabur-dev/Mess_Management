import Image from 'next/image'
import Link from 'next/link'
import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import {
  ArrowRight,
  BarChart3,
  Bell,
  Building2,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  Monitor,
  PieChart,
  Quote,
  ReceiptText,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Utensils,
  UsersRound,
  WalletCards,
} from 'lucide-react'
import { MarketingHero } from '@/components/marketing-hero'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = {
  title: 'About Us | Messzen.com',
  description:
    'Learn how Messzen simplifies hostel and mess management with smart automation, transparent billing, and better communication.',
}

const storyCards = [
  {
    title: 'Centralized Management',
    text: 'Everything in one place: members, rooms, meals, expenses, deposits, and more.',
    icon: ClipboardCheck,
  },
  {
    title: 'Transparency & Accuracy',
    text: 'Accurate calculations and real-time updates ensure complete transparency.',
    icon: PieChart,
  },
  {
    title: 'Save Time & Reduce Work',
    text: 'Automate daily tasks and reports to save valuable time and reduce manual work.',
    icon: Clock3,
  },
  {
    title: 'Access Anywhere, Anytime',
    text: 'Powerful web dashboard and mobile access to manage on the go from any device.',
    icon: Smartphone,
  },
]

const desktopFeatures = [
  'Complete overview of your hostel or mess',
  'Manage members, rooms, meals, expenses and deposits',
  'Generate bills and reports easily',
  'Advanced analytics and insights',
  'Secure and role-based access',
]

const mobileFeatures = [
  'Quick actions on the go',
  'View key information instantly',
  'Add meals, expenses, deposits and more',
  'Stay updated with notices and announcements',
  'Perfect for managers and members',
]

const trustFeatures = [
  {
    title: 'Meal Management',
    text: 'Track daily meals, head count and food expenses efficiently.',
    icon: Utensils,
  },
  {
    title: 'Expense Tracking',
    text: 'Record all types of expenses with categories and payment types.',
    icon: WalletCards,
  },
  {
    title: 'Member & Room Management',
    text: 'Keep member and room information organized and up to date.',
    icon: UsersRound,
  },
  {
    title: 'Monthly Billing',
    text: 'Generate accurate monthly bills in just a few clicks.',
    icon: ReceiptText,
  },
  {
    title: 'Notices & Alerts',
    text: 'Send important notices and get instant notifications.',
    icon: Bell,
  },
  {
    title: 'Reports & Analytics',
    text: 'Get clear insights and reports to make better decisions.',
    icon: BarChart3,
  },
]

const stats = [
  {
    value: '1000+',
    label: 'Hostels & Messes',
    icon: Building2,
  },
  {
    value: '10K+',
    label: 'Active Users',
    icon: UsersRound,
  },
  {
    value: '50K+',
    label: 'Meals Managed',
    icon: Utensils,
  },
  {
    value: '99%',
    label: 'Customer Satisfaction',
    icon: ShieldCheck,
  },
]

function SectionBadge({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={`inline-flex flex-col items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-[#008b80] lg:items-start ${className}`}
    >
      {children}
      <span className="h-0.5 w-8 rounded-full bg-[#008b80]" />
    </span>
  )
}

function StorySection() {
  return (
    <section className="bg-white px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
      <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[.78fr_1.22fr]">
        <div className="text-center lg:text-left">
          <SectionBadge>Our Story</SectionBadge>
          <h2 className="mt-5 text-2xl font-black leading-tight tracking-tight text-[#071821] sm:text-3xl">
            Built to Solve Real-World Management Challenges
          </h2>
          <p className="mt-4 text-sm font-medium leading-7 text-[#334155]">
            Managing a hostel or mess involves countless daily tasks, manual calculations,
            paperwork, and constant follow-ups. We built Messzen to bring everything into
            one organized system, making it simple, transparent, and stress-free for both
            managers and members.
          </p>
          <Button asChild className="mt-6 h-11 rounded-md bg-[#006b63] px-5 text-sm font-black text-white shadow-[0_12px_24px_rgba(0,107,99,0.22)] hover:bg-[#00574f]">
            <Link href="/register" className="flex items-center gap-2">
              Our Mission
              <ArrowRight size={16} />
            </Link>
          </Button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {storyCards.map(({ title, text, icon: Icon }) => (
            <article
              key={title}
              className="rounded-2xl border border-[#d8e8e7] bg-white p-6 text-center shadow-[0_14px_36px_rgba(15,23,42,0.05)] transition hover:-translate-y-1 hover:shadow-[0_18px_45px_rgba(0,107,99,0.12)]"
            >
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#e7f7f5] text-[#008b80]">
                <Icon size={26} />
              </div>
              <h3 className="mt-5 text-base font-black leading-6 text-[#071821]">{title}</h3>
              <p className="mt-3 text-sm font-medium leading-7 text-[#334155]">{text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

function PlatformSection() {
  return (
    <section className="bg-[#fbfdfd] px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-3xl text-center">
          <SectionBadge className="items-center">Our Platform</SectionBadge>
          <h2 className="mt-4 text-2xl font-black tracking-tight text-[#071821] sm:text-3xl">
            Powerful on Desktop. Convenient on Mobile.
          </h2>
          <p className="mt-2 text-sm font-medium text-[#334155]">
            A seamless experience across all devices.
          </p>
        </div>

        <div className="mt-8 rounded-2xl border border-[#d8e8e7] bg-gradient-to-br from-[#f8fcfc] to-white p-5 shadow-[0_18px_46px_rgba(15,23,42,0.06)] sm:p-7">
          <div className="grid items-center gap-8 lg:grid-cols-[.9fr_1.5fr_.9fr]">
            <div>
              <div className="flex items-center gap-3 text-[#008b80]">
                <Monitor size={26} />
                <h3 className="text-lg font-black">Desktop Dashboard</h3>
              </div>
              <ul className="mt-5 space-y-3">
                {desktopFeatures.map((feature) => (
                  <li key={feature} className="flex items-start gap-3 text-sm font-medium leading-6 text-[#334155]">
                    <CheckCircle2 className="mt-1 shrink-0 text-[#008b80]" size={16} />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            <div className="relative flex items-end justify-center gap-3 overflow-hidden px-1 pt-4">
              <div className="w-[72%] max-w-[560px] overflow-hidden rounded-2xl shadow-[0_18px_28px_rgba(15,23,42,0.18)]">
                <Image
                  src="/labtop.webp"
                  alt="Messzen desktop dashboard on laptop"
                  width={780}
                  height={520}
                  className="w-full object-contain"
                />
              </div>

              <div className="w-[22%] min-w-[76px] max-w-[150px] rounded-[1.35rem] border-[6px] border-[#101820] bg-[#101820] shadow-[0_18px_24px_rgba(15,23,42,0.22)]">
                <div className="mx-auto mb-1 h-1.5 w-10 rounded-b-full bg-[#101820]" />
                <div className="overflow-hidden rounded-[1rem] bg-white">
                  <Image
                    src="/phone-dashboard.webp"
                    alt="Messzen mobile dashboard"
                    width={220}
                    height={430}
                    className="aspect-[9/18] w-full object-cover object-top"
                  />
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-3 text-[#008b80] lg:justify-end">
                <Smartphone size={26} />
                <h3 className="text-lg font-black">Mobile Dashboard</h3>
              </div>
              <ul className="mt-5 space-y-3">
                {mobileFeatures.map((feature) => (
                  <li key={feature} className="flex items-start gap-3 text-sm font-medium leading-6 text-[#334155] lg:flex-row-reverse lg:text-right">
                    <CheckCircle2 className="mt-1 shrink-0 text-[#008b80]" size={16} />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function TrustSection() {
  return (
    <section className="bg-white px-4 py-12 sm:px-6 lg:px-8 lg:py-14">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-2xl font-black tracking-tight text-[#071821] sm:text-3xl">
            Why Thousands Trust Messzen
          </h2>
          <span className="mx-auto mt-3 block h-0.5 w-10 rounded-full bg-[#008b80]" />
        </div>

        <div className="mt-9 grid gap-5 sm:grid-cols-2 lg:grid-cols-6">
          {trustFeatures.map(({ title, text, icon: Icon }, index) => (
            <article
              key={title}
              className={`text-center ${index > 0 ? 'lg:border-l lg:border-[#b9d8d5]' : ''} px-3`}
            >
              <Icon className="mx-auto text-[#008b80]" size={36} />
              <h3 className="mt-4 text-sm font-black leading-5 text-[#071821]">{title}</h3>
              <p className="mt-3 text-xs font-medium leading-6 text-[#334155]">{text}</p>
            </article>
          ))}
        </div>

        <div className="mt-10 grid gap-4 rounded-xl bg-gradient-to-r from-[#00645c] to-[#008f85] p-5 text-white shadow-[0_18px_42px_rgba(0,107,99,0.24)] sm:grid-cols-2 lg:grid-cols-4">
          {stats.map(({ value, label, icon: Icon }) => (
            <div key={label} className="flex items-center justify-center gap-4 text-center sm:text-left">
              <Icon size={34} className="shrink-0 text-white/80" />
              <div>
                <p className="text-2xl font-black leading-none sm:text-3xl">{value}</p>
                <p className="mt-1 text-sm font-medium text-white/90">{label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function FounderSection() {
  return (
    <section className="bg-white px-4 pb-16 pt-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="grid items-center gap-8 rounded-2xl border border-[#d8e8e7] bg-gradient-to-br from-[#f6fbfb] via-white to-[#e9f7f5] p-6 shadow-[0_18px_44px_rgba(15,23,42,0.06)] sm:p-8 lg:grid-cols-[.72fr_.9fr_1.08fr]">
          <div className="mx-auto w-full max-w-[250px] overflow-hidden rounded-2xl bg-[#d9f0ed]">
            <Image
              src="/ai-photo.webp"
              alt="Mahabur Rahman, Founder of Messzen"
              width={420}
              height={500}
              className="aspect-[4/5] w-full object-cover"
            />
          </div>

          <div className="text-center lg:text-left">
            <span className="text-xs font-black uppercase tracking-[0.18em] text-[#008b80]">Founder</span>
            <h2 className="mt-3 text-2xl font-black tracking-tight text-[#071821] sm:text-3xl">
              Mahabur Rahman
            </h2>
            <p className="mt-2 text-lg font-black text-[#006b63]">Founder, Messzen</p>
            <p className="mt-2 text-sm font-medium text-[#334155]">Software Engineer since 2025</p>
          </div>

          <div className="border-t border-[#b9d8d5] pt-6 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
            <Quote size={28} className="text-[#008b80]" />
            <p className="mt-4 text-sm font-medium leading-7 text-[#334155] sm:text-base">
              Messzen was created to solve the everyday challenges of managing shared
              living spaces. Our goal is to replace complicated manual processes with
              a simple, transparent and reliable digital experience for everyone.
            </p>
            <p className="mt-5 font-serif text-2xl italic text-[#008b80]">Mahabur Rahman</p>
          </div>
        </div>
      </div>
    </section>
  )
}

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-white text-[#071821]">
      <MarketingHero />
      <StorySection />
      <PlatformSection />
      <TrustSection />
      <FounderSection />
    </main>
  )
}
