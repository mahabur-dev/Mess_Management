'use client'

import {
  type ButtonHTMLAttributes,
  type ReactNode,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react'
import { Check } from 'lucide-react'
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
  const containerRef = useRef<HTMLDivElement | null>(null)
  const sheetId = useId()
  const titleId = `${sheetId}-title`
  const selectedOption = useMemo(
    () => options.find((option) => option.value === value),
    [options, value],
  )
  const selectedLabel = selectedOption?.label ?? 'Select option'

  useEffect(() => {
    if (!open) return

    const handlePointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false)
    }

    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [open])

  useNativeBackAction(open, () => {
    setOpen(false)
    return true
  })

  useEffect(() => {
    if (!open) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  function handleSelect(option: MobileSelectOption<T>) {
    if (option.disabled) return
    onChange(option.value)
    setOpen(false)
  }

  return (
    <div ref={containerRef} className="relative min-w-0">
      {renderTrigger({
        open,
        disabled,
        selectedLabel,
        selectedOption,
        buttonProps: {
          type: 'button',
          disabled,
          'aria-haspopup': 'listbox',
          'aria-expanded': open,
          'aria-controls': open ? sheetId : undefined,
          onClick: () => {
            if (!disabled) setOpen((current) => !current)
          },
        },
      })}
      {open ? (
        <section
          id={sheetId}
          role="listbox"
          aria-labelledby={title ? titleId : undefined}
          className="mt-2 w-full overflow-hidden rounded-[15px] border border-[#dce5ec] bg-white shadow-[0_10px_26px_rgba(18,55,72,0.08)]"
        >
          {title ? (
            <div id={titleId} className="border-b border-[#edf1f4] px-4 py-3 text-label font-bold text-[#123748]">
              {title}
            </div>
          ) : null}

          <div className="max-h-[260px] overflow-y-auto overscroll-contain py-1">
            {options.length ? (
              options.map((option) => {
                const selected = option.value === value

                return (
                  <button
                    key={option.value}
                    type="button"
                    role="option"
                    aria-selected={selected}
                    disabled={option.disabled}
                    onClick={() => handleSelect(option)}
                    className={`flex min-h-[50px] w-full items-center gap-3 px-4 py-3 text-left transition-colors duration-160 disabled:cursor-not-allowed disabled:opacity-50 ${
                      selected ? 'bg-[#edfafa] text-[#008d8c]' : 'bg-white text-[#1d3a42] hover:bg-[#f8fdfd]'
                    }`}
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block text-body font-semibold leading-snug [overflow-wrap:anywhere]">
                        {option.label}
                      </span>
                      {option.description ? (
                        <span className="mt-1 block text-caption font-medium leading-snug text-[#65838b] [overflow-wrap:anywhere]">
                          {option.description}
                        </span>
                      ) : null}
                    </span>
                    {selected ? (
                      <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#008d8c] text-white" aria-hidden="true">
                        <Check size={14} strokeWidth={3} />
                      </span>
                    ) : null}
                  </button>
                )
              })
            ) : (
              <div className="px-4 py-5 text-center text-label font-semibold text-[#65838b]">
                {emptyMessage}
              </div>
            )}
          </div>
        </section>
      ) : null}
    </div>
  )
}
