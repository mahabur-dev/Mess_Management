import Link from 'next/link'
import type { Metadata } from 'next'
import {
  ArrowRight,
  CheckCircle2,
  Shield,
  Sparkles,
  Target,
  TrendingUp,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = {
  title: 'About Us | Messzen.com',
  description:
    'Learn how Messzen simplifies hostel and mess management with smart automation, transparent billing, and better communication.',
}

const valuePoints = [
  'Simple and user-friendly experience for managers and members',
  'Fully responsive design that works beautifully on mobile devices',
  'Real-time communication through notices, alerts, and updates',
  'Accurate automated calculations for meals, bills, and balances',
  'Secure and reliable data handling for daily operations',
]

const plans = [
  {
    name: 'Free Plan',
    summary: 'Get started with essential features and experience the workflow before you scale.',
    badge: 'Getting Started',
    badgeClassName: 'bg-[#eef5ff] text-[#2f80ed]',
  },
  {
    name: 'Monthly Plan',
    summary: 'A practical option for active messes and hostels that need flexibility and full access.',
    badge: 'Flexible Growth',
    badgeClassName: 'bg-[#ecfdf5] text-[#10b981]',
  },
  {
    name: 'Yearly Plan',
    summary: 'Our best-value option for long-term operations that want lower cost and uninterrupted service.',
    badge: 'Best Value',
    badgeClassName: 'bg-[#fffbeb] text-[#f59e0b]',
  },
]

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-white text-[#172554]">
      <section className="overflow-hidden bg-white px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
        <div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-[1.02fr_.98fr]">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-[#d8e6f8] bg-[#f8faff] px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-[#2f80ed]">
              <Sparkles size={14} />
              About Mess Management
            </span>
            <h1 className="mt-6 max-w-4xl text-4xl font-black leading-[1.04] tracking-tight text-[#172554] sm:text-5xl">
              Built to make{' '}
              <span className="bg-gradient-to-r from-[#2f80ed] to-[#8b5cf6] bg-clip-text text-transparent">
                hostel and mess operations
              </span>{' '}
              easier, faster, and more transparent
            </h1>
            <p className="mt-6 max-w-2xl text-base font-semibold leading-8 text-[#6b7a99] sm:text-lg">
              Mess & Hostel Management System is a modern digital platform designed to replace stressful manual work with
              organized workflows, smart automation, and a cleaner experience for both managers and members.
            </p>
            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <Button asChild className="h-12 rounded-xl bg-gradient-to-r from-[#2f80ed] to-[#3b8cff] px-7 font-black text-white shadow-[0_12px_28px_rgba(47,128,237,0.25)] hover:shadow-[0_16px_35px_rgba(47,128,237,0.32)]">
                <Link href="/register" className="flex items-center gap-2">
                  Get Started Today
                  <ArrowRight size={18} />
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-12 rounded-xl border-[#d8e6f8] bg-white px-7 font-black text-[#2f80ed] hover:bg-[#f8faff] hover:border-[#a9ccfb]">
                <Link href="/#pricing">View Plans</Link>
              </Button>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -left-6 top-10 h-24 w-24 rounded-full bg-[#e7f1ff] blur-3xl" />
            <div className="absolute right-0 top-0 h-28 w-28 rounded-full bg-[#f5f3ff] blur-3xl" />
            <div className="relative overflow-hidden rounded-[28px] border border-[#e6ebf4] bg-gradient-to-br from-white via-[#f8fbff] to-[#eef5ff] p-6 shadow-[0_24px_64px_rgba(47,128,237,0.14)] sm:p-8">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-[#e6ebf4] bg-white p-5">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#e7f1ff] text-[#2f80ed]">
                    <Target size={20} />
                  </div>
                  <h2 className="mt-4 text-lg font-black text-[#172554]">Our Mission</h2>
                  <p className="mt-2 text-sm font-semibold leading-7 text-[#6b7a99]">
                    Make daily management simple, efficient, and transparent while reducing manual work and confusion.
                  </p>
                </div>
                <div className="rounded-2xl border border-[#e6ebf4] bg-white p-5">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#ecfdf5] text-[#10b981]">
                    <TrendingUp size={20} />
                  </div>
                  <h2 className="mt-4 text-lg font-black text-[#172554]">Our Vision</h2>
                  <p className="mt-2 text-sm font-semibold leading-7 text-[#6b7a99]">
                    Build a smarter future where shared living management becomes effortless and scalable.
                  </p>
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-[#e6ebf4] bg-white p-6 shadow-[0_10px_28px_rgba(65,103,153,0.07)]">
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#2f80ed]">Why We Built This</p>
                <p className="mt-3 text-sm font-semibold leading-7 text-[#53617d]">
                  Manual meal counting, scattered expenses, delayed notices, and unclear billing create unnecessary pressure.
                  Our platform centralizes these tasks so managers can focus on operations and members can trust the process.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[.92fr_1.08fr]">
          <div className="rounded-[28px] border border-[#e6ebf4] bg-gradient-to-br from-white via-[#f8fbff] to-[#eef5ff] p-8 shadow-[0_20px_50px_rgba(47,128,237,0.10)]">
            <span className="inline-flex rounded-full border border-[#d8e6f8] bg-white px-4 py-1.5 text-xs font-black uppercase tracking-[0.18em] text-[#2f80ed]">
              Why Choose Us
            </span>
            <h2 className="mt-5 text-3xl font-black tracking-tight text-[#172554] sm:text-4xl">
              Built for clarity, trust, and control
            </h2>
            <p className="mt-4 text-sm font-semibold leading-8 text-[#53617d]">
              We help hostel and mess operators replace scattered spreadsheets, phone calls, and manual registers with one
              dependable system that feels simple to use every day.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {valuePoints.map((item) => (
              <div key={item} className="rounded-2xl border border-[#e6ebf4] bg-[#fafcff] p-5">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#e7f1ff] text-[#2f80ed]">
                    <CheckCircle2 size={16} />
                  </span>
                  <p className="text-sm font-bold leading-7 text-[#172554]">{item}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#fafcff] px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center rounded-full border border-[#d8e6f8] bg-white px-4 py-1.5 text-xs font-black uppercase tracking-[0.18em] text-[#2f80ed]">
              Flexible Plans
            </span>
            <h2 className="mt-4 text-3xl font-black tracking-tight text-[#172554] sm:text-4xl">
              Subscription options that fit your size and stage
            </h2>
            <p className="mt-4 text-base font-semibold leading-7 text-[#6b7a99]">
              Start small, grow at your own pace, and choose the plan that works best for your hostel or mess.
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className="rounded-2xl border border-[#e6ebf4] bg-white p-7 shadow-[0_12px_35px_rgba(65,103,153,0.08)] transition hover:-translate-y-1 hover:shadow-[0_18px_45px_rgba(47,128,237,0.12)]"
              >
                <span className={`inline-flex rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em] ${plan.badgeClassName}`}>
                  {plan.badge}
                </span>
                <h3 className="mt-5 text-2xl font-black text-[#172554]">{plan.name}</h3>
                <p className="mt-3 text-sm font-semibold leading-7 text-[#6b7a99]">{plan.summary}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl rounded-[30px] border border-[#dbe7fb] bg-gradient-to-r from-[#f8fbff] via-[#eef6ff] to-[#e4f2ff] p-8 text-[#172554] shadow-[0_20px_55px_rgba(47,128,237,0.12)] sm:p-12">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <span className="inline-flex items-center gap-2 rounded-full border border-[#d8e6f8] bg-white px-4 py-1.5 text-xs font-black uppercase tracking-[0.18em] text-[#2f80ed] shadow-sm">
                <Shield size={14} className="text-[#2f80ed]" />
                Get Started Today
              </span>
              <h2 className="mt-5 text-3xl font-black tracking-tight sm:text-4xl">
                A smarter way to manage your hostel or mess starts here
              </h2>
              <p className="mt-4 text-sm font-semibold leading-8 text-[#53617d] sm:text-base">
                Whether you manage a small mess or a large hostel, our system helps you save time, reduce errors, and
                run operations with confidence.
              </p>
            </div>

            <Button asChild className="h-12 rounded-xl bg-gradient-to-r from-[#2f80ed] to-[#3b8cff] px-7 font-black text-white shadow-[0_12px_28px_rgba(47,128,237,0.22)] hover:shadow-[0_16px_34px_rgba(47,128,237,0.28)]">
              <Link href="/register" className="flex items-center gap-2">
                Join Us Now
                <ArrowRight size={18} />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </main>
  )
}
