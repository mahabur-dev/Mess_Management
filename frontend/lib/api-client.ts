// API Client for connecting to NestJS backend
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'

export interface ApiResponse<T> {
  data: T
  message?: string
  statusCode: number
}

class ApiClient {
  private baseUrl: string

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`
    const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    }

    if (token) {
      headers.Authorization = `Bearer ${token}`
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`)
      }

      const data = await response.json()
      return {
        data: data.data || data,
        message: data.message,
        statusCode: response.status,
      }
    } catch (error) {
      console.error('[API Error]', error)
      throw error
    }
  }

  // Authentication
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

  // Meals
  async getMeals() {
    return this.request('/meals', { method: 'GET' })
  }

  async createMeal(data: any) {
    return this.request('/meals', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  // Messes
  async getMesses() {
    return this.request('/messes', { method: 'GET' })
  }

  async createMess(data: any) {
    return this.request('/messes', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  // Users
  async getUsers() {
    return this.request('/users', { method: 'GET' })
  }

  // Finance
  async getFinance() {
    return this.request('/finance', { method: 'GET' })
  }

  // Shopping
  async getShopping() {
    return this.request('/shopping', { method: 'GET' })
  }

  // Attendance
  async getAttendance() {
    return this.request('/attendance', { method: 'GET' })
  }
}

export const apiClient = new ApiClient(API_BASE_URL)
