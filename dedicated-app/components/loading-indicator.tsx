type LoadingIndicatorProps = {
  label?: string
  variant?: 'inline' | 'card' | 'screen'
  size?: 'sm' | 'md'
  className?: string
}

export function LoadingIndicator({
  label = 'Loading',
  variant = 'inline',
  size = 'md',
  className = '',
}: LoadingIndicatorProps) {
  return (
    <div
      className={`loading-indicator ${className}`}
      data-variant={variant}
      data-size={size}
      role="status"
      aria-label={label}
    >
      <span className="loading-indicator__dots" aria-hidden="true">
        <span />
        <span />
        <span />
      </span>
      <span className="sr-only">{label}</span>
    </div>
  )
}
