import Image from 'next/image'
import {
  BarChart3,
  ShieldCheck,
  UsersRound,
  Zap,
} from 'lucide-react'

const heroTrustPoints = [
  {
    title: 'Secure & Reliable',
    icon: ShieldCheck,
  },
  {
    title: 'Save Time',
    icon: Zap,
  },
  {
    title: 'Data-Driven',
    icon: BarChart3,
  },
  {
    title: 'Built for Everyone',
    icon: UsersRound,
  },
]

type MarketingHeroProps = {
  eyebrow?: string
}

export function MarketingHero({ eyebrow = 'About Messzen' }: MarketingHeroProps) {
  return (
    <section className="relative overflow-hidden bg-[#002f34] px-4 py-12 text-white sm:px-6 lg:px-8 lg:py-14">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_84%_10%,rgba(0,143,133,0.42),transparent_27rem),linear-gradient(105deg,#00272c_0%,#00373d_48%,#002f34_100%)]" />
      <div className="absolute right-5 top-10 hidden h-44 w-44 bg-[radial-gradient(circle,#20d7c9_1.25px,transparent_1.25px)] [background-size:17px_17px] opacity-45 lg:block" />
      <div className="absolute -bottom-10 right-0 hidden h-60 w-60 rounded-full border border-[#20d7c9]/24 lg:block" />

      <div className="relative mx-auto grid max-w-7xl items-center gap-9 lg:grid-cols-[.92fr_1.08fr]">
        <div className="text-center lg:text-left">
          <span className="inline-flex flex-col items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-[#25d7c8] lg:items-start">
            {eyebrow}
            <span className="h-0.5 w-8 rounded-full bg-[#25d7c8]" />
          </span>
          <h1 className="mx-auto mt-5 max-w-2xl text-3xl font-black leading-[1.14] tracking-tight text-white sm:text-4xl lg:mx-0 lg:text-[2.85rem]">
            The Complete Solution for Hostel & Mess Management
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-sm font-medium leading-7 text-white/82 sm:text-base lg:mx-0">
            Messzen helps hostel owners, mess managers, and members manage meals,
            expenses, deposits, bills, rooms, and communication in one smart platform.
          </p>

          <div className="mt-8 grid grid-cols-2 gap-x-3 gap-y-5 sm:grid-cols-4 lg:max-w-xl">
            {heroTrustPoints.map(({ title, icon: Icon }, index) => (
              <div
                key={title}
                className={`text-center ${index > 0 ? 'sm:border-l sm:border-[#25d7c8]/28' : ''}`}
              >
                <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-[#0b5a5f] text-[#cffffb] shadow-[0_10px_24px_rgba(0,0,0,0.2)] ring-1 ring-[#25d7c8]/20">
                  <Icon size={20} />
                </div>
                <p className="mt-3 text-[11px] font-black leading-4 text-white">{title}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-3xl lg:max-w-none">
          <div className="absolute inset-x-8 bottom-4 h-16 rounded-[100%] bg-black/55 blur-2xl sm:h-20" />
          <div className="relative mx-auto w-full max-w-[760px] overflow-hidden rounded-[18px] sm:rounded-[24px]">
            <Image
              src="/labtop.webp"
              alt="Messzen dashboard displayed on a laptop"
              width={1536}
              height={1024}
              priority
              className="w-full object-contain drop-shadow-[0_30px_40px_rgba(0,0,0,0.38)]"
            />
          </div>
        </div>
      </div>
    </section>
  )
}
