'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Eye, EyeOff, LockKeyhole } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { apiClient } from '@/lib/api-client'

export default function ResetPassword() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [isSuccess, setIsSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage('')
    setIsSuccess(false)

    const email = sessionStorage.getItem('resetEmail')
    const otpVerified = sessionStorage.getItem('otpVerified')

    if (!email || otpVerified !== 'true') {
      setMessage('Please verify your OTP before resetting password.')
      return
    }

    if (password.length < 6) {
      setMessage('Password must be at least 6 characters long.')
      return
    }

    if (password !== confirmPassword) {
      setMessage('Passwords do not match.')
      return
    }

    setIsSubmitting(true)
    try {
      const result = await apiClient.resetPassword(email, password)

      setIsSuccess(true)
      setMessage(result.data?.message || result.message || 'Password reset successfully')
      sessionStorage.removeItem('resetEmail')
      sessionStorage.removeItem('otpVerified')

      window.setTimeout(() => {
        router.push('/login')
      }, 900)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Password reset failed')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 50%, #f0f9ff 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
    }}>
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        <div style={{
          position: 'absolute',
          top: '-80px',
          right: '-80px',
          width: '400px',
          height: '400px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(120,84,247,0.08) 0%, transparent 70%)',
        }} />
        <div style={{
          position: 'absolute',
          bottom: '-80px',
          left: '-80px',
          width: '400px',
          height: '400px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(168,141,250,0.06) 0%, transparent 70%)',
        }} />
      </div>

      <div className="reset-wrapper" style={{
        position: 'relative',
        zIndex: 1,
        display: 'flex',
        alignItems: 'stretch',
        width: '100%',
        maxWidth: '900px',
        borderRadius: '24px',
        boxShadow: '0 24px 60px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.04)',
        overflow: 'hidden',
        animation: 'slideUp 0.3s cubic-bezier(0.16,1,0.3,1)',
      }}>
        <div className="reset-card" style={{
          flex: '0 0 420px',
          background: '#fff',
          padding: '44px 36px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
        }}>
          <Link href="/verify_otp" style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            width: 'fit-content',
            color: '#6b7280',
            fontSize: '13px',
            fontWeight: 500,
            textDecoration: 'none',
            marginBottom: '26px',
          }}>
            <ArrowLeft size={14} />
            Back to OTP
          </Link>

          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '48px',
              height: '48px',
              borderRadius: '13px',
              background: 'linear-gradient(135deg, #7854f7, #10175e)',
              marginBottom: '16px',
              boxShadow: '0 4px 16px rgba(120,84,247,0.4)',
            }}>
              <LockKeyhole size={22} color="#fff" />
            </div>
            <h1 style={{ color: '#111827', fontSize: '24px', fontWeight: 700, marginBottom: '6px' }}>
              Reset Password
            </h1>
            <p style={{ color: '#6b7280', fontSize: '14px', lineHeight: 1.5 }}>
              Create a new password to secure your mess account.
            </p>
          </div>

          {message && (
            <div style={{
              background: isSuccess ? '#f0fdf4' : '#fef2f2',
              border: isSuccess ? '1px solid #bbf7d0' : '1px solid #fecaca',
              borderRadius: '10px',
              padding: '10px 14px',
              marginBottom: '20px',
            }}>
              <p style={{ color: isSuccess ? '#15803d' : '#dc2626', fontSize: '13px' }}>
                {message}
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '16px' }}>
              <label htmlFor="password" style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: 500,
                color: '#374151',
                marginBottom: '6px',
              }}>
                New Password
              </label>
              <div style={{ position: 'relative' }}>
                <Input
                  className="h-12 pr-11"
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter new password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#9ca3af',
                  display: 'flex',
                  alignItems: 'center',
                  padding: 0,
                }}>
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label htmlFor="confirmPassword" style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: 500,
                color: '#374151',
                marginBottom: '6px',
              }}>
                Confirm Password
              </label>
              <div style={{ position: 'relative' }}>
                <Input
                  className="h-12 pr-11"
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#9ca3af',
                  display: 'flex',
                  alignItems: 'center',
                  padding: 0,
                }}>
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                width: '100%',
                padding: '13px',
                background: isSubmitting ? '#c4b5fd' : 'linear-gradient(135deg, #7854f7, #534AB7)',
                border: 'none',
                borderRadius: '10px',
                color: '#fff',
                fontWeight: 700,
                fontSize: '15px',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 16px rgba(120,84,247,0.4)',
                transition: 'opacity 0.2s, transform 0.15s',
              }}
              onMouseEnter={(e) => { if (!isSubmitting) e.currentTarget.style.transform = 'translateY(-1px)' }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)' }}
            >
              {isSubmitting ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '24px 0' }}>
            <div style={{ flex: 1, height: '1px', background: '#f3f4f6' }} />
            <span style={{ color: '#9ca3af', fontSize: '13px' }}>or</span>
            <div style={{ flex: 1, height: '1px', background: '#f3f4f6' }} />
          </div>

          <p style={{ textAlign: 'center', color: '#6b7280', fontSize: '14px' }}>
            Remember your password?{' '}
            <Link href="/login" style={{ color: '#7854f7', fontWeight: 600, textDecoration: 'none' }}>
              Sign in
            </Link>
          </p>
        </div>

        <div className="reset-image-panel" style={{
          flex: 1,
          position: 'relative',
          minHeight: '560px',
          overflow: 'hidden',
        }}>
          <Image
            src="/Variety-fruits-vegetables(3).jpg"
            alt="Healthy food"
            width={100}
            height={100}
            className="h-full w-full object-cover"
          />
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(160deg, rgba(120,84,247,0.55) 0%, rgba(16,23,94,0.72) 100%)',
          }} />
          <div style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
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
                color: '#fff',
                fontSize: '18px',
                fontWeight: 700,
                marginBottom: '6px',
                lineHeight: 1.3,
              }}>
                Secure Your Mess Account
              </p>
              <p style={{
                color: 'rgba(255,255,255,0.8)',
                fontSize: '13px',
                lineHeight: 1.5,
              }}>
                Set a strong password and return to managing meals, members, and expenses.
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

        @media (max-width: 700px) {
          .reset-wrapper {
            flex-direction: column !important;
            max-width: 100% !important;
            border-radius: 20px !important;
          }
          .reset-card {
            flex: none !important;
            width: 100% !important;
            padding: 32px 24px !important;
            order: 2;
          }
          .reset-image-panel {
            flex: none !important;
            width: 100% !important;
            min-height: 200px !important;
            max-height: 220px !important;
            order: 1;
          }
        }

        @media (min-width: 701px) and (max-width: 900px) {
          .reset-card {
            flex: 0 0 340px !important;
            padding: 36px 28px !important;
          }
        }
      `}</style>
    </div>
  )
}
