'use client'

import Link from 'next/link'
import type { LucideIcon } from 'lucide-react'
import {
  BarChart3,
  Building2,
  ChevronRight,
  DoorOpen,
  PackageOpen,
  ShieldCheck,
  Sparkles,
  Sprout,
  UserRound,
  UsersRound,
} from 'lucide-react'
import { appHref } from '@/lib/routes'
import { useLocaleFormatters, useTranslations } from '@/lib/i18n'

type OnboardingActionVariant = 'primary' | 'secondary' | 'benefit'

type OnboardingActionProps = {
  href: string
  title: string
  subtitle: string
  icon: LucideIcon
  trailingIcon: LucideIcon
  variant: OnboardingActionVariant
  showPlus?: boolean
}

function EmptyMessIllustration() {
  return (
    <div className="no-mess-illustration" aria-hidden="true">
      <span className="no-mess-illustration__cloud no-mess-illustration__cloud--left" />
      <span className="no-mess-illustration__cloud no-mess-illustration__cloud--right" />
      <Sparkles className="no-mess-illustration__spark no-mess-illustration__spark--one" size={17} />
      <Sparkles className="no-mess-illustration__spark no-mess-illustration__spark--two" size={12} />
      <Sprout className="no-mess-illustration__plant" size={38} strokeWidth={1.8} />
      <span className="no-mess-illustration__box">
        <PackageOpen size={118} strokeWidth={1.35} />
      </span>
      <span className="no-mess-illustration__building">
        <Building2 size={74} strokeWidth={1.7} />
      </span>
    </div>
  )
}

function OnboardingAction({
  href,
  title,
  subtitle,
  icon: Icon,
  trailingIcon: TrailingIcon,
  variant,
  showPlus = false,
}: OnboardingActionProps) {
  return (
    <Link href={appHref(href)} className={`no-mess-action no-mess-action--${variant}`}>
      <span className="no-mess-action__icon">
        <Icon size={27} strokeWidth={2.1} />
        {showPlus ? <span className="no-mess-action__plus">+</span> : null}
      </span>
      <span className="min-w-0 flex-1">
        <span className="no-mess-action__title">{title}</span>
        <span className="no-mess-action__subtitle">{subtitle}</span>
      </span>
      <span className="no-mess-action__trailing" data-variant={variant} aria-hidden="true">
        <TrailingIcon size={variant === 'secondary' ? 23 : 20} strokeWidth={2.35} />
      </span>
    </Link>
  )
}

export function MessOnboardingActions({ compact = false }: { compact?: boolean }) {
  const auth = useTranslations('auth')
  const format = useLocaleFormatters()
  const onboardingActions: OnboardingActionProps[] = [
    {
      href: '/create-mess',
      title: auth('createMessTitle'),
      subtitle: auth('createMessSubtitle'),
      icon: Building2,
      trailingIcon: ChevronRight,
      variant: 'primary',
      showPlus: true,
    },
    {
      href: '/request-mess',
      title: auth('requestMessTitle'),
      subtitle: auth('requestMessSubtitle'),
      icon: DoorOpen,
      trailingIcon: ChevronRight,
      variant: 'secondary',
    },
    {
      href: '/why-join',
      title: auth('whyJoin'),
      subtitle: auth('whyJoinSubtitle'),
      icon: ShieldCheck,
      trailingIcon: ChevronRight,
      variant: 'benefit',
    },
  ]
  const communityMetrics = [
    { value: `${format.number(300)}+`, label: auth('activeMesses'), icon: UsersRound },
    { value: `${format.number(500)}+`, label: auth('happyMembers'), icon: UserRound },
    { value: format.number(0.98, { style: 'percent' }), label: auth('satisfaction'), icon: BarChart3 },
    { value: format.number(0.99, { style: 'percent' }), label: auth('secureSafe'), icon: ShieldCheck },
  ]

  return (
    <div className="no-mess-onboarding">
      <section className="no-mess-card" aria-labelledby="no-mess-title">
        <EmptyMessIllustration />

        <div className="no-mess-copy">
          <h2 id="no-mess-title">{auth('notConnectedTitle')}</h2>
          <p>{auth('notConnectedDescription')}</p>
        </div>

        <div className="no-mess-actions">
          {onboardingActions.map((action) => (
            <OnboardingAction key={action.title} {...action} />
          ))}
        </div>
      </section>

      {!compact ? (
        <section className="no-mess-trust" aria-label={auth('communityHighlights')}>
          <h2>
            <Sparkles size={12} strokeWidth={2} aria-hidden="true" />
            <span>{auth('trustedCommunities')}</span>
            <Sparkles size={12} strokeWidth={2} aria-hidden="true" />
          </h2>
          <div className="no-mess-trust__grid">
            {communityMetrics.map(({ value, label, icon: Icon }) => (
              <div key={label} className="no-mess-trust__metric">
                <span className="no-mess-trust__icon"><Icon size={21} strokeWidth={2.3} /></span>
                <strong>{value}</strong>
                <span>{label}</span>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  )
}
