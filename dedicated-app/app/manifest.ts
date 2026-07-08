import type { MetadataRoute } from 'next'

export const dynamic = 'force-static'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Dedicated Mess App',
    short_name: 'Mess App',
    start_url: '/',
    display: 'standalone',
    background_color: '#f3f8fc',
    theme_color: '#fc782d',
    icons: [{ src: '/icon.svg', sizes: 'any', type: 'image/svg+xml' }],
  }
}
