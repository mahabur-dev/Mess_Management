'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { LockKeyhole, Mail, ShieldCheck, Sparkles } from 'lucide-react'
import { useAuth } from '../providers'

export default function LoginPage() {
  const { login, isLoading, user } = useAuth()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!isLoading && user) router.replace('/')
  }, [isLoading, user, router])

  async function handleSubmit() {
    setError('')
    setBusy(true)
    try {
      await login(email, password)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="min-h-screen px-4 py-6">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-md flex-col">
        {/* <header className="flex items-center justify-between rounded-[28px] border border-white/70 bg-white/75 px-4 py-3 shadow-[0_18px_45px_rgba(8,73,86,0.10)] backdrop-blur"> */}
          {/* <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-[#fc782d] to-[#d95f10] text-white shadow-[0_12px_26px_rgba(252,120,45,0.24)]">
              <ShieldCheck size={20} />
            </div> */}
            {/* <div>
              <div className="text-[12px] font-black uppercase tracking-[0.18em] text-[#58717d]">Mess Management</div>
              <div className="text-sm font-bold text-[#14324a]">Secure access portal</div>
            </div> */}
          {/* </div> */}
          {/* <div className="grid h-10 w-10 place-items-center rounded-full bg-[#fff1e6] text-[#fc782d]">
            <Sparkles size={18} />
          </div>
        </header> */}

        <main className="flex flex-1 items-center py-6">
          <section className="w-full rounded-[32px] border border-white/70 bg-white/88 p-5 shadow-[0_24px_60px_rgba(8,73,86,0.14)] backdrop-blur">
            <div className="mb-6">
              {/* <div className="inline-flex items-center gap-2 rounded-full bg-[#fff1e6] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-[#fc782d]">
                <Sparkles size={13} />
                Manager Login
              </div> */}
              <h1 className="mt-4 text-3xl font-black leading-tight text-[#14324a]">Welcome back</h1>
              {/* <p className="mt-2 text-sm leading-6 text-[#667b8a]">
                Sign in to manage members, meals, expenses, payments and complaints from one place.
              </p> */}
            </div>

            <div className="space-y-4">
              <label className="block">
                <div className="mb-2 text-sm font-bold text-[#14324a]">Email address</div>
                <div className="relative">
                  {/* <Mail className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#fc782d]" size={18} /> */}
                  <input
                    className="field h-14 rounded-2xl bg-white pl-12 pr-4"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    type="email"
                    placeholder="manager@example.com"
                    autoComplete="email"
                  />
                </div>
              </label>

              <label className="block">
                <div className="mb-2 text-sm font-bold text-[#14324a]">Password</div>
                <div className="relative">
                  {/* <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#fc782d]" size={18} /> */}
                  <input
                    className="field h-14 rounded-2xl bg-white pl-12 pr-4"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    type="password"
                    placeholder="Enter your password"
                    autoComplete="current-password"
                  />
                </div>
              </label>

              {error ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                  {error}
                </div>
              ) : null}

              <button
                className="primary-btn flex h-14 w-full items-center justify-center gap-2 rounded-2xl"
                onClick={handleSubmit}
                type="button"
                disabled={busy}
              >
                {busy ? 'Signing in...' : 'Sign In'}
              </button>
            </div>
          </section>
        </main>
      </div>
    </div>
  )
}
