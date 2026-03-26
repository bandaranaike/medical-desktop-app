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
    shell:
      'border-rose-400/25 bg-[linear-gradient(180deg,rgba(72,18,31,0.96),rgba(43,12,23,0.98))] shadow-[0_24px_44px_rgba(15,3,8,0.46)]',
    badge: 'border-rose-300/20 bg-rose-400/12 text-rose-100',
    iconColor: 'text-rose-300'
  },
  warning: {
    icon: AlertTriangle,
    shell:
      'border-amber-300/25 bg-[linear-gradient(180deg,rgba(77,48,15,0.96),rgba(48,29,10,0.98))] shadow-[0_24px_44px_rgba(20,13,4,0.44)]',
    badge: 'border-amber-200/20 bg-amber-300/12 text-amber-50',
    iconColor: 'text-amber-200'
  },
  info: {
    icon: Info,
    shell:
      'border-cyan-300/25 bg-[linear-gradient(180deg,rgba(13,47,60,0.96),rgba(9,30,40,0.98))] shadow-[0_24px_44px_rgba(3,12,16,0.44)]',
    badge: 'border-cyan-200/20 bg-cyan-300/12 text-cyan-50',
    iconColor: 'text-cyan-200'
  },
  success: {
    icon: CheckCircle2,
    shell:
      'border-emerald-300/25 bg-[linear-gradient(180deg,rgba(16,58,47,0.96),rgba(10,35,29,0.98))] shadow-[0_24px_44px_rgba(3,12,10,0.44)]',
    badge: 'border-emerald-200/20 bg-emerald-300/12 text-emerald-50',
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
      <div className="absolute inset-y-0 left-0 w-1 bg-white/18" />
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
          <p className="text-sm font-semibold tracking-tight text-white">{toast.title}</p>
          <p className="mt-1 text-xs leading-5 text-slate-200/90">{toast.message}</p>
        </div>
        <button
          type="button"
          onClick={dismissToast}
          className="rounded-md px-2 py-1 text-[11px] font-medium text-slate-300 transition hover:bg-white/7 hover:text-white"
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
