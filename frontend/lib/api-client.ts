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
export type RequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED'
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
  | 'BUABILL'
  | 'WATER'
  | 'OTHER'
export type ExpensePaymentType = 'FROM_DEPOSIT' | 'PERSONAL'
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

export interface MessRoom {
  roomName: string
  perPerson?: number | null
  roomPrice?: number | null
  occupiedSeats?: number | null
  availableSeats?: number | null
  isFull?: boolean | null
}

export interface Mess {
  id: string
  name: string
  description?: string | null
  address?: string | null
  mess_category?: string | null
  rooms?: MessRoom[] | null
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
  bazar_rules?: string | null
  settings_completed?: boolean
  created_at: string
  _count?: { memberships?: number; deposits?: number; meals?: number }
  memberships?: MessMembershipWithDetails[]
}

export interface PublicMessSubscription {
  plan: SubscriptionPlan
  status: SubscriptionStatus
  startDate: string
  endDate: string | null
}

export interface PublicMessCard {
  id: string
  name: string
  address: string | null
  description: string | null
  category: string | null
  totalMembers: number
  totalSeats: number
  availableSeats: number
  totalMeals: number
  createdAt: string
  creatorName: string
  subscription: PublicMessSubscription | null
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

export interface MemberJoinRequest {
  id: string
  requester_id: string
  mess_id: string
  status: RequestStatus
  review_note?: string | null
  reviewed_by?: string | null
  reviewed_at?: string | null
  created_at: string
  updated_at: string
  requester?: Pick<User, 'id' | 'name' | 'email' | 'phone' | 'role'>
  reviewer?: Pick<User, 'id' | 'name' | 'email'> | null
  mess?: Pick<Mess, 'id' | 'name' | 'address' | 'is_active' | 'created_by'>
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
  totalMeals:number
  extraExpenses:number
  perExtraExpenses:number
  totalDepositAmount:number
}

export interface AdminDashboard {
  users: number
  pendingRequests: number
  approvedRequests: number
  messes: number
  pendingComplaints: number
  pendingPayments: number
  recentExpenses?: Array<{
    id: string
    item_name?: string | null
    category: ExpenseCategory
    amount: string | number
    receipt_url?: string | null
    expense_date: string
    mess?: { id: string; name: string }
    creator?: { id: string; name: string; email: string }
  }>
}

export interface MonthlyBill {
  id: string
  month: string
  total_meals: number
  meal_charge: string
  food_bill: string
  seat_rent: string
  electricity_bill: string
  gas_bill: string
  wifi_bill: string
  cleaner_bill: string
  extra_cost: string
  utility_share: string
  deposit_total: string
  paid_amount: string
  final_due: string
  prev_balance: string
  balance: string
  status: BillStatus
  due_date?: string | null
  generated_at?: string
  member?: User
  mess?: Mess
}

export interface Payment {
  id: string
  amount: string
  method: PaymentMethod
  status: PaymentStatus
  categories: string[]
  note?: string | null
  transaction_id?: string | null
  payment_date?: string | null
  created_at: string
  member?: User
  creator?: User
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

export type ContactRequestSource = 'CONTACT' | 'SUBSCRIPTION' | 'UPGRADE'
export type ContactRequestStatus = 'PENDING' | 'CONTACTED' | 'RESOLVED'

export interface ContactRequest {
  id: string
  name: string
  email: string
  phone?: string | null
  description: string
  source: ContactRequestSource
  requested_plan?: SubscriptionPlan | null
  status: ContactRequestStatus
  admin_note?: string | null
  reviewed_by?: string | null
  reviewed_at?: string | null
  created_at: string
  updated_at: string
  reviewer?: { id: string; name: string; email: string } | null
}

export interface AppNotification {
  id: string
  type: string
  title: string
  body: string
  metadata?: Record<string, unknown> | null
  created_at: string
  mess?: { id: string; name: string }
  sender?: { id: string; name: string; email: string } | null
  reads?: Array<{ user_id: string; read_at: string }>
}

export type SubscriptionPlan = 'TRIAL' | 'MONTHLY' | 'YEARLY'
export type SubscriptionStatus = 'ACTIVE' | 'EXPIRED' | 'CANCELLED' | 'PENDING'

export interface SubscriptionPlanInfo {
  price: number
  label: string
  days: number
  description?: string
  currency?: string
  features?: string[]
}

export interface SubscriptionPlanUpdate {
  label?: string
  price?: number
  days?: number
  description?: string
  currency?: string
  features?: string[]
}

export interface SubscriptionRecord {
  id: string
  mess_id: string
  plan: SubscriptionPlan
  status: SubscriptionStatus
  start_date: string
  end_date: string | null
  cancelled_at: string | null
  created_at: string
  updated_at?: string
  mess: {
    id: string
    name: string
    address?: string | null
    _count?: { memberships?: number }
  }
}

export interface PushSubscriptionPayload {
  endpoint: string
  keys: {
    p256dh: string
    auth: string
  }
  userAgent?: string
}

export interface PushSubscriptionStatus {
  hasActiveSubscription: boolean
  activeSubscriptionCount: number
  latestSubscription: {
    id: string
    endpoint: string
    user_agent?: string | null
    is_active: boolean
    created_at: string
    updated_at: string
    last_used_at: string
  } | null
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
    const headers: HeadersInit = {}
    
    // Only set Content-Type for non-FormData requests
    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json'
    }
    
    Object.assign(headers, options.headers)
    
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

  updateProfile(data: FormData) {
    return this.request<User>('/users/profile', {
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

  createMess(data: { messName: string; messLocation: string; description?: string; meal_rate?: string; currency?: string; messCategory?: string; rooms?: MessRoom[]; totalSeats?: number; monthlyRent?: number }) {
    return this.request<Mess>('/messes', { method: 'POST', body: JSON.stringify({ meal_rate: '0', currency: 'BDT', ...data }) })
  }

  getActiveMesses(params?: QueryParams) {
    return this.request<Mess[]>('/messes/active', { params })
  }

  updateMess(id: string, data: { messName?: string; messLocation?: string; description?: string }) {
    return this.request<Mess>(`/messes/${id}`, { method: 'PATCH', body: JSON.stringify(data) })
  }

  deleteMess(id: string) {
    return this.request(`/messes/${id}`, { method: 'DELETE' })
  }

  requestMessRegistration(data: { messName: string; address: string; totalSeats?: number; monthlyRent?: number; description?: string; messCategory?: string; rooms?: MessRoom[] }) {
    return this.request('/mess-requests', { method: 'POST', body: JSON.stringify(data) })
  }

  getMessRequests(params?: QueryParams) {
    return this.request('/mess-requests', { params })
  }

  reviewMessRequest(id: string, data: { status: 'APPROVED' | 'REJECTED'; reviewNote?: string }) {
    return this.request(`/mess-requests/${id}/review`, { method: 'PATCH', body: JSON.stringify(data) })
  }

  deleteMessRequest(id: string) {
    return this.request(`/mess-requests/${id}`, { method: 'DELETE' })
  }

  requestMemberJoin(messId: string) {
    return this.request<MemberJoinRequest>('/member-join-requests', { method: 'POST', body: JSON.stringify({ messId }) })
  }

  getMyMemberJoinRequests(params?: QueryParams) {
    return this.request<MemberJoinRequest[]>('/member-join-requests/my', { params })
  }

  getManagedMemberJoinRequests(params?: QueryParams) {
    return this.request<MemberJoinRequest[]>('/member-join-requests/managed', { params })
  }

  reviewMemberJoinRequest(id: string, data: { status: RequestStatus; reviewNote?: string }) {
    return this.request<MemberJoinRequest>(`/member-join-requests/${id}/review`, { method: 'PATCH', body: JSON.stringify(data) })
  }

  updateMessSetup(id: string, data: { messName?: string; address?: string; totalSeats?: number; monthlyRent?: number; messCategory?: string; rooms?: MessRoom[]; paymentDeadlineDay?: number; mealOffDeadline?: string; bazarRules?: string; mealTypes?: MealName[]; mealRateMethod?: string }) {
    return this.request<Mess>(`/messes/${id}/setup`, { method: 'PATCH', body: JSON.stringify(data) })
  }

  getAllMembers(params?: QueryParams) {
    return this.request<MessMembershipWithDetails[]>('/messes/members', { params })
  }

  addMember(messId: string, data: { email: string; role: MembershipRole; roomNo?: string; seatNo?: string; monthlyRent?: number; depositAmount?: number }) {
    return this.request<MessMembership>(`/messes/${messId}/members`, { method: 'POST', body: JSON.stringify(data) })
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

  getMonthlyOverview(messId: string, month?: string) {
    return this.request<Array<{ day: string; income: number; expense: number }>>(`/dashboard/mess/${messId}/monthly-overview`, { params: { month } })
  }

  getExpenseBreakdown(messId: string, month?: string) {
    return this.request<{ data: Array<{ name: string; value: number; amount: number; color: string }>; totalAmount: number }>(`/dashboard/mess/${messId}/expense-breakdown`, { params: { month } })
  }

  getWeeklyMealCount(messId: string, date?: string) {
    return this.request<Array<{ day: string; breakfast: number; lunch: number; dinner: number }>>(`/dashboard/mess/${messId}/weekly-meals`, { params: { date } })
  }

  getAdminDashboard() {
    return this.request<AdminDashboard>('/dashboard/admin')
  }

  createMeal(data: { messId: string; memberId?: string; mealName: MealName; status: AttendanceStatus; guests?: number; date?: string; mealCount?: number }) {
    return this.request('/meal', { method: 'POST', body: JSON.stringify({ mealCount: data.status === 'ON' ? 1 : 0, ...data }) })
  }

  setMealDeadline(messId: string, startTime: string, endTime: string, date?: string) {
    return this.request(`/meal/mess/${messId}/deadline`, {
      method: 'POST',
      body: JSON.stringify({ startTime, endTime, date }),
    })
  }

  getMealDeadlineInfo(messId: string, date?: string) {
    return this.request<{ startTime: string; endTime: string; isWindowOpen: boolean; windowStartTime: string; windowEndTime: string }>(`/meal/mess/${messId}/deadline`, { params: { date } })
  }

  getMealWindowStatus(messId: string, date?: string) {
    return this.request<{ isWindowOpen: boolean }>(`/meal/mess/${messId}/window-status`, { params: { date } })
  }

  getMyMeals(params?: QueryParams) {
    return this.request('/meal/my', { params })
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

  createExpense(data: Record<string, unknown> | FormData) {
    return this.request('/expense', {
      method: 'POST',
      body: data instanceof FormData ? data : JSON.stringify(data),
    })
  }

  deleteExpense(id: string) {
    return this.request<{ message: string }>(`/expense/${id}`, { method: 'DELETE' })
  }

  updateExpense(id: string, data: Record<string, unknown> | FormData) {
    return this.request(`/expense/${id}`, {
      method: 'PATCH',
      body: data instanceof FormData ? data : JSON.stringify(data),
    })
  }

  requestExpensePriceReview(id: string, message: string) {
    return this.request(`/expense/${id}/request-price-review`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    })
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

  submitPayment(data: { messId: string; monthlyBillId?: string; amount: number; method: PaymentMethod; transactionId?: string; screenshotUrl?: string; note?: string; paymentDate?: string; categories?: string[]; purchasedBy?: string }) {
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

  deletePayment(id: string) {
    return this.request<{ message: string }>(`/payments/${id}`, { method: 'DELETE' })
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

  deleteComplaint(id: string) {
    return this.request(`/complaints/${id}`, { method: 'DELETE' })
  }

  createContactRequest(data: {
    name: string
    email: string
    phone?: string
    description: string
    source?: ContactRequestSource
    requestedPlan?: SubscriptionPlan
  }) {
    return this.request<ContactRequest>('/contact-requests', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  getContactRequests(params?: QueryParams) {
    return this.request<ContactRequest[]>('/contact-requests', { params })
  }

  reviewContactRequest(id: string, data: { status: ContactRequestStatus; adminNote?: string }) {
    return this.request<ContactRequest>(`/contact-requests/${id}/review`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  }

  getPushPublicKey() {
    return this.request<{ publicKey: string }>('/notification/push/public-key')
  }

  getPushSubscriptionStatus() {
    return this.request<PushSubscriptionStatus>('/notification/push/status')
  }

  savePushSubscription(data: PushSubscriptionPayload) {
    return this.request('/notification/push/subscribe', { method: 'POST', body: JSON.stringify(data) })
  }

  removePushSubscription(endpoint: string) {
    return this.request('/notification/push/unsubscribe', { method: 'PATCH', body: JSON.stringify({ endpoint }) })
  }

  getMyNotifications(params?: QueryParams) {
    return this.request<AppNotification[]>('/notification/my', { params })
  }

  getUnreadNotificationCount() {
    return this.request<{ count: number }>('/notification/unread-count')
  }

  markNotificationAsRead(id: string) {
    return this.request(`/notification/${id}/read`, { method: 'PATCH' })
  }

  deleteNotification(id: string) {
    return this.request(`/notification/${id}`, { method: 'DELETE' })
  }

  // ─── Public Endpoints ────────────────────────────────────
  getPublicMesses(signal?: AbortSignal) {
    return fetch(`${API_BASE_URL}/public/messes`, { signal }).then(res => res.json())
  }

  getPublicPlans(signal?: AbortSignal) {
    return fetch(`${API_BASE_URL}/public/plans`, { signal }).then(res => res.json())
  }

  // ─── Subscription Endpoints ──────────────────────────────
  getSubscriptionPlans() {
    return this.request<Record<string, SubscriptionPlanInfo>>('/subscriptions/plans')
  }

  getSubscriptions(params?: QueryParams) {
    return this.request<SubscriptionRecord[]>('/subscriptions', { params })
  }

  getSubscription(id: string) {
    return this.request<SubscriptionRecord>(`/subscriptions/${id}`)
  }

  getMessSubscription(messId: string) {
    return this.request<SubscriptionRecord | { mess_id: string; plan: SubscriptionPlan; status: SubscriptionStatus; start_date: string; end_date: string | null }>(`/subscriptions/mess/${messId}`)
  }

  createSubscription(data: { messId: string; plan: SubscriptionPlan }) {
    return this.request<SubscriptionRecord>('/subscriptions', { method: 'POST', body: JSON.stringify(data) })
  }

  updateSubscription(
    id: string,
    data: { plan?: SubscriptionPlan; status?: SubscriptionStatus; startDate?: string; endDate?: string; days?: number },
  ) {
    return this.request<SubscriptionRecord>(`/subscriptions/${id}`, { method: 'PATCH', body: JSON.stringify(data) })
  }

  updateSubscriptionPlan(plan: SubscriptionPlan, data: SubscriptionPlanUpdate) {
    return this.request<SubscriptionPlanInfo>(`/subscriptions/plans/${plan}`, { method: 'PATCH', body: JSON.stringify(data) })
  }

  deleteSubscription(id: string) {
    return this.request<SubscriptionRecord>(`/subscriptions/${id}`, { method: 'DELETE' })
  }

  initializeTrial(messId: string) {
    return this.request<SubscriptionRecord>(`/subscriptions/${messId}/trial`, { method: 'POST' })
  }

  checkExpiredSubscriptions() {
    return this.request<{ updated: number }>('/subscriptions/check-expired', { method: 'POST' })
  }
}

export const apiClient = new ApiClient(API_BASE_URL)
