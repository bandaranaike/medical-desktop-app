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
        'surface-shell rounded-lg border p-4 backdrop-blur-md',
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
          <h2 className="text-theme-strong text-sm font-semibold tracking-tight">{title}</h2>
          {description ? <p className="text-theme-muted text-[11px]">{description}</p> : null}
        </div>
      </div>
      {children}
    </section>
  )
}
