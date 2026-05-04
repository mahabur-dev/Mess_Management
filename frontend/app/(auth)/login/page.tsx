'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/app/context/auth-context'
import { Eye, EyeOff } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const { login, isLoading } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [focusedField, setFocusedField] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      await login(email, password)
      router.push('/dashboard')
    } catch {
      setError('Invalid email or password')
    }
  }

  const inputStyle = (field: string) => ({
    width: '100%',
    padding: field === 'password' ? '11px 42px 11px 14px' : '11px 14px',
    background: '#fff',
    border: focusedField === field ? '1.5px solid #7854f7' : '1.5px solid #e5e7eb',
    borderRadius: '10px',
    color: '#111827',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box' as const,
    transition: 'all 0.2s',
    boxShadow: focusedField === field ? '0 0 0 3px rgba(120,84,247,0.1)' : '0 1px 2px rgba(0,0,0,0.05)',
  })

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 50%, #f0f9ff 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px',
    }}>
      {/* Background blobs */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        <div style={{
          position: 'absolute', top: '-80px', right: '-80px',
          width: '400px', height: '400px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(120,84,247,0.08) 0%, transparent 70%)',
        }} />
        <div style={{
          position: 'absolute', bottom: '-80px', left: '-80px',
          width: '400px', height: '400px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(168,141,250,0.06) 0%, transparent 70%)',
        }} />
      </div>

      {/* Card */}
      <div style={{
        position: 'relative', zIndex: 1,
        width: '100%', maxWidth: '420px',
        background: '#fff', borderRadius: '20px', padding: '36px 32px',
        boxShadow: '0 24px 60px rgba(0,0,0,0.1), 0 0 0 1px rgba(0,0,0,0.04)',
        animation: 'slideUp 0.25s cubic-bezier(0.16,1,0.3,1)',
      }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: '48px', height: '48px', borderRadius: '13px',
            background: 'linear-gradient(135deg, #7854f7, #10175e)',
            marginBottom: '16px',
            boxShadow: '0 4px 16px rgba(120,84,247,0.4)',
          }}>
            <span style={{ color: '#fff', fontWeight: 800, fontSize: '22px' }}>M</span>
          </div>
          <h1 style={{ color: '#111827', fontSize: '24px', fontWeight: 700, marginBottom: '6px' }}>
            Welcome Back
          </h1>
          <p style={{ color: '#6b7280', fontSize: '14px' }}>
            Sign in to your mess account
          </p>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            background: '#fef2f2', border: '1px solid #fecaca',
            borderRadius: '10px', padding: '10px 14px', marginBottom: '20px',
          }}>
            <p style={{ color: '#dc2626', fontSize: '13px' }}>{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {/* Email */}
          <div style={{ marginBottom: '16px' }}>
            <label htmlFor="email" style={{
              display: 'block', fontSize: '14px', fontWeight: 500,
              color: '#374151', marginBottom: '6px',
            }}>
              Email Address
            </label>
            <input
              id="email" type="email" placeholder="you@example.com"
              value={email} onChange={e => setEmail(e.target.value)} required
              onFocus={() => setFocusedField('email')}
              onBlur={() => setFocusedField(null)}
              style={inputStyle('email')}
            />
          </div>

          {/* Password */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label htmlFor="password" style={{ fontSize: '14px', fontWeight: 500, color: '#374151' }}>
                Password
              </label>
              <Link href="/forgot-password" style={{ fontSize: '13px', color: '#7854f7', textDecoration: 'none', fontWeight: 500 }}>
                Forgot password?
              </Link>
            </div>
            <div style={{ position: 'relative' }}>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password} onChange={e => setPassword(e.target.value)} required
                onFocus={() => setFocusedField('password')}
                onBlur={() => setFocusedField(null)}
                style={inputStyle('password')}
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} style={{
                position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer',
                color: '#9ca3af', display: 'flex', alignItems: 'center', padding: 0,
              }}>
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit" disabled={isLoading}
            style={{
              width: '100%', padding: '13px',
              background: isLoading ? '#c4b5fd' : 'linear-gradient(135deg, #7854f7, #534AB7)',
              border: 'none', borderRadius: '10px', color: '#fff',
              fontWeight: 700, fontSize: '15px',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 16px rgba(120,84,247,0.4)',
              transition: 'opacity 0.2s, transform 0.15s',
            }}
            onMouseEnter={e => { if (!isLoading) (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)' }}
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '24px 0' }}>
          <div style={{ flex: 1, height: '1px', background: '#f3f4f6' }} />
          <span style={{ color: '#9ca3af', fontSize: '13px' }}>or</span>
          <div style={{ flex: 1, height: '1px', background: '#f3f4f6' }} />
        </div>

        {/* Sign up */}
        <p style={{ textAlign: 'center', color: '#6b7280', fontSize: '14px' }}>
          Don&apos;t have an account?{' '}
          <Link href="/register" style={{ color: '#7854f7', fontWeight: 600, textDecoration: 'none' }}>
            Sign up
          </Link>
        </p>
      </div>

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px) scale(0.98) }
          to   { opacity: 1; transform: translateY(0)    scale(1)    }
        }
        input::placeholder { color: #9ca3af !important; }
      `}</style>
    </div>
  )
}