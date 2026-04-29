import React, { useEffect, useState } from 'react'
import { MoonStar, SunMedium } from 'lucide-react'

import { OperationTabs, type OperationType } from '@/components/home/operation-tabs'
import { SurfaceCard } from '@/components/home/surface-card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { ToastRegion, type ToastItem, type ToastTone } from '@/components/ui/toast-region'
import { applyThemeVariables, type ThemeConfig } from '@/lib/theme'
import { cn } from '@/lib/utils'

type Shift = 'Morning' | 'Evening'
type SearchField = 'name' | 'telephone'
type WorkspaceTab = 'billing' | 'bookings' | 'summary'
type SummaryShift = 'morning' | 'evening'
type ThemeMode = 'dark' | 'light'

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

interface BillingServiceSuggestion {
  id: number
  name: string
  key: string
  inHousePrice: number
  referredPrice: number
}

interface ChargeRow {
  id: string
  label: string
  serviceId: number | null
  inHouseAmount: string
  referredAmount: string
}

interface PrintLineItem {
  name: string
  price: string
}

interface BillLineItem extends PrintLineItem {
  serviceId?: number | null
  serviceKey?: string
  category?: 'opd' | 'channeling' | 'dental' | 'others'
  doctorId?: number | null
  inHouseAmount?: number
  referredAmount?: number
  totalAmount?: number
  isAdHoc?: boolean
}

interface AppNotification {
  level: ToastTone
  title: string
  message: string
}

interface RendererThemeConfig extends ThemeConfig {}

interface DaySummaryItem {
  service_name: string
  quantity: number
  total: number
}

interface DaySummaryReport {
  start_date: string
  end_date: string
  items: DaySummaryItem[]
}

interface SummaryPrintResult {
  shift: SummaryShift
  report: DaySummaryReport
  print: Record<string, unknown>
}

interface BookingRecord {
  billId: number
  reference: string
  bookingNumber: number | null
  date: string
  doctorName: string
  doctorSpecialty: string
}

interface BookingQueueItem {
  id: number
  billId: number
  reference: string
  bookingNumber: number | null
  date: string
  status: string
  patient: PatientInfo
  doctor: {
    id: number | null
    name: string
    specialty: string
    doctorType: string
  }
  paymentType: 'cash' | 'card' | 'online'
  shift: 'morning' | 'evening'
  serviceType: 'opd' | 'specialist' | 'dental' | 'treatment'
  billAmount: number
  systemAmount: number
  items: BillLineItem[]
  createdAt: string
}

interface EditingBookingState {
  id: number
  reference: string
  billId: number
}

interface DoctorListOptions {
  date?: string
  doctorType?: string | 'opd' | 'specialist' | 'dental' | 'treatment'
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
  serviceId?: number | null
  inHouseAmount?: string
  referredAmount?: string
  amount?: string
  doctorId: number | null
  useCount: number
  lastUsedAt: string
}

interface FormPreferences {
  fieldDefaults: StoredFieldDefaults
  recentServices: RecentServicePreset[]
}

type RendererApi = {
  getThemeConfig: () => Promise<RendererThemeConfig>
  searchPatients: (query: string) => Promise<PatientRecord[]>
  listDoctors: (options?: DoctorListOptions) => Promise<DoctorOption[]>
  searchBillingServices: (
    query: string,
    operation?: OperationType
  ) => Promise<BillingServiceSuggestion[]>
  submitBilling: (payload: {
    patient: PatientInfo
    doctorId: number
    total: number
    systemAmount: number
    serviceType: 'opd' | 'specialist' | 'dental' | 'treatment'
    shift: 'morning' | 'evening'
    date: string
    doctorName: string
    paymentType: 'cash' | 'card' | 'online'
    items: BillLineItem[]
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
  listBookings: (date: string) => Promise<BookingQueueItem[]>
  updateBooking: (payload: {
    id: number
    patient: PatientInfo
    doctorId: number
    doctorType: 'specialist' | 'dental'
    date: string
    shift: 'morning' | 'evening'
    paymentType: 'cash' | 'card' | 'online'
    serviceType: 'opd' | 'specialist' | 'dental' | 'treatment'
    billAmount: number
    systemAmount: number
    items: BillLineItem[]
  }) => Promise<BookingRecord>
  deleteBooking: (id: number) => Promise<{ message: string; deletedId: number }>
  proceedBookingToPayment: (payload: {
    id: number
    paymentType: 'cash' | 'card' | 'online'
    shift: 'morning' | 'evening'
    billAmount: number
    systemAmount: number
    items: BillLineItem[]
  }) => Promise<{ message: string; bill: Record<string, unknown> }>
  printReceipt: (payload: {
    billId: number
    billReference: string
    patientName: string
    doctorName: string
    paymentType: 'cash' | 'card' | 'online'
    items: PrintLineItem[]
    total: number
  }) => Promise<Record<string, unknown>>
  printSummaryReport: (payload: {
    date: string
    shift: SummaryShift
  }) => Promise<SummaryPrintResult>
  printDaySummary: (date: string) => Promise<SummaryPrintResult[]>
  onAppNotification: (callback: (notification: AppNotification) => void) => () => void
}

const inputClassName =
  'h-9 rounded-md border-border/90 bg-white/[0.035] text-sm text-theme-strong placeholder:text-theme-muted focus-visible:border-primary/70 focus-visible:ring-primary/20'
const selectClassName =
  'flex h-9 w-full rounded-md border border-border/90 bg-white/[0.035] px-3 text-sm text-theme-strong outline-none transition focus:border-primary/70 focus:ring-2 focus:ring-primary/20'
const softButtonClassName =
  'h-8 border-border/90 bg-white/[0.04] text-xs text-theme-soft transition-all hover:border-primary/35 hover:bg-primary/10 hover:text-theme-strong'
const FORM_PREFERENCES_KEY = 'medical-center-form-preferences-v1'
const THEME_PREFERENCE_KEY = 'medical-center-theme-v1'
const EMPTY_PREFERENCES: FormPreferences = {
  fieldDefaults: {
    opd: {},
    channeling: {},
    dental: {}
  },
  recentServices: []
}

const makeRow = (
  label = '',
  inHouseAmount = '',
  referredAmount = '',
  serviceId: number | null = null
): ChargeRow => ({
  id: Math.random().toString(36).slice(2, 10),
  label,
  serviceId,
  inHouseAmount,
  referredAmount
})

const money = (value: number): string =>
  `LKR ${new Intl.NumberFormat('en-LK', { maximumFractionDigits: 0 }).format(value)}`

const num = (value: string): number => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

const summaryShiftLabel = (shift: SummaryShift): string =>
  shift === 'morning' ? 'Morning' : 'Evening'

function chargeRowTotal(row: ChargeRow): number {
  return num(row.inHouseAmount) + num(row.referredAmount)
}

function normalizeStoredRecentService(preset: RecentServicePreset): RecentServicePreset {
  return {
    ...preset,
    serviceId: preset.serviceId ?? null,
    inHouseAmount: preset.inHouseAmount ?? '0',
    referredAmount: preset.referredAmount ?? preset.amount ?? '0'
  }
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
      recentServices: Array.isArray(parsed.recentServices)
        ? parsed.recentServices.map((preset) => normalizeStoredRecentService(preset))
        : []
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

function loadThemePreference(): ThemeMode {
  if (typeof window === 'undefined') return 'dark'

  try {
    const stored = window.localStorage.getItem(THEME_PREFERENCE_KEY)
    return stored === 'light' ? 'light' : 'dark'
  } catch {
    return 'dark'
  }
}

function saveThemePreference(theme: ThemeMode): void {
  if (typeof window === 'undefined') return

  try {
    window.localStorage.setItem(THEME_PREFERENCE_KEY, theme)
  } catch {
    // Ignore persistence issues and keep the theme toggle usable.
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

function operationTypeFromServiceType(
  serviceType: 'opd' | 'specialist' | 'dental' | 'treatment'
): OperationType {
  switch (serviceType) {
    case 'opd':
      return 'opd'
    case 'specialist':
      return 'channeling'
    case 'dental':
      return 'dental'
    case 'treatment':
      return 'others'
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

function billIdentifier(bill: Record<string, unknown>): number | null {
  if (typeof bill.id === 'number') return bill.id
  if (typeof bill.bill_id === 'number') return bill.bill_id
  return null
}

function billReferenceValue(bill: Record<string, unknown>): string {
  if (typeof bill.bill_reference === 'string') return bill.bill_reference
  if (typeof bill.reference === 'string') return bill.reference
  if (typeof bill.uuid === 'string') return bill.uuid
  return ''
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

function displayShift(value: 'morning' | 'evening'): Shift {
  return value === 'evening' ? 'Evening' : 'Morning'
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
  const [workspaceTab, setWorkspaceTab] = useState<WorkspaceTab>('billing')
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
  const [editingBooking, setEditingBooking] = useState<EditingBookingState | null>(null)
  const [bookingQueue, setBookingQueue] = useState<BookingQueueItem[]>([])
  const [bookingQueueLoading, setBookingQueueLoading] = useState(false)
  const [bookingQueueError, setBookingQueueError] = useState('')
  const [bookingQueueRefreshKey, setBookingQueueRefreshKey] = useState(0)
  const [summaryPrintState, setSummaryPrintState] = useState<{
    status: 'idle' | 'loading' | 'success' | 'error'
    action: SummaryShift | null
    message: string
  }>({
    status: 'idle',
    action: null,
    message: ''
  })
  const [proceedingBookingId, setProceedingBookingId] = useState<number | null>(null)
  const [paymentPromptBooking, setPaymentPromptBooking] = useState<BookingQueueItem | null>(null)
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => loadThemePreference())
  const [opd, setOpd] = useState({ doctorId: 0, consultationFee: '', medicineFee: '' })
  const [channeling, setChanneling] = useState({
    doctorId: 0,
    consultationFee: '',
    bookingFee: ''
  })
  const [dental, setDental] = useState({
    doctorId: 0,
    registrationFee: '',
    rows: [makeRow('Consultation'), makeRow('Medicine')]
  })
  const [othersDoctorId, setOthersDoctorId] = useState(0)
  const [others, setOthers] = useState<ChargeRow[]>([
    makeRow('Report Charge'),
    makeRow('Treatment Charge')
  ])
  const [serviceSuggestions, setServiceSuggestions] = useState<
    Record<string, BillingServiceSuggestion[]>
  >({})
  const dismissToast = (id: string): void => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }
  const pushToast = (level: ToastTone, title: string, message: string): void => {
    setToasts((current) => [...current.slice(-3), makeToast(level, title, message)])
  }
  const toggleThemeMode = (): void => {
    setThemeMode((current) => {
      const next = current === 'dark' ? 'light' : 'dark'
      saveThemePreference(next)
      return next
    })
  }
  const fetchServiceSuggestions = async (
    rowId: string,
    query: string,
    operation: 'dental' | 'others'
  ): Promise<void> => {
    const normalizedQuery = query.trim()
    if (normalizedQuery.length < 2) {
      setServiceSuggestions((current) => ({ ...current, [rowId]: [] }))
      return
    }

    const localSuggestions = formPreferences.recentServices
      .filter(
        (item) =>
          item.operation === operation &&
          item.label.toLowerCase().includes(normalizedQuery.toLowerCase())
      )
      .slice(0, 5)
      .map((item) => ({
        id: item.serviceId ?? 0,
        name: item.label,
        key: item.key,
        inHousePrice: num(item.inHouseAmount ?? '0'),
        referredPrice: num(item.referredAmount ?? item.amount ?? '0')
      }))

    try {
      const apiSuggestions = await api.searchBillingServices(normalizedQuery, operation)
      const merged = [...localSuggestions]

      for (const suggestion of apiSuggestions) {
        if (
          !merged.some(
            (item) =>
              item.id === suggestion.id ||
              item.name.trim().toLowerCase() === suggestion.name.trim().toLowerCase()
          )
        ) {
          merged.push(suggestion)
        }
      }

      setServiceSuggestions((current) => ({ ...current, [rowId]: merged.slice(0, 8) }))
    } catch {
      setServiceSuggestions((current) => ({ ...current, [rowId]: localSuggestions }))
    }
  }
  const applySuggestedService = (
    operation: 'dental' | 'others',
    rowId: string,
    serviceName: string
  ): void => {
    const suggestion = (serviceSuggestions[rowId] ?? []).find(
      (item) => item.name.trim().toLowerCase() === serviceName.trim().toLowerCase()
    )
    if (!suggestion) return

    const apply = (row: ChargeRow): ChargeRow => ({
      ...row,
      label: suggestion.name,
      serviceId: suggestion.id || row.serviceId,
      inHouseAmount: row.inHouseAmount || String(suggestion.inHousePrice || ''),
      referredAmount: row.referredAmount || String(suggestion.referredPrice || '')
    })

    if (operation === 'dental') {
      setDental((current) => ({
        ...current,
        rows: current.rows.map((row) => (row.id === rowId ? apply(row) : row))
      }))
      return
    }

    setOthers((current) => current.map((row) => (row.id === rowId ? apply(row) : row)))
  }
  const handleOperationChange = (operation: OperationType): void => {
    setDoctorLoading(true)
    setActiveOperation(operation)
  }
  const handleBillDateChange = (value: string): void => {
    setDoctorLoading(true)
    if (workspaceTab === 'bookings') {
      setBookingQueueLoading(true)
    }
    if (summaryPrintState.status !== 'idle') {
      setSummaryPrintState({ status: 'idle', action: null, message: '' })
    }
    setBillDate(value)
  }
  const handleWorkspaceTabChange = (tab: WorkspaceTab): void => {
    if (tab === 'bookings') {
      setBookingQueueLoading(true)
    }
    setWorkspaceTab(tab)
  }
  const refreshBookingQueue = (): void => {
    setBookingQueueLoading(true)
    setBookingQueueRefreshKey((current) => current + 1)
  }
  const {
    opd: opdFieldDefaults,
    channeling: channelingFieldDefaults,
    dental: dentalFieldDefaults
  } = formPreferences.fieldDefaults
  const activeDoctorType = operationDoctorType(activeOperation)

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
      .listDoctors({
        date: billDate,
        doctorType: activeDoctorType
      })
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
  }, [
    activeDoctorType,
    api,
    billDate,
    channelingFieldDefaults,
    dentalFieldDefaults,
    opdFieldDefaults
  ])

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

  useEffect(() => {
    let cancelled = false

    if (workspaceTab !== 'bookings') {
      return () => {
        cancelled = true
      }
    }

    void api
      .listBookings(billDate)
      .then((records) => {
        if (cancelled) return
        setBookingQueue(records)
        setBookingQueueError('')
      })
      .catch((error: unknown) => {
        if (cancelled) return
        const message = error instanceof Error ? error.message : 'Failed to load bookings'
        setBookingQueue([])
        setBookingQueueError(message)
        setToasts((current) => [
          ...current.slice(-3),
          makeToast('error', 'Booking list unavailable', message)
        ])
      })
      .finally(() => {
        if (!cancelled) {
          setBookingQueueLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [api, billDate, bookingQueueRefreshKey, workspaceTab])

  useEffect(() => {
    if (typeof document === 'undefined') return

    let cancelled = false

    void api
      .getThemeConfig()
      .then((config) => {
        if (cancelled) return
        applyThemeVariables(document.documentElement, config.baseColor)
      })
      .catch(() => {
        if (cancelled) return
        applyThemeVariables(document.documentElement, '#522e90')
      })

    return () => {
      cancelled = true
    }
  }, [api])

  useEffect(() => {
    if (typeof document === 'undefined') return

    document.documentElement.dataset.theme = themeMode
  }, [themeMode])

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

  const bookingItemAmount = (
    items: BillLineItem[],
    labels: string[],
    amountType: 'total' | 'inHouse' | 'referred' = 'total'
  ): string => {
    const match = items.find((item) => labels.includes(item.name.trim().toLowerCase()))
    if (!match) return ''

    if (amountType === 'inHouse') {
      return String(match.inHouseAmount ?? 0)
    }

    if (amountType === 'referred') {
      return String(match.referredAmount ?? num(match.price))
    }

    return match.price ?? ''
  }

  const bookingItemRows = (items: BillLineItem[], excludedLabels: string[]): ChargeRow[] => {
    const excluded = new Set(excludedLabels)
    const rows = items
      .filter((item) => !excluded.has(item.name.trim().toLowerCase()))
      .map((item) =>
        makeRow(
          item.name,
          String(item.inHouseAmount ?? 0),
          String(item.referredAmount ?? num(item.price)),
          item.serviceId ?? null
        )
      )

    return rows.length > 0 ? rows : [makeRow()]
  }

  const loadBookingIntoForm = (booking: BookingQueueItem): void => {
    const nextOperation = operationTypeFromServiceType(booking.serviceType)
    const normalizedPatient: PatientRecord = {
      id: booking.patient.id ?? 0,
      name: booking.patient.name,
      telephone: booking.patient.telephone,
      email: booking.patient.email,
      dateOfBirth: booking.patient.dateOfBirth,
      age: booking.patient.age,
      address: booking.patient.address,
      registrationNo: booking.patient.registrationNo,
      gender: booking.patient.gender
    }

    fillPatient(normalizedPatient)
    handleBillDateChange(booking.date)
    setShift(displayShift(booking.shift))
    setIsBooking(true)
    setEditingBooking({
      id: booking.id,
      reference: booking.reference,
      billId: booking.billId
    })
    setSavedBooking(null)
    handleWorkspaceTabChange('billing')
    handleOperationChange(nextOperation)
    setSubmitState({ status: 'idle', message: '' })

    if (nextOperation === 'opd') {
      setOpd({
        doctorId: booking.doctor.id ?? 0,
        consultationFee: bookingItemAmount(booking.items, ['doctor fee', 'consultation']),
        medicineFee: bookingItemAmount(booking.items, ['medicine charge', 'opd medicine fee'])
      })
      return
    }

    if (nextOperation === 'channeling') {
      setChanneling({
        doctorId: booking.doctor.id ?? 0,
        consultationFee: bookingItemAmount(
          booking.items,
          ['doctor fee', 'consultation'],
          'referred'
        ),
        bookingFee: bookingItemAmount(
          booking.items,
          ['booking fee', 'channeling / booking fee'],
          'inHouse'
        )
      })
      return
    }

    if (nextOperation === 'dental') {
      setDental({
        doctorId: booking.doctor.id ?? 0,
        registrationFee: bookingItemAmount(booking.items, ['registration fee'], 'inHouse'),
        rows: bookingItemRows(booking.items, ['registration fee'])
      })
      return
    }

    setOthersDoctorId(booking.doctor.id ?? 0)
    setOthers(
      booking.items.length > 0
        ? booking.items.map((item) =>
            makeRow(
              item.name,
              String(item.inHouseAmount ?? 0),
              String(item.referredAmount ?? num(item.price)),
              item.serviceId ?? null
            )
          )
        : [makeRow()]
    )
  }

  const summary =
    activeOperation === 'opd'
      ? [
          { label: 'Doctor Fee', inHouse: 0, referred: num(opd.consultationFee) },
          { label: 'Medicine Charge', inHouse: 0, referred: num(opd.medicineFee) }
        ]
      : activeOperation === 'channeling'
        ? [
            {
              label: 'Doctor Fee',
              inHouse: 0,
              referred: num(channeling.consultationFee)
            },
            {
              label: 'Booking Fee',
              inHouse: num(channeling.bookingFee),
              referred: 0
            }
          ]
        : activeOperation === 'dental'
          ? [
              { label: 'Registration Fee', inHouse: num(dental.registrationFee), referred: 0 },
              ...dental.rows.map((row) => ({
                label: row.label || 'Dental Charge',
                inHouse: num(row.inHouseAmount),
                referred: num(row.referredAmount),
                serviceId: row.serviceId,
                category: 'dental' as const
              }))
            ]
          : others.map((row) => ({
              label: row.label || 'Additional Charge',
              inHouse: num(row.inHouseAmount),
              referred: num(row.referredAmount),
              serviceId: row.serviceId,
              category: 'others' as const
            }))
  const summaryItems = summary
    .map((item) => ({
      ...item,
      total: item.inHouse + item.referred
    }))
    .filter((item) => item.total > 0)
  const currentDoctorId =
    activeOperation === 'opd'
      ? opd.doctorId
      : activeOperation === 'channeling'
        ? channeling.doctorId
        : activeOperation === 'dental'
          ? dental.doctorId
          : othersDoctorId
  const printableItems = summary
    .map<BillLineItem>((item) => ({
      name: item.label,
      price: (item.inHouse + item.referred).toFixed(2),
      serviceId: 'serviceId' in item ? item.serviceId : null,
      category:
        ('category' in item ? item.category : activeOperation === 'channeling' ? 'channeling' : 'opd') ??
        activeOperation,
      doctorId: currentDoctorId || null,
      inHouseAmount: item.inHouse,
      referredAmount: item.referred,
      totalAmount: item.inHouse + item.referred,
      isAdHoc: !('serviceId' in item) || !item.serviceId
    }))
    .filter((item) => item.totalAmount && item.totalAmount > 0)
  const total = printableItems.reduce((sum, item) => sum + (item.totalAmount ?? num(item.price)), 0)
  const systemAmount = printableItems.reduce((sum, item) => sum + (item.inHouseAmount ?? 0), 0)
  const referredAmount = printableItems.reduce((sum, item) => sum + (item.referredAmount ?? 0), 0)
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
          .filter((row) => row.label.trim() && chargeRowTotal(row) > 0)
          .map((row) => ({
            key: `dental:${dental.doctorId || 'any'}:${row.label.trim().toLowerCase()}`,
            operation: 'dental' as const,
            label: row.label.trim(),
            serviceId: row.serviceId,
            inHouseAmount: row.inHouseAmount,
            referredAmount: row.referredAmount,
            doctorId: dental.doctorId || null,
            useCount: 1,
            lastUsedAt: timestamp
          })),
        ...others
          .filter((row) => row.label.trim() && chargeRowTotal(row) > 0)
          .map((row) => ({
            key: `others:${othersDoctorId || 'any'}:${row.label.trim().toLowerCase()}`,
            operation: 'others' as const,
            label: row.label.trim(),
            serviceId: row.serviceId,
            inHouseAmount: row.inHouseAmount,
            referredAmount: row.referredAmount,
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
      handleOperationChange('dental')
      setDental((current) => {
        const alreadyExists = current.rows.some(
          (row) => row.label.trim().toLowerCase() === preset.label.trim().toLowerCase()
        )
        if (alreadyExists) {
          return {
            ...current,
            rows: current.rows.map((row) =>
              row.label.trim().toLowerCase() === preset.label.trim().toLowerCase()
                ? {
                    ...row,
                    serviceId: row.serviceId ?? preset.serviceId ?? null,
                    inHouseAmount: row.inHouseAmount || preset.inHouseAmount || '',
                    referredAmount:
                      row.referredAmount || preset.referredAmount || preset.amount || ''
                  }
                : row
            )
          }
        }

        return {
          ...current,
          doctorId: preset.doctorId || current.doctorId,
          rows: [
            makeRow(
              preset.label,
              preset.inHouseAmount ?? '',
              preset.referredAmount ?? preset.amount ?? '',
              preset.serviceId ?? null
            ),
            ...current.rows
          ]
        }
      })
      return
    }

    handleOperationChange('others')
    setOthersDoctorId((current) => preset.doctorId || current)
    setOthers((current) => {
      const alreadyExists = current.some(
        (row) => row.label.trim().toLowerCase() === preset.label.trim().toLowerCase()
      )
      if (alreadyExists) {
        return current.map((row) =>
          row.label.trim().toLowerCase() === preset.label.trim().toLowerCase()
            ? {
                ...row,
                serviceId: row.serviceId ?? preset.serviceId ?? null,
                inHouseAmount: row.inHouseAmount || preset.inHouseAmount || '',
                referredAmount: row.referredAmount || preset.referredAmount || preset.amount || ''
              }
            : row
        )
      }

      return [
        makeRow(
          preset.label,
          preset.inHouseAmount ?? '',
          preset.referredAmount ?? preset.amount ?? '',
          preset.serviceId ?? null
        ),
        ...current
      ]
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
    if (activeOperation !== 'others' && !currentDoctorId) {
      setSubmitErrorWithToast('Doctor required', doctorRequiredMessage)
      return false
    }

    return true
  }

  const currentBookingMutationPayload = (): {
    patient: PatientInfo
    doctorId: number
    doctorType: 'specialist' | 'dental' | null
    date: string
    shift: 'morning' | 'evening'
    paymentType: 'cash'
    serviceType: 'opd' | 'specialist' | 'dental' | 'treatment'
    billAmount: number
    systemAmount: number
    items: BillLineItem[]
  } => ({
    patient,
    doctorId: currentDoctorId,
    doctorType: bookingDoctorType,
    date: billDate,
    shift: shift.toLowerCase() as 'morning' | 'evening',
    paymentType: 'cash' as const,
    serviceType: operationServiceType(activeOperation),
    billAmount: total,
    systemAmount,
    items: printableItems
  })

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
        systemAmount,
        serviceType: operationServiceType(activeOperation),
        shift: shift.toLowerCase() as 'morning' | 'evening',
        date: billDate,
        doctorName: currentDoctor?.name ?? 'No doctor',
        paymentType: 'cash',
        items: printableItems
      })

      fillPatient(result.patient)
      rememberCurrentDefaults()
      setSavedBooking(null)
      setEditingBooking(null)
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
      const booking = editingBooking
        ? await api.updateBooking({
            id: editingBooking.id,
            ...currentBookingMutationPayload(),
            doctorType: bookingDoctorType
          })
        : await api.submitBooking({
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
      if (editingBooking) {
        setBookingQueue((current) =>
          current.map((item) =>
            item.id === editingBooking.id
              ? {
                  ...item,
                  date: billDate,
                  patient,
                  doctor: {
                    id: currentDoctorId,
                    name: currentDoctor?.name ?? item.doctor.name,
                    specialty: currentDoctor?.specialty ?? item.doctor.specialty,
                    doctorType: bookingDoctorType
                  },
                  shift: shift.toLowerCase() as 'morning' | 'evening',
                  serviceType: operationServiceType(activeOperation),
                  billAmount: total,
                  systemAmount,
                  items: printableItems
                }
              : item
          )
        )
      }
      setSubmitState({ status: 'success', message: bookingLabel(booking) })
      pushToast(
        'success',
        editingBooking ? 'Booking updated' : 'Booking saved',
        bookingLabel(booking)
      )
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
        billId: currentSavedBooking.record.billId ?? editingBooking?.billId ?? 0,
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

  const handleDeleteBooking = async (booking: BookingQueueItem): Promise<void> => {
    try {
      const result = await api.deleteBooking(booking.id)
      setBookingQueue((current) => current.filter((item) => item.id !== booking.id))
      if (editingBooking?.id === booking.id) {
        setEditingBooking(null)
        setSavedBooking(null)
        setIsBooking(false)
      }
      pushToast('success', 'Booking deleted', result.message)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete booking'
      pushToast('error', 'Delete failed', message)
    }
  }

  const clearBookingFromWorkspace = (bookingId: number): void => {
    setBookingQueue((current) => current.filter((item) => item.id !== bookingId))
    if (editingBooking?.id === bookingId) {
      setEditingBooking(null)
      setSavedBooking(null)
      setIsBooking(false)
    }
  }

  const handleProceedBooking = async (
    booking: BookingQueueItem,
    shouldPrint: boolean
  ): Promise<void> => {
    setProceedingBookingId(booking.id)
    try {
      const result = await api.proceedBookingToPayment({
        id: booking.id,
        paymentType: booking.paymentType,
        shift: booking.shift,
        billAmount: booking.billAmount,
        systemAmount: booking.systemAmount,
        items: booking.items
      })

      clearBookingFromWorkspace(booking.id)

      if (shouldPrint) {
        const receiptBillId = billIdentifier(result.bill)

        if (!receiptBillId) {
          throw new Error('Booking moved to payment, but no printable bill id was returned.')
        }

        await api.printReceipt({
          billId: receiptBillId,
          billReference: billReferenceValue(result.bill),
          patientName: booking.patient.name,
          doctorName: booking.doctor.name,
          paymentType: booking.paymentType,
          items: booking.items,
          total: booking.billAmount
        })

        const printMessage = booking.reference
          ? `Moved ${booking.reference} to payment and printed the bill`
          : 'Booking moved to payment and bill printed'
        pushToast('success', 'Payment completed', printMessage)
      } else {
        pushToast('success', 'Moved to payment', result.message)
      }
    } catch (error) {
      const fallbackMessage = shouldPrint
        ? 'Failed to move booking to payment and print the bill'
        : 'Failed to move booking to payment'
      const message = error instanceof Error ? error.message : fallbackMessage
      pushToast('error', 'Proceed to payment failed', message)
    } finally {
      setProceedingBookingId(null)
      setPaymentPromptBooking(null)
    }
  }

  const handlePrintShiftSummary = async (shiftToPrint: SummaryShift): Promise<void> => {
    setSummaryPrintState({
      status: 'loading',
      action: shiftToPrint,
      message: `Printing ${summaryShiftLabel(shiftToPrint).toLowerCase()} report...`
    })

    try {
      const result = await api.printSummaryReport({
        date: billDate,
        shift: shiftToPrint
      })
      const hasItems = result.report.items.length > 0
      const message = hasItems
        ? `${summaryShiftLabel(shiftToPrint)} report printed for ${billDate}.`
        : `${summaryShiftLabel(shiftToPrint)} report printed for ${billDate} with no sales for that shift.`

      setSummaryPrintState({
        status: 'success',
        action: shiftToPrint,
        message
      })
      pushToast('success', `${summaryShiftLabel(shiftToPrint)} report printed`, message)
    } catch (error) {
      const message =
        error instanceof Error ? error.message : `Failed to print ${shiftToPrint} report`
      setSummaryPrintState({
        status: 'error',
        action: shiftToPrint,
        message
      })
      pushToast('error', `${summaryShiftLabel(shiftToPrint)} report failed`, message)
    }
  }

  return (
    <main className="min-h-screen bg-background p-4 text-theme-strong sm:p-5" style={{ backgroundImage: 'var(--body-bg-image)' }}>
      <ToastRegion toasts={toasts} onDismiss={dismissToast} />
      <Modal
        isOpen={paymentPromptBooking !== null}
        onClose={() => {
          if (proceedingBookingId === null) {
            setPaymentPromptBooking(null)
          }
        }}
        title="Proceed To Payment"
      >
        {paymentPromptBooking ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm text-slate-100">
                Move{' '}
                <span className="font-semibold text-white">
                  {paymentPromptBooking.bookingNumber
                    ? `booking #${paymentPromptBooking.bookingNumber}`
                    : paymentPromptBooking.reference || 'this booking'}
                </span>{' '}
                into payment?
              </p>
              <p className="text-xs text-slate-400">
                After payment starts, would you like to print the bill as well?
              </p>
            </div>
            <div className="rounded-lg border border-border/90 bg-[#101924] px-3 py-2 text-xs text-slate-300">
              <p className="font-medium text-white">
                {paymentPromptBooking.patient.name || 'Walk-in'}
              </p>
              <p className="mt-1 text-slate-400">
                {paymentPromptBooking.doctor.name} · {money(paymentPromptBooking.billAmount)}
              </p>
            </div>
            <div className="flex flex-wrap justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setPaymentPromptBooking(null)}
                disabled={proceedingBookingId !== null}
                className={softButtonClassName}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => void handleProceedBooking(paymentPromptBooking, false)}
                disabled={proceedingBookingId !== null}
                className={cn(
                  softButtonClassName,
                  'border-primary/25 bg-primary/5 text-slate-100 hover:bg-primary/12'
                )}
              >
                {proceedingBookingId !== null ? 'Processing...' : 'No, Continue Without Print'}
              </Button>
              <Button
                type="button"
                onClick={() => void handleProceedBooking(paymentPromptBooking, true)}
                disabled={proceedingBookingId !== null}
                className="h-9 rounded-md bg-primary px-4 text-xs font-semibold text-primary-foreground shadow-theme-primary-button hover:bg-primary/90"
              >
                {proceedingBookingId !== null ? 'Printing...' : 'Yes, Print Bill'}
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>
      <div className="mx-auto flex max-w-6xl flex-col gap-4">
        <section className="app-shell relative overflow-hidden rounded-xl border p-4">
          <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-1">
              <span className="inline-flex rounded-full border border-primary/20 bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-primary">
                Medical Center Billing
              </span>
              <div>
                <h1 className="text-theme-strong text-xl font-semibold tracking-tight">
                  Simple billing flow for clinic operators
                </h1>
                <p className="text-theme-muted text-xs">
                  Search patient details, select visit type, enter charges, and generate a bill or
                  save a booking.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={toggleThemeMode}
                className="panel-shell h-11 w-11 rounded-lg"
                title={themeMode === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
              >
                {themeMode === 'dark' ? <SunMedium /> : <MoonStar />}
              </Button>
              <label className="panel-shell flex min-w-40 items-center gap-2 rounded-lg border px-3 py-1.5 text-xs">
                <input
                  type="checkbox"
                  checked={isBooking}
                  onChange={(event) => {
                    const nextChecked = event.target.checked
                    setIsBooking(nextChecked)
                    if (!nextChecked) {
                      setEditingBooking(null)
                      setSavedBooking(null)
                    }
                  }}
                  className="panel-inner-shell h-4 w-4 rounded border-border/90 text-primary focus:ring-primary/30"
                />
                <span>
                  <span className="text-theme-muted block text-[10px] font-semibold uppercase tracking-[0.22em]">
                    Booking
                  </span>
                  <span className="text-theme-soft block text-xs">Save this visit as a booking</span>
                </span>
              </label>
              <div className="panel-shell min-w-35 rounded-lg border px-3 py-1.5">
                <p className="text-theme-muted text-[10px] font-semibold uppercase tracking-wider">
                  Date
                </p>
                <Input
                  type="date"
                  value={billDate}
                  onChange={(event) => handleBillDateChange(event.target.value)}
                  className={cn(
                    inputClassName,
                    'h-7 border-0 bg-transparent px-0 py-0 focus-visible:ring-0'
                  )}
                />
              </div>
              <div className="panel-shell min-w-45 rounded-lg border px-3 py-1.5">
                <p className="text-theme-muted text-[10px] font-semibold uppercase tracking-wider">
                  Shift
                </p>
                <div className="panel-inner-shell mt-1 flex rounded-md border p-0.5">
                  {(['Morning', 'Evening'] as Shift[]).map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setShift(option)}
                      className={cn(
                        'flex-1 rounded px-3 py-1 text-[11px] font-medium transition',
                        shift === option
                          ? 'bg-primary text-primary-foreground shadow-theme-primary-tab'
                          : 'text-theme-muted panel-hover-shell'
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
        <section className="workspace-shell rounded-xl border p-2">
          <div className="grid gap-2 md:grid-cols-3">
            {(
              [
                {
                  id: 'billing',
                  title: 'Billing Desk',
                  subtitle: editingBooking
                    ? 'Continue editing the selected booking in the main form.'
                    : 'Patient entry, charges, and receipt generation.'
                },
                {
                  id: 'bookings',
                  title: 'Booking List',
                  subtitle: 'Review bookings and move them into payment.'
                },
                {
                  id: 'summary',
                  title: 'Summary Prints',
                  subtitle: 'Print service summaries for the date.'
                }
              ] as Array<{ id: WorkspaceTab; title: string; subtitle: string }>
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleWorkspaceTabChange(tab.id)}
                className={cn(
                  'rounded-lg border px-4 py-3 text-left transition',
                  workspaceTab === tab.id
                    ? 'border-primary/35 bg-primary/10 shadow-theme-primary-panel'
                    : 'border-transparent panel-soft-shell hover:border-border/90 panel-hover-shell'
                )}
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-theme-muted text-[10px] font-semibold uppercase tracking-[0.22em]">
                      Workspace
                    </p>
                    <h2 className="text-theme-strong mt-1 text-sm font-semibold">{tab.title}</h2>
                    <p className="text-theme-muted mt-1 text-xs">{tab.subtitle}</p>
                  </div>
                  <span
                    className={cn(
                      'h-2.5 w-2.5 rounded-full transition',
                      workspaceTab === tab.id
                        ? 'bg-primary shadow-theme-primary-glow'
                        : 'bg-theme-idle'
                    )}
                  />
                </div>
              </button>
            ))}
          </div>
        </section>

        {workspaceTab === 'billing' ? (
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
                  <div>
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
                      <option value="Male">
                        Male
                      </option>
                      <option value="Female">
                        Female
                      </option>
                      <option value="Other">
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
                  <OperationTabs value={activeOperation} onChange={handleOperationChange} />
                  {recentServicePresets.length > 0 ? (
                    <div className="space-y-2 rounded-lg border border-border/90 bg-white/2 p-3">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                            Recent Services
                          </p>
                          <p className="mt-1 text-xs text-slate-400">
                            Tap a recent service to bring it back into the current form with its
                            last used value.
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
                            {preset.label} / {money(num(preset.inHouseAmount ?? '0') + num(preset.referredAmount ?? preset.amount ?? '0'))}
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
                            <option key={item.id} value={item.id}>
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
                            setOpd((current) => ({
                              ...current,
                              consultationFee: event.target.value
                            }))
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
                            <option key={item.id} value={item.id}>
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
                              <option key={item.id} value={item.id}>
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
                        {dental.rows.map((row) => (
                          <div
                            key={row.id}
                            className="grid gap-3 rounded-lg border border-border/90 bg-white/2 p-3 lg:grid-cols-[1.4fr_120px_120px_90px]"
                          >
                            <div>
                              <Label>Service</Label>
                              <Input
                                list={`dental-services-${row.id}`}
                                value={row.label}
                                onChange={(event) => {
                                  const value = event.target.value
                                  setDental((current) => ({
                                    ...current,
                                    rows: current.rows.map((item) =>
                                      item.id === row.id
                                        ? { ...item, label: value, serviceId: null }
                                        : item
                                    )
                                  }))
                                  void fetchServiceSuggestions(row.id, value, 'dental')
                                }}
                                onBlur={(event) =>
                                  applySuggestedService('dental', row.id, event.target.value)
                                }
                                placeholder="Treatment name"
                                className={inputClassName}
                              />
                              <datalist id={`dental-services-${row.id}`}>
                                {(serviceSuggestions[row.id] ?? []).map((item) => (
                                  <option key={`${row.id}-${item.id}-${item.name}`} value={item.name}>
                                    {item.name}
                                  </option>
                                ))}
                              </datalist>
                            </div>
                            <div>
                              <Label>In-house</Label>
                              <Input
                                type="number"
                                value={row.inHouseAmount}
                                onChange={(event) =>
                                  setDental((current) => ({
                                    ...current,
                                    rows: current.rows.map((item) =>
                                      item.id === row.id
                                        ? { ...item, inHouseAmount: event.target.value }
                                        : item
                                    )
                                  }))
                                }
                                placeholder="0"
                                className={inputClassName}
                              />
                            </div>
                            <div>
                              <Label>Referred</Label>
                              <Input
                                type="number"
                                value={row.referredAmount}
                                onChange={(event) =>
                                  setDental((current) => ({
                                    ...current,
                                    rows: current.rows.map((item) =>
                                      item.id === row.id
                                        ? { ...item, referredAmount: event.target.value }
                                        : item
                                    )
                                  }))
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
                        ))}
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() =>
                          setDental((current) => ({
                            ...current,
                            rows: [...current.rows, makeRow('New Dental Charge')]
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
                          disabled={doctorLoading}
                        >
                          <option value={0}>
                            No doctor
                          </option>
                          {currentDoctorOptions.map((item) => (
                            <option key={item.id} value={item.id}>
                              {item.name} - {item.specialty}
                            </option>
                          ))}
                        </select>
                      </div>
                      {others.map((row) => (
                        <div
                          key={row.id}
                          className="grid gap-3 rounded-lg border border-border/90 bg-white/2 p-3 lg:grid-cols-[1.4fr_120px_120px_90px]"
                        >
                          <div>
                            <Label>Service</Label>
                            <Input
                              list={`other-services-${row.id}`}
                              value={row.label}
                              onChange={(event) => {
                                const value = event.target.value
                                setOthers((current) =>
                                  current.map((item) =>
                                    item.id === row.id
                                      ? { ...item, label: value, serviceId: null }
                                      : item
                                  )
                                )
                                void fetchServiceSuggestions(row.id, value, 'others')
                              }}
                              onBlur={(event) =>
                                applySuggestedService('others', row.id, event.target.value)
                              }
                              placeholder="Report or treatment name"
                              className={inputClassName}
                            />
                            <datalist id={`other-services-${row.id}`}>
                              {(serviceSuggestions[row.id] ?? []).map((item) => (
                                <option key={`${row.id}-${item.id}-${item.name}`} value={item.name}>
                                  {item.name}
                                </option>
                              ))}
                            </datalist>
                          </div>
                          <div>
                            <Label>In-house</Label>
                            <Input
                              type="number"
                              value={row.inHouseAmount}
                              onChange={(event) =>
                                setOthers((current) =>
                                  current.map((item) =>
                                    item.id === row.id
                                      ? { ...item, inHouseAmount: event.target.value }
                                      : item
                                  )
                                )
                              }
                              placeholder="0"
                              className={inputClassName}
                            />
                          </div>
                          <div>
                            <Label>Referred</Label>
                            <Input
                              type="number"
                              value={row.referredAmount}
                              onChange={(event) =>
                                setOthers((current) =>
                                  current.map((item) =>
                                    item.id === row.id
                                      ? { ...item, referredAmount: event.target.value }
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
                        onClick={() => setOthers((current) => [...current, makeRow('Additional Charge')])}
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
                    {summaryItems.map((item) => (
                      <div
                        key={item.label}
                        className="flex items-center justify-between text-[13px]"
                      >
                        <span className="text-slate-400 font-medium">{item.label}</span>
                        <span className="text-slate-100">{money(item.total)}</span>
                      </div>
                    ))}
                  </div>
                  {activeOperation !== 'opd' ? (
                    <div className="grid grid-cols-2 gap-2">
                      <div className="rounded-lg border border-border/90 bg-white/2 p-2.5">
                        <p className="text-[9px] uppercase tracking-wider text-slate-500 font-semibold">
                          In-house
                        </p>
                        <p className="text-sm font-semibold text-primary">
                          {money(systemAmount)}
                        </p>
                      </div>
                      <div className="rounded-lg border border-border/90 bg-white/2 p-2.5">
                        <p className="text-[9px] uppercase tracking-wider text-slate-500 font-semibold">
                          Referred
                        </p>
                        <p className="text-sm font-semibold text-slate-100">
                          {money(referredAmount)}
                        </p>
                      </div>
                    </div>
                  ) : null}
                  <div className="grand-total-shell rounded-lg border p-4 text-center">
                    <p className="text-[10px] uppercase tracking-widest text-primary font-bold">
                      Grand Total
                    </p>
                    <p className="text-grand-total mt-1 text-2xl font-bold tracking-tight">
                      {money(total)}
                    </p>
                  </div>
                  {submitState.status !== 'idle' ? (
                    <div
                      className={cn(
                        'status-message rounded-lg px-3 py-2 text-xs',
                        submitState.status === 'success'
                          ? 'status-success border border-emerald-400/25'
                          : submitState.status === 'error'
                            ? 'status-error border border-rose-400/25'
                            : 'status-info border border-primary/20'
                      )}
                    >
                      {submitState.message}
                    </div>
                  ) : null}
                  {isBooking && currentSavedBooking ? (
                    <div className="status-message status-info rounded-lg border border-primary/20 px-3 py-2 text-xs">
                      Saved booking
                      {currentSavedBooking.record.bookingNumber
                        ? ` #${currentSavedBooking.record.bookingNumber}`
                        : ''}
                      {currentSavedBooking.record.reference
                        ? ` - ${currentSavedBooking.record.reference}`
                        : ''}
                    </div>
                  ) : null}
                  {isBooking && editingBooking ? (
                    <div className="status-message status-sky rounded-lg border border-primary/20 px-3 py-2 text-xs">
                      Editing booking
                      {editingBooking.reference ? ` - ${editingBooking.reference}` : ''}
                    </div>
                  ) : null}
                  {isBooking && !bookingDoctorType ? (
                    <div className="status-message status-warning rounded-lg border border-amber-400/25 px-3 py-2 text-xs">
                      Booking mode currently supports Channeling and Dental visits with the
                      available public API.
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
                          className="h-10 rounded-md bg-primary text-primary-foreground text-xs font-semibold shadow-theme-primary-strong hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70"
                        >
                          {submitState.status === 'loading'
                            ? editingBooking
                              ? 'Updating Booking...'
                              : 'Saving Booking...'
                            : editingBooking
                              ? 'Update Booking'
                              : 'Save Booking'}
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
                        className="h-10 rounded-md bg-primary text-primary-foreground text-xs font-semibold shadow-theme-primary-strong hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70"
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
        ) : workspaceTab === 'bookings' ? (
          <SurfaceCard eyebrow="Bookings" title="Booking list" className="overflow-hidden">
            <div className="space-y-4">
              <div className="flex flex-col gap-3 rounded-lg border border-border/90 bg-[#111923] p-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-semibold text-white">Bookings for {billDate}</p>
                  <p className="mt-1 text-xs text-slate-400">
                    Edit a booking in the billing form, delete it, or move it into payment.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={refreshBookingQueue}
                  className={softButtonClassName}
                >
                  {bookingQueueLoading ? 'Refreshing...' : 'Refresh List'}
                </Button>
              </div>

              {bookingQueueError ? (
                <div className="rounded-lg border border-amber-400/25 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
                  {bookingQueueError}
                </div>
              ) : null}

              <div className="overflow-x-auto rounded-lg border border-border/90 bg-[#0d141e]">
                <table className="min-w-full divide-y divide-border/90 text-left text-sm">
                  <thead className="bg-white/[0.03] text-[10px] uppercase tracking-[0.22em] text-slate-500">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Booking</th>
                      <th className="px-4 py-3 font-semibold">Patient</th>
                      <th className="px-4 py-3 font-semibold">Doctor</th>
                      <th className="px-4 py-3 font-semibold">Amount</th>
                      <th className="px-4 py-3 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/90">
                    {bookingQueueLoading ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-sm text-slate-400">
                          Loading bookings for the selected date...
                        </td>
                      </tr>
                    ) : bookingQueue.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-sm text-slate-400">
                          No bookings found for {billDate}.
                        </td>
                      </tr>
                    ) : (
                      bookingQueue.map((booking) => (
                        <tr key={booking.id} className="align-top">
                          <td className="px-4 py-3">
                            <p className="font-medium text-white">
                              {booking.bookingNumber
                                ? `#${booking.bookingNumber}`
                                : booking.reference}
                            </p>
                            <p className="mt-1 text-xs text-slate-400">{booking.date}</p>
                            <p className="mt-1 text-[11px] uppercase tracking-[0.18em] text-primary">
                              {booking.status}
                            </p>
                          </td>
                          <td className="px-4 py-3">
                            <p className="font-medium text-white">
                              {booking.patient.name || 'Walk-in'}
                            </p>
                            <p className="mt-1 text-xs text-slate-400">
                              {booking.patient.telephone || 'No telephone'}
                            </p>
                          </td>
                          <td className="px-4 py-3">
                            <p className="font-medium text-white">{booking.doctor.name}</p>
                            <p className="mt-1 text-xs text-slate-400">
                              {booking.doctor.specialty || 'General'}
                            </p>
                          </td>
                          <td className="px-4 py-3">
                            <p className="font-medium text-white">{money(booking.billAmount)}</p>
                            <p className="mt-1 text-xs text-slate-400">
                              {displayShift(booking.shift)} / {booking.serviceType}
                            </p>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap gap-2">
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => loadBookingIntoForm(booking)}
                                className={softButtonClassName}
                              >
                                Edit
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => void handleDeleteBooking(booking)}
                                className={cn(
                                  softButtonClassName,
                                  'hover:border-rose-400/35 hover:bg-rose-500/10 hover:text-rose-100'
                                )}
                              >
                                Delete
                              </Button>
                              <Button
                                type="button"
                                onClick={() => setPaymentPromptBooking(booking)}
                                disabled={proceedingBookingId !== null}
                                className="h-8 rounded-md bg-primary px-3 text-xs font-semibold text-primary-foreground shadow-theme-primary-button hover:bg-primary/90"
                              >
                                {proceedingBookingId === booking.id
                                  ? 'Processing...'
                                  : 'Proceed To Payment'}
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </SurfaceCard>
        ) : (
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
            <SurfaceCard eyebrow="Reports" title="Summary prints" className="overflow-hidden">
              <div className="space-y-4">
                <div className="rounded-lg border border-border/90 bg-[#111923] p-4">
                  <p className="text-sm font-semibold text-white">Print service totals for {billDate}</p>
                  <p className="mt-1 text-xs text-slate-400">
                    Use the selected date above to print the morning or evening report.
                  </p>
                </div>

                <div className="grid gap-3 lg:grid-cols-2">
                  <Button
                    type="button"
                    onClick={() => void handlePrintShiftSummary('morning')}
                    disabled={summaryPrintState.status === 'loading'}
                    className="h-12 rounded-md bg-primary text-primary-foreground text-xs font-semibold shadow-theme-primary-strong hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {summaryPrintState.status === 'loading' &&
                    summaryPrintState.action === 'morning'
                      ? 'Printing Morning Report...'
                      : 'Print Morning Report'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => void handlePrintShiftSummary('evening')}
                    disabled={summaryPrintState.status === 'loading'}
                    className="h-12 rounded-md border-border/90 bg-white/4 text-xs font-semibold text-slate-100 hover:bg-white/8 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {summaryPrintState.status === 'loading' &&
                    summaryPrintState.action === 'evening'
                      ? 'Printing Evening Report...'
                      : 'Print Evening Report'}
                  </Button>
                </div>
              </div>
            </SurfaceCard>

            <aside className="space-y-4">
              <SurfaceCard eyebrow="Status" title="Print queue" className="p-3">
                <div className="space-y-3">
                  <div className="grid gap-2 rounded-lg border border-border/90 bg-[#111923] p-3">
                    <div className="flex items-center justify-between text-[13px]">
                      <span className="text-slate-400 font-medium">Selected date</span>
                      <span className="text-slate-100">{billDate}</span>
                    </div>
                    <div className="flex items-center justify-between text-[13px]">
                      <span className="text-slate-400 font-medium">Printer flow</span>
                      <span className="text-slate-100">Billing Desk printer</span>
                    </div>
                  </div>

                  <div className="space-y-2 rounded-lg border border-border/90 bg-white/2 p-3">
                    {(
                      [
                        {
                          label: 'Morning report',
                          value: 'Print the selected date using the morning shift summary.'
                        },
                        {
                          label: 'Evening report',
                          value: 'Print the selected date using the evening shift summary.'
                        }
                      ] as Array<{ label: string; value: string }>
                    ).map((item) => (
                      <div
                        key={item.label}
                        className="rounded-lg border border-border/80 bg-[#111923] px-3 py-2"
                      >
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
                          {item.label}
                        </p>
                        <p className="mt-1 text-xs text-slate-400">{item.value}</p>
                      </div>
                    ))}
                  </div>

                  {summaryPrintState.status !== 'idle' ? (
                    <div
                      className={cn(
                        'rounded-lg px-3 py-2 text-xs',
                        summaryPrintState.status === 'success'
                          ? 'border border-emerald-400/25 bg-emerald-500/10 text-emerald-100'
                          : summaryPrintState.status === 'error'
                            ? 'border border-rose-400/25 bg-rose-500/10 text-rose-100'
                            : 'border border-primary/20 bg-primary/10 text-primary'
                      )}
                    >
                      {summaryPrintState.message}
                    </div>
                  ) : (
                    <div className="rounded-lg border border-border/90 bg-white/2 px-3 py-2 text-xs text-slate-400">
                      Choose a summary action to send the selected date to the printer.
                    </div>
                  )}
                </div>
              </SurfaceCard>
            </aside>
          </div>
        )}
      </div>
    </main>
  )
}

export default App


