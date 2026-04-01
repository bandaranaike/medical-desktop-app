import { useEffect, useEffectEvent } from 'react'
import { AlertTriangle, CheckCircle2, Info, XCircle } from 'lucide-react'

import { cn } from '@/lib/utils'

export type ToastTone = 'error' | 'warning' | 'info' | 'success'

export type ToastItem = {
  id: string
  level: ToastTone
  title: string
  message: string
}

const toastStyles: Record<
  ToastTone,
  {
    icon: typeof XCircle
    shell: string
    badge: string
    iconColor: string
  }
> = {
  error: {
    icon: XCircle,
    shell: 'toast-shell toast-error border-rose-400/25',
    badge: 'toast-badge toast-badge-error border-rose-300/20',
    iconColor: 'text-rose-300'
  },
  warning: {
    icon: AlertTriangle,
    shell: 'toast-shell toast-warning border-amber-300/25',
    badge: 'toast-badge toast-badge-warning border-amber-200/20',
    iconColor: 'text-amber-200'
  },
  info: {
    icon: Info,
    shell: 'toast-shell toast-info border-cyan-300/25',
    badge: 'toast-badge toast-badge-info border-cyan-200/20',
    iconColor: 'text-cyan-200'
  },
  success: {
    icon: CheckCircle2,
    shell: 'toast-shell toast-success border-emerald-300/25',
    badge: 'toast-badge toast-badge-success border-emerald-200/20',
    iconColor: 'text-emerald-200'
  }
}

function ToastCard({
  toast,
  onDismiss
}: {
  toast: ToastItem
  onDismiss: (id: string) => void
}): React.JSX.Element {
  const style = toastStyles[toast.level]
  const Icon = style.icon
  const dismissToast = useEffectEvent(() => onDismiss(toast.id))

  useEffect(() => {
    const timer = window.setTimeout(() => {
      dismissToast()
    }, 5200)

    return () => {
      window.clearTimeout(timer)
    }
  }, [dismissToast, toast.id])

  return (
    <div
      className={cn(
        'pointer-events-auto relative overflow-hidden rounded-xl border px-4 py-3 backdrop-blur-md transition-all duration-300 animate-in slide-in-from-top-3 fade-in',
        style.shell
      )}
    >
      <div className="toast-accent absolute inset-y-0 left-0 w-1" />
      <div className="flex gap-3">
        <div
          className={cn(
            'mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border',
            style.badge
          )}
        >
          <Icon className={cn('h-4 w-4', style.iconColor)} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="toast-title text-sm font-semibold tracking-tight">{toast.title}</p>
          <p className="toast-message mt-1 text-xs leading-5">{toast.message}</p>
        </div>
        <button
          type="button"
          onClick={dismissToast}
          className="toast-dismiss rounded-md px-2 py-1 text-[11px] font-medium transition"
        >
          Dismiss
        </button>
      </div>
    </div>
  )
}

export function ToastRegion({
  toasts,
  onDismiss
}: {
  toasts: ToastItem[]
  onDismiss: (id: string) => void
}): React.JSX.Element | null {
  if (toasts.length === 0) return null

  return (
    <div className="pointer-events-none fixed right-4 top-4 z-50 flex w-[min(360px,calc(100vw-2rem))] flex-col gap-3">
      {toasts.map((toast) => (
        <ToastCard key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  )
}
