import { clearStoredToken, getStoredToken, type AuthUser, type GlobalRole } from './auth'

const DEFAULT_API_URL =
  process.env.NODE_ENV === 'development'
    ? 'http://localhost:5001/api/v1'
    : 'https://api.messzen.com/api/v1'

const BASE_URL = (process.env.NEXT_PUBLIC_API_URL || DEFAULT_API_URL).replace(/\/+$/, '')

type QueryValue = string | number | boolean | undefined | null

type ApiResponse<T> = {
  success: boolean
  message: string
  data: T
  meta?: Record<string, unknown>
  totalAmount?: number
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
        throw new Error(json.message || res.statusText || 'Request failed')
      }

      return json
    } catch (err) {
      if (err instanceof Error && /invalid or expired token/i.test(err.message)) {
        this.clearAuth()
      }
      if (err instanceof TypeError && /fetch|network|failed/i.test(err.message)) {
        throw new Error(`Unable to connect to the server at ${BASE_URL}`)
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

  changePassword(oldPassword: string, newPassword: string) {
    return this.request<{ message: string }>('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ oldPassword, newPassword }),
    })
  }

  getMesses() {
    return this.request<any[]>('/messes/my-mess')
  }

  getMessDashboard(messId: string) {
    return this.request<any>(`/dashboard/mess/${messId}`)
  }

  getMonthlyOverview(messId: string, month?: string) {
    return this.request<Array<{ day: string; income: number; expense: number }>>(`/dashboard/mess/${messId}/monthly-overview`, {
      params: month ? { month } : undefined,
    })
  }

  getAllMembers(params?: Record<string, QueryValue>) {
    return this.request<any[]>('/messes/members', { params })
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

  reviewPayment(id: string, data: Record<string, unknown>) {
    return this.request(`/payments/${id}/review`, {
      method: 'PATCH',
      body: JSON.stringify(data),
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

  createNotice(data: Record<string, unknown>) {
    return this.request('/notices', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  getNoticesByMess(messId: string, params?: Record<string, QueryValue>) {
    return this.request(`/notices/mess/${messId}`, { params })
  }
}

export const api = new Api()
