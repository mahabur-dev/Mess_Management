import { PHASE_DEVELOPMENT_SERVER } from 'next/constants.js'

/** @param {string} phase */
export default function createNextConfig(phase) {
  const isDevelopmentServer = phase === PHASE_DEVELOPMENT_SERVER

  /** @type {import('next').NextConfig} */
  const nextConfig = {
    // Next 15 uses the same output directory for development and production.
    // Isolate them so a verification build cannot corrupt a running dev server.
    distDir: isDevelopmentServer ? '.next-dev' : '.next',
    // Capacitor consumes the static export. Keeping export mode out of
    // `next dev` prevents development-only head reconciliation during SPA
    // navigation while preserving the production `out` directory.
    ...(isDevelopmentServer ? {} : { output: 'export' }),
    trailingSlash: true,
    images: {
      unoptimized: true,
    },
    // Freeze native feature switches into the exported WebView bundle. This
    // prevents APK and AAB packaging from observing different runtime envs.
    env: {
      NEXT_PUBLIC_GOOGLE_AUTH_ENABLED:
        process.env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED ?? 'false',
      NEXT_PUBLIC_NATIVE_PUSH_ENABLED:
        process.env.NEXT_PUBLIC_NATIVE_PUSH_ENABLED ?? 'false',
    },
    devIndicators: false,
    turbopack: {
      root: process.cwd(),
    },
  }

  return nextConfig
}
