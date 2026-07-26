'use client'

import Image from 'next/image'
import Link from 'next/link'
import type {
  ComponentType,
  InputHTMLAttributes,
  ReactNode,
} from 'react'
import {
  ArrowRight,
  Eye,
  EyeOff,
  LockKeyhole,
  ShieldCheck,
  type LucideProps,
} from 'lucide-react'
import { IconInput } from '@/components/mobile/icon-input'

type IconType = ComponentType<LucideProps>

export const authLinkClass =
  'font-bold text-[#008d8c] transition hover:text-[#00777a]'

export function AuthShell({
  title,
  description,
  children,
  footer,
  maxWidth = 'max-w-md',
}: {
  title: string
  description?: string
  children: ReactNode
  footer?: ReactNode
  maxWidth?: string
}) {
  return (
    <div className="min-h-screen px-4 py-6">
      <div
        className={`mx-auto flex min-h-[calc(100vh-3rem)] w-full ${maxWidth} flex-col`}
      >
        <main className="flex flex-1 items-center py-4">
          <section className="w-full rounded-[20px] border border-white/80 bg-white/94 p-4 shadow-[0_28px_70px_rgba(18,55,72,0.18)] backdrop-blur min-[360px]:p-5">
            <div className="mb-5 text-center">
              <Image
                src="/icon.svg"
                alt="Messzen logo"
                width={80}
                height={80}
                className="mx-auto h-[64px] w-[64px] object-contain"
                priority
              />

              <div className="mt-1 text-display font-bold text-[#008d8c]">
                Messzen
              </div>

              <h1 className="mt-5 text-headline font-bold text-[#062b35]">
                {title}
              </h1>

              {description ? (
                <p className="mx-auto mt-2 max-w-[310px] text-label text-[#65838b]">
                  {description}
                </p>
              ) : null}
            </div>

            {children}

            <div className="mt-5 flex items-center gap-3 text-[#65838b]">
              <span className="h-px flex-1 bg-[#cbd8e1]" />

              <span className="inline-flex items-center gap-1.5 text-caption font-semibold">
                <ShieldCheck size={14} className="text-[#008d8c]" />
                Protected access
              </span>

              <span className="h-px flex-1 bg-[#cbd8e1]" />
            </div>
          </section>
        </main>

        {footer ? (
          <div className="mt-4 text-center text-label font-medium text-[#65838b]">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  )
}

export function AuthMessage({
  children,
  success = false,
}: {
  children: ReactNode
  success?: boolean
}) {
  return (
    <div
      className={`mb-4 rounded-2xl border px-4 py-3 text-label font-semibold ${
        success
          ? 'border-[#bfe7e6] bg-[#edfafa] text-[#00777a]'
          : 'border-[#f4c7c7] bg-[#fff5f5] text-[#b42318]'
      }`}
    >
      {children}
    </div>
  )
}

type AuthFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string
  icon: IconType
}

export function AuthField({
  label,
  icon: Icon,
  className = '',
  ...props
}: AuthFieldProps) {
  return (
    <label className="block">
      <div className="mb-2 text-label font-bold text-[#062b35]">
        {label}
      </div>

      <IconInput
        icon={Icon}
        className={`min-h-[54px] rounded-[14px] border-[#bfe7e6] bg-white text-body ${className}`}
        {...props}
      />
    </label>
  )
}

// export function AuthPasswordField({
//   label,
//   value,
//   onChange,
//   show,
//   onToggle,
//   placeholder,
//   autoComplete,
// }: {
//   label: string
//   value: string
//   onChange: (value: string) => void
//   show: boolean
//   onToggle: () => void
//   placeholder: string
//   autoComplete: string
// }) {
//   return (
//     <label className="block">
//       <div className="mb-2 text-label font-bold text-[#062b35]">
//         {label}
//       </div>

//       <div
//         className="
//           relative flex h-[54px] items-center
//           rounded-[14px]
//           border border-[#bfe7e6]
//           bg-white
//           transition-all duration-200
//           focus-within:border-[#008d8c]
//           focus-within:ring-4
//           focus-within:ring-[#008d8c]/10
//         "
//       >
//         <span
//           className="
//             ml-3 grid h-8 w-8 shrink-0
//             place-items-center rounded-[9px]
//             bg-[#008d8c] text-white
//           "
//         >
//           <LockKeyhole
//             size={17}
//             strokeWidth={2.4}
//             aria-hidden="true"
//           />
//         </span>

//         <input
//           className="
//             h-full min-w-0 flex-1
//             bg-transparent px-3
//             text-label font-medium
//             text-[#062b35]
//             outline-none
//             placeholder:text-[#8aa0a6]
//           "
//           value={value}
//           onChange={(event) => onChange(event.target.value)}
//           type={show ? 'text' : 'password'}
//           placeholder={placeholder}
//           autoComplete={autoComplete}
//           required
//         />

//         <button
//           type="button"
//           aria-label={show ? 'Hide password' : 'Show password'}
//           aria-pressed={show}
//           onClick={onToggle}
//           className="
//             mr-2 grid h-10 w-10 shrink-0
//             place-items-center rounded-xl
//             text-[#52727b]
//             transition-all duration-200
//             hover:bg-[#008d8c]/10
//             hover:text-[#00777a]
//             focus-visible:outline-none
//             focus-visible:ring-2
//             focus-visible:ring-[#008d8c]/30
//           "
//         >
//           {show ? (
//             <EyeOff size={21} strokeWidth={2.4} />
//           ) : (
//             <Eye size={21} strokeWidth={2.4} />
//           )}
//         </button>
//       </div>
//     </label>
//   )
// }

export function AuthPasswordField({
  label,
  value,
  onChange,
  show,
  onToggle,
  placeholder,
  autoComplete,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  show: boolean
  onToggle: () => void
  placeholder: string
  autoComplete: string
}) {
  return (
    <label className="block">
      <div className="mb-2 text-label font-bold text-[#062b35]">
        {label}
      </div>

      <div
        className="
          relative flex min-h-[54px] items-center
          rounded-[14px]
          border border-[#bfe7e6]
          bg-white
          transition-all duration-200
          focus-within:border-[#008d8c]
          focus-within:ring-4
          focus-within:ring-[#008d8c]/10
        "
      >
        <span
          className="
            ml-2 grid h-8 w-8 shrink-0
            place-items-center
            text-[#008d8c]
          "
        >
          <LockKeyhole
            size={20}
            strokeWidth={2.3}
            aria-hidden="true"
          />
        </span>

        <input
          className="
            min-h-[54px] min-w-0 flex-1
            bg-transparent px-2 py-3
            text-body font-medium
            text-[#062b35]
            outline-none
            placeholder:text-[#8aa0a6]
          "
          value={value}
          onChange={(event) => onChange(event.target.value)}
          type={show ? 'text' : 'password'}
          placeholder={placeholder}
          autoComplete={autoComplete}
          required
        />

        <button
          type="button"
          aria-label={show ? 'Hide password' : 'Show password'}
          aria-pressed={show}
          onClick={onToggle}
          className="
            mr-2 grid h-10 w-10 shrink-0
            place-items-center
            text-[#52727b]
            transition-colors duration-200
            hover:text-[#008d8c]
            focus-visible:outline-none
            focus-visible:text-[#008d8c]
          "
        >
          {show ? (
            <EyeOff size={21} strokeWidth={2.4} />
          ) : (
            <Eye size={21} strokeWidth={2.4} />
          )}
        </button>
      </div>
    </label>
  )
}

export function AuthSubmitButton({
  busy,
  busyLabel,
  children,
}: {
  busy: boolean
  busyLabel: string
  children: ReactNode
}) {
  return (
    <button
      className="primary-btn relative flex min-h-[54px] w-full items-center justify-center gap-2 rounded-[14px] py-3 text-body disabled:cursor-not-allowed disabled:opacity-70"
      type="submit"
      disabled={busy}
    >
      <span>{busy ? busyLabel : children}</span>

      <ArrowRight
        className="absolute right-5"
        size={20}
        strokeWidth={2.2}
      />
    </button>
  )
}

export function AuthFooterLink({
  text,
  href,
  action,
}: {
  text: string
  href: string
  action: string
}) {
  return (
    <p>
      {text}{' '}
      <Link href={href} className={authLinkClass}>
        {action}
      </Link>
    </p>
  )
}



// 'use client'

// import Image from 'next/image'
// import Link from 'next/link'
// import type { ComponentType, InputHTMLAttributes, ReactNode } from 'react'
// import { ArrowRight, Eye, EyeOff, ShieldCheck, type LucideProps } from 'lucide-react'
// import { IconInput } from '@/components/mobile/icon-input'

// type IconType = ComponentType<LucideProps>

// export const authLinkClass = 'font-bold text-[#008d8c] transition hover:text-[#00777a]'

// export function AuthShell({
//   title,
//   description,
//   children,
//   footer,
//   maxWidth = 'max-w-md',
// }: {
//   title: string
//   description?: string
//   children: ReactNode
//   footer?: ReactNode
//   maxWidth?: string
// }) {
//   return (
//     <div className="min-h-screen px-4 py-6">
//       <div className={`mx-auto flex min-h-[calc(100vh-3rem)] w-full ${maxWidth} flex-col`}>
//         <main className="flex flex-1 items-center py-4">
//           <section className="w-full rounded-[20px] border border-white/80 bg-white/94 p-5 shadow-[0_28px_70px_rgba(18,55,72,0.18)] backdrop-blur">
//             <div className="mb-5 text-center">
//               <Image src="/icon.svg" alt="Messzen logo" width={80} height={80} className="mx-auto h-[64px] w-[64px] object-contain" priority />
//               <div className="mt-1 text-display font-bold leading-none text-[#008d8c]">Messzen</div>
//               <h1 className="mt-5 text-headline font-bold leading-tight text-[#062b35]">{title}</h1>
//               <p className="mx-auto mt-2 max-w-[310px] text-label leading-5 text-[#65838b]">{description}</p>
//             </div>

//             {children}

//             <div className="mt-5 flex items-center gap-3 text-[#65838b]">
//               <span className="h-px flex-1 bg-[#cbd8e1]" />
//               <span className="inline-flex items-center gap-1.5 text-caption font-semibold">
//                 <ShieldCheck size={14} className="text-[#008d8c]" />
//                 Protected access
//               </span>
//               <span className="h-px flex-1 bg-[#cbd8e1]" />
//             </div>
//           </section>
//         </main>
//         {footer ? <div className="mt-4 text-center text-label font-medium text-[#65838b]">{footer}</div> : null}
//       </div>
//     </div>
//   )
// }

// export function AuthMessage({ children, success = false }: { children: ReactNode; success?: boolean }) {
//   return (
//     <div
//       className={`mb-4 rounded-2xl border px-4 py-3 text-label font-semibold ${
//         success
//           ? 'border-[#bfe7e6] bg-[#edfafa] text-[#00777a]'
//           : 'border-[#f4c7c7] bg-[#fff5f5] text-[#b42318]'
//       }`}
//     >
//       {children}
//     </div>
//   )
// }

// type AuthFieldProps = InputHTMLAttributes<HTMLInputElement> & {
//   label: string
//   icon: IconType
// }

// export function AuthField({ label, icon: Icon, className = '', ...props }: AuthFieldProps) {
//   return (
//     <label className="block">
//       <div className="mb-2 text-label font-bold text-[#062b35]">{label}</div>
//       <IconInput icon={Icon} className={`h-[54px] rounded-[14px] border-[#bfe7e6] bg-white text-label ${className}`} {...props} />
//     </label>
//   )
// }

// export function AuthPasswordField({
//   label,
//   value,
//   onChange,
//   show,
//   onToggle,
//   placeholder,
//   autoComplete,
// }: {
//   label: string
//   value: string
//   onChange: (value: string) => void
//   show: boolean
//   onToggle: () => void
//   placeholder: string
//   autoComplete: string
// }) {
//   return (
//     <label className="block">
//       <div className="mb-2 text-label font-bold text-[#062b35]">{label}</div>
//       <div className="relative">
//         <input
//           className="field field--leading-icon field--trailing-action h-[54px] rounded-[14px] border-[#bfe7e6] bg-white text-label"
//           value={value}
//           onChange={(event) => onChange(event.target.value)}
//           type={show ? 'text' : 'password'}
//           placeholder={placeholder}
//           autoComplete={autoComplete}
//           required
//         />
//         <span className="field-icon field-icon--leading grid h-8 w-8 rounded-[9px] bg-[#008d8c] text-white">
//           <ShieldCheck size={15} />
//         </span>
//         <button
//           type="button"
//           aria-label={show ? 'Hide password' : 'Show password'}
//           onClick={onToggle}
//           className="field-action transition hover:text-[#008d8c]"
//         >
//           {show ? <EyeOff size={18} /> : <Eye size={18} />}
//         </button>
//       </div>
//     </label>
//   )
// }

// export function AuthSubmitButton({
//   busy,
//   busyLabel,
//   children,
// }: {
//   busy: boolean
//   busyLabel: string
//   children: ReactNode
// }) {
//   return (
//     <button className="primary-btn relative flex h-[54px] w-full items-center justify-center gap-2 rounded-[14px] text-body disabled:cursor-not-allowed disabled:opacity-70" type="submit" disabled={busy}>
//       <span>{busy ? busyLabel : children}</span>
//       <ArrowRight className="absolute right-5" size={20} strokeWidth={2.2} />
//     </button>
//   )
// }

// export function AuthFooterLink({
//   text,
//   href,
//   action,
// }: {
//   text: string
//   href: string
//   action: string
// }) {
//   return (
//     <p>
//       {text}{' '}
//       <Link href={href} className={authLinkClass}>
//         {action}
//       </Link>
//     </p>
//   )
// }
