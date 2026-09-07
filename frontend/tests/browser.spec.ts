import { test, expect } from '@playwright/test'
import { preparePage, expectNoPageOverflow } from './fixtures'

for (const locale of ['en', 'bn'] as const) {
  test(`every dashboard route renders without runtime errors (${locale})`, async ({ page }) => {
    test.setTimeout(90_000)
    await preparePage(page, locale, true, 'ADMIN')
    const errors: string[] = []
    page.on('pageerror', error => errors.push(`${page.url()}: ${error.message}`))
    for (const route of ['', 'attendance', 'bazar-schedule', 'complaints', 'contact', 'contact-requests', 'finance', 'meal-patterns', 'meal-patterns/setup', 'meals', 'member_management', 'mess_management', 'mess_requests', 'monthly-bills', 'notices', 'notifications', 'payments', 'quick-add', 'reports', 'settings', 'shopping', 'subscriptions', 'users']) {
      await test.step(route || 'overview', async () => {
        const response = await page.goto(`/dashboard${route ? `/${route}` : ''}`)
        expect(response?.status()).toBe(200)
        await expect(page.locator('html')).toHaveAttribute('lang', locale)
        await expect(page.getByRole('main')).toBeVisible()
        // Allow mount-time mocked requests and asynchronous component rendering.
        await page.waitForTimeout(500)
        await expectNoPageOverflow(page)
        expect(errors).toEqual([])
      })
    }
  })

  test(`public routes, language persistence and themes (${locale})`, async ({ page }) => {
    await preparePage(page, locale)
    const errors: string[] = []
    page.on('pageerror', error => errors.push(error.message))
    for (const route of ['/', '/about', '/contact', '/login', '/register', '/forget_password', '/verify_email', '/verify_otp', '/reset_password', '/privacy-policy', '/terms-and-conditions']) {
      const response = await page.goto(route)
      expect(response?.status(), route).toBe(200)
      await expect(page.locator('html')).toHaveAttribute('lang', locale)
      await expectNoPageOverflow(page)
    }
    await page.goto('/login')
    await page.getByRole('button', { name: locale === 'en' ? 'Switch to Bangla' : 'ইংরেজিতে পরিবর্তন করুন' }).click()
    const nextLocale = locale === 'en' ? 'bn' : 'en'
    await expect(page.locator('html')).toHaveAttribute('lang', nextLocale)
    await page.reload()
    await expect(page.locator('html')).toHaveAttribute('lang', nextLocale)
    await page.evaluate(() => localStorage.setItem('theme', 'dark'))
    await page.reload()
    await expect(page.locator('html')).toHaveClass(/dark/)
    await expectNoPageOverflow(page)
    expect(errors).toEqual([])
  })

  test(`financial pages preserve records and localize controls (${locale})`, async ({ page }) => {
    const { person, writes } = await preparePage(page, locale, true)
    const errors: string[] = []
    page.on('pageerror', error => errors.push(error.message))
    await page.goto('/dashboard/payments')
    await expect(page.getByText(person.name).filter({ visible: true }).first()).toBeVisible()
    await page.getByRole('button', { name: locale === 'en' ? 'Add deposit' : 'ডিপোজিট যোগ করুন', exact: true }).click()
    const drawer = page.getByRole('dialog')
    await expect(drawer).toBeVisible()
    const amount = drawer.getByRole('spinbutton')
    await amount.fill('-10')
    await drawer.getByRole('button', { name: locale === 'en' ? 'Add deposit' : 'ডিপোজিট যোগ করুন', exact: true }).click()
    expect(writes.filter(write => /\/payments$/.test(write.path))).toHaveLength(0)
    await expect(drawer.getByRole('alert')).toBeVisible()
    await amount.fill('500')
    await drawer.getByRole('button', { name: locale === 'en' ? 'Add deposit' : 'ডিপোজিট যোগ করুন', exact: true }).click()
    await expect(drawer).not.toBeVisible()
    expect(writes.find(write => /\/payments$/.test(write.path))?.language).toBe(locale)
    await page.goto('/dashboard/finance')
    await page.getByRole('button', { name: locale === 'en' ? 'View expense' : 'খরচ দেখুন' }).filter({ visible: true }).first().click()
    await expect(page.getByRole('dialog').getByText('Database rice চাল').first()).toBeVisible()
    await page.getByRole('dialog').getByRole('button', { name: locale === 'en' ? 'Edit' : 'সম্পাদনা', exact: true }).click()
    await expect(page.getByRole('dialog').getByRole('button', { name: locale === 'en' ? 'Personal' : 'ব্যক্তিগত', exact: true })).toHaveAttribute('aria-pressed', 'true')
    await page.goto('/dashboard/monthly-bills')
    await expect(page.getByText(person.name).filter({ visible: true }).first()).toBeVisible()
    await page.getByRole('button', { name: locale === 'en' ? 'Select month' : 'মাস নির্বাচন করুন', exact: true }).filter({ visible: true }).last().click()
    await expect(page.getByRole('button', { name: locale === 'en' ? 'Previous year' : 'আগের বছর' })).toBeVisible()
    await expectNoPageOverflow(page)
    expect(errors).toEqual([])
  })
}

test('marketing autoplay keeps the page and neighboring text stable', async ({ page }) => {
  await preparePage(page, 'en')
  await page.goto('/')
  const heading = page.getByRole('heading', { name: /Say it once/ })
  await heading.scrollIntoViewIfNeeded()
  await page.evaluate(() => document.fonts.ready)
  const samples: Array<{ y: number; scroll: number }> = []
  for (let i = 0; i < 12; i++) {
    samples.push(await heading.evaluate(element => ({ y: element.getBoundingClientRect().top, scroll: window.scrollY })))
    await page.waitForTimeout(1000)
  }
  expect(Math.max(...samples.map(s => s.y)) - Math.min(...samples.map(s => s.y))).toBeLessThanOrEqual(2)
  expect(Math.max(...samples.map(s => s.scroll)) - Math.min(...samples.map(s => s.scroll))).toBeLessThanOrEqual(2)
  await expectNoPageOverflow(page)
})

test('financial API failures display a localized retry action', async ({ page }) => {
  await preparePage(page, 'bn', true)
  await page.route('**/payments/mess/**', route => route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ success: false, code: 'SERVICE_UNAVAILABLE', message: 'internal database error' }) }))
  await page.goto('/dashboard/payments')
  const alert = page.getByRole('alert').filter({ has: page.getByRole('button', { name: 'আবার চেষ্টা করুন' }) })
  await expect(alert).toBeVisible()
  await expect(alert).not.toContainText('internal database error')
  await page.unroute('**/payments/mess/**')
  await alert.getByRole('button').click()
  await expect(alert).not.toBeVisible()
  await expect(page.getByText('QA Rahim অপরিবর্তিত').filter({ visible: true }).first()).toBeVisible()
})

test('rapid language changes persist the final backend preference', async ({ page }) => {
  await preparePage(page, 'en', true)
  let preference = 'en'
  const writes: string[] = []
  await page.route('**/users/profile', async route => {
    if (route.request().method() !== 'PATCH') return route.fallback()
    const requestedLocale = /name="preferredLocale"\r\n\r\n(en|bn)\r\n/.exec(route.request().postData() ?? '')?.[1] ?? ''
    writes.push(requestedLocale)
    if (requestedLocale === 'bn') await new Promise(resolve => setTimeout(resolve, 400))
    preference = requestedLocale
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: { id: 'qa-user', preferred_locale: preference } }) })
  })
  await page.goto('/dashboard/payments')
  await expect(page.getByText('QA Rahim অপরিবর্তিত').filter({ visible: true }).first()).toBeVisible()
  await page.getByRole('button', { name: 'Switch to Bangla' }).filter({ visible: true }).first().click()
  await expect.poll(() => writes.includes('bn')).toBe(true)
  await page.getByRole('button', { name: 'ইংরেজিতে পরিবর্তন করুন' }).filter({ visible: true }).first().click()
  await expect.poll(() => writes.at(-1)).toBe('en')
  await expect.poll(() => preference).toBe('en')
  await expect(page.locator('html')).toHaveAttribute('lang', 'en')
})

test('public language switching remains usable when storage is denied', async ({ page }) => {
  await preparePage(page, 'en')
  await page.goto('/login')
  await page.evaluate(() => localStorage.clear())
  await page.addInitScript(() => {
    Storage.prototype.getItem = () => { throw new DOMException('Blocked', 'SecurityError') }
    Storage.prototype.setItem = () => { throw new DOMException('Blocked', 'SecurityError') }
  })
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  await page.reload()
  await page.getByRole('button', { name: 'Switch to Bangla' }).click()
  await expect(page.locator('html')).toHaveAttribute('lang', 'bn')
  expect(errors).toEqual([])
})
