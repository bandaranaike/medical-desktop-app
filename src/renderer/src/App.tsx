import React, { useEffect, useState } from 'react'

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
  dateOfBirth: string
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
  dateOfBirth: string
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

interface BookingRecord {
  billId: number
  reference: string
  bookingNumber: number | null
  date: string
  doctorName: string
  doctorSpecialty: string
}

interface StoredFieldDefaults {
  opd: Record<number, { consultationFee: string; medicineFee: string }>
  channeling: Record<number, { consultationFee: string; bookingFee: string }>
  dental: Record<number, { registrationFee: string }>
}

interface RecentServicePreset {
  key: string
  operation: 'dental' | 'others'
  label: string
  amount: string
  doctorId: number | null
  useCount: number
  lastUsedAt: string
}

interface FormPreferences {
  fieldDefaults: StoredFieldDefaults
  recentServices: RecentServicePreset[]
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
  submitBooking: (payload: {
    patient: PatientInfo
    doctorId: number
    doctorType: 'specialist' | 'dental'
    date: string
  }) => Promise<BookingRecord>
  printReceipt: (payload: {
    billId: number
    billReference: string
    patientName: string
    doctorName: string
    paymentType: 'cash' | 'card' | 'online'
    items: PrintLineItem[]
    total: number
  }) => Promise<Record<string, unknown>>
  onAppNotification: (callback: (notification: AppNotification) => void) => () => void
}

const inputClassName =
  'h-9 rounded-md border-border/90 bg-white/[0.035] text-sm text-white placeholder:text-slate-500 focus-visible:border-primary/70 focus-visible:ring-primary/20'
const selectClassName =
  'flex h-9 w-full rounded-md border border-border/90 bg-white/[0.035] px-3 text-sm text-white outline-none transition focus:border-primary/70 focus:ring-2 focus:ring-primary/20'
const softButtonClassName =
  'h-8 border-border/90 bg-white/[0.04] text-xs text-slate-200 transition-all hover:border-primary/35 hover:bg-primary/10 hover:text-white'
const FORM_PREFERENCES_KEY = 'medical-center-form-preferences-v1'
const EMPTY_PREFERENCES: FormPreferences = {
  fieldDefaults: {
    opd: {},
    channeling: {},
    dental: {}
  },
  recentServices: []
}

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

function normalizePatientName(value: string): string {
  return value.trim().replace(/\s+/g, ' ').toLowerCase()
}

function normalizePatientPhone(value: string): string {
  return value.replace(/\D/g, '')
}

function parseDisplayDate(value: string): Date | null {
  const match = value.trim().match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  if (!match) return null

  const [, day, month, year] = match
  const date = new Date(Number(year), Number(month) - 1, Number(day))

  if (Number.isNaN(date.getTime())) return null
  if (date.getFullYear() !== Number(year)) return null
  if (date.getMonth() !== Number(month) - 1) return null
  if (date.getDate() !== Number(day)) return null

  return date
}

function formatDisplayDate(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = String(date.getFullYear())
  return `${day}/${month}/${year}`
}

function calculateAgeFromDate(value: string): string {
  const birthDate = parseDisplayDate(value)
  if (!birthDate) return ''

  const today = new Date()
  let age = today.getFullYear() - birthDate.getFullYear()
  const monthDelta = today.getMonth() - birthDate.getMonth()

  if (monthDelta < 0 || (monthDelta === 0 && today.getDate() < birthDate.getDate())) {
    age -= 1
  }

  return age >= 0 ? String(age) : ''
}

function calculateDateOfBirthFromAge(value: string): string {
  const parsedAge = Number(value)
  if (!Number.isFinite(parsedAge) || parsedAge < 0) return ''

  const today = new Date()
  const birthDate = new Date(today.getFullYear() - parsedAge, today.getMonth(), today.getDate())
  return formatDisplayDate(birthDate)
}

function loadFormPreferences(): FormPreferences {
  if (typeof window === 'undefined') return EMPTY_PREFERENCES

  try {
    const raw = window.localStorage.getItem(FORM_PREFERENCES_KEY)
    if (!raw) return EMPTY_PREFERENCES

    const parsed = JSON.parse(raw) as Partial<FormPreferences>
    return {
      fieldDefaults: {
        opd: parsed.fieldDefaults?.opd ?? {},
        channeling: parsed.fieldDefaults?.channeling ?? {},
        dental: parsed.fieldDefaults?.dental ?? {}
      },
      recentServices: Array.isArray(parsed.recentServices) ? parsed.recentServices : []
    }
  } catch {
    return EMPTY_PREFERENCES
  }
}

function saveFormPreferences(preferences: FormPreferences): void {
  if (typeof window === 'undefined') return

  try {
    window.localStorage.setItem(FORM_PREFERENCES_KEY, JSON.stringify(preferences))
  } catch {
    // Ignore local persistence errors and keep the form usable.
  }
}

function upsertRecentServices(
  current: RecentServicePreset[],
  incoming: RecentServicePreset[]
): RecentServicePreset[] {
  const next = [...current]

  for (const preset of incoming) {
    const existingIndex = next.findIndex((item) => item.key === preset.key)
    if (existingIndex >= 0) {
      const existing = next[existingIndex]
      next[existingIndex] = {
        ...existing,
        ...preset,
        useCount: Math.max(existing.useCount + 1, preset.useCount)
      }
      continue
    }

    next.push(preset)
  }

  return next
    .sort((left, right) => {
      if (left.lastUsedAt === right.lastUsedAt) return right.useCount - left.useCount
      return right.lastUsedAt.localeCompare(left.lastUsedAt)
    })
    .slice(0, 12)
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

function defaultDoctorIdForOperation(doctors: DoctorOption[], operation: OperationType): number {
  return doctorOptionsForOperation(doctors, operation)[0]?.id ?? doctors[0]?.id ?? 0
}

function applyOpdDoctorDefaults(
  current: { doctorId: number; consultationFee: string; medicineFee: string },
  doctorId: number,
  defaults?: { consultationFee: string; medicineFee: string }
): { doctorId: number; consultationFee: string; medicineFee: string } {
  const next = {
    ...current,
    doctorId,
    consultationFee: current.consultationFee || defaults?.consultationFee || '',
    medicineFee: current.medicineFee || defaults?.medicineFee || ''
  }

  return next.doctorId === current.doctorId &&
    next.consultationFee === current.consultationFee &&
    next.medicineFee === current.medicineFee
    ? current
    : next
}

function applyChannelingDoctorDefaults(
  current: { doctorId: number; consultationFee: string; bookingFee: string },
  doctorId: number,
  defaults?: { consultationFee: string; bookingFee: string }
): { doctorId: number; consultationFee: string; bookingFee: string } {
  const next = {
    ...current,
    doctorId,
    consultationFee: current.consultationFee || defaults?.consultationFee || '',
    bookingFee: current.bookingFee || defaults?.bookingFee || ''
  }

  return next.doctorId === current.doctorId &&
    next.consultationFee === current.consultationFee &&
    next.bookingFee === current.bookingFee
    ? current
    : next
}

function applyDentalDoctorDefaults(
  current: { doctorId: number; registrationFee: string; rows: ChargeRow[] },
  doctorId: number,
  defaults?: { registrationFee: string }
): { doctorId: number; registrationFee: string; rows: ChargeRow[] } {
  const next = {
    ...current,
    doctorId,
    registrationFee: current.registrationFee || defaults?.registrationFee || ''
  }

  return next.doctorId === current.doctorId && next.registrationFee === current.registrationFee
    ? current
    : next
}

function billIdLabel(bill: Record<string, unknown>): string {
  if (typeof bill.id === 'number') return `Bill #${bill.id} created`
  if (typeof bill.bill_id === 'number') return `Bill #${bill.bill_id} created`
  if (typeof bill.uuid === 'string') return `Bill ${bill.uuid} created`
  return 'Bill created successfully'
}

function bookingDoctorTypeForOperation(operation: OperationType): 'specialist' | 'dental' | null {
  if (operation === 'channeling') return 'specialist'
  if (operation === 'dental') return 'dental'
  return null
}

function bookingLabel(booking: BookingRecord): string {
  if (booking.bookingNumber) {
    return `Booking #${booking.bookingNumber} saved`
  }
  if (booking.reference) {
    return `Booking ${booking.reference} saved`
  }
  return 'Booking saved successfully'
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
  const [isBooking, setIsBooking] = useState(false)
  const [shift, setShift] = useState<Shift>('Morning')
  const [billDate, setBillDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [patient, setPatient] = useState<PatientInfo>({
    id: null,
    name: '',
    telephone: '',
    email: '',
    dateOfBirth: '',
    age: '',
    gender: 'Male',
    address: '',
    registrationNo: ''
  })
  const [selectedPatientSnapshot, setSelectedPatientSnapshot] = useState<{
    id: number
    name: string
    telephone: string
  } | null>(null)
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
  const [formPreferences, setFormPreferences] = useState<FormPreferences>(() =>
    loadFormPreferences()
  )
  const [savedBooking, setSavedBooking] = useState<{
    record: BookingRecord
    draftSignature: string
  } | null>(null)
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
  const dismissToast = (id: string): void => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }
  const pushToast = (level: ToastTone, title: string, message: string): void => {
    setToasts((current) => [...current.slice(-3), makeToast(level, title, message)])
  }
  const {
    opd: opdFieldDefaults,
    channeling: channelingFieldDefaults,
    dental: dentalFieldDefaults
  } = formPreferences.fieldDefaults

  useEffect(() => {
    return api.onAppNotification((notification) => {
      setToasts((current) => [
        ...current.slice(-3),
        makeToast(notification.level, notification.title, notification.message)
      ])
    })
  }, [api])

  useEffect(() => {
    let cancelled = false

    void api
      .listDoctors()
      .then((records) => {
        if (cancelled) return
        setDoctors(records)
        setDoctorError('')
        if (records.length === 0) return

        const opdDoctorId = defaultDoctorIdForOperation(records, 'opd')
        const channelingDoctorId = defaultDoctorIdForOperation(records, 'channeling')
        const dentalDoctorId = defaultDoctorIdForOperation(records, 'dental')
        const othersDoctorId = defaultDoctorIdForOperation(records, 'others')

        setOpd((current) =>
          applyOpdDoctorDefaults(
            current,
            current.doctorId || opdDoctorId,
            opdFieldDefaults[current.doctorId || opdDoctorId]
          )
        )
        setChanneling((current) =>
          applyChannelingDoctorDefaults(
            current,
            current.doctorId || channelingDoctorId,
            channelingFieldDefaults[current.doctorId || channelingDoctorId]
          )
        )
        setDental((current) =>
          applyDentalDoctorDefaults(
            current,
            current.doctorId || dentalDoctorId,
            dentalFieldDefaults[current.doctorId || dentalDoctorId]
          )
        )
        setOthersDoctorId((current) => current || othersDoctorId)
      })
      .catch((error: unknown) => {
        if (cancelled) return
        const message = error instanceof Error ? error.message : 'Failed to load doctors'
        setDoctors([])
        setDoctorError(message)
        setToasts((current) => [
          ...current.slice(-3),
          makeToast('error', 'Doctor list unavailable', message)
        ])
      })
      .finally(() => {
        if (!cancelled) {
          setDoctorLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [api, channelingFieldDefaults, dentalFieldDefaults, opdFieldDefaults])

  useEffect(() => {
    const query =
      activeField === 'name' ? patient.name : activeField === 'telephone' ? patient.telephone : ''
    if (!activeField || query.trim().length < 2) return

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
          setToasts((current) => [
            ...current.slice(-3),
            makeToast('warning', 'Patient search failed', message)
          ])
        })
    }, 220)
    return () => clearTimeout(timer)
  }, [activeField, api, patient.name, patient.telephone])

  const setPatientField = (key: keyof PatientInfo, value: string | number | null): void => {
    setPatient((current) => ({ ...current, [key]: value }))
    if (submitState.status !== 'idle') {
      setSubmitState({ status: 'idle', message: '' })
    }
  }

  const handlePatientIdentityFieldChange = (key: 'name' | 'telephone', value: string): void => {
    const nextPatient = { ...patient, [key]: value }
    const selectedName = normalizePatientName(selectedPatientSnapshot?.name ?? '')
    const selectedTelephone = normalizePatientPhone(selectedPatientSnapshot?.telephone ?? '')
    const nextName = normalizePatientName(nextPatient.name)
    const nextTelephone = normalizePatientPhone(nextPatient.telephone)
    const movedAwayFromSelectedPatient =
      !!selectedPatientSnapshot &&
      !!nextName &&
      !!nextTelephone &&
      nextName !== selectedName &&
      nextTelephone !== selectedTelephone

    setPatient({
      ...nextPatient,
      id: movedAwayFromSelectedPatient ? null : nextPatient.id
    })
    setSearchResults([])
    setSearchError('')

    if (movedAwayFromSelectedPatient) {
      setSelectedPatientSnapshot(null)
      setActiveField(null)
    }

    if (submitState.status !== 'idle') {
      setSubmitState({ status: 'idle', message: '' })
    }
  }

  const setPatientDateOfBirth = (value: string): void => {
    setPatient((current) => {
      const next = { ...current, dateOfBirth: value }
      const calculatedAge = calculateAgeFromDate(value)

      if (calculatedAge) {
        next.age = calculatedAge
      }

      return next
    })

    if (submitState.status !== 'idle') {
      setSubmitState({ status: 'idle', message: '' })
    }
  }

  const setPatientAge = (value: string): void => {
    setPatient((current) => {
      const next = { ...current, age: value }
      const calculatedDateOfBirth = calculateDateOfBirthFromAge(value)

      if (calculatedDateOfBirth) {
        next.dateOfBirth = calculatedDateOfBirth
      }

      return next
    })

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
      dateOfBirth: user.dateOfBirth ?? '',
      age: user.age ?? '',
      address: user.address ?? '',
      registrationNo: user.registrationNo ?? '',
      gender: user.gender ? user.gender[0].toUpperCase() + user.gender.slice(1) : 'Male'
    })
    setSelectedPatientSnapshot({
      id: user.id,
      name: user.name ?? '',
      telephone: user.telephone ?? ''
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
  const printableItems = summary
    .filter((item) => item.value > 0)
    .map<PrintLineItem>((item) => ({
      name: item.label,
      price: item.value.toFixed(2)
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
  const bookingDoctorType = bookingDoctorTypeForOperation(activeOperation)
  const recentServicePresets = formPreferences.recentServices.filter(
    (item) => item.operation === 'dental' || item.operation === 'others'
  )
  const bookingDraftSignature = JSON.stringify({
    isBooking,
    activeOperation,
    billDate,
    patient,
    currentDoctorId,
    printableItems,
    total
  })
  const activeSearchQuery =
    activeField === 'name' ? patient.name : activeField === 'telephone' ? patient.telephone : ''
  const canShowSearchFeedback = !!activeField && activeSearchQuery.trim().length >= 2
  const currentSavedBooking =
    savedBooking?.draftSignature === bookingDraftSignature ? savedBooking : null

  const persistFormPreferences = (updater: (current: FormPreferences) => FormPreferences): void => {
    setFormPreferences((current) => {
      const next = updater(current)
      saveFormPreferences(next)
      return next
    })
  }

  const rememberCurrentDefaults = (): void => {
    persistFormPreferences((current) => {
      const next: FormPreferences = {
        fieldDefaults: {
          opd: { ...current.fieldDefaults.opd },
          channeling: { ...current.fieldDefaults.channeling },
          dental: { ...current.fieldDefaults.dental }
        },
        recentServices: current.recentServices
      }

      if (opd.doctorId) {
        next.fieldDefaults.opd[opd.doctorId] = {
          consultationFee: opd.consultationFee,
          medicineFee: opd.medicineFee
        }
      }

      if (channeling.doctorId) {
        next.fieldDefaults.channeling[channeling.doctorId] = {
          consultationFee: channeling.consultationFee,
          bookingFee: channeling.bookingFee
        }
      }

      if (dental.doctorId) {
        next.fieldDefaults.dental[dental.doctorId] = {
          registrationFee: dental.registrationFee
        }
      }

      const timestamp = new Date().toISOString()
      const servicePresets: RecentServicePreset[] = [
        ...dental.rows
          .filter((row) => row.label.trim() && num(row.amount) > 0)
          .map((row) => ({
            key: `dental:${dental.doctorId || 'any'}:${row.label.trim().toLowerCase()}`,
            operation: 'dental' as const,
            label: row.label.trim(),
            amount: row.amount,
            doctorId: dental.doctorId || null,
            useCount: 1,
            lastUsedAt: timestamp
          })),
        ...others
          .filter((row) => row.label.trim() && num(row.amount) > 0)
          .map((row) => ({
            key: `others:${othersDoctorId || 'any'}:${row.label.trim().toLowerCase()}`,
            operation: 'others' as const,
            label: row.label.trim(),
            amount: row.amount,
            doctorId: othersDoctorId || null,
            useCount: 1,
            lastUsedAt: timestamp
          }))
      ]

      next.recentServices = upsertRecentServices(current.recentServices, servicePresets)
      return next
    })
  }

  const applyRecentServicePreset = (preset: RecentServicePreset): void => {
    if (preset.operation === 'dental') {
      setActiveOperation('dental')
      setDental((current) => {
        const alreadyExists = current.rows.some(
          (row) => row.label.trim().toLowerCase() === preset.label.trim().toLowerCase()
        )
        if (alreadyExists) {
          return {
            ...current,
            rows: current.rows.map((row) =>
              row.label.trim().toLowerCase() === preset.label.trim().toLowerCase()
                ? { ...row, amount: row.amount || preset.amount }
                : row
            )
          }
        }

        return {
          ...current,
          doctorId: preset.doctorId || current.doctorId,
          rows: [makeRow(preset.label, preset.amount), ...current.rows]
        }
      })
      return
    }

    setActiveOperation('others')
    setOthersDoctorId((current) => preset.doctorId || current)
    setOthers((current) => {
      const alreadyExists = current.some(
        (row) => row.label.trim().toLowerCase() === preset.label.trim().toLowerCase()
      )
      if (alreadyExists) {
        return current.map((row) =>
          row.label.trim().toLowerCase() === preset.label.trim().toLowerCase()
            ? { ...row, amount: row.amount || preset.amount }
            : row
        )
      }

      return [makeRow(preset.label, preset.amount), ...current]
    })
  }

  const setSubmitErrorWithToast = (title: string, message: string): void => {
    setSubmitState({ status: 'error', message })
    pushToast('warning', title, message)
  }

  const validatePatientAndDoctor = (doctorRequiredMessage: string): boolean => {
    if (!patient.name.trim()) {
      setSubmitErrorWithToast('Missing patient name', 'Patient name is required.')
      return false
    }
    if (!patient.telephone.trim()) {
      setSubmitErrorWithToast('Missing telephone number', 'Patient telephone is required.')
      return false
    }
    if (!patient.age.trim() || Number(patient.age) <= 0) {
      setSubmitErrorWithToast('Invalid patient age', 'Patient age must be a valid number.')
      return false
    }
    if (!currentDoctorId) {
      setSubmitErrorWithToast('Doctor required', doctorRequiredMessage)
      return false
    }

    return true
  }

  const handleSubmit = async (): Promise<void> => {
    if (!validatePatientAndDoctor('Select a doctor before generating the bill.')) {
      return
    }
    if (total <= 0) {
      const message = 'Enter at least one bill amount before printing.'
      setSubmitErrorWithToast('Missing bill amount', message)
      return
    }

    setSubmitState({ status: 'loading', message: 'Saving patient and creating bill...' })

    try {
      const result = await api.submitBilling({
        patient,
        doctorId: currentDoctorId,
        total,
        serviceType: operationServiceType(activeOperation),
        shift: shift.toLowerCase() as 'morning' | 'evening',
        date: billDate,
        doctorName: currentDoctor?.name ?? '',
        paymentType: 'cash',
        items: printableItems
      })

      fillPatient(result.patient)
      rememberCurrentDefaults()
      setSavedBooking(null)
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

  const handleSaveBooking = async (): Promise<void> => {
    if (!validatePatientAndDoctor('Select a doctor before saving the booking.')) {
      return
    }
    if (!bookingDoctorType) {
      const message = 'Booking mode is currently available for Channeling and Dental visits only.'
      setSubmitErrorWithToast('Booking not supported here', message)
      return
    }

    setSubmitState({ status: 'loading', message: 'Saving booking...' })

    try {
      const booking = await api.submitBooking({
        patient,
        doctorId: currentDoctorId,
        doctorType: bookingDoctorType,
        date: billDate
      })

      rememberCurrentDefaults()
      setSavedBooking({
        record: booking,
        draftSignature: bookingDraftSignature
      })
      setSubmitState({ status: 'success', message: bookingLabel(booking) })
      pushToast('success', 'Booking saved', bookingLabel(booking))
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save booking'
      setSubmitState({
        status: 'error',
        message
      })
      pushToast('error', 'Booking failed', message)
    }
  }

  const handlePrintBooking = async (): Promise<void> => {
    if (!currentSavedBooking) {
      const message = 'Save the booking before printing the bill.'
      setSubmitErrorWithToast('Booking not saved', message)
      return
    }
    if (total <= 0) {
      const message = 'Enter at least one bill amount before printing.'
      setSubmitErrorWithToast('Missing bill amount', message)
      return
    }

    setSubmitState({ status: 'loading', message: 'Printing saved booking bill...' })

    try {
      await api.printReceipt({
        billId: currentSavedBooking.record.billId,
        billReference: currentSavedBooking.record.reference,
        patientName: patient.name,
        doctorName: currentDoctor?.name ?? currentSavedBooking.record.doctorName,
        paymentType: 'cash',
        items: printableItems,
        total
      })

      const message = currentSavedBooking.record.reference
        ? `Printed booking bill ${currentSavedBooking.record.reference}`
        : 'Printed saved booking bill'
      setSubmitState({ status: 'success', message })
      pushToast('success', 'Booking bill printed', message)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to print booking bill'
      setSubmitState({
        status: 'error',
        message
      })
      pushToast('error', 'Booking print failed', message)
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
                  Search patient details, select visit type, enter charges, and generate a bill or
                  save a booking.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <label className="flex min-w-40 items-center gap-2 rounded-lg border border-border/90 bg-[#16202c] px-3 py-1.5 text-xs text-slate-200">
                <input
                  type="checkbox"
                  checked={isBooking}
                  onChange={(event) => setIsBooking(event.target.checked)}
                  className="h-4 w-4 rounded border-border/90 bg-[#0f161f] text-primary focus:ring-primary/30"
                />
                <span>
                  <span className="block text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                    Booking
                  </span>
                  <span className="block text-xs text-slate-200">Save this visit as a booking</span>
                </span>
              </label>
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
                  results={canShowSearchFeedback ? searchResults : []}
                  activeField={activeField}
                  onFocus={setActiveField}
                  onBlur={() => {
                    setActiveField(null)
                    setSearchResults([])
                    setSearchError('')
                  }}
                  onChange={(value) => handlePatientIdentityFieldChange('name', value)}
                  onSelect={fillPatient}
                />
                <SearchBox
                  label="Telephone"
                  field="telephone"
                  value={patient.telephone}
                  placeholder="Telephone number"
                  results={canShowSearchFeedback ? searchResults : []}
                  activeField={activeField}
                  onFocus={setActiveField}
                  onBlur={() => {
                    setActiveField(null)
                    setSearchResults([])
                    setSearchError('')
                  }}
                  onChange={(value) => handlePatientIdentityFieldChange('telephone', value)}
                  onSelect={fillPatient}
                />
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
                  <Label>Email</Label>
                  <Input
                    value={patient.email}
                    onChange={(event) => setPatientField('email', event.target.value)}
                    placeholder="patient@email.com"
                    className={inputClassName}
                  />
                </div>
                <div className="md:col-span-2 xl:col-span-2">
                  <Label>Date Of Birth / Age</Label>
                  <div className="grid gap-3 md:grid-cols-[minmax(0,3fr)_minmax(0,1fr)]">
                    <Input
                      value={patient.dateOfBirth}
                      onChange={(event) => setPatientDateOfBirth(event.target.value)}
                      placeholder="DD/MM/YYYY"
                      className={inputClassName}
                    />
                    <Input
                      value={patient.age}
                      onChange={(event) => setPatientAge(event.target.value)}
                      placeholder="Age"
                      className={inputClassName}
                    />
                  </div>
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
                {canShowSearchFeedback && searchError ? (
                  <div className="md:col-span-2 xl:col-span-3 rounded-lg border border-amber-400/25 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
                    {searchError}
                  </div>
                ) : null}
              </div>
            </SurfaceCard>

            <SurfaceCard eyebrow="Visit Type" title="Billing operation">
              <div className="space-y-4">
                <OperationTabs value={activeOperation} onChange={setActiveOperation} />
                {recentServicePresets.length > 0 ? (
                  <div className="space-y-2 rounded-lg border border-border/90 bg-white/2 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                          Recent Services
                        </p>
                        <p className="mt-1 text-xs text-slate-400">
                          Tap a recent service to bring it back into the current form with its last
                          used value.
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {recentServicePresets.map((preset) => (
                        <button
                          key={preset.key}
                          type="button"
                          onClick={() => applyRecentServicePreset(preset)}
                          className="rounded-full border border-border/90 bg-[#111923] px-3 py-1.5 text-xs text-slate-100 transition hover:border-primary/35 hover:bg-primary/10 hover:text-white"
                        >
                          {preset.label} · {money(num(preset.amount))}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}
                {activeOperation === 'opd' ? (
                  <div className="grid gap-x-4 gap-y-3 lg:grid-cols-2">
                    <div className="lg:col-span-2">
                      <Label>Doctor</Label>
                      <select
                        value={opd.doctorId}
                        onChange={(event) =>
                          setOpd((current) =>
                            applyOpdDoctorDefaults(
                              current,
                              Number(event.target.value),
                              formPreferences.fieldDefaults.opd[Number(event.target.value)]
                            )
                          )
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
                          setChanneling((current) =>
                            applyChannelingDoctorDefaults(
                              current,
                              Number(event.target.value),
                              formPreferences.fieldDefaults.channeling[Number(event.target.value)]
                            )
                          )
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
                            setDental((current) =>
                              applyDentalDoctorDefaults(
                                current,
                                Number(event.target.value),
                                formPreferences.fieldDefaults.dental[Number(event.target.value)]
                              )
                            )
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
                    <span className="text-slate-400 font-medium">Mode</span>
                    <span className="text-slate-100">{isBooking ? 'Booking' : 'Bill'}</span>
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
                {isBooking && currentSavedBooking ? (
                  <div className="rounded-lg border border-primary/20 bg-primary/10 px-3 py-2 text-xs text-primary">
                    Saved booking
                    {currentSavedBooking.record.bookingNumber
                      ? ` #${currentSavedBooking.record.bookingNumber}`
                      : ''}
                    {currentSavedBooking.record.reference
                      ? ` • ${currentSavedBooking.record.reference}`
                      : ''}
                  </div>
                ) : null}
                {isBooking && !bookingDoctorType ? (
                  <div className="rounded-lg border border-amber-400/25 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
                    Booking mode currently supports Channeling and Dental visits with the available
                    public API.
                  </div>
                ) : null}
                <div className="grid gap-2">
                  {isBooking ? (
                    <>
                      <Button
                        type="button"
                        onClick={() => void handleSaveBooking()}
                        disabled={
                          submitState.status === 'loading' ||
                          doctorLoading ||
                          doctors.length === 0 ||
                          currentDoctorOptions.length === 0
                        }
                        className="h-10 rounded-md bg-primary text-primary-foreground text-xs font-semibold shadow-[0_14px_28px_rgba(34,211,238,0.22)] hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        {submitState.status === 'loading' ? 'Saving Booking...' : 'Save Booking'}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => void handlePrintBooking()}
                        disabled={
                          submitState.status === 'loading' || !currentSavedBooking || total <= 0
                        }
                        className={cn(
                          'h-10 rounded-md border-border/90 bg-white/4 text-xs font-semibold text-slate-100 hover:bg-white/8 disabled:cursor-not-allowed disabled:opacity-60'
                        )}
                      >
                        Print Bill
                      </Button>
                    </>
                  ) : (
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
                  )}
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
