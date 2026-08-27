'use client'

import {
  type CSSProperties,
  type ButtonHTMLAttributes,
  type ReactNode,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { createPortal } from 'react-dom'
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

type SelectMenuPosition = {
  style: CSSProperties
  maxHeight: number
  side: 'top' | 'bottom'
}

const VIEWPORT_MARGIN = 12
const TRIGGER_GAP = 8
const MIN_MENU_HEIGHT = 120
const PREFERRED_MENU_HEIGHT = 320
const MIN_MENU_WIDTH = 180

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
  const menuRef = useRef<HTMLElement | null>(null)
  const [menuPosition, setMenuPosition] = useState<SelectMenuPosition | null>(null)
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
      const target = event.target as Node
      if (!containerRef.current?.contains(target) && !menuRef.current?.contains(target)) {
        setOpen(false)
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [open])

  useLayoutEffect(() => {
    if (!open) {
      setMenuPosition(null)
      return
    }

    const updatePosition = () => {
      const trigger = containerRef.current
      if (!trigger) return

      const rect = trigger.getBoundingClientRect()
      const viewportWidth = window.innerWidth
      const viewportHeight = window.innerHeight
      const spaceBelow = viewportHeight - rect.bottom - VIEWPORT_MARGIN - TRIGGER_GAP
      const spaceAbove = rect.top - VIEWPORT_MARGIN - TRIGGER_GAP
      const side = spaceBelow < 200 && spaceAbove > spaceBelow ? 'top' : 'bottom'
      const availableHeight = Math.max(
        MIN_MENU_HEIGHT,
        Math.min(PREFERRED_MENU_HEIGHT, side === 'bottom' ? spaceBelow : spaceAbove),
      )
      const width = Math.min(
        Math.max(rect.width, MIN_MENU_WIDTH),
        viewportWidth - VIEWPORT_MARGIN * 2,
      )
      const left = Math.min(
        Math.max(rect.left, VIEWPORT_MARGIN),
        viewportWidth - VIEWPORT_MARGIN - width,
      )

      setMenuPosition({
        side,
        maxHeight: availableHeight,
        style: {
          position: 'fixed',
          left,
          width,
          ...(side === 'bottom'
            ? { top: rect.bottom + TRIGGER_GAP }
            : { bottom: viewportHeight - rect.top + TRIGGER_GAP }),
        },
      })
    }

    updatePosition()
    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)

    const resizeObserver = typeof ResizeObserver === 'undefined'
      ? null
      : new ResizeObserver(updatePosition)
    if (containerRef.current) resizeObserver?.observe(containerRef.current)

    return () => {
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
      resizeObserver?.disconnect()
    }
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

  const menu = open && menuPosition ? (
    <section
      ref={menuRef}
      id={sheetId}
      role="listbox"
      aria-label={title ? undefined : label}
      aria-labelledby={title ? titleId : undefined}
      data-side={menuPosition.side}
      className="z-[100] flex overflow-hidden rounded-[15px] border border-[#dce5ec] bg-white shadow-[0_16px_38px_rgba(18,55,72,0.18)]"
      style={{ ...menuPosition.style, maxHeight: menuPosition.maxHeight }}
    >
      <div className="flex min-h-0 w-full flex-col">
        {title ? (
          <div id={titleId} className="shrink-0 border-b border-[#edf1f4] px-4 py-3 text-label font-bold text-[#123748]">
            {title}
          </div>
        ) : null}

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain py-1">
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
      </div>
    </section>
  ) : null

  return (
    <div ref={containerRef} className="relative min-w-0" data-mobile-select-open={open || undefined}>
      {renderTrigger({
        open,
        disabled,
        selectedLabel,
        selectedOption,
        buttonProps: {
          type: 'button',
          disabled,
          'aria-label': label,
          'aria-haspopup': 'listbox',
          'aria-expanded': open,
          'aria-controls': open ? sheetId : undefined,
          onClick: () => {
            if (!disabled) setOpen((current) => !current)
          },
        },
      })}
      {menu ? createPortal(menu, document.body) : null}
    </div>
  )
}
