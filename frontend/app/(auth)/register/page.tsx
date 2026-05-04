'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/app/context/auth-context'
import { ArrowLeft, Building2, User, X, ChevronRight, Eye, EyeOff } from 'lucide-react'

type Step = 'choose' | 'mess' | 'member'

function InputField({
  label, id, name, type = 'text', placeholder, value, onChange,
}: {
  label: string; id: string; name: string; type?: string
  placeholder: string; value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
}) {
  const [show, setShow] = useState(false)
  const [focused, setFocused] = useState(false)
  const isPassword = type === 'password'

  return (
    <div style={{ marginBottom: '16px' }}>
      <label htmlFor={id} style={{
        display: 'block', fontSize: '14px', fontWeight: 500,
        color: '#374151', marginBottom: '6px',
      }}>
        {label}
      </label>
      <div style={{ position: 'relative' }}>
        <input
          id={id} name={name}
          type={isPassword ? (show ? 'text' : 'password') : type}
          placeholder={placeholder} value={value} onChange={onChange} required
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          style={{
            width: '100%',
            padding: isPassword ? '11px 42px 11px 14px' : '11px 14px',
            background: '#fff',
            border: focused ? '1.5px solid #7854f7' : '1.5px solid #e5e7eb',
            borderRadius: '10px', color: '#111827', fontSize: '14px',
            outline: 'none', boxSizing: 'border-box', transition: 'all 0.2s',
            boxShadow: focused ? '0 0 0 3px rgba(120,84,247,0.1)' : '0 1px 2px rgba(0,0,0,0.05)',
          }}
        />
        {isPassword && (
          <button type="button" onClick={() => setShow(!show)} style={{
            position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
            background: 'none', border: 'none', cursor: 'pointer',
            color: '#9ca3af', display: 'flex', alignItems: 'center', padding: 0,
          }}>
            {show ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Popup Modal ────────────────────────────────────────────────────────────
export function RegisterModal({
  open, onClose,
}: { open: boolean; onClose: () => void }) {
  const { register, isLoading } = useAuth()
  const [step, setStep] = useState<Step>('choose')
  const [error, setError] = useState('')
  const router = useRouter()  

  const [messForm, setMessForm] = useState({ name: '', email: '', phone: '', password: '', confirmPassword: '' })
  const [memberForm, setMemberForm] = useState({ name: '', email: '', phone: '', password: '', confirmPassword: '' })

  const handleMessChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target; setMessForm(p => ({ ...p, [name]: value }))
  }
  const handleMemberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target; setMemberForm(p => ({ ...p, [name]: value }))
  }

  const handleMessSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError('')
    if (messForm.password !== messForm.confirmPassword) return setError('Passwords do not match')
    try { await register(messForm.name, messForm.email, messForm.phone, messForm.password, "ORGANIZER"); router.push('/login') }
    catch { setError('Registration failed. Please try again.') }
  }

  const handleMemberSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError('')
    if (memberForm.password !== memberForm.confirmPassword) return setError('Passwords do not match')
    try { await register(memberForm.name, memberForm.email, memberForm.phone, memberForm.password, "MEMBER"); router.push('/login') }
    catch { setError('Registration failed. Please try again.') }
  }

  const close = () => { 
    onClose()
    setStep('choose')
    setError('')
    router.push('/')  // ✅ redirect to home
  }
  const goBack = () => { setStep('choose'); setError('') }

  if (!open) return null

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) close() }}
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        // background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(6px)',
        background: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 50%, #f0f9ff 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '24px', animation: 'fadeIn 0.2s ease',
      }}
    >
      <div style={{
        width: '100%', maxWidth: '420px', maxHeight: '92vh', overflowY: 'auto',
        background: '#fff', borderRadius: '20px', padding: '32px',
        boxShadow: '0 24px 60px rgba(0,0,0,0.18)',
        animation: 'slideUp 0.25s cubic-bezier(0.16,1,0.3,1)',
        position: 'relative',
      }}>
        {/* Close */}
        <button onClick={close} style={{
          position: 'absolute', top: '16px', right: '16px',
          background: '#f3f4f6', border: 'none', borderRadius: '8px',
          width: '30px', height: '30px', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', color: '#6b7280', transition: 'background 0.15s',
        }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#e5e7eb'}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = '#f3f4f6'}
        >
          <X size={15} />
        </button>

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
          <div style={{
            width: '38px', height: '38px', borderRadius: '10px',
            background: 'linear-gradient(135deg, #7854f7, #10175e)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ color: '#fff', fontWeight: 800, fontSize: '20px' }}>M</span>
          </div>
          <span style={{ color: '#111827', fontWeight: 700, fontSize: '16px' }}>Mess Management</span>
        </div>

        {/* CHOOSE */}
        {step === 'choose' && (
          <div>
            <h2 style={{ color: '#111827', fontSize: '22px', fontWeight: 700, marginBottom: '6px' }}>Create your account</h2>
            <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '24px' }}>
              Choose how you want to join the platform
            </p>

            {/* Register Mess */}
            <button onClick={() => setStep('mess')} style={{
              width: '100%', background: '#fafafa',
              border: '1.5px solid #e5e7eb', borderRadius: '14px',
              padding: '16px 18px', cursor: 'pointer', textAlign: 'left',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              marginBottom: '10px', transition: 'all 0.2s',
            }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.border = '1.5px solid #7854f7'
                ;(e.currentTarget as HTMLElement).style.background = '#f9f7ff'
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.border = '1.5px solid #e5e7eb'
                ;(e.currentTarget as HTMLElement).style.background = '#fafafa'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{
                  width: '46px', height: '46px', borderRadius: '12px', flexShrink: 0,
                  background: 'linear-gradient(135deg, #7854f7, #534AB7)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(120,84,247,0.35)',
                }}>
                  <Building2 size={21} color="#fff" />
                </div>
                <div>
                  <p style={{ color: '#111827', fontWeight: 700, fontSize: '15px', marginBottom: '2px' }}>Register a Mess</p>
                  <p style={{ color: '#6b7280', fontSize: '12px' }}>Create & manage your own mess community</p>
                </div>
              </div>
              <ChevronRight size={17} color="#9ca3af" style={{ flexShrink: 0 }} />
            </button>

            {/* Register Member */}
            <button onClick={() => setStep('member')} style={{
              width: '100%', background: '#fafafa',
              border: '1.5px solid #e5e7eb', borderRadius: '14px',
              padding: '16px 18px', cursor: 'pointer', textAlign: 'left',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              marginBottom: '24px', transition: 'all 0.2s',
            }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.border = '1.5px solid #7854f7'
                ;(e.currentTarget as HTMLElement).style.background = '#f9f7ff'
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.border = '1.5px solid #e5e7eb'
                ;(e.currentTarget as HTMLElement).style.background = '#fafafa'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{
                  width: '46px', height: '46px', borderRadius: '12px', flexShrink: 0,
                  background: 'linear-gradient(135deg, #a88dfa, #7854f7)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(168,141,250,0.35)',
                }}>
                  <User size={21} color="#fff" />
                </div>
                <div>
                  <p style={{ color: '#111827', fontWeight: 700, fontSize: '15px', marginBottom: '2px' }}>Register as Member</p>
                  <p style={{ color: '#6b7280', fontSize: '12px' }}>Join an existing mess community</p>
                </div>
              </div>
              <ChevronRight size={17} color="#9ca3af" style={{ flexShrink: 0 }} />
            </button>

            <div style={{ textAlign: 'center', borderTop: '1px solid #f3f4f6', paddingTop: '20px' }}>
              <p style={{ color: '#6b7280', fontSize: '14px' }}>
                Already have an account?{' '}
                <Link href="/login" style={{ color: '#7854f7', fontWeight: 600, textDecoration: 'none' }}>Sign in</Link>
              </p>
            </div>
          </div>
        )}

        {/* MESS FORM */}
        {step === 'mess' && (
          <div>
            <button onClick={goBack} style={{
              display: 'flex', alignItems: 'center', gap: '5px',
              color: '#6b7280', background: 'none', border: 'none',
              cursor: 'pointer', marginBottom: '20px', fontSize: '13px', padding: 0,
            }}>
              <ArrowLeft size={13} /> Back
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '22px' }}>
              <div style={{
                width: '42px', height: '42px', borderRadius: '11px', flexShrink: 0,
                background: 'linear-gradient(135deg, #7854f7, #534AB7)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(120,84,247,0.35)',
              }}>
                <Building2 size={20} color="#fff" />
              </div>
              <div>
                <h2 style={{ color: '#111827', fontSize: '19px', fontWeight: 700, marginBottom: '2px' }}>Register a Mess</h2>
                <p style={{ color: '#6b7280', fontSize: '12px' }}>Set up your mess management account</p>
              </div>
            </div>

            {error && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', padding: '10px 14px', marginBottom: '16px' }}>
                <p style={{ color: '#dc2626', fontSize: '13px' }}>{error}</p>
              </div>
            )}

            <form onSubmit={handleMessSubmit}>
              <InputField label="Mess Name" id="name" name="name" placeholder="John Doe" value={messForm.name} onChange={handleMessChange} />
              {/* <InputField label="Mess Name" id="messName" name="messName" placeholder="My Mess House" value={messForm.messName} onChange={handleMessChange} /> */}
              <InputField label="Email Address" id="email" name="email" type="email" placeholder="you@example.com" value={messForm.email} onChange={handleMessChange} />
              <InputField label="Phone Number" id="phone" name="phone" type="tel" placeholder="01700-000000" value={messForm.phone} onChange={handleMessChange} />
              <InputField label="Password" id="password" name="password" type="password" placeholder="••••••••" value={messForm.password} onChange={handleMessChange} />
              <InputField label="Confirm Password" id="confirmPassword" name="confirmPassword" type="password" placeholder="••••••••" value={messForm.confirmPassword} onChange={handleMessChange} />

              <button type="submit" disabled={isLoading} style={{
                width: '100%', padding: '12px',
                background: isLoading ? '#c4b5fd' : 'linear-gradient(135deg, #7854f7, #534AB7)',
                border: 'none', borderRadius: '10px', color: '#fff',
                fontWeight: 700, fontSize: '15px',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 16px rgba(120,84,247,0.4)', transition: 'opacity 0.2s',
              }}>
                {isLoading ? 'Creating...' : 'Create Mess Account'}
              </button>
            </form>

            <p style={{ textAlign: 'center', color: '#6b7280', fontSize: '13px', marginTop: '16px' }}>
              Already have an account?{' '}
              <Link href="/login" style={{ color: '#7854f7', fontWeight: 600, textDecoration: 'none' }}>Sign in</Link>
            </p>
          </div>
        )}

        {/* MEMBER FORM */}
        {step === 'member' && (
          <div>
            <button onClick={goBack} style={{
              display: 'flex', alignItems: 'center', gap: '5px',
              color: '#6b7280', background: 'none', border: 'none',
              cursor: 'pointer', marginBottom: '20px', fontSize: '13px', padding: 0,
            }}>
              <ArrowLeft size={13} /> Back
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '22px' }}>
              <div style={{
                width: '42px', height: '42px', borderRadius: '11px', flexShrink: 0,
                background: 'linear-gradient(135deg, #a88dfa, #7854f7)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(168,141,250,0.35)',
              }}>
                <User size={20} color="#fff" />
              </div>
              <div>
                <h2 style={{ color: '#111827', fontSize: '19px', fontWeight: 700, marginBottom: '2px' }}>Register as Member</h2>
                <p style={{ color: '#6b7280', fontSize: '12px' }}>Join an existing mess community</p>
              </div>
            </div>

            {error && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', padding: '10px 14px', marginBottom: '16px' }}>
                <p style={{ color: '#dc2626', fontSize: '13px' }}>{error}</p>
              </div>
            )}

            <form onSubmit={handleMemberSubmit}>
              <InputField label="Full Name" id="mname" name="name" placeholder="John Doe" value={memberForm.name} onChange={handleMemberChange} />
              <InputField label="Email Address" id="memail" name="email" type="email" placeholder="you@example.com" value={memberForm.email} onChange={handleMemberChange} />
              <InputField label="Phone Number" id="mphone" name="phone" type="tel" placeholder="01700-000000" value={memberForm.phone} onChange={handleMemberChange} />
              <InputField label="Password" id="mpassword" name="password" type="password" placeholder="••••••••" value={memberForm.password} onChange={handleMemberChange} />
              <InputField label="Confirm Password" id="mconfirm" name="confirmPassword" type="password" placeholder="••••••••" value={memberForm.confirmPassword} onChange={handleMemberChange} />

              <button type="submit" disabled={isLoading} style={{
                width: '100%', padding: '12px',
                background: isLoading ? '#c4b5fd' : 'linear-gradient(135deg, #a88dfa, #7854f7)',
                border: 'none', borderRadius: '10px', color: '#fff',
                fontWeight: 700, fontSize: '15px',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 16px rgba(168,141,250,0.4)', transition: 'opacity 0.2s',
              }}>
                {isLoading ? 'Creating...' : 'Create Member Account'}
              </button>
            </form>

            <p style={{ textAlign: 'center', color: '#6b7280', fontSize: '13px', marginTop: '16px' }}>
              Already have an account?{' '}
              <Link href="/login" style={{ color: '#7854f7', fontWeight: 600, textDecoration: 'none' }}>Sign in</Link>
            </p>
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(24px) scale(0.97) }
          to { opacity: 1; transform: translateY(0) scale(1) }
        }
        input::placeholder { color: #9ca3af !important; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: rgba(120,84,247,0.25); border-radius: 4px; }
      `}</style>
    </div>
  )
}

// ─── Register Page (just opens modal immediately) ────────────────────────────
export default function RegisterPage() {
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true); setOpen(true) }, [])

  if (!mounted) return null

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 50%, #f0f9ff 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <RegisterModal open={open} onClose={() => setOpen(false)} />
    </div>
  )
}