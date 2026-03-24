import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

interface SurfaceCardProps {
  title: string
  eyebrow?: string
  description?: string
  className?: string
  children: ReactNode
}

export function SurfaceCard({
  title,
  eyebrow,
  description,
  className,
  children
}: SurfaceCardProps): React.JSX.Element {
  return (
    <section
      className={cn(
        'rounded-lg border border-border/90 bg-[linear-gradient(180deg,rgba(16,23,35,0.96),rgba(13,19,29,0.92))] p-4 shadow-[0_18px_40px_rgba(3,9,18,0.26)] backdrop-blur-md',
        className
      )}
    >
      <div className="mb-4 flex flex-wrap items-start justify-between gap-1">
        <div className="space-y-0.5">
          {eyebrow ? (
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-primary/85">
              {eyebrow}
            </p>
          ) : null}
          <h2 className="text-sm font-semibold tracking-tight text-white">{title}</h2>
          {description ? <p className="text-[11px] text-slate-400">{description}</p> : null}
        </div>
      </div>
      {children}
    </section>
  )
}
