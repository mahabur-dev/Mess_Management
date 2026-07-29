import { PHASE_DEVELOPMENT_SERVER } from 'next/constants.js'

/** @param {string} phase */
export default function createNextConfig(phase) {
  const isDevelopmentServer = phase === PHASE_DEVELOPMENT_SERVER

  /** @type {import('next').NextConfig} */
  const nextConfig = {
    // Capacitor consumes the static export. Keeping export mode out of
    // `next dev` prevents development-only head reconciliation during SPA
    // navigation while preserving the production `out` directory.
    ...(isDevelopmentServer ? {} : { output: 'export' }),
    trailingSlash: true,
    images: {
      unoptimized: true,
    },
    devIndicators: false,
    turbopack: {
      root: process.cwd(),
    },
  }

  return nextConfig
}
