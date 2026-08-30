import type { MetadataRoute } from 'next'
import type { Locale } from './i18n'

const PWA_COPY = {
  en: {
    name: 'Messzen — Mess & Hostel Management',
    description: 'Manage shared meals, expenses, deposits and monthly accounts with Messzen.',
  },
  bn: {
    name: 'Messzen — মেস ও হোস্টেল ব্যবস্থাপনা',
    description: 'Messzen দিয়ে যৌথ মিল, খরচ, ডিপোজিট ও মাসিক হিসাব পরিচালনা করুন।',
  },
} as const satisfies Record<Locale, { name: string; description: string }>

export function manifestForLocale(locale: Locale): MetadataRoute.Manifest {
  const copy = PWA_COPY[locale]
  return {
    id: '/',
    lang: locale === 'bn' ? 'bn-BD' : 'en-BD',
    name: copy.name,
    short_name: 'Messzen',
    description: copy.description,
    start_url: '/',
    display: 'standalone',
    background_color: '#c9eeea',
    theme_color: '#008d8c',
    icons: [{ src: '/icon.svg', sizes: 'any', type: 'image/svg+xml' }],
  }
}
