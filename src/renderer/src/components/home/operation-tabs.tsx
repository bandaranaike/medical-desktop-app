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

export function OperationTabs({
  value,
  onChange
}: OperationTabsProps): React.JSX.Element {
  return (
    <div className="inline-flex rounded-xl border border-white/10 bg-white/5 p-1">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          type="button"
          onClick={() => onChange(tab.value)}
          className={cn(
            'rounded-lg px-4 py-2 text-sm font-medium transition-all',
            value === tab.value
              ? 'bg-cyan-400 text-slate-950 shadow-[0_10px_28px_rgba(34,211,238,0.35)]'
              : 'text-slate-300 hover:bg-white/6 hover:text-white'
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
