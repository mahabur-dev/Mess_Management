import { readFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'

const root = process.cwd()
const read = (file) => readFile(path.join(root, file), 'utf8')
const violations = []

const [authShell, login, onboarding, morePage, providers, settings, mealSettings, quickAdd] = await Promise.all([
  read('components/auth-ui.tsx'),
  read('app/login/page.tsx'),
  read('app/onboarding/page.tsx'),
  read('app/more/page.tsx'),
  read('app/providers.tsx'),
  read('app/settings/page.tsx'),
  read('app/meals/settings/page.tsx'),
  read('app/quick-add/page.tsx'),
])

if (!authShell.includes('showLanguageToggle ? <AuthLanguageToggle /> : null')) {
  violations.push('AuthShell language control must remain explicitly opt-in.')
}
if (!login.includes('showLanguageToggle')) violations.push('Login must expose the language switcher.')
if (onboarding.includes('AuthLanguageToggle')) violations.push('Onboarding must not expose a language switcher.')
if (!morePage.includes('<AuthLanguageToggle />')) violations.push('More page must expose the language switcher.')
if (settings.includes('LanguageSegmentedControl') || mealSettings.includes('LanguageSegmentedControl')) {
  violations.push('Authenticated settings screens must not duplicate the global language switcher.')
}
if (!quickAdd.includes('trailing={<NotificationLink />}')) {
  violations.push('Quick Add header must expose the notification action.')
}

const updatePreference = providers.indexOf('api.updatePreferredLocale(locale)')
const loadProfile = providers.indexOf('const profile = await api.getProfile()', updatePreference)
const preserveLoginLocale = providers.indexOf('receiveUser(profile.data, false)', loadProfile)
if (updatePreference < 0 || loadProfile < updatePreference || preserveLoginLocale < loadProfile) {
  violations.push('Login must persist the selected locale before profile load and preserve it when receiving the profile.')
}

const personalPages = [
  'app/personal/page.tsx',
  'app/personal/transactions/page.tsx',
  'app/personal/transactions/add/page.tsx',
  'app/personal/reports/page.tsx',
  'app/personal/family/page.tsx',
  'app/personal/budget/page.tsx',
]
for (const file of personalPages) {
  const source = await read(file)
  if (source.includes('CompactLanguageToggle')) violations.push(`${file} must not expose a language switcher.`)
}

if (violations.length) {
  console.error(`Locale surface contract failed with ${violations.length} violation(s):`)
  violations.forEach((violation) => console.error(`- ${violation}`))
  process.exit(1)
}

console.log('Locale surface contract passed: Login + More only, with authenticated notification actions and login persistence ordering.')
