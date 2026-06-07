import { NextRequest, NextResponse } from 'next/server'

const backendApiUrl = process.env.API_URL || 'http://localhost:5001/api/v1'

export async function POST(request: NextRequest) {
  const body = await request.json()
  const response = await fetch(`${backendApiUrl}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...body, role: 'MEMBER' }),
  })
  const data = await response.json()
  return NextResponse.json(data, { status: response.status })
}
