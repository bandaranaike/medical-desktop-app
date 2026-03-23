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
        'rounded-[18px] border border-white/10 bg-[#11161e]/90 p-5 shadow-[0_20px_60px_rgba(0,0,0,0.42)] backdrop-blur-xl',
        className
      )}
    >
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          {eyebrow ? (
            <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-cyan-300/80">
              {eyebrow}
            </p>
          ) : null}
          <h2 className="text-lg font-semibold tracking-tight text-white">{title}</h2>
          {description ? <p className="text-sm text-slate-400">{description}</p> : null}
        </div>
      </div>
      {children}
    </section>
  )
}
