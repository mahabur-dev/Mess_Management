// // // API Client for connecting to NestJS backend
// // const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'

// // export interface ApiResponse<T> {
// //   data: T
// //   message?: string
// //   statusCode: number
// // }

// // class ApiClient {
// //   private baseUrl: string

// //   constructor(baseUrl: string) {
// //     this.baseUrl = baseUrl
// //   }

// //   private async request<T>(
// //     endpoint: string,
// //     options: RequestInit = {}
// //   ): Promise<ApiResponse<T>> {
// //     const url = `${this.baseUrl}${endpoint}`
// //     const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null

// //     const headers: HeadersInit = {
// //       'Content-Type': 'application/json',
// //       ...options.headers,
// //     }

// //     if (token) {
// //       headers.Authorization = `Bearer ${token}`
// //     }

// //     try {
// //       const response = await fetch(url, {
// //         ...options,
// //         headers,
// //       })

// //       if (!response.ok) {
// //         throw new Error(`API error: ${response.statusText}`)
// //       }

// //       const data = await response.json()
// //       return {
// //         data: data.data || data,
// //         message: data.message,
// //         statusCode: response.status,
// //       }
// //     } catch (error) {
// //       console.error('[API Error]', error)
// //       throw error
// //     }
// //   }

// //   // Authentication
// //   async login(email: string, password: string) {
// //     return this.request('/auth/login', {
// //       method: 'POST',
// //       body: JSON.stringify({ email, password }),
// //     })
// //   }

// //   async register(email: string, password: string, name: string) {
// //     return this.request('/auth/register', {
// //       method: 'POST',
// //       body: JSON.stringify({ email, password, name }),
// //     })
// //   }

// //   // Meals
// //   async getMeals() {
// //     return this.request('/meals', { method: 'GET' })
// //   }

// //   async createMeal(data: any) {
// //     return this.request('/meals', {
// //       method: 'POST',
// //       body: JSON.stringify(data),
// //     })
// //   }

// //   // Messes
// //   async getMesses() {
// //     return this.request('/messes', { method: 'GET' })
// //   }

// //   async createMess(data: any) {
// //     return this.request('/messes', {
// //       method: 'POST',
// //       body: JSON.stringify(data),
// //     })
// //   }

// //   // Users
// //   async getUsers() {
// //     return this.request('/users', { method: 'GET' })
// //   }

// //   // Finance
// //   async getFinance() {
// //     return this.request('/finance', { method: 'GET' })
// //   }

// //   // Shopping
// //   async getShopping() {
// //     return this.request('/shopping', { method: 'GET' })
// //   }

// //   // Attendance
// //   async getAttendance() {
// //     return this.request('/attendance', { method: 'GET' })
// //   }
// // }

// // export const apiClient = new ApiClient(API_BASE_URL)


// // API Client for connecting to NestJS backend
// const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'

// // ─── Response shape from your NestJS backend ─────────────────────────────────
// export interface BackendResponse<T> {
//   statusCode: number
//   success: boolean
//   message: string
//   meta: null | { total: number; page: number; limit: number }
//   data: T
// }

// // ─── Mess types matching your Prisma schema ───────────────────────────────────
// export interface MessCreator {
//   id: string
//   name: string
//   email: string
// }

// export interface MessCount {
//   memberships: number
//   deposits: number
//   meals: number
// }

// export interface Mess {
//   id: string
//   name: string
//   description: string | null
//   address: string | null
//   meal_rate: string
//   currency: string
//   created_by: string
//   is_active: boolean
//   created_at: string
//   creator?: MessCreator
//   _count?: MessCount
// }

// export interface CreateMessDto {
//   messName: string
//   description?: string
//   messLocation?: string
//   meal_rate: string
//   currency: string
// }

// export interface UpdateMessDto extends Partial<CreateMessDto> {
//   is_active?: boolean
// }

// // ─── Generic API response wrapper ────────────────────────────────────────────
// export interface ApiResponse<T> {
//   data: T
//   message?: string
//   statusCode: number
// }

// // ─── Error class for API errors ───────────────────────────────────────────────
// export class ApiError extends Error {
//   constructor(
//     public statusCode: number,
//     message: string,
//     public errorSources?: { path: string; message: string }[]
//   ) {
//     super(message)
//     this.name = 'ApiError'
//   }
// }

// class ApiClient {
//   private baseUrl: string

//   constructor(baseUrl: string) {
//     this.baseUrl = baseUrl
//   }

//   private async request<T>(
//     endpoint: string,
//     options: RequestInit = {}
//   ): Promise<BackendResponse<T>> {
//     const url = `${this.baseUrl}${endpoint}`
//     const token =
//       typeof window !== 'undefined' ? localStorage.getItem('authToken') : null

//     const headers: HeadersInit = {
//       'Content-Type': 'application/json',
//       ...options.headers,
//     }

//     if (token) {
//       ;(headers as Record<string, string>)['Authorization'] = `Bearer ${token}`
//     }

//     const response = await fetch(url, { ...options, headers })
//     const json = await response.json()

//     console.log(json)

//     // Your backend returns { success, statusCode, message, data } on both success and error
//     if (!response.ok || !json.success) {
//       throw new ApiError(
//         json.statusCode ?? response.status,
//         json.message ?? response.statusText,
//         json.errorSources
//       )
//     }

//     return json as BackendResponse<T>
//   }

//   // ─── Auth ──────────────────────────────────────────────────────────────────
//   async login(email: string, password: string) {
//     return this.request('/auth/login', {
//       method: 'POST',
//       body: JSON.stringify({ email, password }),
//     })
//   }

//   async register(email: string, password: string, name: string) {
//     return this.request('/auth/register', {
//       method: 'POST',
//       body: JSON.stringify({ email, password, name }),
//     })
//   }

//   // ─── Messes ────────────────────────────────────────────────────────────────

//   //own messes
//   async getMesses(): Promise<BackendResponse<Mess | Mess[]>> {
//     return this.request<Mess | Mess[]>('/messes/my-mess', { method: 'GET' })
//   }

//   async getMess(id: string): Promise<BackendResponse<Mess>> {
//     return this.request<Mess>(`/messes/${id}`, { method: 'GET' })
//   }

//   async createMess(data: CreateMessDto): Promise<BackendResponse<Mess>> {
//     return this.request<Mess>('/messes', {
//       method: 'POST',
//       body: JSON.stringify(data),
//     })
//   }

//   async updateMess(id: string, data: UpdateMessDto): Promise<BackendResponse<Mess>> {
//     return this.request<Mess>(`/messes/${id}`, {
//       method: 'PATCH',
//       body: JSON.stringify(data),
//     })
//   }

//   async deleteMess(id: string): Promise<BackendResponse<null>> {
//     return this.request<null>(`/messes/${id}`, { method: 'DELETE' })
//   }

//   // ─── Meals ─────────────────────────────────────────────────────────────────
//   async getMeals() {
//     return this.request('/meals', { method: 'GET' })
//   }

//   async createMeal(data: unknown) {
//     return this.request('/meals', {
//       method: 'POST',
//       body: JSON.stringify(data),
//     })
//   }

//   // ─── Users ─────────────────────────────────────────────────────────────────
//   async getUsers() {
//     return this.request('/users', { method: 'GET' })
//   }

//   // ─── Finance ───────────────────────────────────────────────────────────────
//   async getFinance() {
//     return this.request('/finance', { method: 'GET' })
//   }

//   // ─── Shopping ──────────────────────────────────────────────────────────────
//   async getShopping() {
//     return this.request('/shopping', { method: 'GET' })
//   }

//   // ─── Attendance ────────────────────────────────────────────────────────────
//   async getAttendance() {
//     return this.request('/attendance', { method: 'GET' })
//   }
// }

// export const apiClient = new ApiClient(API_BASE_URL)


// // API Client for connecting to NestJS backend
// const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'

// export interface ApiResponse<T> {
//   data: T
//   message?: string
//   statusCode: number
// }

// class ApiClient {
//   private baseUrl: string

//   constructor(baseUrl: string) {
//     this.baseUrl = baseUrl
//   }

//   private async request<T>(
//     endpoint: string,
//     options: RequestInit = {}
//   ): Promise<ApiResponse<T>> {
//     const url = `${this.baseUrl}${endpoint}`
//     const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null

//     const headers: HeadersInit = {
//       'Content-Type': 'application/json',
//       ...options.headers,
//     }

//     if (token) {
//       headers.Authorization = `Bearer ${token}`
//     }

//     try {
//       const response = await fetch(url, {
//         ...options,
//         headers,
//       })

//       if (!response.ok) {
//         throw new Error(`API error: ${response.statusText}`)
//       }

//       const data = await response.json()
//       return {
//         data: data.data || data,
//         message: data.message,
//         statusCode: response.status,
//       }
//     } catch (error) {
//       console.error('[API Error]', error)
//       throw error
//     }
//   }

//   // Authentication
//   async login(email: string, password: string) {
//     return this.request('/auth/login', {
//       method: 'POST',
//       body: JSON.stringify({ email, password }),
//     })
//   }

//   async register(email: string, password: string, name: string) {
//     return this.request('/auth/register', {
//       method: 'POST',
//       body: JSON.stringify({ email, password, name }),
//     })
//   }

//   // Meals
//   async getMeals() {
//     return this.request('/meals', { method: 'GET' })
//   }

//   async createMeal(data: any) {
//     return this.request('/meals', {
//       method: 'POST',
//       body: JSON.stringify(data),
//     })
//   }

//   // Messes
//   async getMesses() {
//     return this.request('/messes', { method: 'GET' })
//   }

//   async createMess(data: any) {
//     return this.request('/messes', {
//       method: 'POST',
//       body: JSON.stringify(data),
//     })
//   }

//   // Users
//   async getUsers() {
//     return this.request('/users', { method: 'GET' })
//   }

//   // Finance
//   async getFinance() {
//     return this.request('/finance', { method: 'GET' })
//   }

//   // Shopping
//   async getShopping() {
//     return this.request('/shopping', { method: 'GET' })
//   }

//   // Attendance
//   async getAttendance() {
//     return this.request('/attendance', { method: 'GET' })
//   }
// }

// export const apiClient = new ApiClient(API_BASE_URL)


// API Client for connecting to NestJS backend
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'

// ─── Response shape from your NestJS backend ─────────────────────────────────
export interface BackendResponse<T> {
  statusCode: number
  success: boolean
  message: string
  meta: null | { total: number; page: number; limit: number }
  data: T
}

// ─── Mess types matching your Prisma schema ───────────────────────────────────
export interface MessCreator {
  id: string
  name: string
  email: string
}

export interface MessCount {
  memberships: number
  deposits: number
  meals: number
}

export interface Mess {
  id: string
  name: string
  description: string | null
  address: string | null
  meal_rate: string
  currency: string
  created_by: string
  is_active: boolean
  created_at: string
  creator?: MessCreator
  _count?: MessCount
}

export interface CreateMessDto {
  messName: string
  description?: string
  messLocation?: string
  meal_rate: string
  currency: string
}

export interface UpdateMessDto extends Partial<CreateMessDto> {
  is_active?: boolean
}

// ─── Generic API response wrapper ────────────────────────────────────────────
export interface ApiResponse<T> {
  data: T
  message?: string
  statusCode: number
}

// ─── Error class for API errors ───────────────────────────────────────────────
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

class ApiClient {
  private baseUrl: string

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<BackendResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`
    const token =
      typeof window !== 'undefined' ? localStorage.getItem('authToken') : null

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    }

    if (token) {
      ;(headers as Record<string, string>)['Authorization'] = `Bearer ${token}`
    }

    const response = await fetch(url, { ...options, headers })
    const json = await response.json()

    console.log(json)

    // Your backend returns { success, statusCode, message, data } on both success and error
    if (!response.ok || !json.success) {
      throw new ApiError(
        json.statusCode ?? response.status,
        json.message ?? response.statusText,
        json.errorSources
      )
    }

    return json as BackendResponse<T>
  }

  // ─── Auth ──────────────────────────────────────────────────────────────────
  async login(email: string, password: string) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
  }

  async register(email: string, password: string, name: string) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    })
  }

  // ─── Messes ────────────────────────────────────────────────────────────────

  //own messes
  async getMesses(): Promise<BackendResponse<Mess | Mess[]>> {
    return this.request<Mess | Mess[]>('/messes/my-mess', { method: 'GET' })
  }

  async getMess(id: string): Promise<BackendResponse<Mess>> {
    return this.request<Mess>(`/messes/${id}`, { method: 'GET' })
  }

  async createMess(data: CreateMessDto): Promise<BackendResponse<Mess>> {
    return this.request<Mess>('/messes', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateMess(id: string, data: UpdateMessDto): Promise<BackendResponse<Mess>> {
    return this.request<Mess>(`/messes/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  }

  async deleteMess(id: string): Promise<BackendResponse<null>> {
    return this.request<null>(`/messes/${id}`, { method: 'DELETE' })
  }

  // ─── Meals ─────────────────────────────────────────────────────────────────
  async getMeals() {
    return this.request('/meals', { method: 'GET' })
  }

  async createMeal(data: unknown) {
    return this.request('/meals', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  // ─── Users ─────────────────────────────────────────────────────────────────
  async getUsers() {
    return this.request('/users', { method: 'GET' })
  }

  // ─── Finance ───────────────────────────────────────────────────────────────
  async getFinance() {
    return this.request('/finance', { method: 'GET' })
  }

  // ─── Shopping ──────────────────────────────────────────────────────────────
  async getShopping() {
    return this.request('/shopping', { method: 'GET' })
  }

  // ─── Attendance ────────────────────────────────────────────────────────────
  async getAttendance() {
    return this.request('/attendance', { method: 'GET' })
  }

  // ─── Members ───────────────────────────────────────────────────────────────
  async getMembers(messId: string) {
    return this.request(`/messes/${messId}/members`, { method: 'GET' })
  }

  async addMember(messId: string, data: { email: string; role: 'MANAGER' | 'MEMBER' }) {
    return this.request(`/messes/${messId}/members`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateMemberRole(messId: string, memberId: string, role: 'MANAGER' | 'MEMBER') {
    return this.request(`/messes/${messId}/members/${memberId}`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    })
  }

  async removeMember(messId: string, memberId: string) {
    return this.request(`/messes/${messId}/members/${memberId}`, { method: 'DELETE' })
  }
}

export const apiClient = new ApiClient(API_BASE_URL)
