import { clearStoredToken, getStoredToken, type AuthUser, type GlobalRole } from './auth'
import type { MemberJoinRequest, MemberJoinReviewStatus } from './member-join-requests'
import type { AiCapabilities, AiCommand, AiLocale, AiSpeechLanguage } from './ai-automation'

const DEFAULT_API_URL = 'http://localhost:5001/api/v1'

const BASE_URL = (process.env.NEXT_PUBLIC_API_URL || DEFAULT_API_URL).replace(/\/+$/, '')
const SERVICE_UNAVAILABLE_MESSAGE = 'Messzen is temporarily unavailable. Please try again in a few moments.'
const CONNECTION_ERROR_MESSAGE = "We couldn't connect to Messzen. Check your internet connection and try again."

function safeApiErrorMessage(status: number) {
  if (status >= 500) return SERVICE_UNAVAILABLE_MESSAGE
  return 'Request failed. Please try again.'
}

type QueryValue = string | number | boolean | undefined | null

export type MonthlyReportStatus = 'DRAFT' | 'FINALIZED'
export type MonthlyReportDeliveryStatus = 'PENDING' | 'PROCESSING' | 'SENT' | 'FAILED'

export type MonthlyReportMemberSnapshot = {
  memberId: string
  name: string
  email: string
  totalMeals: number
  mealCost: number
  otherCost: number
  rentCost: number
  utilityCost: number
  totalAmount: number
  deposit: number
  paidAmount: number
  previousBalance: number
  balance: number
  due: number
  credit: number
  status: string
}

export type MonthlyReportSnapshot = {
  schemaVersion: 1
  mess: { id: string; name: string; currency: string }
  month: string
  summary: {
    totalMembers: number
    totalMeals: number
    totalExpense: number
    totalDeposit: number
    mealRate: number
    totalMessCost: number
    totalDue: number
    totalCredit: number
  }
  expenseSummary: {
    foodBazar: number
    utility: number
    rentHouse: number
    otherExpenses: number
    totalExpense: number
    totalMessCost: number
  }
  members: MonthlyReportMemberSnapshot[]
}

export type MonthlyReport = {
  id: string
  mess_id: string
  month: string
  status: MonthlyReportStatus
  version: number
  source_revision: number
  snapshot: MonthlyReportSnapshot
  generated_at: string
  finalized_at: string | null
  deliveries: Array<{
    id: string
    member_id: string
    recipient_email: string
    status: MonthlyReportDeliveryStatus
    attempts: number
    sent_at: string | null
    last_error: string | null
  }>
  can_manage: boolean
}

export type MonthlyReportSetting = {
  auto_generate: boolean
  email_members: boolean
  updated_at: string | null
}

export type BulkMealName = 'BREAKFAST' | 'LUNCH' | 'DINNER'

export type BazarFrequency = 'EVERY_DAY' | 'SPECIFIC_WEEKDAYS' | 'CUSTOM_DATES'
export type BazarDateStatus = 'OPEN' | 'CLOSED' | 'COMPLETED'
export type BazarDutySlotStatus = 'AVAILABLE' | 'ASSIGNED' | 'CLOSED'

export type BazarDutyMember = {
  id: string
  name: string
  email: string
  avatar_url?: string | null
}

export type BazarScheduleSettings = {
  id: string
  mess_id: string
  frequency: BazarFrequency
  weekdays: number[]
  custom_days: number[]
  default_members_per_date: number
  duty_limit: number
  include_manager: boolean
  release_notice_days: number
  strict_fairness: boolean
}

export type SaveBazarScheduleSettingsInput = {
  frequency: BazarFrequency
  weekdays: number[]
  customDays: number[]
  defaultMembersPerDate: number
  dutyLimit: number
  includeManager: boolean
  releaseNoticeDays: number
  strictFairness?: boolean
}

export type BazarDutySlot = {
  id: string
  bazar_date_id: string
  slot_number: number
  status: BazarDutySlotStatus
  effectiveStatus?: BazarDutySlotStatus
  assigned_member_id: string | null
  assigned_member?: BazarDutyMember | null
}

export type MoveBazarDutyResult = {
  source: BazarDutySlot | null
  target: BazarDutySlot | null
}

export type BazarScheduleDate = {
  id: string
  duty_date: string
  required_members: number
  status: BazarDateStatus
  effectiveStatus?: BazarDateStatus
  isPast?: boolean
  slots: BazarDutySlot[]
}

export type BazarSchedule = {
  id: string
  year: number
  month: number
  version: number
  status: 'ACTIVE' | 'FINISHED'
  default_members_per_date: number
  duty_limit: number
  release_notice_days: number
  eligible_member_count: number
  recommended_duty_count: number
  dates: BazarScheduleDate[]
  overview: {
    totalBazarDates: number
    totalDutySlots: number
    assigned: number
    available: number
    closed: number
    recommendedDutyCount: number
    currentUserDutyCount?: number
    distribution: Array<{ member: BazarDutyMember; dutyCount: number }>
  }
  mess?: { id: string; name: string; created_by: string }
}

export type BazarScheduleRequest = {
  id: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED'
  reason?: string | null
  created_at: string
  requester?: BazarDutyMember
  target_member?: BazarDutyMember
  slot?: { bazar_date?: { duty_date: string } }
  requester_slot?: { bazar_date?: { duty_date: string } }
}

export type BulkMealAttendanceUpdate = {
  memberId: string
  mealName: BulkMealName
  mealCount: number
  expectedMealCount?: number
}

export type BulkMealAttendanceResult = {
  date: string
  requestedCount: number
  updatedCount: number
  unchangedCount: number
  affectedMemberCount: number
  billingSync: string
}

type ApiResponse<T> = {
  success: boolean
  message: string
  code?: string
  params?: Record<string, string | number | boolean | null>
  errorSources?: Array<{ path: string | number; message: string }>
  data: T
  meta?: Record<string, unknown>
  totalAmount?: number
  billing?: {
    status: 'DIRTY' | 'PROCESSING' | 'READY' | 'FAILED'
    requestedAt?: string | null
    calculatedAt?: string | null
  } | null
}

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly status: number,
    public readonly errorSources: Array<{ path: string | number; message: string }> = [],
    public readonly params: Record<string, string | number | boolean | null> = {},
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

class Api {
  private token() {
    return getStoredToken()
  }

  private clearAuth() {
    if (typeof window === 'undefined') return
    clearStoredToken()
    window.dispatchEvent(new Event('auth:expired'))
  }

  private async request<T>(endpoint: string, options: RequestInit & { params?: Record<string, QueryValue> } = {}) {
    let url = `${BASE_URL}${endpoint}`
    if (options.params) {
      const params = new URLSearchParams()
      for (const [key, value] of Object.entries(options.params)) {
        if (value !== undefined && value !== null && value !== '') params.set(key, String(value))
      }
      const query = params.toString()
      if (query) url += `?${query}`
    }

    const headers: HeadersInit = {}
    if (!(options.body instanceof FormData)) headers['Content-Type'] = 'application/json'
    Object.assign(headers, options.headers)
    const requestHeaders = headers as Record<string, string>
    const token = this.token()
    if (token) requestHeaders.Authorization = `Bearer ${token}`

    const fetchOptions: RequestInit & { params?: Record<string, QueryValue> } = {
      ...options,
      headers,
      credentials: 'include',
    }
    delete fetchOptions.params

    try {
      const res = await fetch(url, fetchOptions)

      const json = (await res.json().catch(() => ({}))) as ApiResponse<T>

      if (!res.ok || json.success === false) {
        if (res.status === 401) this.clearAuth()
        throw new ApiError(
          safeApiErrorMessage(res.status),
          json.code || `HTTP_${res.status}`,
          res.status,
          json.errorSources,
          json.params ?? {},
        )
      }

      return json
    } catch (err) {
      if (err instanceof TypeError && /fetch|network|failed/i.test(err.message)) {
        throw new ApiError(CONNECTION_ERROR_MESSAGE, 'NETWORK_ERROR', 0)
      }
      throw err
    }
  }

  login(email: string, password: string) {
    return this.request<{ accessToken: string; user: AuthUser }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
  }

  googleLogin(idToken: string) {
    return this.request<{ accessToken: string; user: AuthUser }>('/auth/google', {
      method: 'POST',
      body: JSON.stringify({ idToken }),
    })
  }

  register(data: { name: string; email: string; phone?: string; password: string; role?: GlobalRole }) {
    return this.request<AuthUser>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  logout() {
    return this.request<{ message: string }>('/auth/logout', {
      method: 'POST',
    })
  }

  forgotPassword(email: string) {
    return this.request<{ message: string }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    })
  }

  verifyOtp(email: string, otp: string) {
    return this.request<{ message: string }>('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ email, otp }),
    })
  }

  resetPassword(email: string, newPassword: string) {
    return this.request<{ message: string }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email, newPassword }),
    })
  }

  getProfile() {
    return this.request<AuthUser>('/users/profile')
  }

  updateProfile(data: FormData) {
    return this.request<AuthUser>('/users/profile', {
      method: 'PATCH',
      body: data,
    })
  }

  deleteAccount() {
    return this.request<{
      deletedAt: string
      personalDataAnonymized: boolean
      financialHistoryRetained: boolean
    }>('/users/profile', {
      method: 'DELETE',
    })
  }

  updatePreferredLocale(locale: 'en' | 'bn') {
    const data = new FormData()
    data.set('preferredLocale', locale)
    return this.updateProfile(data)
  }

  changePassword(oldPassword: string, newPassword: string) {
    return this.request<{ message: string }>('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ oldPassword, newPassword }),
    })
  }

  getMesses() {
    return this.request<any[]>('/messes/my-mess', { cache: 'no-store' })
  }

  getMessSubscription(messId: string) {
    return this.request<{
      mess_id: string
      plan: string
      status: string
      start_date: string
      end_date: string | null
    }>(`/subscriptions/mess/${messId}`, { cache: 'no-store' })
  }

  getSubscriptionPlans() {
    return this.request<Record<string, {
      price: number
      label: string
      days: number
      description?: string
      currency?: string
      features?: string[]
    }>>('/subscriptions/plans', { cache: 'no-store' })
  }

  updateMessSetup(messId: string, data: Record<string, unknown>) {
    return this.request(`/messes/${messId}/setup`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  }

  createMess(data: Record<string, unknown>) {
    return this.request('/messes', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  getActiveMesses(params?: Record<string, QueryValue>) {
    return this.request('/messes/active', { params })
  }

  requestMemberJoin(messId: string) {
    return this.request('/member-join-requests', {
      method: 'POST',
      body: JSON.stringify({ messId }),
    })
  }

  getMyMemberJoinRequests(params?: Record<string, QueryValue>) {
    return this.request('/member-join-requests/my', { params })
  }

  getManagedMemberJoinRequests(params?: Record<string, QueryValue>) {
    return this.request<MemberJoinRequest[]>('/member-join-requests/managed', { params })
  }

  reviewMemberJoinRequest(requestId: string, status: MemberJoinReviewStatus, reviewNote?: string) {
    return this.request<MemberJoinRequest>(`/member-join-requests/${requestId}/review`, {
      method: 'PATCH',
      body: JSON.stringify({ status, reviewNote }),
    })
  }

  getMessDashboard(messId: string, month?: string) {
    return this.request<any>(`/dashboard/mess/${messId}`, {
      params: month ? { month } : undefined,
      cache: 'no-store',
    })
  }

  getMonthlyOverview(messId: string, month?: string) {
    return this.request<Array<{ day: string; income: number; expense: number }>>(`/dashboard/mess/${messId}/monthly-overview`, {
      params: month ? { month } : undefined,
    })
  }

  getAllMembers(params?: Record<string, QueryValue>) {
    return this.request<any[]>('/messes/members', { params, cache: 'no-store' })
  }

  getMessMemberOptions(messId: string) {
    return this.request<Array<{ id: string; name: string; email: string }>>(
      `/messes/${messId}/member-options`,
      { cache: 'no-store' },
    )
  }

  addMember(messId: string, data: Record<string, unknown>) {
    return this.request(`/messes/${messId}/members`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  updateMember(messId: string, memberId: string, data: Record<string, unknown>) {
    return this.request(`/messes/${messId}/members/${memberId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  removeMember(messId: string, memberId: string) {
    return this.request(`/messes/${messId}/members/${memberId}`, {
      method: 'DELETE',
    })
  }

  getExpensesByMess(messId: string, params?: Record<string, QueryValue>) {
    return this.request(`/expense/mess/${messId}`, { params })
  }

  getExpenseSummary(messId: string, month?: string) {
    return this.request('/expense/summary', { params: { messId, month } })
  }

  getMyExpenseDetails(messId: string, month?: string) {
    return this.request('/expense/my-details', { params: { messId, month } })
  }

  getMemberExpenseDetails(messId: string, memberId: string, month?: string) {
    return this.request('/expense/member-details', { params: { messId, memberId, month } })
  }

  getManagerMemberExpenses(messId: string, month?: string) {
    return this.request('/expense/manager/members', { params: { messId, month } })
  }

  getExpenseById(id: string) {
    return this.request(`/expense/${id}`)
  }

  previewExpense(data: Record<string, unknown>) {
    return this.request('/expense/preview', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  createExpense(data: Record<string, unknown> | FormData) {
    return this.request('/expense', {
      method: 'POST',
      body: data instanceof FormData ? data : JSON.stringify(data),
    })
  }

  updateExpense(id: string, data: Record<string, unknown> | FormData) {
    return this.request(`/expense/${id}`, {
      method: 'PATCH',
      body: data instanceof FormData ? data : JSON.stringify(data),
    })
  }

  reviewExpense(id: string, status: 'APPROVED' | 'REJECTED', note?: string) {
    return this.request(`/expense/${id}/approval`, {
      method: 'PATCH',
      body: JSON.stringify({ status, note }),
    })
  }

  deleteExpense(id: string) {
    return this.request(`/expense/${id}`, {
      method: 'DELETE',
    })
  }

  getFundBalances(messId: string) {
    return this.request<{
      messDepositBalance: number
      collectedFundBalance: number
    }>(`/funds/${messId}/balances`)
  }

  createCollectedFund(data: {
    messId: string
    amount: number
    date?: string
    note?: string
  }) {
    return this.request<{
      id: string
      amount: number
      balance: number
      balances: {
        messDepositBalance: number
        collectedFundBalance: number
      }
    }>('/funds/collected', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  getCollectedFundEntries(messId: string, params?: Record<string, QueryValue>) {
    return this.request(`/funds/${messId}/collected`, { params })
  }

  deleteCollectedFundEntry(id: string) {
    return this.request(`/funds/collected/${id}`, {
      method: 'DELETE',
    })
  }

  getDepositsByMess(messId: string, params?: Record<string, QueryValue>) {
    return this.request(`/deposit/mess/${messId}`, { params })
  }

  getDepositById(id: string) {
    return this.request(`/deposit/${id}`)
  }

  createDeposit(data: Record<string, unknown>) {
    return this.request('/deposit', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  updateDeposit(id: string, data: Record<string, unknown>) {
    return this.request(`/deposit/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  }

  createMeal(data: Record<string, unknown>) {
    return this.request('/meal', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  bulkUpdateOwnMeals(messId: string, updates: Array<Record<string, unknown>>, idempotencyKey = crypto.randomUUID()) {
    return this.request(`/meal/mess/${messId}/my-attendance/bulk`, {
      method: 'PATCH',
      body: JSON.stringify({ idempotencyKey, updates }),
    })
  }

  getMealsByMess(messId: string, params?: Record<string, QueryValue>) {
    return this.request(`/meal/mess/${messId}`, { params })
  }

  getMealMembers(messId: string) {
    return this.request<any[]>(`/meal/mess/${messId}/members`, { cache: 'no-store' })
  }

  bulkUpdateMealAttendances(messId: string, data: { date: string; updates: BulkMealAttendanceUpdate[] }) {
    return this.request<BulkMealAttendanceResult>(`/meal/mess/${messId}/attendance/bulk`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  }

  getMealDeadline(messId: string, date?: string) {
    return this.request(`/meal/mess/${messId}/deadline`, {
      params: date ? { date } : undefined,
    })
  }

  getMealWindowStatus(messId: string, date?: string) {
    return this.request(`/meal/mess/${messId}/window-status`, {
      params: date ? { date } : undefined,
    })
  }

  setMealDeadline(messId: string, data: Record<string, unknown>) {
    return this.request(`/meal/mess/${messId}/deadline`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  getMealSettings(messId: string) {
    return this.request(`/meal/mess/${messId}/settings`)
  }

  updateMealSettings(messId: string, data: Record<string, unknown>) {
    return this.request(`/meal/mess/${messId}/settings`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  }

  updateMeal(id: string, data: Record<string, unknown>) {
    return this.request(`/meal/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  }

  getMealPatterns(membershipId?: string) {
    return this.request('/meal-patterns', { params: membershipId ? { membershipId } : undefined })
  }

  createMealPattern(data: Record<string, unknown>) {
    return this.request('/meal-patterns', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  updateMealPattern(id: string, data: Record<string, unknown>) {
    return this.request(`/meal-patterns/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  }

  pauseMealPattern(id: string) {
    return this.request(`/meal-patterns/${id}/pause`, { method: 'POST' })
  }

  resumeMealPattern(id: string) {
    return this.request(`/meal-patterns/${id}/resume`, { method: 'POST' })
  }

  cancelMealPattern(id: string) {
    return this.request(`/meal-patterns/${id}/cancel`, { method: 'POST' })
  }

  getBazarScheduleSettings(messId: string) {
    return this.request<BazarScheduleSettings>(`/bazar/schedule-settings/${messId}`, { cache: 'no-store' })
  }

  saveBazarScheduleSettings(messId: string, data: SaveBazarScheduleSettingsInput) {
    return this.request<BazarScheduleSettings>(`/bazar/schedule-settings/${messId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  generateBazarSchedule(data: { messId: string; year: number; month: number }) {
    return this.request<BazarSchedule>('/bazar/schedules/generate', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  getBazarSchedule(messId: string, year: number, month: number) {
    return this.request<BazarSchedule>(`/bazar/schedules/mess/${messId}`, {
      params: { year, month },
      cache: 'no-store',
    })
  }

  addBazarScheduleDate(scheduleId: string, data: { date: string; requiredMembers?: number; reason: string }) {
    return this.request<BazarScheduleDate>(`/bazar/schedules/${scheduleId}/dates`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  claimBazarDuty(slotId: string) {
    return this.request<BazarDutySlot>(`/bazar/duty-slots/${slotId}/claim`, { method: 'POST' })
  }

  assignBazarDuty(slotId: string, data: { memberId: string; reason?: string }) {
    return this.request<BazarDutySlot>(`/bazar/duty-slots/${slotId}/assign`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  moveBazarDuty(slotId: string, data: { targetSlotId: string; reason?: string }) {
    return this.request<MoveBazarDutyResult>(`/bazar/duty-slots/${slotId}/move`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  releaseBazarDuty(slotId: string, data: { reason: string }) {
    return this.request<BazarScheduleRequest>(`/bazar/duty-slots/${slotId}/release`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  createBazarSwap(data: { requesterSlotId: string; targetSlotId: string; reason?: string }) {
    return this.request<BazarScheduleRequest>('/bazar/swap-requests', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  getBazarReleaseRequests(messId: string, status?: BazarScheduleRequest['status']) {
    return this.request<BazarScheduleRequest[]>(`/bazar/release-requests/mess/${messId}`, {
      params: { status },
      cache: 'no-store',
    })
  }

  getBazarSwapRequests(messId: string, status?: BazarScheduleRequest['status']) {
    return this.request<BazarScheduleRequest[]>(`/bazar/swap-requests/mess/${messId}`, {
      params: { status },
      cache: 'no-store',
    })
  }

  generateMonthlyBills(data: { messId: string; month: string }) {
    return this.request('/monthly-bill/generate', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  getBillsByMess(messId: string, params?: Record<string, QueryValue>) {
    return this.request(`/monthly-bill/mess/${messId}`, { params })
  }

  getMonthlyBillById(id: string) {
    return this.request(`/monthly-bill/${id}`)
  }

  getMonthlyReport(messId: string, month: string) {
    return this.request<MonthlyReport | null>(`/monthly-reports/mess/${messId}`, { params: { month } })
  }

  getMonthlyReportById(id: string) {
    return this.request<MonthlyReport>(`/monthly-reports/${id}`)
  }

  generateMonthlyReport(data: { messId: string; month: string }) {
    return this.request<MonthlyReport>('/monthly-reports/generate', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  finalizeMonthlyReport(id: string) {
    return this.request<MonthlyReport>(`/monthly-reports/${id}/finalize`, { method: 'POST' })
  }

  retryMonthlyReportDeliveries(id: string) {
    return this.request<MonthlyReport>(`/monthly-reports/${id}/retry-deliveries`, { method: 'POST' })
  }

  getMonthlyReportSettings(messId: string) {
    return this.request<MonthlyReportSetting>(`/monthly-reports/settings/${messId}`, { cache: 'no-store' })
  }

  updateMonthlyReportSettings(messId: string, data: { autoGenerate: boolean; emailMembers: boolean }) {
    return this.request<MonthlyReportSetting>(`/monthly-reports/settings/${messId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  }

  async downloadMonthlyReportPdf(id: string, locale: 'en' | 'bn') {
    const response = await fetch(`${BASE_URL}/monthly-reports/${id}/pdf?locale=${locale}`, {
      headers: { Authorization: `Bearer ${this.token() ?? ''}` },
      credentials: 'include',
    })
    if (!response.ok) {
      if (response.status === 401) this.clearAuth()
      throw new ApiError(safeApiErrorMessage(response.status), `HTTP_${response.status}`, response.status)
    }
    const disposition = response.headers.get('content-disposition') ?? ''
    const filename = disposition.match(/filename="?([^";]+)"?/i)?.[1] ?? 'messzen-monthly-report.pdf'
    return { blob: await response.blob(), filename }
  }

  requestMonthlyBillClose(id: string) {
    return this.request(`/monthly-bill/${id}/close-request`, {
      method: 'POST',
    })
  }

  getManagedMonthlyBillCloseRequests(messId: string, status?: 'PENDING' | 'APPROVED' | 'REJECTED') {
    return this.request('/monthly-bill/close-requests/managed', {
      params: { messId, status },
    })
  }

  reviewMonthlyBillCloseRequest(requestId: string, status: 'APPROVED' | 'REJECTED', reviewNote?: string) {
    return this.request(`/monthly-bill/close-requests/${requestId}/review`, {
      method: 'PATCH',
      body: JSON.stringify({ status, reviewNote }),
    })
  }

  getPersonalSummary(month?: string) {
    return this.request('/personal/summary', { params: { month } })
  }

  getPersonalReports(month?: string) {
    return this.request('/personal/reports', { params: { month } })
  }

  getPersonalTransactions(params?: {
    month?: string
    type?: 'INCOME' | 'EXPENSE' | 'SAVING'
    category?: string
    familyMemberId?: string
    search?: string
    page?: number
    limit?: number
  }) {
    return this.request('/personal/transactions', { params })
  }

  createPersonalTransaction(data: {
    type: 'INCOME' | 'EXPENSE' | 'SAVING'
    category: string
    amount: number
    date: string
    description?: string
    familyMemberId?: string | null
  }) {
    return this.request('/personal/transactions', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  updatePersonalTransaction(
    id: string,
    data: Partial<{
      type: 'INCOME' | 'EXPENSE' | 'SAVING'
      category: string
      amount: number
      date: string
      description?: string
      familyMemberId?: string | null
    }>
  ) {
    return this.request(`/personal/transactions/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  }

  deletePersonalTransaction(id: string) {
    return this.request(`/personal/transactions/${id}`, { method: 'DELETE' })
  }

  getPersonalFamilyMembers(month?: string) {
    return this.request('/personal/family-members', { params: { month } })
  }

  createPersonalFamilyMember(data: { name: string; relation: string }) {
    return this.request('/personal/family-members', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  updatePersonalFamilyMember(id: string, data: { name?: string; relation?: string }) {
    return this.request(`/personal/family-members/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  }

  deletePersonalFamilyMember(id: string) {
    return this.request(`/personal/family-members/${id}`, { method: 'DELETE' })
  }

  getPersonalBudgets(month?: string) {
    return this.request('/personal/budgets', { params: { month } })
  }

  createPersonalBudget(data: { month: string; category: string; limitAmount: number }) {
    return this.request('/personal/budgets', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  updatePersonalBudget(id: string, data: { limitAmount: number }) {
    return this.request(`/personal/budgets/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  }

  deletePersonalBudget(id: string) {
    return this.request(`/personal/budgets/${id}`, { method: 'DELETE' })
  }

  updateMonthlyBillStatus(id: string, data: Record<string, unknown>) {
    return this.request(`/monthly-bill/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  }

  createPayment(data: Record<string, unknown> | FormData) {
    return this.request('/payments', {
      method: 'POST',
      body: data instanceof FormData ? data : JSON.stringify(data),
    })
  }

  getPaymentsByMess(messId: string, params?: Record<string, QueryValue>) {
    return this.request(`/payments/mess/${messId}`, { params })
  }

  getPaymentById(id: string) {
    return this.request(`/payments/${id}`)
  }

  updatePayment(id: string, data: Record<string, unknown>) {
    return this.request(`/payments/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  }

  reviewPayment(id: string, data: Record<string, unknown>) {
    return this.request(`/payments/${id}/review`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  }

  deletePayment(id: string) {
    return this.request(`/payments/${id}`, {
      method: 'DELETE',
    })
  }

  createComplaint(data: Record<string, unknown>) {
    return this.request('/complaints', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  getComplaintsByMess(messId: string, params?: Record<string, QueryValue>) {
    return this.request(`/complaints/mess/${messId}`, { params })
  }

  updateComplaintStatus(id: string, data: Record<string, unknown>) {
    return this.request(`/complaints/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  }

  getAiCapabilities(locale: AiLocale = 'en') {
    return this.request<AiCapabilities>('/ai/commands/capabilities', {
      params: { locale },
      cache: 'no-store',
    })
  }

  createAiTextCommand(data: { messId: string; text: string; locale: AiLocale; idempotencyKey: string }) {
    return this.request<AiCommand>('/ai/commands/text', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  createAiVoiceCommand(data: { messId: string; audio: Blob; locale: AiLocale; speechLanguage?: AiSpeechLanguage; idempotencyKey: string }) {
    const form = new FormData()
    const extension = data.audio.type.includes('mp4') ? 'm4a' : data.audio.type.includes('ogg') ? 'ogg' : 'webm'
    form.append('messId', data.messId)
    form.append('locale', data.locale)
    form.append('speechLanguage', data.speechLanguage ?? 'auto')
    form.append('idempotencyKey', data.idempotencyKey)
    form.append('audio', data.audio, `messzen-command.${extension}`)
    return this.request<AiCommand>('/ai/commands/voice', { method: 'POST', body: form })
  }

  confirmAiCommand(commandId: string, payload: Record<string, unknown>) {
    return this.request<AiCommand>(`/ai/commands/${commandId}/confirm`, {
      method: 'POST',
      body: JSON.stringify({ payload }),
    })
  }

  cancelAiCommand(commandId: string) {
    return this.request<AiCommand>(`/ai/commands/${commandId}/cancel`, { method: 'POST' })
  }

  createNotice(data: Record<string, unknown>) {
    return this.request('/notices', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  getNoticesByMess(messId: string, params?: Record<string, QueryValue>) {
    return this.request(`/notices/mess/${messId}`, { params })
  }

  getNotifications(params?: Record<string, QueryValue>) {
    return this.request('/notification/my', { params })
  }

  getUnreadNotificationCount() {
    return this.request<{ count: number }>('/notification/unread-count', { cache: 'no-store' })
  }

  markNotificationRead(id: string) {
    return this.request(`/notification/${id}/read`, { method: 'PATCH' })
  }

  getFcmDeviceStatus() {
    return this.request<{
      configured: boolean
      hasActiveDevice: boolean
      activeDeviceCount: number
    }>('/notification/push/fcm/status', { cache: 'no-store' })
  }

  registerFcmDevice(token: string, appVersion: string) {
    return this.request('/notification/push/fcm/register', {
      method: 'POST',
      body: JSON.stringify({ token, appVersion }),
    })
  }

  unregisterFcmDevice(token: string) {
    return this.request('/notification/push/fcm/unregister', {
      method: 'PATCH',
      body: JSON.stringify({ token }),
    })
  }
}

export const api = new Api()
