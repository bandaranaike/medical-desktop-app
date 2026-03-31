import { config as loadEnv } from 'dotenv'
import { existsSync, mkdirSync, writeFileSync } from 'fs'
import { app, shell, BrowserWindow, ipcMain } from 'electron'

// Disable Autofill in DevTools to avoid noise in the console
app.commandLine.appendSwitch('disable-features', 'AutofillServerCommunication')
// More specific switch if the above isn't enough
app.commandLine.appendSwitch('disable-autofill')

import { dirname, join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { PrismaClient } from '../generated/prisma/client'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'

const RUNTIME_CONFIG_FILE_NAME = 'config.env'
const DEFAULT_RUNTIME_CONFIG = [
  '# Runtime configuration for 5th-electron-app',
  '# Development uses the project .env file.',
  '# Packaged builds on Windows create/read this file from the app userData folder.',
  'API_BASE_URL=http://test-b.local',
  'API_KEY=',
  'API_REFERER=http://test-b.local',
  'API_AUTH_TOKEN=',
  'PRINTER_BASE_URL=http://0.0.0.0:5000',
  ''
].join('\n')

let createdRuntimeConfigPath: string | null = null

function getRuntimeConfigPath(): string {
  return join(app.getPath('userData'), RUNTIME_CONFIG_FILE_NAME)
}

function getConfigSourceLabel(): string {
  return app.isPackaged ? getRuntimeConfigPath() : '.env'
}

function ensureRuntimeConfigFile(): void {
  if (!app.isPackaged) return

  const runtimeConfigPath = getRuntimeConfigPath()
  if (existsSync(runtimeConfigPath)) return

  mkdirSync(dirname(runtimeConfigPath), { recursive: true })
  writeFileSync(runtimeConfigPath, DEFAULT_RUNTIME_CONFIG, 'utf8')
  createdRuntimeConfigPath = runtimeConfigPath
  console.warn(`Created runtime config template at ${runtimeConfigPath}`)
}

function loadRuntimeEnv(): void {
  if (app.isPackaged) {
    ensureRuntimeConfigFile()
    loadEnv({ path: getRuntimeConfigPath() })
    return
  }

  loadEnv()
}

loadRuntimeEnv()

const dbPath = join(app.getPath('userData'), 'dev.db')
const adapter = new PrismaBetterSqlite3({ url: dbPath })
const prisma = new PrismaClient({
  adapter,
  log: ['query', 'info']
})

type PatientDraft = {
  id?: number | null
  name: string
  telephone: string
  email: string
  dateOfBirth: string
  age: string
  gender: string
  address: string
  registrationNo: string
}

type PatientRecord = {
  id: number
  name: string
  telephone: string
  email: string
  dateOfBirth: string
  age: string
  gender: string
  address: string
  registrationNo: string
}

type DoctorRecord = {
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

type DoctorListOptions = {
  date?: string
  doctorType?: 'opd' | 'specialist' | 'dental' | 'treatment'
}

type BillingSubmission = {
  patient: PatientDraft
  doctorId: number
  total: number
  serviceType: 'opd' | 'specialist' | 'dental' | 'treatment'
  shift: 'morning' | 'evening'
  date: string
  doctorName: string
  paymentType: 'cash' | 'card' | 'online'
  items: Array<{
    name: string
    price: string
  }>
}

type BookingSubmission = {
  patient: PatientDraft
  doctorId: number
  doctorType: 'specialist' | 'dental'
  date: string
}

type BillingResult = {
  patient: PatientRecord
  bill: Record<string, unknown>
  print: Record<string, unknown>
}

type BookingRecord = {
  billId: number
  reference: string
  bookingNumber: number | null
  date: string
  doctorName: string
  doctorSpecialty: string
}

type BookingQueueItem = {
  id: number
  billId: number
  reference: string
  bookingNumber: number | null
  date: string
  status: string
  patient: PatientRecord
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
  items: Array<{
    name: string
    price: string
  }>
  createdAt: string
}

type BookingUpdatePayload = {
  id: number
  patient: PatientDraft
  doctorId: number
  doctorType: 'specialist' | 'dental'
  date: string
  shift: 'morning' | 'evening'
  paymentType: 'cash' | 'card' | 'online'
  serviceType: 'opd' | 'specialist' | 'dental' | 'treatment'
  billAmount: number
  systemAmount: number
  items: Array<{
    name: string
    price: string
  }>
}

type BookingProceedPayload = {
  id: number
  paymentType: 'cash' | 'card' | 'online'
  shift: 'morning' | 'evening'
  billAmount: number
  systemAmount: number
  items: Array<{
    name: string
    price: string
  }>
}

type PrintPayload = {
  billId: number
  billReference: string
  patientName: string
  doctorName: string
  paymentType: 'cash' | 'card' | 'online'
  items: Array<{
    name: string
    price: string
  }>
  total: number
}

type AppNotificationLevel = 'error' | 'warning' | 'info' | 'success'

type AppNotification = {
  level: AppNotificationLevel
  title: string
  message: string
}

const APP_NOTIFICATION_CHANNEL = 'app:notification'

function getUnknownErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message
  if (typeof error === 'string' && error.trim()) return error

  try {
    return JSON.stringify(error)
  } catch {
    return 'Unknown error'
  }
}

function broadcastAppNotification(notification: AppNotification, window?: BrowserWindow): void {
  const windows = window ? [window] : BrowserWindow.getAllWindows()

  for (const target of windows) {
    if (target.isDestroyed()) continue
    target.webContents.send(APP_NOTIFICATION_CHANNEL, notification)
  }
}

function reportAppError(
  context: string,
  error: unknown,
  options?: {
    title?: string
    window?: BrowserWindow
  }
): void {
  const message = getUnknownErrorMessage(error)
  console.error(`[${context}]`, error)
  broadcastAppNotification(
    {
      level: 'error',
      title: options?.title ?? 'Application error',
      message
    },
    options?.window
  )
}

function handlePromiseError<T>(
  promise: Promise<T>,
  context: string,
  options?: {
    title?: string
    window?: BrowserWindow
  }
): void {
  void promise.catch((error) => {
    reportAppError(context, error, options)
  })
}

function getApiConfig(): {
  baseUrl: string
  apiKey: string
  referer: string
  authToken: string
} {
  const baseUrl = process.env['API_BASE_URL']?.trim()
  const apiKey = process.env['API_KEY']?.trim()
  const referer = process.env['API_REFERER']?.trim()
  const authToken = process.env['API_AUTH_TOKEN']?.trim()

  const missing = [
    ['API_BASE_URL', baseUrl],
    ['API_KEY', apiKey],
    ['API_REFERER', referer],
    ['API_AUTH_TOKEN', authToken]
  ]
    .filter(([, value]) => !value)
    .map(([name]) => name)

  if (missing.length > 0) {
    throw new Error(`Missing API configuration in ${getConfigSourceLabel()}: ${missing.join(', ')}`)
  }

  return {
    baseUrl: baseUrl!.replace(/\/+$/, ''),
    apiKey: apiKey!,
    referer: referer!,
    authToken: authToken!
  }
}

function getPrinterBaseUrl(): string {
  const baseUrl = process.env['PRINTER_BASE_URL']?.trim()

  if (!baseUrl) {
    throw new Error(`Missing printer configuration in ${getConfigSourceLabel()}: PRINTER_BASE_URL`)
  }

  return baseUrl.replace(/\/+$/, '')
}

async function apiRequest<T>(
  path: string,
  init: RequestInit = {},
  options: { allowNotFound?: boolean } = {}
): Promise<T> {
  const config = getApiConfig()
  const headers = new Headers(init.headers)
  headers.set('Accept', 'application/json')
  headers.set('Content-Type', 'application/json')
  headers.set('X-API-KEY', config.apiKey)
  headers.set('Referer', config.referer)
  headers.set('Authorization', `Bearer ${config.authToken}`)

  const response = await fetch(`${config.baseUrl}${path}`, {
    ...init,
    headers
  })

  if (options.allowNotFound && response.status === 404) {
    return null as T
  }

  const rawText = await response.text()
  const body = rawText ? safeJsonParse(rawText) : null

  if (!response.ok) {
    const message = getErrorMessage(body, response.statusText)
    throw new Error(message || `API request failed with status ${response.status}`)
  }

  return body as T
}

function safeJsonParse(value: string): unknown {
  try {
    return JSON.parse(value)
  } catch {
    return value
  }
}

function getCollection(payload: unknown): Record<string, unknown>[] {
  if (Array.isArray(payload)) {
    return payload.filter(
      (item): item is Record<string, unknown> => typeof item === 'object' && item !== null
    )
  }
  if (
    payload &&
    typeof payload === 'object' &&
    'data' in payload &&
    Array.isArray((payload as { data?: unknown }).data)
  ) {
    return (payload as { data: unknown[] }).data.filter(
      (item): item is Record<string, unknown> => typeof item === 'object' && item !== null
    )
  }
  return []
}

function getErrorMessage(payload: unknown, fallback: string): string {
  if (typeof payload === 'string' && payload.trim()) {
    return payload
  }

  const directMessage = getString(payload, 'message') || getString(payload, 'error')
  if (directMessage) {
    return directMessage
  }

  if (payload && typeof payload === 'object' && 'errors' in payload) {
    const errors = (payload as { errors?: unknown }).errors
    if (errors && typeof errors === 'object') {
      for (const value of Object.values(errors as Record<string, unknown>)) {
        if (Array.isArray(value)) {
          const first = value.find(
            (item): item is string => typeof item === 'string' && item.trim().length > 0
          )
          if (first) return first
        }
        if (typeof value === 'string' && value.trim()) {
          return value
        }
      }
    }
  }

  return fallback
}

function getString(record: unknown, key: string): string {
  if (!record || typeof record !== 'object') return ''
  const value = (record as Record<string, unknown>)[key]
  return typeof value === 'string' ? value : ''
}

function getNumber(record: unknown, key: string): number | null {
  if (!record || typeof record !== 'object') return null
  const value = (record as Record<string, unknown>)[key]
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

function getRecord(record: unknown, key: string): Record<string, unknown> | null {
  if (!record || typeof record !== 'object') return null
  const value = (record as Record<string, unknown>)[key]
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null
}

function normalizeWhitespace(value: string): string {
  return value.trim().replace(/\s+/g, ' ')
}

function normalizePhone(value: string): string {
  return value.replace(/[^\d+]/g, '')
}

function normalizePatient(record: Record<string, unknown>): PatientRecord {
  const birthday = getString(record, 'birthday') || getString(record, 'dateOfBirth')

  return {
    id: getNumber(record, 'id') ?? 0,
    name: getString(record, 'name'),
    telephone: getString(record, 'telephone') || getString(record, 'phone'),
    email: getString(record, 'email'),
    dateOfBirth: formatIsoDateForDisplay(birthday),
    age: getString(record, 'age') || String(getNumber(record, 'age') ?? ''),
    gender: getString(record, 'gender'),
    address: getString(record, 'address'),
    registrationNo: getString(record, 'registrationNo') || getString(record, 'registration_no')
  }
}

function formatIsoDateForDisplay(value: string): string {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (!match) return ''

  const [, year, month, day] = match
  return `${day}/${month}/${year}`
}

function parseDisplayDateToIso(value: string): string | null {
  const trimmed = value.trim()
  const match = trimmed.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  if (!match) return null

  const [, day, month, year] = match
  const iso = `${year}-${month}-${day}`
  const parsed = new Date(`${iso}T00:00:00`)

  if (Number.isNaN(parsed.getTime())) return null
  if (parsed.getUTCFullYear() !== Number(year)) return null
  if (parsed.getUTCMonth() + 1 !== Number(month)) return null
  if (parsed.getUTCDate() !== Number(day)) return null

  return iso
}

function normalizeDoctor(record: Record<string, unknown>): DoctorRecord {
  const specialtyRecord =
    record['specialty'] && typeof record['specialty'] === 'object'
      ? (record['specialty'] as Record<string, unknown>)
      : null

  return {
    id: getNumber(record, 'id') ?? 0,
    name: getString(record, 'name'),
    specialty:
      getString(record, 'specialty_name') ||
      getString(specialtyRecord, 'name') ||
      getString(record, 'doctor_type') ||
      'General',
    telephone: getString(record, 'telephone') || getString(record, 'phone'),
    email: getString(record, 'email'),
    address: getString(record, 'address'),
    doctorType: getString(record, 'doctor_type') || 'specialist',
    dentalSplitMode: 'percentage',
    dentalSplitValue: 0
  }
}

function doctorCollection(payload: unknown): DoctorRecord[] {
  return getCollection(payload)
    .map(normalizeDoctor)
    .filter((item) => item.id > 0 && item.name)
}

async function searchPatients(query: string): Promise<PatientRecord[]> {
  const payload = await apiRequest<unknown>(
    `/api/public/patients/search?query=${encodeURIComponent(query)}`
  )
  return getCollection(payload)
    .map(normalizePatient)
    .filter((item) => item.id > 0)
}

async function listDoctors(options: DoctorListOptions = {}): Promise<DoctorRecord[]> {
  const date = options.date?.trim()
  const doctorType = options.doctorType?.trim()

  if (date && doctorType) {
    const datedAttempts = [
      `/api/public/doctors/by-date?date=${encodeURIComponent(date)}&type=${encodeURIComponent(doctorType)}`,
      `/api/public/doctor-availabilities/search-booking-doctors?date=${encodeURIComponent(date)}&type=${encodeURIComponent(doctorType)}`
    ]

    for (const path of datedAttempts) {
      try {
        const payload = await apiRequest<unknown>(path, {}, { allowNotFound: true })
        const doctors = doctorCollection(payload)
        if (doctors.length > 0) {
          return doctors
        }
      } catch (error) {
        console.warn(`[listDoctors] failed attempt for ${path}`, error)
      }
    }
  }

  const fallbackAttempts = [
    '/api/public/doctors?sort[]=name',
    `/api/public/doctors?sort[]=name${doctorType ? `&searchField=doctor_type&searchValue=${encodeURIComponent(doctorType)}` : ''}`
  ]

  for (const path of fallbackAttempts) {
    try {
      const payload = await apiRequest<unknown>(path, {}, { allowNotFound: true })
      const doctors = doctorCollection(payload)
      if (doctors.length > 0) {
        return doctors
      }
    } catch (error) {
      console.warn(`[listDoctors] fallback failed for ${path}`, error)
    }
  }

  return []
}

function findExactPatientMatch(
  candidates: PatientRecord[],
  draft: PatientDraft
): PatientRecord | null {
  const telephone = normalizePhone(draft.telephone)
  const name = normalizeWhitespace(draft.name).toLowerCase()

  return (
    candidates.find(
      (candidate) => telephone && normalizePhone(candidate.telephone) === telephone
    ) ||
    candidates.find(
      (candidate) => name && normalizeWhitespace(candidate.name).toLowerCase() === name
    ) ||
    null
  )
}

function patientPayloadFromDraft(draft: PatientDraft): Record<string, unknown> {
  return {
    name: normalizeWhitespace(draft.name),
    telephone: normalizeWhitespace(draft.telephone),
    email: normalizeWhitespace(draft.email) || undefined,
    birthday: parseDisplayDateToIso(draft.dateOfBirth) || undefined,
    age: Number(draft.age),
    gender: draft.gender.toLowerCase(),
    address: normalizeWhitespace(draft.address) || undefined,
    registrationNo: normalizeWhitespace(draft.registrationNo) || undefined,
    registration_no: normalizeWhitespace(draft.registrationNo) || undefined
  }
}

async function upsertPatient(draft: PatientDraft): Promise<PatientRecord> {
  if (draft.id && draft.id > 0) {
    const updated = await apiRequest<Record<string, unknown>>(`/api/public/patients/${draft.id}`, {
      method: 'PUT',
      body: JSON.stringify(patientPayloadFromDraft(draft))
    })
    return normalizePatient(updated)
  }

  const lookupQuery = normalizeWhitespace(draft.telephone || draft.name)
  if (lookupQuery) {
    const existing = findExactPatientMatch(await searchPatients(lookupQuery), draft)
    if (existing) {
      const updated = await apiRequest<Record<string, unknown>>(
        `/api/public/patients/${existing.id}`,
        {
          method: 'PUT',
          body: JSON.stringify(patientPayloadFromDraft({ ...draft, id: existing.id }))
        }
      )
      return normalizePatient(updated)
    }
  }

  const created = await apiRequest<Record<string, unknown>>('/api/public/patients', {
    method: 'POST',
    body: JSON.stringify(patientPayloadFromDraft(draft))
  })
  return normalizePatient(created)
}

async function createBill(
  payload: BillingSubmission,
  patientId: number
): Promise<Record<string, unknown>> {
  return apiRequest<Record<string, unknown>>('/api/public/bills', {
    method: 'POST',
    body: JSON.stringify({
      bill_amount: payload.total,
      payment_type: payload.paymentType,
      system_amount: 0,
      patient_id: patientId,
      doctor_id: payload.doctorId,
      is_booking: false,
      service_type: payload.serviceType,
      shift: payload.shift,
      date: payload.date
    })
  })
}

function normalizeBooking(record: Record<string, unknown>): BookingRecord {
  const billId = getNumber(record, 'bill_id') ?? getNumber(record, 'id') ?? 0

  if (!billId) {
    throw new Error('Booking was created, but no bill id was returned by the API.')
  }

  return {
    billId,
    reference: getString(record, 'reference') || getString(record, 'bill_reference'),
    bookingNumber: getNumber(record, 'booking_number'),
    date: getString(record, 'date'),
    doctorName: getString(record, 'doctor_name'),
    doctorSpecialty: getString(record, 'doctor_specialty')
  }
}

function normalizeBookingQueueItem(record: Record<string, unknown>): BookingQueueItem {
  const patientRecord = getRecord(record, 'patient')
  const doctorRecord = getRecord(record, 'doctor')
  const items =
    getRecord(record, 'items') === null && Array.isArray(record['items'])
      ? (record['items'] as unknown[])
      : []

  return {
    id: getNumber(record, 'id') ?? getNumber(record, 'bill_id') ?? 0,
    billId: getNumber(record, 'bill_id') ?? getNumber(record, 'id') ?? 0,
    reference: getString(record, 'reference') || getString(record, 'bill_reference'),
    bookingNumber: getNumber(record, 'booking_number'),
    date: getString(record, 'date'),
    status: getString(record, 'status') || 'booked',
    patient: patientRecord
      ? normalizePatient(patientRecord)
      : {
          id: getNumber(record, 'patient_id') ?? 0,
          name: getString(record, 'patient_name'),
          telephone: getString(record, 'telephone') || getString(record, 'phone'),
          email: getString(record, 'email'),
          dateOfBirth: formatIsoDateForDisplay(getString(record, 'birthday')),
          age: getString(record, 'age') || String(getNumber(record, 'age') ?? ''),
          gender: getString(record, 'gender'),
          address: getString(record, 'address'),
          registrationNo: getString(record, 'registration_no')
        },
    doctor: {
      id: doctorRecord ? getNumber(doctorRecord, 'id') : getNumber(record, 'doctor_id'),
      name: doctorRecord ? getString(doctorRecord, 'name') : getString(record, 'doctor_name'),
      specialty: doctorRecord
        ? getString(doctorRecord, 'specialty') ||
          getString(getRecord(doctorRecord, 'specialty'), 'name')
        : getString(record, 'doctor_specialty'),
      doctorType: doctorRecord
        ? getString(doctorRecord, 'doctor_type')
        : getString(record, 'service_type') || 'specialist'
    },
    paymentType: (getString(record, 'payment_type') as 'cash' | 'card' | 'online') || 'cash',
    shift: (getString(record, 'shift') as 'morning' | 'evening') || 'morning',
    serviceType:
      (getString(record, 'service_type') as 'opd' | 'specialist' | 'dental' | 'treatment') ||
      'specialist',
    billAmount: getNumber(record, 'bill_amount') ?? 0,
    systemAmount: getNumber(record, 'system_amount') ?? 0,
    items: items
      .filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null)
      .map((item) => ({
        name: getString(item, 'name') || getString(item, 'service_name') || 'Item',
        price: getString(item, 'price') || String(getNumber(item, 'bill_amount') ?? 0)
      })),
    createdAt: getString(record, 'created_at')
  }
}

function normalizeBookingQueue(payload: unknown): BookingQueueItem[] {
  return getCollection(payload)
    .map(normalizeBookingQueueItem)
    .filter((item) => item.id > 0)
}

function bookingPayloadFromPatient(draft: PatientDraft): Record<string, unknown> {
  return {
    name: normalizeWhitespace(draft.name),
    telephone: normalizeWhitespace(draft.telephone),
    email: normalizeWhitespace(draft.email) || undefined,
    age: Number(draft.age),
    gender: draft.gender.toLowerCase(),
    address: normalizeWhitespace(draft.address) || undefined,
    birthday: parseDisplayDateToIso(draft.dateOfBirth) || undefined,
    registration_no: normalizeWhitespace(draft.registrationNo) || undefined
  }
}

function bookingTimeScopeForDate(date: string): 'today' | 'future' | 'old' {
  const today = new Date().toISOString().slice(0, 10)
  if (date === today) return 'today'
  return date > today ? 'future' : 'old'
}

async function listBookings(date: string): Promise<BookingQueueItem[]> {
  const normalizedDate = date.trim()
  const attempts = [
    `/api/public/bookings?date=${encodeURIComponent(normalizedDate)}`,
    `/api/public/bills/bookings/${bookingTimeScopeForDate(normalizedDate)}?date=${encodeURIComponent(normalizedDate)}`
  ]

  for (const path of attempts) {
    try {
      const payload = await apiRequest<unknown>(path, {}, { allowNotFound: true })
      const bookings = normalizeBookingQueue(payload)
      if (bookings.length > 0) {
        return bookings.filter((item) => item.date === normalizedDate)
      }
    } catch (error) {
      console.warn(`[listBookings] failed attempt for ${path}`, error)
    }
  }

  return []
}

async function updateBooking(payload: BookingUpdatePayload): Promise<BookingRecord> {
  const response = await apiRequest<Record<string, unknown>>(`/api/public/bookings/${payload.id}`, {
    method: 'PUT',
    body: JSON.stringify({
      patient: bookingPayloadFromPatient(payload.patient),
      doctor_id: payload.doctorId,
      doctor_type: payload.doctorType,
      date: payload.date,
      shift: payload.shift,
      payment_type: payload.paymentType,
      service_type: payload.serviceType,
      bill_amount: payload.billAmount,
      system_amount: payload.systemAmount,
      items: payload.items
    })
  })

  const record = getRecord(response, 'booking') ?? response
  return normalizeBooking(record)
}

async function deleteBooking(id: number): Promise<{ message: string; deletedId: number }> {
  const response = await apiRequest<Record<string, unknown>>(`/api/public/bookings/${id}`, {
    method: 'DELETE'
  })

  return {
    message: getString(response, 'message') || 'Booking deleted successfully.',
    deletedId: getNumber(response, 'deleted_id') ?? id
  }
}

async function proceedBookingToPayment(
  payload: BookingProceedPayload
): Promise<{ message: string; bill: Record<string, unknown> }> {
  const response = await apiRequest<Record<string, unknown>>(
    `/api/public/bookings/${payload.id}/proceed-to-payment`,
    {
      method: 'POST',
      body: JSON.stringify({
        payment_type: payload.paymentType,
        shift: payload.shift,
        bill_amount: payload.billAmount,
        system_amount: payload.systemAmount,
        items: payload.items
      })
    }
  )

  return {
    message: getString(response, 'message') || 'Booking moved to payment successfully.',
    bill: getRecord(response, 'bill') ?? response
  }
}

async function createBooking(payload: BookingSubmission): Promise<BookingRecord> {
  const response = await apiRequest<Record<string, unknown>>(
    '/api/public/bookings/make-appointment',
    {
      method: 'POST',
      body: JSON.stringify({
        name: normalizeWhitespace(payload.patient.name),
        phone: normalizeWhitespace(payload.patient.telephone),
        email: normalizeWhitespace(payload.patient.email) || undefined,
        age: Number(payload.patient.age),
        doctor_id: payload.doctorId,
        doctor_type: payload.doctorType,
        date: payload.date
      })
    }
  )

  return normalizeBooking(response)
}

function getBillIdentifier(bill: Record<string, unknown>): number | null {
  return getNumber(bill, 'id') ?? getNumber(bill, 'bill_id')
}

function getBillReference(bill: Record<string, unknown>): string {
  return (
    getString(bill, 'bill_reference') ||
    getString(bill, 'reference') ||
    getString(bill, 'uuid') ||
    ''
  )
}

async function printReceipt(payload: PrintPayload): Promise<Record<string, unknown>> {
  const response = await fetch(`${getPrinterBaseUrl()}/print`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      bill_reference: payload.billReference,
      payment_type: payload.paymentType,
      bill_id: payload.billId,
      customer_name: payload.patientName,
      doctor_name: payload.doctorName,
      items: payload.items,
      total: payload.total.toFixed(2)
    })
  })

  const rawText = await response.text()
  const body = rawText ? safeJsonParse(rawText) : null

  if (!response.ok) {
    const message = getErrorMessage(body, response.statusText)
    throw new Error(message || `Printer request failed with status ${response.status}`)
  }

  return (body as Record<string, unknown>) ?? {}
}

async function submitBilling(payload: BillingSubmission): Promise<BillingResult> {
  const patient = await upsertPatient(payload.patient)
  const bill = await createBill(payload, patient.id)
  const billId = getBillIdentifier(bill)

  if (!billId) {
    throw new Error('Bill was created, but no printable bill id was returned by the API.')
  }

  const print = await printReceipt({
    billId,
    billReference: getBillReference(bill),
    patientName: patient.name,
    doctorName: payload.doctorName,
    paymentType: payload.paymentType,
    items: payload.items,
    total: payload.total
  })
  return { patient, bill, print }
}

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 1440,
    height: 960,
    minWidth: 1300,
    minHeight: 820,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()

    if (createdRuntimeConfigPath) {
      broadcastAppNotification(
        {
          level: 'warning',
          title: 'Configuration required',
          message: `Created ${createdRuntimeConfigPath}. Fill in the API settings and restart the app.`
        },
        mainWindow
      )
    }
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    handlePromiseError(shell.openExternal(details.url), 'Open external link', {
      title: 'Unable to open link',
      window: mainWindow
    })
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    handlePromiseError(
      mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL']),
      'Load renderer URL',
      {
        title: 'Renderer failed to load',
        window: mainWindow
      }
    )
  } else {
    handlePromiseError(
      mainWindow.loadFile(join(__dirname, '../renderer/index.html')),
      'Load renderer file',
      {
        title: 'Renderer failed to load',
        window: mainWindow
      }
    )
  }
}

process.on('unhandledRejection', (reason) => {
  reportAppError('Unhandled promise rejection', reason)
})

process.on('uncaughtException', (error) => {
  reportAppError('Uncaught exception', error)
})

handlePromiseError(
  app.whenReady().then(() => {
    electronApp.setAppUserModelId('com.electron')

    app.on('browser-window-created', (_, window) => {
      optimizer.watchWindowShortcuts(window)
    })

    ipcMain.on('ping', () => console.log('pong'))

    ipcMain.handle('user:create', async (_, data) => {
      return prisma.user.create({ data })
    })

    ipcMain.handle('user:list', async () => {
      return prisma.user.findMany()
    })

    ipcMain.handle('patients:search', async (_, query: string) => {
      return searchPatients(query)
    })

    ipcMain.handle('doctors:list', async (_, options?: DoctorListOptions) => {
      return listDoctors(options)
    })

    ipcMain.handle('billing:submit', async (_, payload: BillingSubmission) => {
      return submitBilling(payload)
    })

    ipcMain.handle('booking:submit', async (_, payload: BookingSubmission) => {
      return createBooking(payload)
    })

    ipcMain.handle('bookings:list', async (_, date: string) => {
      return listBookings(date)
    })

    ipcMain.handle('booking:update', async (_, payload: BookingUpdatePayload) => {
      return updateBooking(payload)
    })

    ipcMain.handle('booking:delete', async (_, id: number) => {
      return deleteBooking(id)
    })

    ipcMain.handle('booking:proceed-to-payment', async (_, payload: BookingProceedPayload) => {
      return proceedBookingToPayment(payload)
    })

    ipcMain.handle('receipt:print', async (_, payload: PrintPayload) => {
      return printReceipt(payload)
    })

    createWindow()

    app.on('activate', function () {
      if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
  }),
  'Initialize application',
  { title: 'App startup failed' }
)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
