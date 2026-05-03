import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { email, password, name } = await request.json()

    // TODO: Replace with actual NestJS backend call
    // const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/register`, {
    //   method: 'POST',
    //   body: JSON.stringify({ email, password, name })
    // })

    // Mock user data - Remove after connecting to NestJS backend
    const mockUser = {
      id: Math.random().toString(36).substr(2, 9),
      email,
      name,
      role: 'user',
      avatar: null,
    }

    const token = 'mock_jwt_token_' + Date.now()

    return NextResponse.json(
      {
        data: mockUser,
        token,
        message: 'Registration successful',
      },
      { status: 201 }
    )
  } catch (error) {
    return NextResponse.json(
      { message: 'Registration failed', error },
      { status: 400 }
    )
  }
}
