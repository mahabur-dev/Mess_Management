/** Product switches shared by dashboard navigation, routes and data requests. */
export const APP_FEATURES = {
  // Defaults to false. Next.js exposes NEXT_PUBLIC_* values at build time.
  subscriptions:
    process.env.NEXT_PUBLIC_SUBSCRIPTION_FEATURE_ENABLED?.trim().toLowerCase() === 'true',
} as const
