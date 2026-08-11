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
    eyebrow: 'WELCOME TO',
    title: 'Messzen',
    description: 'Mess & Hostel Management App',
    visual: 'brand',
  },
  {
    id: 'workspace',
    eyebrow: 'ONE SHARED WORKSPACE',
    title: 'Run your mess with clarity',
    description: 'Keep members, meals, bazar expenses, utilities and deposits organized in one place.',
    visual: 'workspace',
  },
  {
    id: 'automation',
    eyebrow: 'FAST, REVIEWABLE ACTIONS',
    title: 'Speak it. Review it. Save it.',
    description: 'Use Bangla, English or Banglish with Quick Add, then verify every detail before anything is saved.',
    visual: 'automation',
  },
  {
    id: 'start',
    eyebrow: 'READY WHEN YOU ARE',
    title: 'Start managing today',
    description: 'Bring your mess accounting into a simpler, clearer and more dependable daily flow.',
    visual: 'start',
  },
] as const
