import { createHash } from 'node:crypto'
import { createReadStream, existsSync } from 'node:fs'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { createServer } from 'node:http'
import path from 'node:path'
import process from 'node:process'
import { spawn } from 'node:child_process'

const update = process.argv.includes('--update')
const root = process.cwd()
const out = path.join(root, 'out')
const baselineDirectory = path.join(root, 'qa', 'visual-baselines')
const artifactDirectory = path.join(root, 'qa', 'artifacts')
const browserCandidates = [
  process.env.MESSZEN_QA_BROWSER,
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
].filter(Boolean)
const browser = browserCandidates.find(existsSync)

if (!existsSync(path.join(out, 'index.html'))) throw new Error('Static export is missing. Run npm run build first.')
if (!browser) throw new Error('Chrome or Edge is required for Phase 8 visual QA.')
await Promise.all([mkdir(baselineDirectory, { recursive: true }), mkdir(artifactDirectory, { recursive: true })])

const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.webmanifest': 'application/manifest+json' }
const server = createServer((request, response) => {
  const pathname = decodeURIComponent(new URL(request.url ?? '/', 'http://localhost').pathname)
  const relative = pathname === '/' ? 'index.html' : pathname.replace(/^\//, '')
  let file = path.resolve(out, relative)
  if (!path.extname(file)) file = path.join(file, 'index.html')
  if (!file.startsWith(path.resolve(out)) || !existsSync(file)) {
    response.writeHead(404).end('Not found')
    return
  }
  response.setHeader('content-type', mime[path.extname(file)] ?? 'application/octet-stream')
  createReadStream(file).pipe(response)
})
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
const port = server.address().port
async function availablePort() {
  const probe = createServer()
  await new Promise((resolve) => probe.listen(0, '127.0.0.1', resolve))
  const value = probe.address().port
  await new Promise((resolve) => probe.close(resolve))
  return value
}
const debuggingPort = await availablePort()
const profile = path.join(artifactDirectory, `.browser-profile-${process.pid}-${Date.now()}`)
const child = spawn(browser, [
  '--headless=new', '--no-sandbox', '--disable-gpu-sandbox', '--in-process-gpu',
  '--disable-gpu', '--disable-software-rasterizer', '--disable-features=VizDisplayCompositor',
  '--no-first-run', '--no-default-browser-check',
  `--remote-debugging-port=${debuggingPort}`, `--user-data-dir=${profile}`, 'about:blank',
], { stdio: 'ignore', windowsHide: true })

const delay = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds))
async function target() {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    if (child.exitCode !== null) throw new Error(`Headless browser exited before DevTools was ready (code ${child.exitCode}).`)
    try {
      const targets = await fetch(`http://127.0.0.1:${debuggingPort}/json/list`).then((response) => response.json())
      const page = targets.find((item) => item.type === 'page')
      if (page?.webSocketDebuggerUrl) return page
    } catch {}
    await delay(100)
  }
  throw new Error('Could not connect to the headless browser.')
}

let socket
let sequence = 0
const pending = new Map()
function call(method, params = {}) {
  const id = ++sequence
  socket.send(JSON.stringify({ id, method, params }))
  return new Promise((resolve, reject) => pending.set(id, { resolve, reject }))
}
async function evaluate(expression) {
  const result = await call('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text)
  return result.result.value
}
async function waitFor(expression, label) {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    try {
      if (await evaluate(`Boolean(${expression})`)) return
    } catch {
      // Navigation replaces the JavaScript execution context; retry against
      // the new document instead of treating that transition as a QA failure.
    }
    await delay(100)
  }
  throw new Error(`Timed out waiting for ${label}.`)
}

function digest(buffer) { return createHash('sha256').update(buffer).digest('hex') }
async function assertScreenshot(name, buffer) {
  const artifact = path.join(artifactDirectory, name)
  const baseline = path.join(baselineDirectory, name)
  await writeFile(artifact, buffer)
  if (update) {
    await writeFile(baseline, buffer)
    console.log(`UPDATED ${path.relative(root, baseline)}`)
    return
  }
  if (!existsSync(baseline)) throw new Error(`Missing visual baseline: ${path.relative(root, baseline)}`)
  const expected = await readFile(baseline)
  if (digest(expected) !== digest(buffer)) throw new Error(`Visual regression detected: ${name}`)
  console.log(`PASS visual baseline ${name}`)
}

async function loadOnboarding(locale, height = 800) {
  await call('Emulation.setDeviceMetricsOverride', { width: 360, height, deviceScaleFactor: 1, mobile: true })
  await call('Page.navigate', { url: `http://127.0.0.1:${port}/onboarding/` })
  await waitFor(`document.readyState === 'complete'`, 'initial page load')
  await evaluate(`localStorage.clear(); localStorage.setItem('messzen:locale', ${JSON.stringify(locale)}); location.reload()`)
  await waitFor(`document.documentElement.dataset.locale === ${JSON.stringify(locale)} && document.querySelector('.onboarding-copy h1')`, `${locale} onboarding`)
  await delay(350)
}

async function layoutAudit(locale) {
  const result = await evaluate(`(() => {
    const visible = (element) => { const style = getComputedStyle(element); const rect = element.getBoundingClientRect(); return style.visibility !== 'hidden' && style.display !== 'none' && rect.width > 0 && rect.height > 0 }
    const name = (element) => element.getAttribute('aria-label') || element.getAttribute('title') || (element.getAttribute('aria-labelledby') || '').split(/\\s+/).map((id) => document.getElementById(id)?.textContent || '').join(' ').trim() || element.textContent.trim()
    const interactive = [...document.querySelectorAll('button,a[href],input,select,textarea')].filter(visible)
    const unnamed = interactive.filter((element) => !name(element)).map((element) => element.outerHTML.slice(0, 120))
    const undersized = interactive.filter((element) => { const rect = element.getBoundingClientRect(); return rect.width < 44 || rect.height < 44 }).map((element) => ({ tag: element.tagName, className: element.className, width: Math.round(element.getBoundingClientRect().width), height: Math.round(element.getBoundingClientRect().height) }))
    const overflow = [...document.querySelectorAll('body *')].filter((element) => { const style = getComputedStyle(element); const directText = [...element.childNodes].some((node) => node.nodeType === Node.TEXT_NODE && node.textContent.trim()); return directText && visible(element) && element.scrollWidth > element.clientWidth + 1 && !['auto','scroll','hidden','clip'].includes(style.overflowX) }).map((element) => ({ tag: element.tagName, className: element.className, delta: element.scrollWidth - element.clientWidth })).slice(0, 10)
    return { lang: document.documentElement.lang, unnamed, undersized, overflow, bodyOverflow: document.documentElement.scrollWidth - innerWidth }
  })()`)
  if (result.lang !== locale) throw new Error(`html lang did not synchronize for ${locale}`)
  if (result.unnamed.length) throw new Error(`Unnamed interactive controls (${locale}): ${JSON.stringify(result.unnamed)}`)
  if (result.undersized.length) throw new Error(`Touch targets below 44x44 (${locale}): ${JSON.stringify(result.undersized)}`)
  if (result.overflow.length || result.bodyOverflow > 1) throw new Error(`Horizontal overflow (${locale}): ${JSON.stringify(result)}`)
  console.log(`PASS ${locale} 360x800 copy, accessible names, overflow and 44px touch targets`)
}

try {
  const page = await target()
  socket = new WebSocket(page.webSocketDebuggerUrl)
  socket.onmessage = (event) => {
    const message = JSON.parse(event.data)
    if (!message.id || !pending.has(message.id)) return
    const request = pending.get(message.id)
    pending.delete(message.id)
    if (message.error) request.reject(new Error(message.error.message))
    else request.resolve(message.result)
  }
  await Promise.race([
    new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = reject }),
    delay(8000).then(() => { throw new Error('Timed out opening the DevTools WebSocket.') }),
  ])
  await Promise.all([call('Page.enable'), call('Runtime.enable')])

  for (const locale of ['en', 'bn']) {
    await loadOnboarding(locale)
    await layoutAudit(locale)
    const screenshot = await call('Page.captureScreenshot', { format: 'png', fromSurface: true })
    await assertScreenshot(`onboarding-${locale}-360x800.png`, Buffer.from(screenshot.data, 'base64'))
  }

  await evaluate(`document.querySelectorAll('.onboarding-dots button')[2].click()`)
  await waitFor(`document.querySelector('.onboarding-secondary-actions button')`, 'automation actions')
  await evaluate(`document.querySelector('.onboarding-secondary-actions button').click()`)
  await waitFor(`document.querySelector('[role="dialog"]')`, 'onboarding guide dialog')
  const dialog = await evaluate(`(() => { const dialog = document.querySelector('[role="dialog"]'); const title = document.getElementById(dialog.getAttribute('aria-labelledby')); return { title: title?.textContent.trim(), focusInside: dialog.contains(document.activeElement), modal: dialog.getAttribute('aria-modal') } })()`)
  if (!dialog.title || !dialog.focusInside || dialog.modal !== 'true') throw new Error(`Dialog accessibility failed: ${JSON.stringify(dialog)}`)
  console.log('PASS translated dialog title, initial focus and modal semantics')

  await evaluate(`document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))`)
  await waitFor(`!document.querySelector('[role="dialog"]')`, 'dialog close')
  await evaluate(`localStorage.setItem('messzen:onboarding-complete:v1', 'complete'); localStorage.setItem('messzen:locale', 'en'); location.href='/login/'`)
  await waitFor(`location.pathname === '/login/' && document.querySelector('input[type="email"]') && document.documentElement.dataset.locale === 'en'`, 'English login')
  await evaluate(`document.querySelector('.auth-language-toggle').click()`)
  await waitFor(`document.documentElement.dataset.locale === 'bn' && localStorage.getItem('messzen:locale') === 'bn'`, 'Login language switch persistence')
  await evaluate(`location.reload()`)
  await waitFor(`location.pathname === '/login/' && document.querySelector('input[type="email"]') && document.documentElement.dataset.locale === 'bn'`, 'Bangla login refresh persistence')
  console.log('PASS Login language switch and refresh persistence (English → Bangla)')
  await call('Emulation.setDeviceMetricsOverride', { width: 360, height: 480, deviceScaleFactor: 1, mobile: true })
  await evaluate(`document.querySelector('input[type="email"]').focus(); document.querySelector('input[type="email"]').scrollIntoView({ block: 'center' })`)
  const keyboard = await evaluate(`(() => { const rect = document.activeElement.getBoundingClientRect(); return { activeInput: document.activeElement.matches('input,textarea'), visible: rect.top >= 0 && rect.bottom <= innerHeight, overflow: document.documentElement.scrollWidth - innerWidth } })()`)
  if (!keyboard.activeInput || !keyboard.visible || keyboard.overflow > 1) throw new Error(`Keyboard-open layout failed: ${JSON.stringify(keyboard)}`)
  console.log('PASS 360x480 keyboard-open layout and focused input visibility')
} finally {
  socket?.close()
  child.kill()
  server.close()
}

console.log('Phase 8 bilingual visual and mobile layout QA passed.')
process.exit(0)
