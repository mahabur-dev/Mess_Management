export type OnboardingVisual = 'brand' | 'workspace' | 'automation' | 'start'

export type OnboardingSlide = {
  id: 'welcome' | 'workspace' | 'automation' | 'start'
  visual: OnboardingVisual
}

export const onboardingSlides: readonly OnboardingSlide[] = [
  {
    id: 'welcome',
    visual: 'brand',
  },
  {
    id: 'workspace',
    visual: 'workspace',
  },
  {
    id: 'automation',
    visual: 'automation',
  },
  {
    id: 'start',
    visual: 'start',
  },
] as const
