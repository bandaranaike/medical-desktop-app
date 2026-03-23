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
  'h-11 rounded-lg border-white/10 bg-white/3 text-[15px] text-white shadow-none placeholder:text-slate-500 focus-visible:border-cyan-300/60 focus-visible:ring-2 focus-visible:ring-cyan-300/30'
const selectClassName =
  'flex h-11 w-full rounded-lg border border-white/10 bg-white/3 px-3 text-[15px] text-white outline-none transition focus:border-cyan-300/60 focus:ring-2 focus:ring-cyan-300/30'
const softButtonClassName =
  'border-white/10 bg-white/[0.04] text-slate-100 hover:border-cyan-300/30 hover:bg-cyan-300/10 hover:text-white'

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
    <label className="mb-2 block text-xs font-medium uppercase tracking-[0.2em] text-slate-400">
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
        <div className="absolute inset-x-0 top-full z-20 mt-2 rounded-lg border border-white/10 bg-[#11161e] p-2 shadow-2xl">
          {results.map((user) => (
            <button
              key={user.id}
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => onSelect(user)}
              className="flex w-full items-center justify-between rounded-md px-3 py-3 text-left transition hover:bg-white/6"
            >
              <span>
                <span className="block text-sm font-medium text-white">
                  {user.name || 'Unnamed Patient'}
                </span>
                <span className="block text-xs text-slate-400">
                  {user.telephone || user.registrationNo || user.email || 'No details'}
                </span>
              </span>
              <span className="text-xs text-cyan-300">Autofill</span>
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

  const doctor =
    activeOperation === 'opd'
      ? doctors.find((item) => item.id === opd.doctorId)
      : activeOperation === 'channeling'
        ? doctors.find((item) => item.id === channeling.doctorId)
        : activeOperation === 'dental'
          ? doctors.find((item) => item.id === dental.doctorId)
          : undefined

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
    <main className="min-h-screen px-4 py-6 text-white sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-365 flex-col gap-8">
        <section className="relative overflow-hidden rounded-[20px] border border-white/10 bg-[#0d1218]/95 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.5)]">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.14),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.12),transparent_30%)]" />
          <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-3">
              <span className="inline-flex rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.28em] text-cyan-200">
                Medical Center Billing
              </span>
              <div>
                <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                  Simple billing flow for clinic operators
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400 sm:text-base">
                  Search patient details, select the visit type, enter charges, and generate a
                  print-ready bill from one screen.
                </p>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-[14px] border border-white/10 bg-white/3 px-4 py-3">
                <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500">Date</p>
                <Input
                  type="date"
                  value={billDate}
                  onChange={(event) => setBillDate(event.target.value)}
                  className={cn(inputClassName, 'mt-2 border-0 bg-transparent px-0 py-0')}
                />
              </div>
              <div className="rounded-[14px] border border-white/10 bg-white/3 px-4 py-3 sm:col-span-2">
                <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500">Shift</p>
                <div className="mt-3 flex rounded-lg border border-white/10 bg-[#0c1117] p-1">
                  {(['Morning', 'Evening'] as Shift[]).map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setShift(option)}
                      className={cn(
                        'flex-1 rounded-md px-4 py-2 text-sm font-medium transition',
                        shift === option
                          ? 'bg-cyan-400 text-slate-950 shadow-[0_10px_24px_rgba(34,211,238,0.28)]'
                          : 'text-slate-300 hover:bg-white/6'
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

        <div className="grid gap-8 xl:grid-cols-[minmax(0,1.95fr)_360px]">
          <div>
            <SurfaceCard
              eyebrow="Patient"
              title="Patient information"
              description="Name and telephone search existing records and autofill the available fields."
            >
              <div className="grid gap-x-5 gap-y-8 md:grid-cols-2 xl:grid-cols-3">
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
                <div className="md:col-span-2 xl:col-span-1">
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
            <div className="h-8" />
            <SurfaceCard
              eyebrow="Visit Type"
              title="Billing operation"
              description="Switch between operation types without losing the values already entered."
            >
              <div className="space-y-8">
                <OperationTabs value={activeOperation} onChange={setActiveOperation} />
                {activeOperation === 'opd' ? (
                  <div className="grid gap-x-5 gap-y-8 lg:grid-cols-2">
                    <div className="mb-1 lg:col-span-2">
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
                  <div className="grid gap-x-5 gap-y-8 lg:grid-cols-2">
                    <div className="mb-1 lg:col-span-2">
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
                  <div className="space-y-8">
                    <div className="grid gap-x-5 gap-y-8 lg:grid-cols-[minmax(0,1.2fr)_220px]">
                      <div className="mb-1">
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
                    <div className="space-y-6">
                      {dental.rows.map((row) => {
                        const split = splitDental(
                          num(row.amount),
                          doctors.find((item) => item.id === dental.doctorId)
                        )
                        return (
                          <div
                            key={row.id}
                            className="grid gap-3 rounded-[14px] border border-white/10 bg-white/3 p-4 lg:grid-cols-[minmax(0,1.1fr)_220px_240px_auto]"
                          >
                            <div>
                              <Label>Charge Label</Label>
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
                                placeholder="Dental treatment name"
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
                            <div className="grid gap-2 rounded-xl border border-white/10 bg-[#0d1218] p-3">
                              <div className="flex items-center justify-between text-xs uppercase tracking-[0.18em] text-slate-500">
                                <span>Split</span>
                                <span>
                                  {doctor?.dentalSplitMode === 'fixed'
                                    ? `Fixed ${money(doctor.dentalSplitValue)}`
                                    : `${doctor?.dentalSplitValue ?? 0}% In-house`}
                                </span>
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <div className="rounded-[10px] border border-white/8 bg-white/3 p-3">
                                  <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500">
                                    In-house
                                  </p>
                                  <p className="mt-2 text-sm font-semibold text-cyan-200">
                                    {money(split.inHouse)}
                                  </p>
                                </div>
                                <div className="rounded-[10px] border border-white/8 bg-white/3 p-3">
                                  <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500">
                                    Referred
                                  </p>
                                  <p className="mt-2 text-sm font-semibold text-slate-100">
                                    {money(split.referred)}
                                  </p>
                                </div>
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
                                className={cn(softButtonClassName, 'w-full rounded-lg')}
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
                      className={cn(softButtonClassName, 'rounded-lg')}
                    >
                      Add Dental Charge
                    </Button>
                  </div>
                ) : null}
                {activeOperation === 'others' ? (
                  <div className="space-y-6">
                    {others.map((row) => (
                      <div
                        key={row.id}
                        className="grid gap-3 rounded-[14px] border border-white/10 bg-white/3 p-4 lg:grid-cols-[minmax(0,1fr)_220px_auto]"
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
                            className={cn(softButtonClassName, 'w-full rounded-lg')}
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
                      className={cn(softButtonClassName, 'rounded-lg')}
                    >
                      Add Charge Row
                    </Button>
                  </div>
                ) : null}
              </div>
            </SurfaceCard>
          </div>

          <div>
            <SurfaceCard
              eyebrow="Doctor"
              title={doctor ? doctor.name : 'No doctor selected'}
              description={
                doctor
                  ? `${doctor.specialty} - ${doctor.telephone}`
                  : 'Select a doctor for OPD, Channeling, or Dental operations.'
              }
            >
              {doctor ? (
                <div className="grid gap-5 sm:grid-cols-2 my-6">
                  <div className="rounded-xl border border-white/10 bg-white/3 p-4">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Email</p>
                    <p className="mt-2 text-sm text-slate-100">{doctor.email}</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/3 p-4">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
                      Address
                    </p>
                    <p className="mt-2 text-sm text-slate-100">{doctor.address}</p>
                  </div>
                  {activeOperation === 'dental' ? (
                    <div className="rounded-xl border border-cyan-300/20 bg-cyan-300/8 p-4 sm:col-span-2">
                      <p className="text-[11px] uppercase tracking-[0.18em] text-cyan-200/80">
                        Dental Split Rule
                      </p>
                      <p className="mt-2 text-sm leading-6 text-cyan-50">
                        {doctor.dentalSplitMode === 'fixed'
                          ? `In-house charge is fixed at ${money(doctor.dentalSplitValue)} per entered charge.`
                          : `In-house charge is ${doctor.dentalSplitValue}% of each entered dental charge.`}
                      </p>
                    </div>
                  ) : null}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-white/10 bg-white/3 p-6 text-sm text-slate-400">
                  The current operation does not require a doctor selection yet.
                </div>
              )}
            </SurfaceCard>
            <div className="h-8" />
            <SurfaceCard
              eyebrow="Summary"
              title="Current bill"
              description="Review the values before generating the print view."
            >
              <div>
                <div className="grid gap-5 rounded-[14px] border border-white/10 bg-[#0d1218] p-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">Patient</span>
                    <span className="font-medium text-slate-100">
                      {patient.name || 'Walk-in patient'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">Shift</span>
                    <span className="font-medium text-slate-100">{shift}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">Date</span>
                    <span className="font-medium text-slate-100">{billDate}</span>
                  </div>
                </div>
                <div className="h-5" />
                <div className="space-y-4 rounded-[14px] border border-white/10 bg-white/3 p-4">
                  {summary.map((item) => (
                    <div key={item.label} className="flex items-center justify-between text-sm">
                      <span className="text-slate-400">{item.label}</span>
                      <span className="font-medium text-slate-100">{money(item.value)}</span>
                    </div>
                  ))}
                </div>
                {activeOperation === 'dental' ? (
                  <>
                    <div className="h-5" />
                    <div className="grid gap-5 sm:grid-cols-2">
                      <div className="rounded-xl border border-white/10 bg-white/3 p-4">
                        <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
                          In-house total
                        </p>
                        <p className="mt-2 text-lg font-semibold text-cyan-200">
                          {money(dentalSplit.inHouse)}
                        </p>
                      </div>
                      <div className="rounded-xl border border-white/10 bg-white/3 p-4">
                        <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
                          Referred total
                        </p>
                        <p className="mt-2 text-lg font-semibold text-slate-100">
                          {money(dentalSplit.referred)}
                        </p>
                      </div>
                    </div>
                  </>
                ) : null}
                <div className="h-5" />
                <div className="rounded-2xl border border-cyan-300/20 bg-[linear-gradient(135deg,rgba(34,211,238,0.18),rgba(37,99,235,0.08))] p-5">
                  <p className="text-[11px] uppercase tracking-[0.22em] text-cyan-100/80">
                    Grand Total
                  </p>
                  <p className="mt-3 text-3xl font-semibold tracking-tight">{money(total)}</p>
                </div>
                <div className="h-5" />
                <div className="grid gap-5">
                  <Button
                    type="button"
                    onClick={() => window.print()}
                    className="h-12 rounded-lg bg-cyan-400 text-sm font-semibold text-slate-950 shadow-[0_14px_40px_rgba(34,211,238,0.28)] hover:bg-cyan-300"
                  >
                    Generate And Print Bill
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className={cn(softButtonClassName, 'h-11 rounded-lg')}
                  >
                    Save Draft Layout
                  </Button>
                </div>
              </div>
            </SurfaceCard>
          </div>
        </div>
      </div>
    </main>
  )
}

export default App
