import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.mess.management',
  appName: 'Mess Management',
  webDir: 'out',
  // server: {
  //   androidScheme: 'https',
  //   cleartext: true,
  // },
  server: {
    url: 'http://localhost:3000',
    cleartext: true,
    androidScheme: 'http',
  },
  plugins: {
    StatusBar: {
      overlaysWebView: true,
      // Internal screens use a dark brand header by default. Route-aware
      // runtime overrides keep Auth, Onboarding and More surfaces dark-on-light.
      style: 'DARK',
    },
    FirebaseAuthentication: {
      skipNativeAuth: false,
      providers: ['google.com'],
    },
  },
}

export default config
