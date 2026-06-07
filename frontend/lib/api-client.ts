const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api/v1'
const REQUEST_TIMEOUT_MS = 60000

export interface BackendResponse<T> {
  statusCode: number
  success: boolean
  message: string
  meta?: { total: number; page: number; limit: number; totalPages?: number } | null
  data: T
}

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public errorSources?: { path: string; message: string }[]
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export type GlobalRole = 'ADMIN' | 'MANAGER' | 'MEMBER' | 'ORGANIZER'
export type MembershipRole = 'MANAGER' | 'MEMBER'
export type MealName = 'BREAKFAST' | 'LUNCH' | 'DINNER'
export type AttendanceStatus = 'ON' | 'OFF'
export type ExpenseCategory =
  | 'GROCERY'
  | 'UTILITY'
  | 'RENT'
  | 'FOOD'
  | 'GAS'
  | 'ELECTRICITY'
  | 'WIFI'
  | 'CLEANER'
  | 'MAINTENANCE'
  | 'OTHER'
export type PaymentMethod = 'CASH' | 'BKASH' | 'NAGAD' | 'ROCKET' | 'BANK'
export type PaymentStatus = 'PENDING' | 'APPROVED' | 'REJECTED'
export type BillStatus = 'PENDING' | 'PAID' | 'PARTIAL'
export type NoticeType = 'MEAL' | 'PAYMENT' | 'EMERGENCY' | 'MEETING' | 'RULE_UPDATE' | 'GENERAL'
export type ComplaintCategory =
  | 'MEAL_CORRECTION'
  | 'PAYMENT_CORRECTION'
  | 'LEAVE_REQUEST'
  | 'ROOM_ISSUE'
  | 'FOOD_ISSUE'
  | 'MAINTENANCE_ISSUE'
  | 'OTHER'
export type ComplaintStatus = 'PENDING' | 'PROCESSING' | 'SOLVED' | 'REJECTED'

export interface User {
  id: string
  name: string
  email: string
  phone?: string | null
  role: GlobalRole
  avatar_url?: string | null
  memberships?: MessMembership[]
}

export interface Mess {
  id: string
  name: string
  description?: string | null
  address?: string | null
  meal_rate: string
  currency: string
  created_by: string
  is_active: boolean
  total_seats?: number | null
  monthly_rent?: string | null
  electricity_bill?: string | null
  gas_bill?: string | null
  wifi_bill?: string | null
  cleaner_bill?: string | null
  extra_cost?: string | null
  payment_deadline_day?: number
  meal_off_deadline?: string | null
  settings_completed?: boolean
  created_at: string
  _count?: { memberships?: number; deposits?: number; meals?: number }
}

export interface MessMembership {
  id: string
  mess_id: string
  user_id: string
  role: MembershipRole
  joined_at: string
  left_at?: string | null
  is_active: boolean
  room_no?: string | null
  seat_no?: string | null
  monthly_rent?: string | null
  deposit_amount?: string | null
  due_balance?: string | null
  user?: User
  mess?: Mess
}

export interface MessMembershipWithDetails extends MessMembership {
  user: User
  mess: Mess
}

export interface MessDashboard {
  todayTotalMeals: number
  currentMonthTotalBazar: number
  currentMealRate: number
  totalDue: number
  paidAmount: number
  activeMembers: number
  pendingPayments: number
  openComplaints: number
  notices: Array<{ id: string; title: string; type: NoticeType; is_pinned: boolean; created_at: string }>
}

export interface AdminDashboard {
  users: number
  pendingRequests: number
  approvedRequests: number
  messes: number
  pendingComplaints: number
  pendingPayments: number
}

export interface MonthlyBill {
  id: string
  month: string
  total_meals: number
  food_bill: string
  seat_rent: string
  utility_share: string
  paid_amount: string
  final_due: string
  balance: string
  status: BillStatus
  member?: User
  mess?: Mess
}

export interface Payment {
  id: string
  amount: string
  method: PaymentMethod
  status: PaymentStatus
  transaction_id?: string | null
  created_at: string
  member?: User
  mess?: Mess
}

export interface Notice {
  id: string
  type: NoticeType
  title: string
  body: string
  is_pinned: boolean
  created_at: string
  creator?: User
  mess?: Mess
}

export interface Complaint {
  id: string
  category: ComplaintCategory
  title: string
  description: string
  status: ComplaintStatus
  response?: string | null
  created_at: string
  member?: User
  mess?: Mess
}

type QueryParams = Record<string, string | number | boolean | undefined | null>

class ApiClient {
  constructor(private baseUrl: string) {}

  private getToken() {
    if (typeof window === 'undefined') return null
    return localStorage.getItem('authToken')
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit & { params?: QueryParams } = {}
  ): Promise<BackendResponse<T>> {
    let url = `${this.baseUrl}${endpoint}`
    if (options.params) {
      const params = new URLSearchParams()
      Object.entries(options.params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') params.set(key, String(value))
      })
      const query = params.toString()
      if (query) url += `?${query}`
    }

    const token = this.getToken()
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    }
    const requestHeaders = headers as Record<string, string>
    if (token) requestHeaders.Authorization = `Bearer ${token}`

    const controller = new AbortController()
    const timeoutId = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
    const abortRequest = () => controller.abort()
    options.signal?.addEventListener('abort', abortRequest, { once: true })

    const fetchOptions: RequestInit = { ...options, headers, signal: controller.signal }
    delete (fetchOptions as RequestInit & { params?: QueryParams }).params

    try {
      const response = await fetch(url, fetchOptions)
      const json = await response.json().catch(() => ({}))
      if (!response.ok || json.success === false) {
        throw new ApiError(
          json.statusCode ?? response.status,
          json.message ?? response.statusText ?? 'Something went wrong',
          json.errorSources
        )
      }
      return json as BackendResponse<T>
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new ApiError(408, 'Request timed out. Please check that the backend server is running.')
      }
      throw error
    } finally {
      window.clearTimeout(timeoutId)
      options.signal?.removeEventListener('abort', abortRequest)
    }
  }

  login(email: string, password: string) {
    return this.request<{ accessToken: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
  }

  register(data: { name: string; email: string; phone?: string; password: string; role?: GlobalRole }) {
    return this.request<User>('/auth/register', { method: 'POST', body: JSON.stringify(data) })
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

  getProfile(signal?: AbortSignal) {
    return this.request<User>('/users/profile', { signal })
  }

  getUsers(params?: QueryParams) {
    return this.request<User[]>('/users', { params })
  }

  getMesses() {
    return this.request<Mess[]>('/messes/my-mess')
  }

  getAllMesses(params?: QueryParams) {
    return this.request<Mess[]>('/messes', { params })
  }

  getMess(id: string) {
    return this.request<Mess>(`/messes/${id}`)
  }

  createMess(data: { messName: string; messLocation: string; description?: string; meal_rate?: string; currency?: string }) {
    return this.request<Mess>('/messes', { method: 'POST', body: JSON.stringify({ meal_rate: '0', currency: 'BDT', ...data }) })
  }

  updateMess(id: string, data: { messName?: string; messLocation?: string; description?: string }) {
    return this.request<Mess>(`/messes/${id}`, { method: 'PATCH', body: JSON.stringify(data) })
  }

  deleteMess(id: string) {
    return this.request(`/messes/${id}`, { method: 'DELETE' })
  }

  requestMessRegistration(data: { messName: string; address: string; totalSeats?: number; monthlyRent?: number; description?: string }) {
    return this.request('/messes/registration-requests', { method: 'POST', body: JSON.stringify(data) })
  }

  getMessRequests(params?: QueryParams) {
    return this.request('/messes/registration-requests', { params })
  }

  reviewMessRequest(id: string, data: { status: 'APPROVED' | 'REJECTED'; reviewNote?: string }) {
    return this.request(`/messes/registration-requests/${id}/review`, { method: 'PATCH', body: JSON.stringify(data) })
  }

  updateMessSetup(id: string, data: Record<string, unknown>) {
    return this.request<Mess>(`/messes/${id}/setup`, { method: 'PATCH', body: JSON.stringify(data) })
  }

  getAllMembers(params?: QueryParams) {
    return this.request<MessMembershipWithDetails[]>('/messes/members', { params })
  }

  addMember(messId: string, data: { email: string; role: MembershipRole; roomNo?: string; seatNo?: string; monthlyRent?: number; depositAmount?: number }) {
    return this.request<MessMembership>(`/messes/${messId}/members`, { method: 'POST', body: JSON.stringify({ ...data, messId }) })
  }

  updateMember(messId: string, memberId: string, data: Partial<{ role: MembershipRole; isActive: boolean; roomNo: string; seatNo: string; monthlyRent: number; depositAmount: number }>) {
    return this.request<MessMembership>(`/messes/${messId}/members/${memberId}`, { method: 'PUT', body: JSON.stringify(data) })
  }

  updateMemberRole(messId: string, memberId: string, role: MembershipRole) {
    return this.updateMember(messId, memberId, { role })
  }

  removeMember(messId: string, memberId: string) {
    return this.request(`/messes/${messId}/members/${memberId}`, { method: 'DELETE' })
  }

  getMessDashboard(messId: string, month?: string) {
    return this.request<MessDashboard>(`/dashboard/mess/${messId}`, { params: { month } })
  }

  getAdminDashboard() {
    return this.request<AdminDashboard>('/dashboard/admin')
  }

  createMeal(data: { messId: string; memberId?: string; mealName: MealName; status: AttendanceStatus; guests?: number; date?: string; mealCount?: number }) {
    return this.request('/meal', { method: 'POST', body: JSON.stringify({ mealCount: data.status === 'ON' ? 1 : 0, ...data }) })
  }

  getMealsByMess(messId: string, params?: QueryParams) {
    return this.request(`/meal/mess/${messId}`, { params })
  }

  getMealSummary(messId: string, params?: QueryParams) {
    return this.request(`/meal/mess/${messId}/summary`, { params })
  }

  getExpensesByMess(messId: string, params?: QueryParams) {
    return this.request('/expense/mess/' + messId, { params })
  }

  createExpense(data: Record<string, unknown>) {
    return this.request('/expense', { method: 'POST', body: JSON.stringify(data) })
  }

  generateMonthlyBill(data: { messId: string; month: string }) {
    return this.request<MonthlyBill[]>('/monthly-bill/generate', { method: 'POST', body: JSON.stringify(data) })
  }

  getBillsByMess(messId: string, params?: QueryParams) {
    return this.request<MonthlyBill[]>(`/monthly-bill/mess/${messId}`, { params })
  }

  getMyBills(params?: QueryParams) {
    return this.request<MonthlyBill[]>('/monthly-bill/my', { params })
  }

  submitPayment(data: { messId: string; monthlyBillId?: string; amount: number; method: PaymentMethod; transactionId?: string; screenshotUrl?: string; note?: string }) {
    return this.request<Payment>('/payments', { method: 'POST', body: JSON.stringify(data) })
  }

  getPaymentsByMess(messId: string, params?: QueryParams) {
    return this.request<Payment[]>(`/payments/mess/${messId}`, { params })
  }

  getAllPayments(params?: QueryParams) {
    return this.request<Payment[]>('/payments', { params })
  }

  getMyPayments(params?: QueryParams) {
    return this.request<Payment[]>('/payments/my', { params })
  }

  reviewPayment(id: string, data: { status: 'APPROVED' | 'REJECTED'; note?: string }) {
    return this.request<Payment>(`/payments/${id}/review`, { method: 'PATCH', body: JSON.stringify(data) })
  }

  getNoticesByMess(messId: string, params?: QueryParams) {
    return this.request<Notice[]>(`/notices/mess/${messId}`, { params })
  }

  createNotice(data: { messId: string; type: NoticeType; title: string; body: string; isPinned?: boolean }) {
    return this.request<Notice>('/notices', { method: 'POST', body: JSON.stringify(data) })
  }

  getComplaintsByMess(messId: string, params?: QueryParams) {
    return this.request<Complaint[]>(`/complaints/mess/${messId}`, { params })
  }

  getAllComplaints(params?: QueryParams) {
    return this.request<Complaint[]>('/complaints', { params })
  }

  getMyComplaints(params?: QueryParams) {
    return this.request<Complaint[]>('/complaints/my', { params })
  }

  createComplaint(data: { messId: string; category: ComplaintCategory; title: string; description: string }) {
    return this.request<Complaint>('/complaints', { method: 'POST', body: JSON.stringify(data) })
  }

  updateComplaintStatus(id: string, data: { status: ComplaintStatus; response?: string }) {
    return this.request<Complaint>(`/complaints/${id}/status`, { method: 'PATCH', body: JSON.stringify(data) })
  }
}

export const apiClient = new ApiClient(API_BASE_URL)
