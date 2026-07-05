import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.mess.management',
  appName: 'Mess Management',
  webDir: 'out',
  server: {
    androidScheme: 'https',
    cleartext: true,
  },
}

export default config
