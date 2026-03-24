import React, { useEffect, useState } from 'react'

import { OperationTabs, type OperationType } from '@/components/home/operation-tabs'
import { SurfaceCard } from '@/components/home/surface-card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

type Shift = 'Morning' | 'Evening'
type SearchField = 'name' | 'telephone' | 'registrationNo'

interface PatientInfo {
  name: string
  telephone: string
  email: string
  age: string
  gender: string
  address: string
  registrationNo: string
}

interface UserRecord {
  id: number
  name?: string | null
  email?: string | null
  telephone?: string | null
  address?: string | null
  registrationNo?: string | null
  gender?: string | null
}

interface DoctorOption {
  id: string
  name: string
  specialty: string
  telephone: string
  email: string
  address: string
  dentalSplitMode: 'fixed' | 'percentage'
  dentalSplitValue: number
}

interface ChargeRow {
  id: string
  label: string
  amount: string
}

type RendererApi = {
  searchUsers: (query: string) => Promise<UserRecord[]>
}

const doctors: DoctorOption[] = [
  {
    id: 'd1',
    name: 'Dr. Nimal Perera',
    specialty: 'OPD',
    telephone: '+94 71 100 2000',
    email: 'nimal@medical.local',
    address: 'Main Street Clinic',
    dentalSplitMode: 'fixed',
    dentalSplitValue: 1250
  },
  {
    id: 'd2',
    name: 'Dr. Ishani Fernando',
    specialty: 'Channeling',
    telephone: '+94 71 100 3000',
    email: 'ishani@medical.local',
    address: 'Central Medical Center',
    dentalSplitMode: 'percentage',
    dentalSplitValue: 35
  },
  {
    id: 'd3',
    name: 'Dr. Rashmi Silva',
    specialty: 'Dental Surgery',
    telephone: '+94 71 100 4000',
    email: 'rashmi@medical.local',
    address: 'Smile Care Wing',
    dentalSplitMode: 'percentage',
    dentalSplitValue: 42
  }
]

const inputClassName =
  'h-9 rounded-md border-border/90 bg-white/[0.035] text-sm text-white placeholder:text-slate-500 focus-visible:border-primary/70 focus-visible:ring-primary/20'
const selectClassName =
  'flex h-9 w-full rounded-md border border-border/90 bg-white/[0.035] px-3 text-sm text-white outline-none transition focus:border-primary/70 focus:ring-2 focus:ring-primary/20'
const softButtonClassName =
  'h-8 border-border/90 bg-white/[0.04] text-xs text-slate-200 transition-all hover:border-primary/35 hover:bg-primary/10 hover:text-white'

const makeRow = (label = '', amount = ''): ChargeRow => ({
  id: Math.random().toString(36).slice(2, 10),
  label,
  amount
})

const money = (value: number): string =>
  `LKR ${new Intl.NumberFormat('en-LK', { maximumFractionDigits: 0 }).format(value)}`

const num = (value: string): number => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function splitDental(amount: number, doctor?: DoctorOption): { inHouse: number; referred: number } {
  if (!doctor || amount <= 0) return { inHouse: 0, referred: amount }
  const inHouse =
    doctor.dentalSplitMode === 'fixed'
      ? Math.min(doctor.dentalSplitValue, amount)
      : amount * (doctor.dentalSplitValue / 100)
  return { inHouse, referred: Math.max(amount - inHouse, 0) }
}

function Label({ children }: { children: React.ReactNode }): React.JSX.Element {
  return (
    <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">
      {children}
    </label>
  )
}

function SearchBox({
  label,
  field,
  value,
  placeholder,
  results,
  activeField,
  onFocus,
  onBlur,
  onChange,
  onSelect
}: {
  label: string
  field: SearchField
  value: string
  placeholder: string
  results: UserRecord[]
  activeField: SearchField | null
  onFocus: (field: SearchField) => void
  onBlur: () => void
  onChange: (value: string) => void
  onSelect: (user: UserRecord) => void
}): React.JSX.Element {
  return (
    <div className="relative">
      <Label>{label}</Label>
      <Input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onFocus={() => onFocus(field)}
        onBlur={() => setTimeout(onBlur, 180)}
        placeholder={placeholder}
        className={inputClassName}
      />
      {activeField === field && results.length > 0 ? (
        <div className="absolute inset-x-0 top-full z-20 mt-1 rounded-md border border-border/90 bg-[rgba(13,19,29,0.98)] p-1 shadow-2xl">
          {results.map((user) => (
            <button
              key={user.id}
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => onSelect(user)}
              className="flex w-full items-center justify-between rounded px-2 py-1.5 text-left transition hover:bg-white/4"
            >
              <span>
                <span className="block text-xs font-medium text-white">
                  {user.name || 'Unnamed Patient'}
                </span>
                <span className="block text-[10px] text-slate-500">
                  {user.telephone || user.registrationNo || user.email || 'No details'}
                </span>
              </span>
              <span className="text-[10px] text-primary">Autofill</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}

function App(): React.JSX.Element {
  const api = window.api as RendererApi
  const [activeOperation, setActiveOperation] = useState<OperationType>('opd')
  const [shift, setShift] = useState<Shift>('Morning')
  const [billDate, setBillDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [patient, setPatient] = useState<PatientInfo>({
    name: '',
    telephone: '',
    email: '',
    age: '',
    gender: 'Male',
    address: '',
    registrationNo: ''
  })
  const [activeField, setActiveField] = useState<SearchField | null>(null)
  const [searchResults, setSearchResults] = useState<UserRecord[]>([])
  const [opd, setOpd] = useState({ doctorId: doctors[0].id, consultationFee: '', medicineFee: '' })
  const [channeling, setChanneling] = useState({
    doctorId: doctors[1].id,
    consultationFee: '',
    bookingFee: ''
  })
  const [dental, setDental] = useState({
    doctorId: doctors[2].id,
    registrationFee: '',
    rows: [makeRow('Consultation', ''), makeRow('Medicine', '')]
  })
  const [others, setOthers] = useState<ChargeRow[]>([
    makeRow('Report Charge', ''),
    makeRow('Treatment Charge', '')
  ])

  useEffect(() => {
    const query =
      activeField === 'name'
        ? patient.name
        : activeField === 'telephone'
          ? patient.telephone
          : activeField === 'registrationNo'
            ? patient.registrationNo
            : ''
    if (!activeField || query.trim().length < 2) {
      return
    }
    const timer = setTimeout(() => {
      void api
        .searchUsers(query.trim())
        .then(setSearchResults)
        .catch(() => setSearchResults([]))
    }, 220)
    return () => clearTimeout(timer)
  }, [activeField, api, patient.name, patient.registrationNo, patient.telephone])

  const setPatientField = (key: keyof PatientInfo, value: string): void =>
    setPatient((current) => ({ ...current, [key]: value }))

  const fillPatient = (user: UserRecord): void => {
    setPatient((current) => ({
      ...current,
      name: user.name ?? '',
      telephone: user.telephone ?? '',
      email: user.email ?? '',
      address: user.address ?? '',
      registrationNo: user.registrationNo ?? '',
      gender: user.gender ?? current.gender
    }))
    setSearchResults([])
    setActiveField(null)
  }

  const dentalSplit = dental.rows.reduce(
    (total, row) => {
      const split = splitDental(
        num(row.amount),
        doctors.find((item) => item.id === dental.doctorId)
      )
      return { inHouse: total.inHouse + split.inHouse, referred: total.referred + split.referred }
    },
    { inHouse: 0, referred: 0 }
  )

  const summary =
    activeOperation === 'opd'
      ? [
          { label: 'Doctor Fee', value: num(opd.consultationFee) },
          { label: 'Medicine Charge', value: num(opd.medicineFee) }
        ]
      : activeOperation === 'channeling'
        ? [
            { label: 'Doctor Fee', value: num(channeling.consultationFee) },
            { label: 'Booking Fee', value: num(channeling.bookingFee) }
          ]
        : activeOperation === 'dental'
          ? [
              { label: 'Registration Fee', value: num(dental.registrationFee) },
              ...dental.rows.map((row) => ({
                label: row.label || 'Dental Charge',
                value: num(row.amount)
              }))
            ]
          : others.map((row) => ({
              label: row.label || 'Additional Charge',
              value: num(row.amount)
            }))
  const total = summary.reduce((sum, item) => sum + item.value, 0)

  return (
    <main className="min-h-screen p-4 text-white sm:p-5">
      <div className="mx-auto flex max-w-6xl flex-col gap-4">
        <section className="relative overflow-hidden rounded-xl border border-border/90 bg-[linear-gradient(180deg,rgba(12,19,30,0.98),rgba(16,25,39,0.94))] p-4 shadow-[0_24px_50px_rgba(3,9,18,0.3)]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.12),transparent_32%)]" />
          <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-1">
              <span className="inline-flex rounded-full border border-primary/20 bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-primary">
                Medical Center Billing
              </span>
              <div>
                <h1 className="text-xl font-semibold tracking-tight">
                  Simple billing flow for clinic operators
                </h1>
                <p className="text-xs text-slate-400">
                  Search patient details, select visit type, enter charges, and generate bill.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <div className="min-w-35 rounded-lg border border-border/90 bg-[#16202c] px-3 py-1.5">
                <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
                  Date
                </p>
                <Input
                  type="date"
                  value={billDate}
                  onChange={(event) => setBillDate(event.target.value)}
                  className={cn(
                    inputClassName,
                    'h-7 border-0 bg-transparent px-0 py-0 focus-visible:ring-0'
                  )}
                />
              </div>
              <div className="min-w-45 rounded-lg border border-border/90 bg-[#16202c] px-3 py-1.5">
                <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
                  Shift
                </p>
                <div className="mt-1 flex rounded-md border border-border/90 bg-[#0f161f] p-0.5">
                  {(['Morning', 'Evening'] as Shift[]).map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setShift(option)}
                      className={cn(
                        'flex-1 rounded px-3 py-1 text-[11px] font-medium transition',
                        shift === option
                          ? 'bg-primary text-primary-foreground shadow-[0_10px_22px_rgba(34,211,238,0.24)]'
                          : 'text-slate-400 hover:bg-white/4'
                      )}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-4">
            <SurfaceCard eyebrow="Patient" title="Patient information">
              <div className="grid gap-x-4 gap-y-4 md:grid-cols-2 xl:grid-cols-3">
                <SearchBox
                  label="Name"
                  field="name"
                  value={patient.name}
                  placeholder="Patient name"
                  results={searchResults}
                  activeField={activeField}
                  onFocus={setActiveField}
                  onBlur={() => {
                    setActiveField(null)
                    setSearchResults([])
                  }}
                  onChange={(value) => setPatientField('name', value)}
                  onSelect={fillPatient}
                />
                <SearchBox
                  label="Telephone"
                  field="telephone"
                  value={patient.telephone}
                  placeholder="Telephone number"
                  results={searchResults}
                  activeField={activeField}
                  onFocus={setActiveField}
                  onBlur={() => {
                    setActiveField(null)
                    setSearchResults([])
                  }}
                  onChange={(value) => setPatientField('telephone', value)}
                  onSelect={fillPatient}
                />
                <div>
                  <Label>Email</Label>
                  <Input
                    value={patient.email}
                    onChange={(event) => setPatientField('email', event.target.value)}
                    placeholder="patient@email.com"
                    className={inputClassName}
                  />
                </div>
                <div>
                  <Label>Age</Label>
                  <Input
                    value={patient.age}
                    onChange={(event) => setPatientField('age', event.target.value)}
                    placeholder="Age"
                    className={inputClassName}
                  />
                </div>
                <SearchBox
                  label="Registration No"
                  field="registrationNo"
                  value={patient.registrationNo}
                  placeholder="Registration number"
                  results={searchResults}
                  activeField={activeField}
                  onFocus={setActiveField}
                  onBlur={() => {
                    setActiveField(null)
                    setSearchResults([])
                  }}
                  onChange={(value) => setPatientField('registrationNo', value)}
                  onSelect={fillPatient}
                />
                <div>
                  <Label>Gender</Label>
                  <select
                    value={patient.gender}
                    onChange={(event) => setPatientField('gender', event.target.value)}
                    className={selectClassName}
                  >
                    <option value="Male" className="bg-slate-900">
                      Male
                    </option>
                    <option value="Female" className="bg-slate-900">
                      Female
                    </option>
                    <option value="Other" className="bg-slate-900">
                      Other
                    </option>
                  </select>
                </div>
                <div className="md:col-span-2 xl:col-span-3">
                  <Label>Address</Label>
                  <Input
                    value={patient.address}
                    onChange={(event) => setPatientField('address', event.target.value)}
                    placeholder="Patient address"
                    className={inputClassName}
                  />
                </div>
              </div>
            </SurfaceCard>

            <SurfaceCard eyebrow="Visit Type" title="Billing operation">
              <div className="space-y-4">
                <OperationTabs value={activeOperation} onChange={setActiveOperation} />
                {activeOperation === 'opd' ? (
                  <div className="grid gap-x-4 gap-y-3 lg:grid-cols-2">
                    <div className="lg:col-span-2">
                      <Label>Doctor</Label>
                      <select
                        value={opd.doctorId}
                        onChange={(event) =>
                          setOpd((current) => ({ ...current, doctorId: event.target.value }))
                        }
                        className={selectClassName}
                      >
                        {doctors.map((item) => (
                          <option key={item.id} value={item.id} className="bg-slate-900">
                            {item.name} - {item.specialty}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label>Doctor Consultation Fee</Label>
                      <Input
                        type="number"
                        value={opd.consultationFee}
                        onChange={(event) =>
                          setOpd((current) => ({ ...current, consultationFee: event.target.value }))
                        }
                        placeholder="0"
                        className={inputClassName}
                      />
                    </div>
                    <div>
                      <Label>OPD Medicine Fee</Label>
                      <Input
                        type="number"
                        value={opd.medicineFee}
                        onChange={(event) =>
                          setOpd((current) => ({ ...current, medicineFee: event.target.value }))
                        }
                        placeholder="0"
                        className={inputClassName}
                      />
                    </div>
                  </div>
                ) : null}
                {activeOperation === 'channeling' ? (
                  <div className="grid gap-x-4 gap-y-3 lg:grid-cols-2">
                    <div className="lg:col-span-2">
                      <Label>Doctor</Label>
                      <select
                        value={channeling.doctorId}
                        onChange={(event) =>
                          setChanneling((current) => ({ ...current, doctorId: event.target.value }))
                        }
                        className={selectClassName}
                      >
                        {doctors.map((item) => (
                          <option key={item.id} value={item.id} className="bg-slate-900">
                            {item.name} - {item.specialty}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label>Doctor Consultation Fee</Label>
                      <Input
                        type="number"
                        value={channeling.consultationFee}
                        onChange={(event) =>
                          setChanneling((current) => ({
                            ...current,
                            consultationFee: event.target.value
                          }))
                        }
                        placeholder="0"
                        className={inputClassName}
                      />
                    </div>
                    <div>
                      <Label>Channeling / Booking Fee</Label>
                      <Input
                        type="number"
                        value={channeling.bookingFee}
                        onChange={(event) =>
                          setChanneling((current) => ({
                            ...current,
                            bookingFee: event.target.value
                          }))
                        }
                        placeholder="0"
                        className={inputClassName}
                      />
                    </div>
                  </div>
                ) : null}
                {activeOperation === 'dental' ? (
                  <div className="space-y-4">
                    <div className="grid gap-x-4 gap-y-3 lg:grid-cols-[1fr_180px]">
                      <div>
                        <Label>Doctor</Label>
                        <select
                          value={dental.doctorId}
                          onChange={(event) =>
                            setDental((current) => ({ ...current, doctorId: event.target.value }))
                          }
                          className={selectClassName}
                        >
                          {doctors.map((item) => (
                            <option key={item.id} value={item.id} className="bg-slate-900">
                              {item.name} - {item.specialty}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <Label>Registration Fee</Label>
                        <Input
                          type="number"
                          value={dental.registrationFee}
                          onChange={(event) =>
                            setDental((current) => ({
                              ...current,
                              registrationFee: event.target.value
                            }))
                          }
                          placeholder="0"
                          className={inputClassName}
                        />
                      </div>
                    </div>
                    <div className="space-y-2.5">
                      {dental.rows.map((row) => {
                        const split = splitDental(
                          num(row.amount),
                          doctors.find((item) => item.id === dental.doctorId)
                        )
                        return (
                          <div
                            key={row.id}
                            className="grid gap-3 rounded-lg border border-border/90 bg-white/2 p-3 lg:grid-cols-[1fr_120px_160px_80px]"
                          >
                            <div>
                              <Label>Label</Label>
                              <Input
                                value={row.label}
                                onChange={(event) =>
                                  setDental((current) => ({
                                    ...current,
                                    rows: current.rows.map((item) =>
                                      item.id === row.id
                                        ? { ...item, label: event.target.value }
                                        : item
                                    )
                                  }))
                                }
                                placeholder="Treatment name"
                                className={inputClassName}
                              />
                            </div>
                            <div>
                              <Label>Charge</Label>
                              <Input
                                type="number"
                                value={row.amount}
                                onChange={(event) =>
                                  setDental((current) => ({
                                    ...current,
                                    rows: current.rows.map((item) =>
                                      item.id === row.id
                                        ? { ...item, amount: event.target.value }
                                        : item
                                    )
                                  }))
                                }
                                placeholder="0"
                                className={inputClassName}
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-1.5 rounded-md border border-border/90 bg-[#111923] p-2">
                              <div className="space-y-0.5">
                                <p className="text-[9px] uppercase tracking-wider text-slate-500 font-semibold">
                                  In-house
                                </p>
                                <p className="text-[11px] font-semibold text-primary">
                                  {money(split.inHouse)}
                                </p>
                              </div>
                              <div className="space-y-0.5">
                                <p className="text-[9px] uppercase tracking-wider text-slate-500 font-semibold">
                                  Referred
                                </p>
                                <p className="text-[11px] font-semibold text-slate-100">
                                  {money(split.referred)}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-end">
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() =>
                                  setDental((current) => ({
                                    ...current,
                                    rows: current.rows.filter((item) => item.id !== row.id)
                                  }))
                                }
                                disabled={dental.rows.length === 1}
                                className={cn(softButtonClassName, 'w-full')}
                              >
                                Remove
                              </Button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() =>
                        setDental((current) => ({
                          ...current,
                          rows: [...current.rows, makeRow('New Dental Charge', '')]
                        }))
                      }
                      className={softButtonClassName}
                    >
                      Add Dental Charge
                    </Button>
                  </div>
                ) : null}
                {activeOperation === 'others' ? (
                  <div className="space-y-2.5">
                    {others.map((row) => (
                      <div
                        key={row.id}
                        className="grid gap-3 rounded-lg border border-border/90 bg-white/2 p-3 lg:grid-cols-[1fr_120px_80px]"
                      >
                        <div>
                          <Label>Label</Label>
                          <Input
                            value={row.label}
                            onChange={(event) =>
                              setOthers((current) =>
                                current.map((item) =>
                                  item.id === row.id ? { ...item, label: event.target.value } : item
                                )
                              )
                            }
                            placeholder="Report or treatment name"
                            className={inputClassName}
                          />
                        </div>
                        <div>
                          <Label>Charge</Label>
                          <Input
                            type="number"
                            value={row.amount}
                            onChange={(event) =>
                              setOthers((current) =>
                                current.map((item) =>
                                  item.id === row.id
                                    ? { ...item, amount: event.target.value }
                                    : item
                                )
                              )
                            }
                            placeholder="0"
                            className={inputClassName}
                          />
                        </div>
                        <div className="flex items-end">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() =>
                              setOthers((current) => current.filter((item) => item.id !== row.id))
                            }
                            disabled={others.length === 1}
                            className={cn(softButtonClassName, 'w-full')}
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() =>
                        setOthers((current) => [...current, makeRow('Additional Charge', '')])
                      }
                      className={softButtonClassName}
                    >
                      Add Charge Row
                    </Button>
                  </div>
                ) : null}
              </div>
            </SurfaceCard>
          </div>

          <aside className="space-y-4">
            <SurfaceCard eyebrow="Summary" title="Current bill" className="p-3">
              <div className="space-y-3">
                <div className="grid gap-2 rounded-lg border border-border/90 bg-[#111923] p-3">
                  <div className="flex items-center justify-between text-[13px]">
                    <span className="text-slate-400 font-medium">Patient</span>
                    <span className="text-slate-100">{patient.name || 'Walk-in'}</span>
                  </div>
                  <div className="flex items-center justify-between text-[13px]">
                    <span className="text-slate-400 font-medium">Shift</span>
                    <span className="text-slate-100">{shift}</span>
                  </div>
                  <div className="flex items-center justify-between text-[13px]">
                    <span className="text-slate-400 font-medium">Date</span>
                    <span className="text-slate-100">{billDate}</span>
                  </div>
                </div>
                <div className="space-y-2 rounded-lg border border-border/90 bg-white/2 p-3">
                  {summary.map((item) => (
                    <div key={item.label} className="flex items-center justify-between text-[13px]">
                      <span className="text-slate-400 font-medium">{item.label}</span>
                      <span className="text-slate-100">{money(item.value)}</span>
                    </div>
                  ))}
                </div>
                {activeOperation === 'dental' ? (
                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-lg border border-border/90 bg-white/2 p-2.5">
                      <p className="text-[9px] uppercase tracking-wider text-slate-500 font-semibold">
                        In-house
                      </p>
                      <p className="text-sm font-semibold text-primary">
                        {money(dentalSplit.inHouse)}
                      </p>
                    </div>
                    <div className="rounded-lg border border-border/90 bg-white/2 p-2.5">
                      <p className="text-[9px] uppercase tracking-wider text-slate-500 font-semibold">
                        Referred
                      </p>
                      <p className="text-sm font-semibold text-slate-100">
                        {money(dentalSplit.referred)}
                      </p>
                    </div>
                  </div>
                ) : null}
                <div className="rounded-lg border border-primary/20 bg-[linear-gradient(180deg,rgba(24,56,74,0.92),rgba(19,46,61,0.96))] p-4 text-center">
                  <p className="text-[10px] uppercase tracking-widest text-primary font-bold">
                    Grand Total
                  </p>
                  <p className="mt-1 text-2xl font-bold tracking-tight text-white">
                    {money(total)}
                  </p>
                </div>
                <div className="grid gap-2">
                  <Button
                    type="button"
                    onClick={() => window.print()}
                    className="h-10 rounded-md bg-primary text-primary-foreground text-xs font-semibold shadow-[0_14px_28px_rgba(34,211,238,0.22)] hover:bg-primary/90"
                  >
                    Generate And Print Bill
                  </Button>
                </div>
              </div>
            </SurfaceCard>
          </aside>
        </div>
      </div>
    </main>
  )
}

export default App
