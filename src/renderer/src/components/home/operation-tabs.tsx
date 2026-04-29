import { cn } from '@/lib/utils'

export type OperationType = 'opd' | 'channeling' | 'dental' | 'others'

interface OperationTabsProps {
  value: OperationType
  onChange: (value: OperationType) => void
}

const tabs: Array<{ value: OperationType; label: string }> = [
  { value: 'opd', label: 'OPD' },
  { value: 'channeling', label: 'Channeling' },
  { value: 'dental', label: 'Dental' },
  { value: 'others', label: 'Others' }
]

export function OperationTabs({ value, onChange }: OperationTabsProps): React.JSX.Element {
  return (
    <div className="panel-shell inline-flex rounded-lg border p-0.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          type="button"
          onClick={() => onChange(tab.value)}
          className={cn(
            'rounded-md px-3 py-1 text-[11px] font-semibold transition-all',
            value === tab.value
              ? 'bg-primary text-primary-foreground shadow-theme-primary-tab'
              : 'text-theme-muted panel-hover-shell hover:text-theme-strong'
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
