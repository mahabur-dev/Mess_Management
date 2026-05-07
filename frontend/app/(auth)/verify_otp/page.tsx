'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, RotateCcw, ShieldCheck } from 'lucide-react'
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from '@/components/ui/input-otp'

export default function VerifyOtp() {
  const router = useRouter()
  const [otp, setOtp] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [message, setMessage] = useState('')
  const [isSuccess, setIsSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage('')
    setIsSuccess(false)

    if (otp.length < 6) {
      setMessage('Please enter the 6-digit verification code.')
      return
    }

    const email = sessionStorage.getItem('resetEmail')
    if (!email) {
      setMessage('Please request an OTP with your email first.')
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
      })
      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'OTP verification failed')
      }

      const successMessage = result.data?.message || result.message || 'OTP verified successfully'
      setIsSuccess(true)
      setMessage(successMessage)
      sessionStorage.setItem('otpVerified', 'true')

      window.setTimeout(() => {
        router.push('/reset_password')
      }, 800)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'OTP verification failed')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleResendOtp = async () => {
    const email = sessionStorage.getItem('resetEmail')
    setMessage('')
    setIsSuccess(false)

    if (!email) {
      setMessage('Please request an OTP with your email first.')
      return
    }

    setIsResending(true)
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Failed to resend OTP')
      }

      setOtp('')
      setIsSuccess(true)
      setMessage(result.data?.message || result.message || 'A new OTP has been sent to your email.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to resend OTP')
    } finally {
      setIsResending(false)
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

      <div className="otp-wrapper" style={{
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
        <div className="otp-card" style={{
          flex: '0 0 420px',
          background: '#fff',
          padding: '44px 36px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
        }}>
          <Link href="/forget_password" style={{
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
            Back to email
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
              <ShieldCheck size={23} color="#fff" />
            </div>
            <h1 style={{ color: '#111827', fontSize: '24px', fontWeight: 700, marginBottom: '6px' }}>
              Verify OTP
            </h1>
            <p style={{ color: '#6b7280', fontSize: '14px', lineHeight: 1.5 }}>
              Enter the 6-digit code sent to your email address.
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
              <p style={{
                color: isSuccess ? '#15803d' : '#dc2626',
                fontSize: '13px',
              }}>
                {message}
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '24px' }}>
              <label htmlFor="otp" style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: 500,
                color: '#374151',
                marginBottom: '10px',
              }}>
                Verification Code
              </label>
              <InputOTP
                id="otp"
                maxLength={6}
                value={otp}
                onChange={setOtp}
                containerClassName="justify-center gap-2"
              >
                <InputOTPGroup className="gap-2">
                  {[0, 1, 2, 3, 4, 5].map((index) => (
                    <InputOTPSlot
                      key={index}
                      index={index}
                      className="h-12 w-12 rounded-[10px] border border-[#e5e7eb] bg-white text-base font-semibold text-[#111827] shadow-xs data-[active=true]:border-[#7854f7] data-[active=true]:ring-[#7854f7]/20"
                    />
                  ))}
                </InputOTPGroup>
              </InputOTP>
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
              {isSubmitting ? 'Verifying...' : 'Verify Code'}
            </button>
          </form>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '24px 0' }}>
            <div style={{ flex: 1, height: '1px', background: '#f3f4f6' }} />
            <span style={{ color: '#9ca3af', fontSize: '13px' }}>or</span>
            <div style={{ flex: 1, height: '1px', background: '#f3f4f6' }} />
          </div>

          <button
            type="button"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '7px',
              width: '100%',
              background: '#fafafa',
              border: '1.5px solid #e5e7eb',
              borderRadius: '10px',
              color: '#7854f7',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 700,
              padding: '12px',
              transition: 'background 0.15s, border 0.15s',
            }}
            onClick={() => {
              void handleResendOtp()
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#f9f7ff'
              e.currentTarget.style.border = '1.5px solid #7854f7'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#fafafa'
              e.currentTarget.style.border = '1.5px solid #e5e7eb'
            }}
          >
            <RotateCcw size={15} />
            {isResending ? 'Resending...' : 'Resend OTP'}
          </button>

          <p style={{ textAlign: 'center', color: '#6b7280', fontSize: '14px', marginTop: '18px' }}>
            Remember your password?{' '}
            <Link href="/login" style={{ color: '#7854f7', fontWeight: 600, textDecoration: 'none' }}>
              Sign in
            </Link>
          </p>
        </div>

        <div className="otp-image-panel" style={{
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
                Secure Account Access
              </p>
              <p style={{
                color: 'rgba(255,255,255,0.8)',
                fontSize: '13px',
                lineHeight: 1.5,
              }}>
                Confirm your identity and get back to managing your mess with confidence.
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

        @media (max-width: 700px) {
          .otp-wrapper {
            flex-direction: column !important;
            max-width: 100% !important;
            border-radius: 20px !important;
          }
          .otp-card {
            flex: none !important;
            width: 100% !important;
            padding: 32px 24px !important;
            order: 2;
          }
          .otp-image-panel {
            flex: none !important;
            width: 100% !important;
            min-height: 200px !important;
            max-height: 220px !important;
            order: 1;
          }
        }

        @media (max-width: 420px) {
          [data-slot="input-otp-group"] {
            gap: 6px !important;
          }
          [data-slot="input-otp-slot"] {
            width: 42px !important;
            height: 46px !important;
          }
        }

        @media (min-width: 701px) and (max-width: 900px) {
          .otp-card {
            flex: 0 0 340px !important;
            padding: 36px 28px !important;
          }
          [data-slot="input-otp-slot"] {
            width: 44px !important;
          }
        }
      `}</style>
    </div>
  )
}
