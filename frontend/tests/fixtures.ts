import { expect, type Page } from '@playwright/test'

export async function preparePage(
  page: Page,
  locale: 'en' | 'bn',
  authenticated = false,
  role: 'MANAGER' | 'ADMIN' | 'MEMBER' = 'MANAGER',
  options: { pushNotifications?: boolean } = {},
) {
  const writes: Array<{ path: string; method: string; body: string; language: string }> = []
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Dhaka' }).format(new Date())
  const person = { id: 'qa-user', name: 'QA Rahim অপরিবর্তিত', email: 'qa@example.test', role, preferred_locale: locale }
  const mess = { id: 'qa-mess', name: 'QA Test Mess', memberships: [] }
  const membership = { id: 'qa-membership', user_id: person.id, mess_id: mess.id, role: role === 'MEMBER' ? 'MEMBER' : 'MANAGER', is_active: true, user: person, mess }
  const user = { ...person, memberships: [membership] }
  const expense = { id: 'qa-expense', category: 'FOOD', item_name: 'Database rice চাল', amount: 850, quantity: 2, unit: 'kg', expense_date: today, payment_type: 'PERSONAL', status: 'DRAFT', approvalStatus: 'PENDING', creator: person, purchaser: person, purchased_by: person.id, items: [{ itemName: 'Database rice চাল', amount: 850, quantity: 2, unit: 'kg' }] }
  const payment = { id: 'qa-payment', member: person, creator: person, amount: 2000, status: 'PENDING', method: 'BKASH', categories: ['FOOD'], payment_date: today, created_at: today + 'T10:00:00Z', note: 'Database note অপরিবর্তিত' }
  const bill = { id: 'qa-bill', member: person, month: today.slice(0, 7) + '-01', food_bill: 850, seat_rent: 2000, utility_share: 500, prev_balance: 200, deposit_total: 2000, paid_amount: 0, final_due: 1550, balance: 1550, total_meals: 12, status: 'PENDING' }
  const reportMonthDate = new Date()
  reportMonthDate.setMonth(reportMonthDate.getMonth() - 1, 1)
  const reportMonth = `${reportMonthDate.getFullYear()}-${String(reportMonthDate.getMonth() + 1).padStart(2, '0')}-01T00:00:00.000Z`
  const monthlyReport = {
    id: 'qa-monthly-report',
    mess_id: mess.id,
    month: reportMonth,
    status: 'FINALIZED',
    version: 2,
    source_revision: 4,
    generated_at: reportMonth,
    finalized_at: reportMonth,
    generated_by: person,
    finalized_by: person,
    can_manage: role !== 'MEMBER',
    deliveries: role === 'MEMBER' ? [] : [{ id: 'qa-delivery', member_id: person.id, recipient_email: person.email, status: 'SENT', attempts: 1, sent_at: reportMonth, last_error: null }],
    snapshot: {
      schemaVersion: 1,
      mess: { id: mess.id, name: mess.name, currency: 'BDT' },
      month: reportMonth,
      summary: { totalMembers: 1, totalMeals: 52, totalExpense: 2580, totalDeposit: 3000, mealRate: 40, totalMessCost: 4580, totalDue: 0, totalCredit: 420 },
      expenseSummary: { foodBazar: 2080, utility: 400, rentHouse: 2000, otherExpenses: 100, totalExpense: 2580, totalMessCost: 4580 },
      members: [{ memberId: person.id, name: person.name, email: person.email, totalMeals: 52, mealCost: 2080, otherCost: 500, rentCost: 0, utilityCost: 500, totalAmount: 2580, deposit: 3000, paidAmount: 0, previousBalance: 0, balance: -420, due: 0, credit: 420, status: 'PAID' }],
    },
  }
  await page.addInitScript(({ locale, authenticated, pushNotifications }) => {
    try { if (!localStorage.getItem('qa-initialized')) {
      localStorage.setItem('messzen:locale', locale)
      localStorage.setItem('theme', 'light')
      if (authenticated) localStorage.setItem('authToken', 'qa-token')
      localStorage.setItem('qa-initialized', 'true')
    } } catch { /* Storage-denied scenarios intentionally exercise this path. */ }
    // QA only exposes the browser push API in tests that exercise its prompt lifecycle.
    if (!pushNotifications) delete (window as unknown as Record<string, unknown>).PushManager
  }, { locale, authenticated, pushNotifications: options.pushNotifications ?? false })
  await page.route('**/*', async (route) => {
    const request = route.request()
    const url = new URL(request.url())
    if (url.pathname.includes('/api/')) {
      const path = url.pathname
      let data: unknown = []
      if (request.method() !== 'GET' && request.method() !== 'OPTIONS') {
        writes.push({ path, method: request.method(), body: request.postData() ?? '', language: request.headers()['accept-language'] })
      }
      if (path.endsWith('/users/profile')) {
        const language = request.headers()['accept-language']
        if (request.method() === 'PATCH' && (language === 'en' || language === 'bn')) user.preferred_locale = language
        data = user
      } else if (path.endsWith('/messes/my-mess') || path.endsWith('/messes')) data = [mess]
      else if (path.includes('/monthly-reports/settings/')) data = { auto_generate: true, email_members: true, updated_at: reportMonth }
      else if (path.includes('/monthly-reports/mess/') || path.endsWith('/monthly-reports/qa-monthly-report')) data = monthlyReport
      else if (path.includes('/bazar/schedules/mess/') && !path.endsWith('/history')) data = null
      else if (path.includes('/bazar/schedule-settings/')) data = null
      else if (path.includes('/subscriptions/mess/')) data = { plan: 'FREE', status: 'ACTIVE', end_date: null }
      else if (path.endsWith('/subscriptions/plans')) data = {}
      else if (path.endsWith('/users')) data = [person]
      else if (path.endsWith('/window-status')) data = { isWindowOpen: true }
      else if (path.includes('/members')) data = [membership]
      else if (path.includes('/expense')) data = request.method() === 'GET' ? [expense] : expense
      else if (path.includes('/payments')) data = request.method() === 'GET' ? [payment] : payment
      else if (path.includes('/monthly-bill')) data = [bill]
      else if (path.includes('/unread-count')) data = { count: 0 }
      else if (path.includes('/capabilities')) data = { enabled: true, quota: { used: 0, limit: 10, remaining: 10, exhausted: false }, voice: { enabled: false, maxDurationSeconds: 60 } }
      else if (path.includes('/meal/mess/') && path.includes('/deadline')) data = { startTime: '09:00', endTime: '17:00', isWindowOpen: true, windowStartTime: '09:00', windowEndTime: '17:00' }
      else if (path.includes('/meal/mess/') && path.includes('/window-status')) data = { isWindowOpen: true }
      else if (path.includes('/meal/mess/')) data = []
      else if (path.includes('/monthly-overview')) data = []
      else if (path.includes('/dashboard/') || path.includes('/summary')) data = {}
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data, meta: { totalPages: 1, total: Array.isArray(data) ? data.length : 1 } }) })
    }
    if (url.origin !== 'http://127.0.0.1:3100') return route.fulfill({ status: 204, body: '' })
    return route.continue()
  })
  return { writes, person, expense }
}

export async function expectNoPageOverflow(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true)
}
