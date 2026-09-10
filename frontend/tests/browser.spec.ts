import { test, expect } from '@playwright/test'
import { preparePage, expectNoPageOverflow } from './fixtures'

test('mobile dashboard prioritizes quick actions and a two-column overview', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'This layout is intentionally mobile-only.')

  for (const locale of ['en', 'bn'] as const) {
    await preparePage(page, locale, true, 'MANAGER')
    await page.goto('/dashboard')

    const quickActionsLabel = locale === 'en' ? 'Quick actions' : 'দ্রুত কাজ'
    const statisticsLabel = locale === 'en' ? 'Dashboard statistics' : 'ড্যাশবোর্ড পরিসংখ্যান'
    const quickActions = page.getByRole('navigation', { name: quickActionsLabel })
    const actionLinks = quickActions.getByRole('link')
    await expect(actionLinks).toHaveCount(6)

    const boxes = await actionLinks.evaluateAll((links) =>
      links.map((link) => {
        const box = link.getBoundingClientRect()
        const style = getComputedStyle(link)
        return {
          x: box.x,
          y: box.y,
          width: box.width,
          backgroundImage: style.backgroundImage,
          boxShadow: style.boxShadow,
        }
      }),
    )
    expect(new Set(boxes.map((box) => Math.round(box.y))).size).toBe(2)
    expect(new Set(boxes.slice(0, 3).map((box) => Math.round(box.y))).size).toBe(1)
    expect(boxes[3].y).toBeGreaterThan(boxes[0].y)
    expect(Math.max(...boxes.map((box) => box.width)) - Math.min(...boxes.map((box) => box.width))).toBeLessThanOrEqual(1)
    for (const box of boxes) {
      expect(box.backgroundImage).toBe('none')
      expect(box.boxShadow).toBe('none')
    }

    const overview = page.getByRole('region', { name: statisticsLabel })
    await expect(overview).toBeVisible()
    const columns = await overview.evaluate((element) =>
      getComputedStyle(element).gridTemplateColumns.split(' ').filter(Boolean),
    )
    expect(columns).toHaveLength(2)
    await expectNoPageOverflow(page)
  }
})

test('monthly report uses a responsive, flat enterprise layout in both languages', async ({ page }, testInfo) => {
  for (const locale of ['en', 'bn'] as const) {
    await preparePage(page, locale, true, 'MANAGER')
    await page.goto('/dashboard/reports')

    const summary = page.getByRole('region', {
      name: locale === 'en' ? 'Mess summary' : 'মেস সারসংক্ষেপ',
    })
    await expect(summary).toBeVisible()
    await expect(page.getByRole('heading', {
      name: locale === 'en' ? 'Member-wise summary' : 'সদস্যভিত্তিক সারসংক্ষেপ',
    })).toBeVisible()
    await expect(page.getByText('QA Rahim অপরিবর্তিত').filter({ visible: true }).first()).toBeVisible()

    const metrics = summary.locator('article')
    await expect(metrics).toHaveCount(6)
    const rows = await metrics.evaluateAll((items) => items.map((item) => {
      const box = item.getBoundingClientRect()
      const style = getComputedStyle(item)
      return { x: box.x, y: box.y, backgroundImage: style.backgroundImage, boxShadow: style.boxShadow }
    }))
    const expectedColumns = testInfo.project.name === 'mobile' ? 2 : 3
    expect(new Set(rows.slice(0, expectedColumns).map((row) => Math.round(row.y))).size).toBe(1)
    expect(new Set(rows.map((row) => Math.round(row.x))).size).toBe(expectedColumns)
    for (const row of rows) {
      expect(row.backgroundImage).toBe('none')
      expect(row.boxShadow).toBe('none')
    }
    await expectNoPageOverflow(page)
  }
})

test('monthly report changes language without reloading its financial snapshot', async ({ page }) => {
  await preparePage(page, 'en', true, 'MANAGER')
  let reportReads = 0
  await page.route('**/monthly-reports/mess/**', async (route) => {
    reportReads += 1
    await route.fallback()
  })
  await page.goto('/dashboard/reports')

  const englishSummary = page.getByRole('region', { name: 'Mess summary' })
  await expect(englishSummary).toBeVisible()
  await englishSummary.evaluate((element) => element.setAttribute('data-snapshot-marker', 'preserved'))
  expect(reportReads).toBe(1)

  await page.locator('.dashboard-header-clean [data-language-switcher]').click()
  await expect(page.locator('html')).toHaveAttribute('lang', 'bn')
  const banglaSummary = page.getByRole('region', { name: 'মেস সারসংক্ষেপ' })
  await expect(banglaSummary).toHaveAttribute('data-snapshot-marker', 'preserved')
  await page.waitForTimeout(500)
  expect(reportReads).toBe(1)
  await expectNoPageOverflow(page)
})

for (const locale of ['en', 'bn'] as const) {
  test(`every dashboard route renders without runtime errors (${locale})`, async ({ page }) => {
    test.setTimeout(150_000)
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

test('landing page opens the supplied demo workspace without registration', async ({ page }) => {
  await preparePage(page, 'en')
  await page.goto('/')
  await page.getByRole('button', { name: 'Open demo dashboard' }).click()
  await expect(page).toHaveURL(/\/dashboard$/)
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()
})

test('about dashboard image keeps its complete frame', async ({ page }) => {
  await preparePage(page, 'en')
  await page.goto('/about')
  const image = page.getByRole('img', { name: 'Messzen management dashboard' })
  await expect(image).toBeVisible()
  await expect(image).toHaveCSS('object-fit', 'contain')
})

test('marketing header remains stable when switching from English to Bangla', async ({ page }) => {
  await preparePage(page, 'en')
  await page.goto('/')
  await page.evaluate(() => document.fonts.ready)

  const header = page.locator('nav').first()
  const automationLink = header.locator('a[href="/#automation"]').first()
  const switcher = header.locator('[data-language-switcher]:visible')
  const before = {
    header: await header.boundingBox(),
    link: await automationLink.boundingBox(),
    switcher: await switcher.boundingBox(),
  }

  await switcher.click()
  await expect(page.locator('html')).toHaveAttribute('lang', 'bn')
  await page.evaluate(async () => {
    await document.fonts.ready
    await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())))
  })

  const after = {
    header: await header.boundingBox(),
    link: await automationLink.boundingBox(),
    switcher: await switcher.boundingBox(),
  }

  for (const key of ['header', 'link', 'switcher'] as const) {
    if (key === 'link' && before[key] === null && after[key] === null) continue
    expect(before[key]).not.toBeNull()
    expect(after[key]).not.toBeNull()
    expect(Math.abs(after[key]!.x - before[key]!.x), key).toBeLessThanOrEqual(0.5)
    expect(Math.abs(after[key]!.y - before[key]!.y), key).toBeLessThanOrEqual(0.5)
  }
})

test('marketing actions stay on one line when switching from Bangla to English', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'Desktop action buttons are replaced by the mobile menu.')
  await preparePage(page, 'bn')
  await page.goto('/')
  await expect(page.locator('html')).toHaveAttribute('lang', 'bn')

  for (const width of [768, 800, 1024, 1279, 1280]) {
    await page.setViewportSize({ width, height: 900 })
    const header = page.locator('nav').first()
    const switcher = header.locator('[data-language-switcher]:visible')
    await switcher.click()
    await expect(page.locator('html')).toHaveAttribute('lang', 'en')

    for (const link of [header.locator('a[href="/login"]:visible'), header.locator('a[href="/register"]:visible')]) {
      const dimensions = await link.evaluate(element => ({
        clientHeight: element.clientHeight,
        scrollHeight: element.scrollHeight,
        whiteSpace: getComputedStyle(element).whiteSpace,
      }))
      expect(dimensions.whiteSpace, `${width}px`).toBe('nowrap')
      expect(dimensions.scrollHeight, `${width}px`).toBeLessThanOrEqual(dimensions.clientHeight)
    }

    await switcher.click()
    await expect(page.locator('html')).toHaveAttribute('lang', 'bn')
  }
})

test('dashboard header remains stable when switching from English to Bangla', async ({ page }) => {
  await preparePage(page, 'en', true)
  await page.goto('/dashboard')
  await page.evaluate(() => document.fonts.ready)

  const header = page.locator('.dashboard-header-clean')
  const switcher = header.locator('[data-language-switcher]')
  const before = {
    header: await header.boundingBox(),
    switcher: await switcher.boundingBox(),
  }

  await switcher.click()
  await expect(page.locator('html')).toHaveAttribute('lang', 'bn')
  await page.evaluate(async () => {
    await document.fonts.ready
    await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())))
  })

  const after = {
    header: await header.boundingBox(),
    switcher: await switcher.boundingBox(),
  }

  for (const key of ['header', 'switcher'] as const) {
    expect(before[key]).not.toBeNull()
    expect(after[key]).not.toBeNull()
    expect(Math.abs(after[key]!.x - before[key]!.x), key).toBeLessThanOrEqual(0.5)
    expect(Math.abs(after[key]!.y - before[key]!.y), key).toBeLessThanOrEqual(0.5)
  }
})

test('dashboard language switch keeps the page mounted and dismissed push setup closed', async ({ page }) => {
  await preparePage(page, 'en', true, 'MANAGER', { pushNotifications: true })
  await page.goto('/dashboard')

  const pushDialog = page.getByRole('dialog')
  await expect(pushDialog).toBeVisible()
  await pushDialog.getByRole('button', { name: 'Not now' }).click()
  await expect(pushDialog).toHaveCount(0)

  await page.evaluate(() => {
    ;(window as Window & { __dashboardLocaleMarker?: string }).__dashboardLocaleMarker = 'still-mounted'
  })
  await page.locator('.dashboard-header-clean [data-language-switcher]').click()
  await expect(page.locator('html')).toHaveAttribute('lang', 'bn')
  await page.waitForTimeout(700)

  await expect(pushDialog).toHaveCount(0)
  expect(await page.evaluate(() => (
    window as Window & { __dashboardLocaleMarker?: string }
  ).__dashboardLocaleMarker)).toBe('still-mounted')
})

test('legal documents retain a white page background in dark theme', async ({ page }) => {
  await preparePage(page, 'en')
  await page.goto('/privacy-policy')
  await page.evaluate(() => localStorage.setItem('theme', 'dark'))
  await page.reload()
  await expect(page.locator('html')).toHaveClass(/dark/)

  for (const route of ['/privacy-policy', '/terms-and-conditions']) {
    await page.goto(route)
    await expect(page.locator('main.legal-page')).toHaveCSS('background-color', 'rgb(255, 255, 255)')
    await expect(page.locator('main.legal-page')).toHaveCSS('color', 'rgb(9, 9, 9)')
  }
})

for (const locale of ['en', 'bn'] as const) {
  test(`Quick Add and monthly meal details use the selected UI language (${locale})`, async ({ page }) => {
    test.setTimeout(90_000)
    await preparePage(page, locale, true)

    await page.goto('/dashboard/quick-add')
    await expect(page.getByRole('heading', { name: locale === 'en' ? 'What would you like to add?' : 'আপনি কী যোগ করতে চান?' })).toBeVisible()
    await expect(page.getByText(locale === 'en' ? 'Free command usage' : 'বিনামূল্যের কমান্ড ব্যবহার')).toBeVisible()

    await page.goto('/dashboard/meals')
    await page.getByRole('button', { name: locale === 'en' ? /(?:View )?full month/i : /পুরো মাস/ }).click()
    const drawer = page.getByRole('dialog')
    await expect(drawer.getByText(locale === 'en' ? 'Monthly meal register' : 'মাসিক মিল রেজিস্টার')).toBeVisible()
    await expect(drawer.getByRole('button', { name: locale === 'en' ? 'Previous month' : 'আগের মাস' })).toBeVisible()
  })
}
