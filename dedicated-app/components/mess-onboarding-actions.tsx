'use client'

import Link from 'next/link'
import { Building2, DoorOpen, Plus, Search } from 'lucide-react'
import { appHref } from '@/lib/routes'

export function MessOnboardingActions() {
  return (
    <section className="mess-onboarding-panel">
      <div className="flex items-start gap-3">
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-[16px] bg-[#edfafa] text-[#008d8c]">
          <Building2 size={23} strokeWidth={2.35} />
        </div>
        <div className="min-w-0">
          <div className="text-title-sm font-black leading-tight text-[#123748]">Set up your mess</div>
          <p className="mt-1 text-label font-semibold leading-snug text-[#65838b]">
            Create a new mess as manager or request to join an existing mess.
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-2.5">
        <Link href={appHref('/create-mess')} className="mess-onboarding-action mess-onboarding-action--primary">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[14px] bg-white/18 text-white">
            <Plus size={20} strokeWidth={2.6} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-body font-black leading-tight">Create Mess</span>
            <span className="mt-0.5 block text-caption font-semibold leading-snug text-white/82">Start your own mess workspace</span>
          </span>
        </Link>

        <Link href={appHref('/request-mess')} className="mess-onboarding-action mess-onboarding-action--secondary">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[14px] bg-[#edfafa] text-[#008d8c]">
            <DoorOpen size={20} strokeWidth={2.4} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-body font-black leading-tight text-[#123748]">Request Mess</span>
            <span className="mt-0.5 block text-caption font-semibold leading-snug text-[#65838b]">Find a mess and ask manager approval</span>
          </span>
          <Search className="shrink-0 text-[#008d8c]" size={18} strokeWidth={2.4} />
        </Link>
      </div>
    </section>
  )
}
