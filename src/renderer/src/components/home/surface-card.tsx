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
        'rounded-lg border border-border bg-card/20 p-4 shadow-sm backdrop-blur-md mb-8!',
        className
      )}
    >
      <div className="mb-24 flex flex-wrap items-start justify-between gap-1">
        <div className="space-y-0.5 mb-8">
          {eyebrow ? (
            <p className="text-[10px] font-bold uppercase tracking-wider text-primary">
              {eyebrow}
            </p>
          ) : null}
          <h2 className="text-sm font-semibold tracking-tight text-white mb-8">{title}</h2>
          {description ? <p className="text-[11px] text-slate-500">{description}</p> : null}
        </div>
      </div>
      {children}
    </section>
  )
}
