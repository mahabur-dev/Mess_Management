'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { LockKeyhole, Mail } from 'lucide-react'
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
        <main className="flex flex-1 items-center py-6">
          <section className="w-full rounded-[32px] border border-white/70 bg-white/88 p-5 shadow-[0_24px_60px_rgba(8,73,86,0.14)] backdrop-blur">
            <div className="mb-6 text-center">
              <div className="mx-auto grid h-24 w-24 place-items-center rounded-[28px] bg-white shadow-[0_18px_35px_rgba(7,94,101,0.12)] ring-1 ring-[#dff3f3]">
                <Image src="/icon.svg" alt="Mess Management logo" width={88} height={88} className="h-20 w-20 object-contain" priority />
              </div>
              <h1 className="mt-5 text-3xl font-black leading-tight text-[#14324a]">Log in to your account</h1>
              <p className="mt-2 text-sm leading-6 text-[#667b8a]">
                Access your mess dashboard, members, meals, and expenses securely.
              </p>
            </div>

            <div className="space-y-4">
              <label className="block">
                <div className="mb-2 text-sm font-bold text-[#14324a]">Email address</div>
                <div className="relative">
                  {/* <span className="pointer-events-none absolute left-4 inset-y-0 flex items-center text-[#0b7f82]">
                    <Mail size={17} />
                  </span> */}
                  <input
                    className="field h-14 rounded-2xl bg-white pl-16 pr-4"
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
                  {/* <span className="pointer-events-none absolute left-4 inset-y-0 flex items-center text-[#0b7f82]">
                    <LockKeyhole size={17} />
                  </span> */}
                  <input
                    className="field h-14 rounded-2xl bg-white pl-16 pr-4"
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
