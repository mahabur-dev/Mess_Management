import { spawnSync } from 'node:child_process'
import path from 'node:path'
import process from 'node:process'

const root = process.cwd()
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm'
const node = process.execPath
const strictNative = process.argv.includes('--strict-native')
const steps = [
  ['Typography tokens', npm, ['run', 'check:typography'], root],
  ['Dictionary parity', npm, ['run', 'check:i18n'], root],
  ['Hardcoded copy', node, ['scripts/check-hardcoded-copy.mjs'], root],
  ['Accessibility source', node, ['scripts/check-accessibility.mjs'], root],
  ['Locale surfaces and login persistence', node, ['scripts/check-locale-surfaces.mjs'], root],
  ['Localization, role and error unit suites', node, ['scripts/phase8-unit-tests.cjs'], root],
  ['Backend API/push contract build', npm, ['run', 'build'], path.resolve(root, '..', 'backend')],
  ['Backend API/push contract tests', node, ['--test', 'test/api-message-contract.test.js', 'test/notification-localization.test.js'], path.resolve(root, '..', 'backend')],
  ['Production static export', npm, ['run', 'build'], root],
  ['Bilingual visual/mobile QA', node, ['scripts/visual-qa.mjs'], root],
  ['Capacitor Android sync', npm, ['run', 'cap:sync', '--', 'android'], root],
  ['Capacitor Android smoke', node, ['scripts/android-smoke.mjs', ...(strictNative ? ['--strict'] : [])], root],
]

for (const [label, command, args, cwd] of steps) {
  console.log(`\n=== ${label} ===`)
  const result = spawnSync(command, args, { cwd, stdio: 'inherit', shell: false })
  if (result.status !== 0) process.exit(result.status ?? 1)
}
console.log(`\nPhase 8 ${strictNative ? 'controlled-release' : 'verification'} gate passed.`)
