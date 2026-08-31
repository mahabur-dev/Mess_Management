import { NextRequest, NextResponse } from 'next/server'

import { APP_FEATURES } from './lib/feature-flags'

export function middleware(request: NextRequest) {
  if (!APP_FEATURES.subscriptions && request.nextUrl.pathname.startsWith('/dashboard/subscriptions')) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/subscriptions/:path*'],
}
