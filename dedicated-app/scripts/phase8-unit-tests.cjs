const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const Module = require('node:module')
const ts = require('typescript')

const appRoot = path.resolve(__dirname, '..')
const originalResolve = Module._resolveFilename
Module._resolveFilename = function (request, parent, isMain, options) {
  if (request.startsWith('@/')) request = path.join(appRoot, request.slice(2))
  return originalResolve.call(this, request, parent, isMain, options)
}

function register(extension) {
  require.extensions[extension] = (module, filename) => {
    const output = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
      compilerOptions: {
        target: ts.ScriptTarget.ES2022,
        module: ts.ModuleKind.CommonJS,
        moduleResolution: ts.ModuleResolutionKind.NodeJs,
        jsx: ts.JsxEmit.ReactJSX,
        esModuleInterop: true,
        resolveJsonModule: true,
      },
      fileName: filename,
    })
    module._compile(output.outputText, filename)
  }
}
register('.ts')
register('.tsx')

const tests = []
function test(name, run) { tests.push({ name, run }) }

const {
  formatDate, formatIsoDate, formatMoney, formatMonth, formatNumber,
  formatRelativeTime, formatTime, formatWeekday,
} = require('../lib/i18n/formatters.ts')
const { translate } = require('../lib/i18n/translate.ts')
const { localizedErrorMessage } = require('../lib/i18n/errors.ts')
const { persistStoredLocale, resolveStoredLocale } = require('../lib/i18n/locale-storage.ts')
const { synchronizeLocaleDocument } = require('../lib/i18n/locale-document.ts')
const { LOCALE_STORAGE_KEY } = require('../lib/i18n/types.ts')
const {
  canAccessAppPath, canManageMess, getAppBackFallback, getBottomTabs, getHomeQuickActions,
  getMoreMenuGroups, hasActiveMess,
} = require('../lib/app-permissions.ts')
const { api, ApiError } = require('../lib/api.ts')
const { formatPersonalMoney } = require('../features/personal/constants.ts')

function memoryStorage(entries = {}) {
  const values = new Map(Object.entries(entries))
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: (key) => values.delete(key),
    snapshot: () => Object.fromEntries(values),
  }
}

test('locale migration, switch, refresh, logout/login and restart persistence', () => {
  const storage = memoryStorage({ 'messzen:personal-locale': 'bn' })
  assert.equal(resolveStoredLocale(storage, 'en-US'), 'bn')
  persistStoredLocale(storage, 'bn')
  assert.equal(storage.snapshot()['messzen:personal-locale'], undefined)
  assert.equal(storage.snapshot()[LOCALE_STORAGE_KEY], 'bn')
  assert.equal(resolveStoredLocale(storage, 'en-US'), 'bn') // refresh
  assert.equal(resolveStoredLocale(storage, 'en-US'), 'bn') // logout does not clear preference
  persistStoredLocale(storage, 'en') // authenticated profile preference
  assert.equal(resolveStoredLocale(storage, 'bn-BD'), 'en') // app restart
})

test('locale document synchronization updates language, metadata and manifest', () => {
  const attributes = new Map()
  const document = {
    documentElement: { lang: '', dataset: {} },
    title: '',
    querySelector: (selector) => ({ setAttribute: (name, value) => attributes.set(`${selector}:${name}`, value) }),
  }
  synchronizeLocaleDocument(document, 'bn')
  assert.equal(document.documentElement.lang, 'bn')
  assert.equal(document.documentElement.dataset.locale, 'bn')
  assert.match(document.title, /Messzen/)
  assert.equal(attributes.get('link[rel="manifest"]:href'), '/manifest-bn.webmanifest')
  assert.ok(attributes.get('meta[name="description"]:content'))
})

test('translation interpolation and safe missing-key fallback', () => {
  assert.equal(translate('en', 'common', 'loadingMetric', { metric: 'Balance' }), 'Loading Balance')
  assert.match(translate('bn', 'common', 'loadingMetric', { metric: 'ব্যালেন্স' }), /ব্যালেন্স/)
  assert.equal(translate('en', 'common', '__phase8_missing__'), 'common.__phase8_missing__')
})

test('money, number, date, time, month, weekday and relative-time formatters', () => {
  const date = '2026-08-30T12:30:00+06:00'
  assert.equal(formatMoney(1250, 'en'), '৳\u202f1,250')
  assert.equal(formatMoney(1250, 'bn'), '৳\u202f১,২৫০')
  assert.equal(formatPersonalMoney(1250, 'en'), '৳\u202f1,250')
  assert.equal(formatPersonalMoney(1250, 'bn'), '৳\u202f১,২৫০')
  assert.match(formatMoney(1250, 'en'), /^৳\u202f\S/)
  assert.match(formatNumber(1250, 'bn'), /১.*২৫০/)
  assert.equal(formatIsoDate(date), '2026-08-30')
  for (const value of [formatDate(date, 'bn'), formatTime(date, 'bn'), formatMonth(date, 'bn'), formatWeekday(date, 'bn')]) {
    assert.ok(value.length > 1)
  }
  assert.ok(formatRelativeTime('2026-08-29T12:30:00+06:00', 'en', date).includes('yesterday'))
})

test('stable API error codes localize and raw backend sentences never leak', () => {
  const raw = { code: 'MEAL_ENTRY_NOT_FOUND', status: 404, message: 'SECRET RAW ENGLISH', params: {} }
  assert.match(localizedErrorMessage(raw, 'en'), /meal entry/i)
  assert.doesNotMatch(localizedErrorMessage(raw, 'bn'), /SECRET RAW ENGLISH/)
  assert.notEqual(localizedErrorMessage({ code: 'NETWORK_ERROR', status: 0 }, 'en'), localizedErrorMessage({ code: 'NETWORK_ERROR', status: 0 }, 'bn'))
  assert.doesNotMatch(localizedErrorMessage({ code: 'UNKNOWN_REMOTE_FAILURE', status: 503, message: 'RAW' }, 'bn'), /RAW/)
})

test('real API transport maps offline and server failures to safe localized errors', async () => {
  const originalFetch = global.fetch
  try {
    global.fetch = async () => { throw new TypeError('fetch failed') }
    await assert.rejects(api.getProfile(), (error) => error instanceof ApiError && error.code === 'NETWORK_ERROR' && error.status === 0)

    global.fetch = async () => new Response(JSON.stringify({
      success: false,
      code: 'UNKNOWN_REMOTE_FAILURE',
      message: 'PRIVATE SERVER DIAGNOSTIC',
      params: {},
    }), { status: 503, headers: { 'content-type': 'application/json' } })
    await assert.rejects(api.getProfile(), (error) => {
      assert.equal(error.code, 'UNKNOWN_REMOTE_FAILURE')
      assert.doesNotMatch(localizedErrorMessage(error, 'bn'), /PRIVATE SERVER DIAGNOSTIC/)
      return true
    })
  } finally {
    global.fetch = originalFetch
  }
})

test('manager, member and no-mess role matrix', () => {
  const membership = { id: 'membership-1', mess_id: 'mess-1', role: 'MEMBER', is_active: true }
  const manager = { id: 'manager', role: 'MANAGER', memberships: [membership] }
  const member = { id: 'member', role: 'MEMBER', memberships: [membership] }
  const noMess = { id: 'new-user', role: 'MEMBER', memberships: [] }
  assert.equal(canManageMess(manager), true)
  assert.equal(canManageMess(member), false)
  assert.equal(hasActiveMess(member), true)
  assert.equal(hasActiveMess(noMess), false)
  assert.equal(canAccessAppPath(manager, '/members'), true)
  assert.equal(canAccessAppPath(member, '/members'), false)
  assert.equal(canAccessAppPath(member, '/meals'), true)
  assert.equal(canAccessAppPath(manager, '/notices'), true)
  assert.equal(canAccessAppPath(member, '/notices'), false)
  assert.equal(canAccessAppPath(manager, '/meals/members/monthly'), true)
  assert.equal(canAccessAppPath(member, '/meals/members/monthly'), false)
  assert.equal(getAppBackFallback(manager, '/meals/members/monthly'), '/meals/members')
  assert.equal(canAccessAppPath(noMess, '/meals'), false)
  assert.deepEqual(getBottomTabs(noMess).map((item) => item.href), ['/', '/profile', '/settings', '/more'])
  const expectedQuickActions = ['/meals', '/expenses', '/payments', '/bazar-schedule', '/quick-add', '/monthly-bill']
  assert.deepEqual(getHomeQuickActions(manager).map((item) => item.href), expectedQuickActions)
  assert.deepEqual(getHomeQuickActions(member).map((item) => item.href), expectedQuickActions)
  assert.equal(getMoreMenuGroups(manager).some((group) => group.items.some((item) => item.href === '/members')), true)
  assert.equal(getMoreMenuGroups(member).some((group) => group.items.some((item) => item.href === '/members')), false)
  assert.equal(getMoreMenuGroups(manager).some((group) => group.items.some((item) => item.href === '/meal-pattern')), true)
  assert.equal(getMoreMenuGroups(member).some((group) => group.items.some((item) => item.href === '/meal-pattern')), true)
  assert.equal(getMoreMenuGroups(manager).some((group) => group.items.some((item) => item.href === '/notices')), true)
  assert.equal(getMoreMenuGroups(member).some((group) => group.items.some((item) => item.href === '/notices')), false)
})

;(async () => {
  let failures = 0
  for (const { name, run } of tests) {
    try {
      await run()
      console.log(`PASS ${name}`)
    } catch (error) {
      failures += 1
      console.error(`FAIL ${name}`)
      console.error(error)
    }
  }
  console.log(`${tests.length - failures}/${tests.length} Phase 8 unit suites passed.`)
  process.exitCode = failures ? 1 : 0
})()
