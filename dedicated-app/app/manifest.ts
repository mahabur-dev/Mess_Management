import type { MetadataRoute } from 'next'

export const dynamic = 'force-static'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Messzen — Mess & Hostel Management',
    short_name: 'Messzen',
    start_url: '/',
    display: 'standalone',
    background_color: '#c9eeea',
    theme_color: '#008d8c',
    icons: [{ src: '/icon.svg', sizes: 'any', type: 'image/svg+xml' }],
  }
}
