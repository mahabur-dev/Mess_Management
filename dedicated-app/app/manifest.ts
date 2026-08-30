import type { MetadataRoute } from 'next'
import { manifestForLocale } from '@/lib/pwa-copy'

export const dynamic = 'force-static'

export default function manifest(): MetadataRoute.Manifest {
  return manifestForLocale('en')
}
