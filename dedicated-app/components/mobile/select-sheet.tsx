'use client'

import {
  type ButtonHTMLAttributes,
  type ReactNode,
  useEffect,
  useId,
  useMemo,
  useState,
} from 'react'
import { createPortal } from 'react-dom'
import { Check, X } from 'lucide-react'
import { useNativeBackAction } from '@/components/native-back-actions'

export type MobileSelectOption<T extends string = string> = {
  value: T
  label: string
  description?: string
  disabled?: boolean
}

type MobileSelectSheetTrigger<T extends string> = {
  open: boolean
  disabled?: boolean
  selectedLabel: string
  selectedOption?: MobileSelectOption<T>
  buttonProps: ButtonHTMLAttributes<HTMLButtonElement>
}

type MobileSelectSheetProps<T extends string> = {
  label: string
  value: T
  options: Array<MobileSelectOption<T>>
  onChange: (value: T) => void
  disabled?: boolean
  title?: string
  emptyMessage?: string
  renderTrigger: (props: MobileSelectSheetTrigger<T>) => ReactNode
}

export function MobileSelectSheet<T extends string>({
  label,
  value,
  options,
  onChange,
  disabled,
  title,
  emptyMessage = 'No options available.',
  renderTrigger,
}: MobileSelectSheetProps<T>) {
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [portalElement, setPortalElement] = useState<HTMLDivElement | null>(null)
  const sheetId = useId()
  const titleId = `${sheetId}-title`
  const selectedOption = useMemo(
    () => options.find((option) => option.value === value),
    [options, value],
  )
  const selectedLabel = selectedOption?.label ?? 'Select option'

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return

    const element = document.createElement('div')
    element.setAttribute('data-mobile-select-portal', '')
    document.body.appendChild(element)
    setPortalElement(element)

    return () => {
      setPortalElement(null)
      if (document.body.contains(element)) {
        document.body.removeChild(element)
      }
    }
  }, [mounted])

  useNativeBackAction(open, () => {
    setOpen(false)
    return true
  })

  useEffect(() => {
    if (!open) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }

    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = originalOverflow
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  function handleSelect(option: MobileSelectOption<T>) {
    if (option.disabled) return
    onChange(option.value)
    setOpen(false)
  }

  const sheet = open && portalElement
    ? createPortal(
        <div
          className="fixed left-1/2 top-0 z-[120] flex h-[100dvh] w-[min(430px,100vw)] -translate-x-1/2 items-end justify-center bg-[#062b35]/45 px-3 pb-[calc(14px+env(safe-area-inset-bottom))] pt-6 backdrop-blur-[3px]"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setOpen(false)
          }}
        >
          <section
            id={sheetId}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="w-full overflow-hidden rounded-t-[24px] border border-white/80 bg-white shadow-[0_26px_70px_rgba(6,43,53,0.24)]"
          >
            <div className="px-4 pt-3.5">
              <div className="mx-auto mb-3 h-1.5 w-11 rounded-full bg-[#d8e9e9]" />
              <div className="flex items-center justify-between gap-3 border-b border-[#e4eeee] pb-3">
                <h2 id={titleId} className="min-w-0 truncate text-body font-bold text-[#062b35]">
                  {title ?? `Select ${label}`}
                </h2>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label={`Close ${label} selection`}
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-[#d7ebeb] text-[#65838b] transition hover:border-[#008d8c] hover:bg-[#effafa] hover:text-[#008d8c] active:scale-95"
                >
                  <X size={18} strokeWidth={2.35} />
                </button>
              </div>
            </div>

            <div className="max-h-[min(58dvh,390px)] space-y-2 overflow-y-auto overscroll-contain px-3 py-3">
              {options.length ? (
                options.map((option) => {
                  const selected = option.value === value

                  return (
                    <button
                      key={option.value}
                      type="button"
                      disabled={option.disabled}
                      onClick={() => handleSelect(option)}
                      className={`flex min-h-[54px] w-full items-center gap-3 rounded-[16px] border px-3.5 py-3 text-left transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50 ${
                        selected
                          ? 'border-[#008d8c] bg-[#edfafa] shadow-[0_8px_24px_rgba(0,141,140,0.10)]'
                          : 'border-[#deecec] bg-white hover:border-[#9ed6d4] hover:bg-[#f8fdfd]'
                      }`}
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block text-body font-semibold leading-snug text-[#1d3a42] [overflow-wrap:anywhere]">
                          {option.label}
                        </span>
                        {option.description ? (
                          <span className="mt-0.5 block text-caption font-medium leading-snug text-[#789096] [overflow-wrap:anywhere]">
                            {option.description}
                          </span>
                        ) : null}
                      </span>
                      <span
                        className={`grid h-7 w-7 shrink-0 place-items-center rounded-full border ${
                          selected
                            ? 'border-[#008d8c] bg-[#008d8c] text-white'
                            : 'border-[#c9dfdf] text-transparent'
                        }`}
                        aria-hidden="true"
                      >
                        <Check size={15} strokeWidth={3} />
                      </span>
                    </button>
                  )
                })
              ) : (
                <div className="rounded-[16px] border border-[#deecec] bg-[#f8fdfd] px-4 py-5 text-center text-label font-semibold text-[#65838b]">
                  {emptyMessage}
                </div>
              )}
            </div>
          </section>
        </div>,
        portalElement,
      )
    : null

  return (
    <>
      {renderTrigger({
        open,
        disabled,
        selectedLabel,
        selectedOption,
        buttonProps: {
          type: 'button',
          disabled,
          'aria-haspopup': 'dialog',
          'aria-expanded': open,
          'aria-controls': open ? sheetId : undefined,
          onClick: () => {
            if (!disabled) setOpen(true)
          },
        },
      })}
      {sheet}
    </>
  )
}
