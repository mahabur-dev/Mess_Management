// 'use client'

// import { useState } from 'react'
// import Link from 'next/link'
// import { useRouter } from 'next/navigation'
// import { useAuth } from '@/app/context/auth-context'
// import { Button } from '@/components/ui/button'
// import { Input } from '@/components/ui/input'
// import { Card } from '@/components/ui/card'

// export default function RegisterPage() {
//   const router = useRouter()
//   const { register, isLoading } = useAuth()
//   const [formData, setFormData] = useState({
//     name: '',
//     email: '',
//     password: '',
//     confirmPassword: '',
//   })
//   const [error, setError] = useState('')

//   const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const { name, value } = e.target
//     setFormData((prev) => ({ ...prev, [name]: value }))
//   }

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault()
//     setError('')

//     if (formData.password !== formData.confirmPassword) {
//       setError('Passwords do not match')
//       return
//     }

//     try {
//       await register(formData.email, formData.password, formData.name)
//       router.push('/dashboard')
//     } catch (err) {
//       setError('Registration failed. Please try again.')
//     }
//   }

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/10 flex items-center justify-center px-4 py-12">
//       <Card className="w-full max-w-md bg-card border-border shadow-lg">
//         <div className="p-8">
//           {/* Header */}
//           <div className="text-center mb-8">
//             <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-accent mb-4">
//               <span className="text-accent-foreground font-bold text-xl">M</span>
//             </div>
//             <h1 className="text-2xl font-bold text-foreground">Create Account</h1>
//             <p className="text-muted-foreground mt-2">Join your mess management platform</p>
//           </div>

//           {/* Form */}
//           <form onSubmit={handleSubmit} className="space-y-4">
//             {error && (
//               <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg">
//                 <p className="text-sm text-destructive">{error}</p>
//               </div>
//             )}

//             <div className="space-y-2">
//               <label htmlFor="name" className="text-sm font-medium text-foreground">
//                 Full Name
//               </label>
//               <Input
//                 id="name"
//                 name="name"
//                 type="text"
//                 placeholder="John Doe"
//                 value={formData.name}
//                 onChange={handleChange}
//                 className="bg-input border-border text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-accent"
//                 required
//               />
//             </div>

//             <div className="space-y-2">
//               <label htmlFor="email" className="text-sm font-medium text-foreground">
//                 Email Address
//               </label>
//               <Input
//                 id="email"
//                 name="email"
//                 type="email"
//                 placeholder="you@example.com"
//                 value={formData.email}
//                 onChange={handleChange}
//                 className="bg-input border-border text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-accent"
//                 required
//               />
//             </div>

//             <div className="space-y-2">
//               <label htmlFor="password" className="text-sm font-medium text-foreground">
//                 Password
//               </label>
//               <Input
//                 id="password"
//                 name="password"
//                 type="password"
//                 placeholder="••••••••"
//                 value={formData.password}
//                 onChange={handleChange}
//                 className="bg-input border-border text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-accent"
//                 required
//               />
//             </div>

//             <div className="space-y-2">
//               <label htmlFor="confirmPassword" className="text-sm font-medium text-foreground">
//                 Confirm Password
//               </label>
//               <Input
//                 id="confirmPassword"
//                 name="confirmPassword"
//                 type="password"
//                 placeholder="••••••••"
//                 value={formData.confirmPassword}
//                 onChange={handleChange}
//                 className="bg-input border-border text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-accent"
//                 required
//               />
//             </div>

//             <Button
//               type="submit"
//               disabled={isLoading}
//               className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-semibold py-2 rounded-lg transition"
//             >
//               {isLoading ? 'Creating account...' : 'Create Account'}
//             </Button>
//           </form>

//           {/* Divider */}
//           <div className="my-6 flex items-center gap-3">
//             <div className="flex-1 h-px bg-border" />
//             <span className="text-sm text-muted-foreground">or</span>
//             <div className="flex-1 h-px bg-border" />
//           </div>

//           {/* Sign In Link */}
//           <p className="text-center text-sm text-muted-foreground">
//             Already have an account?{' '}
//             <Link href="/login" className="font-semibold text-primary hover:text-primary/90 transition">
//               Sign in
//             </Link>
//           </p>
//         </div>
//       </Card>

//       {/* Background decoration */}
//       <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
//         <div className="absolute top-0 right-0 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
//         <div className="absolute bottom-0 left-0 w-96 h-96 bg-secondary/5 rounded-full blur-3xl" />
//       </div>
//     </div>
//   )
// }


'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/app/context/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'

export default function RegisterPage() {
  const router = useRouter()
  const { register, isLoading } = useAuth()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [error, setError] = useState('')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    try {
      await register(formData.email, formData.password, formData.name)
      setTimeout(() => {
        router.push('/dashboard')
      }, 500)
    } catch (err) {
      setError('Registration failed. Please try again.')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/10 flex items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md bg-card border-border shadow-lg">
        <div className="p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-accent mb-4">
              <span className="text-accent-foreground font-bold text-xl">M</span>
            </div>
            <h1 className="text-2xl font-bold text-foreground">Create Account</h1>
            <p className="text-muted-foreground mt-2">Join your mess management platform</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium text-foreground">
                Full Name
              </label>
              <Input
                id="name"
                name="name"
                type="text"
                placeholder="John Doe"
                value={formData.name}
                onChange={handleChange}
                className="bg-input border-border text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-accent"
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-foreground">
                Email Address
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={handleChange}
                className="bg-input border-border text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-accent"
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-foreground">
                Password
              </label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                className="bg-input border-border text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-accent"
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="text-sm font-medium text-foreground">
                Confirm Password
              </label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="bg-input border-border text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-accent"
                required
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-semibold py-2 rounded-lg transition"
            >
              {isLoading ? 'Creating account...' : 'Create Account'}
            </Button>
          </form>

          {/* Demo Info */}
          <div className="mt-6 p-3 bg-accent/10 border border-accent/30 rounded-lg">
            <p className="text-xs text-muted-foreground text-center">
              <span className="font-semibold text-accent">Demo Mode:</span> Fill in any details to create account
            </p>
          </div>

          {/* Divider */}
          <div className="my-6 flex items-center gap-3">
            <div className="flex-1 h-px bg-border" />
            <span className="text-sm text-muted-foreground">or</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* Sign In Link */}
          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link href="/login" className="font-semibold text-primary hover:text-primary/90 transition">
              Sign in
            </Link>
          </p>
        </div>
      </Card>

      {/* Background decoration */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-secondary/5 rounded-full blur-3xl" />
      </div>
    </div>
  )
}
