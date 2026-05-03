import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    // TODO: Replace with actual NestJS backend call
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
      method: 'POST',
      body: JSON.stringify({ email, password })
    })
    if (!response.ok) {
      throw new Error('Login failed')
    }

    const result = await response.json()
    // Mock user data - Remove after connecting to NestJS backend
    // const mockUser = {
    //   id: '1',
    //   email,
    //   name: 'John Doe',
    //   role: 'user',
    //   avatar: null,
    // }

    // const token = 'mock_jwt_token_' + Date.now()

    return NextResponse.json(
      {
        data: response.ok ? await response.json() : null,
        token: response.ok ? await response.json() : null,
        message: 'Login successful',
      },
      { status: 200 }
    )
  } catch (error) {
    return NextResponse.json(
      { message: 'Login failed', error },
      { status: 400 }
    )
  }
}
