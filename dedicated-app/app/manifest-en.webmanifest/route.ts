import { manifestForLocale } from '@/lib/pwa-copy'

export const dynamic = 'force-static'

export function GET() {
  return Response.json(manifestForLocale('en'), {
    headers: {
      'Cache-Control': 'public, max-age=3600, must-revalidate',
      'Content-Type': 'application/manifest+json; charset=utf-8',
    },
  })
}
