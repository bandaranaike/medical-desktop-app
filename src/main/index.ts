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
    throw new Error(
      `Missing API configuration in ${getConfigSourceLabel()}: ${missing.join(', ')}`
    )
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

  console.log('API Request:', config.baseUrl + path)

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

async function searchPatients(query: string): Promise<PatientRecord[]> {
  const payload = await apiRequest<unknown>(
    `/api/public/patients/search?query=${encodeURIComponent(query)}`
  )
  return getCollection(payload)
    .map(normalizePatient)
    .filter((item) => item.id > 0)
}

async function listDoctors(): Promise<DoctorRecord[]> {
  const payload = await apiRequest<unknown>('/api/public/doctors?sort[]=name')
  return getCollection(payload)
    .map(normalizeDoctor)
    .filter((item) => item.id > 0 && item.name)
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

async function createBooking(payload: BookingSubmission): Promise<BookingRecord> {
  const response = await apiRequest<Record<string, unknown>>('/api/public/bookings/make-appointment', {
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
  })

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

    ipcMain.handle('doctors:list', async () => {
      return listDoctors()
    })

    ipcMain.handle('billing:submit', async (_, payload: BillingSubmission) => {
      return submitBilling(payload)
    })

    ipcMain.handle('booking:submit', async (_, payload: BookingSubmission) => {
      return createBooking(payload)
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
