/** Product switches for the dedicated mobile app. */
export const APP_FEATURES = {
  // Defaults to false. Rebuild the app with true to restore subscription UI.
  subscriptions:
    process.env.NEXT_PUBLIC_SUBSCRIPTION_FEATURE_ENABLED?.trim().toLowerCase() === 'true',
} as const
