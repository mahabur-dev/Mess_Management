"use client"

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

      {/* Two-column wrapper */}
      <div className="login-wrapper" style={{
        position: 'relative', zIndex: 1,
        display: 'flex', alignItems: 'stretch',
        width: '100%', maxWidth: '900px',
        borderRadius: '24px',
        boxShadow: '0 24px 60px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.04)',
        overflow: 'hidden',
        animation: 'slideUp 0.3s cubic-bezier(0.16,1,0.3,1)',
      }}>

        {/* LEFT — Login Card */}
        <div className="login-card" style={{
          flex: '0 0 420px',
          background: '#fff',
          padding: '44px 36px',
          display: 'flex', flexDirection: 'column', justifyContent: 'center',
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

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '24px 0' }}>
            <div style={{ flex: 1, height: '1px', background: '#f3f4f6' }} />
            <span style={{ color: '#9ca3af', fontSize: '13px' }}>or</span>
            <div style={{ flex: 1, height: '1px', background: '#f3f4f6' }} />
          </div>

          <p style={{ textAlign: 'center', color: '#6b7280', fontSize: '14px' }}>
            Don&apos;t have an account?{' '}
            <Link href="/register" style={{ color: '#7854f7', fontWeight: 600, textDecoration: 'none' }}>
              Sign up
            </Link>
          </p>
        </div>

        {/* RIGHT — Image Panel */}
        <div className="image-panel" style={{
          flex: 1,
          position: 'relative',
          minHeight: '560px',
          overflow: 'hidden',
        }}>
          {/* Photo */}
          <img
            src='/Variety-fruits-vegetables(3).jpg'
            alt="Healthy food"
            style={{
              width: '100%', height: '100%',
              objectFit: 'cover',
              objectPosition: 'center',
              display: 'block',
            }}
          />
          {/* Gradient overlay matching brand colors */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(160deg, rgba(120,84,247,0.55) 0%, rgba(16,23,94,0.72) 100%)',
          }} />
          {/* Text overlay */}
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', flexDirection: 'column',
            justifyContent: 'flex-end',
            padding: '36px',
          }}>
            <div style={{
              background: 'rgba(255,255,255,0.1)',
              backdropFilter: 'blur(12px)',
              borderRadius: '16px',
              border: '1px solid rgba(255,255,255,0.2)',
              padding: '20px 24px',
            }}>
              <p style={{
                color: '#fff', fontSize: '18px', fontWeight: 700,
                marginBottom: '6px', lineHeight: 1.3,
              }}>
                Fresh &amp; Healthy Meals
              </p>
              <p style={{
                color: 'rgba(255,255,255,0.8)', fontSize: '13px', lineHeight: 1.5,
              }}>
                Manage your mess, track meals, and enjoy nutritious food every day.
              </p>
            </div>
          </div>
        </div>

      </div>

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(24px) scale(0.97) }
          to { opacity: 1; transform: translateY(0) scale(1) }
        }
        input::placeholder { color: #9ca3af !important; }

        /* ── Responsive ── */
        @media (max-width: 700px) {
          .login-wrapper {
            flex-direction: column !important;
            max-width: 100% !important;
            border-radius: 20px !important;
          }
          .login-card {
            flex: none !important;
            width: 100% !important;
            padding: 32px 24px !important;
            order: 2;
          }
          .image-panel {
            flex: none !important;
            width: 100% !important;
            min-height: 200px !important;
            max-height: 220px !important;
            order: 1;
          }
        }

        @media (min-width: 701px) and (max-width: 900px) {
          .login-card {
            flex: 0 0 340px !important;
            padding: 36px 28px !important;
          }
        }
      `}</style>
    </div>
  )
}