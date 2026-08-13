export type OnboardingVisual = 'brand' | 'workspace' | 'automation' | 'start'

export type OnboardingSlide = {
  id: string
  eyebrow: string
  title: string
  description: string
  visual: OnboardingVisual
}

export const onboardingSlides: readonly OnboardingSlide[] = [
  {
    id: 'welcome',
    eyebrow: '',
    title: 'Welcome to Messzen',
    description: 'Mess & Hostel Management, made simple and dependable.',
    visual: 'brand',
  },
  {
    id: 'workspace',
    eyebrow: '',
    title: 'Simplify your mess or hostel',
    description: 'Manage members, meals, expenses, utilities and payments from one dependable workspace.',
    visual: 'workspace',
  },
  {
    id: 'automation',
    eyebrow: 'FAST, REVIEWABLE ACTIONS',
    title: 'Speak it. Review it. Save it.',
    description: 'Use Bangla, English or Banglish to add expenses, deposits, utilities or meals, then confirm before anything is saved.',
    visual: 'automation',
  },
  {
    id: 'start',
    eyebrow: '',
    title: 'Start managing today',
    description: 'Bring your mess accounting into a simpler, clearer and more dependable daily flow.',
    visual: 'start',
  },
] as const
