import { existsSync } from 'node:fs'
import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { spawnSync } from 'node:child_process'

const root = process.cwd()
const exported = path.join(root, 'out')
const nativeAssets = path.join(root, 'android', 'app', 'src', 'main', 'assets', 'public')
const required = [
  path.join(exported, 'index.html'),
  path.join(exported, 'manifest-en.webmanifest'),
  path.join(exported, 'manifest-bn.webmanifest'),
  path.join(nativeAssets, 'index.html'),
  path.join(nativeAssets, 'manifest-en.webmanifest'),
  path.join(nativeAssets, 'manifest-bn.webmanifest'),
  path.join(root, 'android', 'app', 'src', 'main', 'AndroidManifest.xml'),
  path.join(root, 'android', 'app', 'src', 'main', 'java', 'com', 'mess', 'management', 'MainActivity.java'),
]
const missing = required.filter((file) => !existsSync(file))
if (missing.length) throw new Error(`Capacitor Android smoke failed; missing:\n${missing.join('\n')}`)

async function htmlCount(directory) {
  let total = 0
  for (const item of await readdir(directory, { withFileTypes: true })) {
    if (item.isDirectory()) total += await htmlCount(path.join(directory, item.name))
    else if (item.name === 'index.html') total += 1
  }
  return total
}
const [exportedRoutes, nativeRoutes] = await Promise.all([htmlCount(exported), htmlCount(nativeAssets)])
if (exportedRoutes !== nativeRoutes) throw new Error(`Capacitor assets are stale: export=${exportedRoutes}, Android=${nativeRoutes}`)

async function findQuickAddChunk(directory) {
  for (const item of await readdir(directory, { withFileTypes: true })) {
    const target = path.join(directory, item.name)
    if (item.isDirectory()) {
      const nested = await findQuickAddChunk(target)
      if (nested) return nested
    } else if (/page-[a-f0-9]+\.js$/i.test(item.name) && directory.endsWith(path.join('app', 'quick-add'))) {
      return target
    }
  }
  return null
}

const quickAddChunk = await findQuickAddChunk(path.join(nativeAssets, '_next', 'static', 'chunks'))
if (!quickAddChunk) throw new Error('Capacitor assets are stale: Quick Add bundle is missing.')
const quickAddSource = await readFile(quickAddChunk, 'utf8')
if (!quickAddSource.includes('speechLanguage:"auto"')) {
  throw new Error('Capacitor assets are stale: Quick Add voice must use automatic language detection.')
}
if (!quickAddSource.includes('Free command usage')) {
  throw new Error('Capacitor assets are stale: Quick Add command quota UI is missing.')
}

const config = await readFile(path.join(root, 'capacitor.config.ts'), 'utf8')
if (!config.includes("appId: 'com.mess.management'") || !config.includes("webDir: 'out'")) {
  throw new Error('Capacitor appId/webDir contract is invalid.')
}
console.log(`PASS Capacitor sync smoke: ${nativeRoutes} static routes and bilingual manifests copied.`)

const java = spawnSync('java', ['-version'], { encoding: 'utf8', shell: true })
if (java.status === 0) {
  const gradle = process.platform === 'win32' ? 'gradlew.bat' : './gradlew'
  const result = spawnSync(gradle, ['assembleDebug'], { cwd: path.join(root, 'android'), stdio: 'inherit', shell: process.platform === 'win32' })
  if (result.status !== 0) process.exit(result.status ?? 1)
  console.log('PASS Android assembleDebug native smoke.')
} else if (process.argv.includes('--strict')) {
  throw new Error('Android native compile requires JDK 21 (java is not available on PATH).')
} else {
  console.warn('SKIP Android assembleDebug: JDK is not installed; Capacitor sync and native asset smoke passed.')
}
