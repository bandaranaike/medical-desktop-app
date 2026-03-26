import React, { useEffect, useEffectEvent, useState } from 'react'

import { OperationTabs, type OperationType } from '@/components/home/operation-tabs'
import { SurfaceCard } from '@/components/home/surface-card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ToastRegion, type ToastItem, type ToastTone } from '@/components/ui/toast-region'
import { cn } from '@/lib/utils'

type Shift = 'Morning' | 'Evening'
type SearchField = 'name' | 'telephone'

interface PatientInfo {
  id: number | null
  name: string
  telephone: string
  email: string
  age: string
  gender: string
  address: string
  registrationNo: string
}

interface PatientRecord {
  id: number
  name: string
  email: string
  telephone: string
  age: string
  address: string
  registrationNo: string
  gender: string
}

interface DoctorOption {
  id: number
  name: string
  specialty: string
  telephone: string
  email: string
  address: string
  doctorType: string
  dentalSplitMode: 'fixed' | 'percentage'
  dentalSplitValue: number
}

interface ChargeRow {
  id: string
  label: string
  amount: string
}

interface PrintLineItem {
  name: string
  price: string
}

interface AppNotification {
  level: ToastTone
  title: string
  message: string
}

type RendererApi = {
  searchPatients: (query: string) => Promise<PatientRecord[]>
  listDoctors: () => Promise<DoctorOption[]>
  submitBilling: (payload: {
    patient: PatientInfo
    doctorId: number
    total: number
    serviceType: 'opd' | 'specialist' | 'dental' | 'treatment'
    shift: 'morning' | 'evening'
    date: string
    doctorName: string
    paymentType: 'cash' | 'card' | 'online'
    items: PrintLineItem[]
  }) => Promise<{
    patient: PatientRecord
    bill: Record<string, unknown>
    print: Record<string, unknown>
  }>
  onAppNotification: (callback: (notification: AppNotification) => void) => () => void
}

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

function operationDoctorType(operation: OperationType): string {
  switch (operation) {
    case 'opd':
      return 'opd'
    case 'channeling':
      return 'specialist'
    case 'dental':
      return 'dental'
    case 'others':
      return 'treatment'
  }
}

function operationServiceType(
  operation: OperationType
): 'opd' | 'specialist' | 'dental' | 'treatment' {
  switch (operation) {
    case 'opd':
      return 'opd'
    case 'channeling':
      return 'specialist'
    case 'dental':
      return 'dental'
    case 'others':
      return 'treatment'
  }
}

function doctorOptionsForOperation(
  doctors: DoctorOption[],
  operation: OperationType
): DoctorOption[] {
  const matches = doctors.filter((doctor) => doctor.doctorType === operationDoctorType(operation))
  return matches.length > 0 ? matches : doctors
}

function billIdLabel(bill: Record<string, unknown>): string {
  if (typeof bill.id === 'number') return `Bill #${bill.id} created`
  if (typeof bill.bill_id === 'number') return `Bill #${bill.bill_id} created`
  if (typeof bill.uuid === 'string') return `Bill ${bill.uuid} created`
  return 'Bill created successfully'
}

function makeToast(level: ToastTone, title: string, message: string): ToastItem {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    level,
    title,
    message
  }
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
  results: PatientRecord[]
  activeField: SearchField | null
  onFocus: (field: SearchField) => void
  onBlur: () => void
  onChange: (value: string) => void
  onSelect: (user: PatientRecord) => void
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
                  {user.telephone || user.email || 'No details'}
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
    id: null,
    name: '',
    telephone: '',
    email: '',
    age: '',
    gender: 'Male',
    address: '',
    registrationNo: ''
  })
  const [activeField, setActiveField] = useState<SearchField | null>(null)
  const [searchResults, setSearchResults] = useState<PatientRecord[]>([])
  const [searchError, setSearchError] = useState('')
  const [doctors, setDoctors] = useState<DoctorOption[]>([])
  const [doctorError, setDoctorError] = useState('')
  const [doctorLoading, setDoctorLoading] = useState(true)
  const [submitState, setSubmitState] = useState<{
    status: 'idle' | 'loading' | 'success' | 'error'
    message: string
  }>({ status: 'idle', message: '' })
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const [opd, setOpd] = useState({ doctorId: 0, consultationFee: '', medicineFee: '' })
  const [channeling, setChanneling] = useState({
    doctorId: 0,
    consultationFee: '',
    bookingFee: ''
  })
  const [dental, setDental] = useState({
    doctorId: 0,
    registrationFee: '',
    rows: [makeRow('Consultation', ''), makeRow('Medicine', '')]
  })
  const [othersDoctorId, setOthersDoctorId] = useState(0)
  const [others, setOthers] = useState<ChargeRow[]>([
    makeRow('Report Charge', ''),
    makeRow('Treatment Charge', '')
  ])
  const dismissToast = useEffectEvent((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
  })
  const pushToast = useEffectEvent((level: ToastTone, title: string, message: string) => {
    setToasts((current) => [...current.slice(-3), makeToast(level, title, message)])
  })

  useEffect(() => {
    return api.onAppNotification((notification) => {
      pushToast(notification.level, notification.title, notification.message)
    })
  }, [api, pushToast])

  useEffect(() => {
    let cancelled = false

    void api
      .listDoctors()
      .then((records) => {
        if (cancelled) return
        setDoctors(records)
        setDoctorError('')
      })
      .catch((error: unknown) => {
        if (cancelled) return
        const message = error instanceof Error ? error.message : 'Failed to load doctors'
        setDoctors([])
        setDoctorError(message)
        pushToast('error', 'Doctor list unavailable', message)
      })
      .finally(() => {
        if (!cancelled) {
          setDoctorLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [api])

  useEffect(() => {
    if (doctors.length === 0) return

    const opdDefault = doctorOptionsForOperation(doctors, 'opd')[0]?.id ?? doctors[0].id
    const channelingDefault =
      doctorOptionsForOperation(doctors, 'channeling')[0]?.id ?? doctors[0].id
    const dentalDefault = doctorOptionsForOperation(doctors, 'dental')[0]?.id ?? doctors[0].id
    const othersDefault = doctorOptionsForOperation(doctors, 'others')[0]?.id ?? doctors[0].id

    setOpd((current) => ({ ...current, doctorId: current.doctorId || opdDefault }))
    setChanneling((current) => ({
      ...current,
      doctorId: current.doctorId || channelingDefault
    }))
    setDental((current) => ({ ...current, doctorId: current.doctorId || dentalDefault }))
    setOthersDoctorId((current) => current || othersDefault)
  }, [doctors])

  useEffect(() => {
    const query =
      activeField === 'name' ? patient.name : activeField === 'telephone' ? patient.telephone : ''
    if (!activeField || query.trim().length < 2) {
      setSearchResults([])
      setSearchError('')
      return
    }
    const timer = setTimeout(() => {
      void api
        .searchPatients(query.trim())
        .then((records) => {
          setSearchResults(records)
          setSearchError('')
        })
        .catch((error: unknown) => {
          const message = error instanceof Error ? error.message : 'Failed to search patients'
          setSearchResults([])
          setSearchError(message)
          pushToast('warning', 'Patient search failed', message)
        })
    }, 220)
    return () => clearTimeout(timer)
  }, [activeField, api, patient.name, patient.telephone, pushToast])

  const setPatientField = (key: keyof PatientInfo, value: string | number | null): void => {
    setPatient((current) => ({ ...current, [key]: value }))
    if (submitState.status !== 'idle') {
      setSubmitState({ status: 'idle', message: '' })
    }
  }

  const fillPatient = (user: PatientRecord): void => {
    setPatient({
      id: user.id,
      name: user.name ?? '',
      telephone: user.telephone ?? '',
      email: user.email ?? '',
      age: user.age ?? '',
      address: user.address ?? '',
      registrationNo: user.registrationNo ?? '',
      gender: user.gender ? user.gender[0].toUpperCase() + user.gender.slice(1) : 'Male'
    })
    setSearchResults([])
    setSearchError('')
    setActiveField(null)
    setSubmitState({ status: 'idle', message: '' })
  }

  const dentalDoctor = doctors.find((item) => item.id === dental.doctorId)
  const dentalSplit = dental.rows.reduce(
    (total, row) => {
      const split = splitDental(num(row.amount), dentalDoctor)
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
  const currentDoctorId =
    activeOperation === 'opd'
      ? opd.doctorId
      : activeOperation === 'channeling'
        ? channeling.doctorId
        : activeOperation === 'dental'
          ? dental.doctorId
          : othersDoctorId
  const currentDoctor = doctors.find((item) => item.id === currentDoctorId)
  const currentDoctorOptions = doctorOptionsForOperation(doctors, activeOperation)

  const handleSubmit = async (): Promise<void> => {
    if (!patient.name.trim()) {
      const message = 'Patient name is required.'
      setSubmitState({ status: 'error', message })
      pushToast('warning', 'Missing patient name', message)
      return
    }
    if (!patient.telephone.trim()) {
      const message = 'Patient telephone is required.'
      setSubmitState({ status: 'error', message })
      pushToast('warning', 'Missing telephone number', message)
      return
    }
    if (!patient.age.trim() || Number(patient.age) <= 0) {
      const message = 'Patient age must be a valid number.'
      setSubmitState({ status: 'error', message })
      pushToast('warning', 'Invalid patient age', message)
      return
    }
    if (!currentDoctorId) {
      const message = 'Select a doctor before generating the bill.'
      setSubmitState({ status: 'error', message })
      pushToast('warning', 'Doctor required', message)
      return
    }
    if (total <= 0) {
      const message = 'Enter at least one bill amount before printing.'
      setSubmitState({ status: 'error', message })
      pushToast('warning', 'Missing bill amount', message)
      return
    }

    setSubmitState({ status: 'loading', message: 'Saving patient and creating bill...' })

    try {
      const printItems = summary
        .filter((item) => item.value > 0)
        .map<PrintLineItem>((item) => ({
          name: item.label,
          price: item.value.toFixed(2)
        }))

      const result = await api.submitBilling({
        patient,
        doctorId: currentDoctorId,
        total,
        serviceType: operationServiceType(activeOperation),
        shift: shift.toLowerCase() as 'morning' | 'evening',
        date: billDate,
        doctorName: currentDoctor?.name ?? '',
        paymentType: 'cash',
        items: printItems
      })

      fillPatient(result.patient)
      setSubmitState({ status: 'success', message: billIdLabel(result.bill) })
      pushToast('success', 'Bill created', billIdLabel(result.bill))
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create bill'
      setSubmitState({
        status: 'error',
        message
      })
      pushToast('error', 'Billing failed', message)
    }
  }

  return (
    <main className="min-h-screen p-4 text-white sm:p-5">
      <ToastRegion toasts={toasts} onDismiss={dismissToast} />
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
                    setSearchError('')
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
                    setSearchError('')
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
                <div>
                  <Label>Registration No</Label>
                  <Input
                    value={patient.registrationNo}
                    onChange={(event) => setPatientField('registrationNo', event.target.value)}
                    placeholder="Registration number"
                    className={inputClassName}
                  />
                </div>
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
                {searchError ? (
                  <div className="md:col-span-2 xl:col-span-3 rounded-lg border border-amber-400/25 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
                    {searchError}
                  </div>
                ) : null}
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
                          setOpd((current) => ({
                            ...current,
                            doctorId: Number(event.target.value)
                          }))
                        }
                        className={selectClassName}
                        disabled={doctorLoading || currentDoctorOptions.length === 0}
                      >
                        {currentDoctorOptions.map((item) => (
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
                          setChanneling((current) => ({
                            ...current,
                            doctorId: Number(event.target.value)
                          }))
                        }
                        className={selectClassName}
                        disabled={doctorLoading || currentDoctorOptions.length === 0}
                      >
                        {currentDoctorOptions.map((item) => (
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
                            setDental((current) => ({
                              ...current,
                              doctorId: Number(event.target.value)
                            }))
                          }
                          className={selectClassName}
                          disabled={doctorLoading || currentDoctorOptions.length === 0}
                        >
                          {currentDoctorOptions.map((item) => (
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
                    <div>
                      <Label>Doctor</Label>
                      <select
                        value={othersDoctorId}
                        onChange={(event) => setOthersDoctorId(Number(event.target.value))}
                        className={selectClassName}
                        disabled={doctorLoading || currentDoctorOptions.length === 0}
                      >
                        {currentDoctorOptions.map((item) => (
                          <option key={item.id} value={item.id} className="bg-slate-900">
                            {item.name} - {item.specialty}
                          </option>
                        ))}
                      </select>
                    </div>
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
                {doctorError ? (
                  <div className="rounded-lg border border-amber-400/25 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
                    {doctorError}
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
                {submitState.status !== 'idle' ? (
                  <div
                    className={cn(
                      'rounded-lg px-3 py-2 text-xs',
                      submitState.status === 'success'
                        ? 'border border-emerald-400/25 bg-emerald-500/10 text-emerald-100'
                        : submitState.status === 'error'
                          ? 'border border-rose-400/25 bg-rose-500/10 text-rose-100'
                          : 'border border-primary/20 bg-primary/10 text-primary'
                    )}
                  >
                    {submitState.message}
                  </div>
                ) : null}
                <div className="grid gap-2">
                  <Button
                    type="button"
                    onClick={() => void handleSubmit()}
                    disabled={
                      submitState.status === 'loading' ||
                      doctorLoading ||
                      doctors.length === 0 ||
                      currentDoctorOptions.length === 0
                    }
                    className="h-10 rounded-md bg-primary text-primary-foreground text-xs font-semibold shadow-[0_14px_28px_rgba(34,211,238,0.22)] hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {submitState.status === 'loading'
                      ? 'Saving And Creating Bill...'
                      : 'Generate And Print Bill'}
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
