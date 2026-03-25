import { config as loadEnv } from 'dotenv'
import { app, shell, BrowserWindow, ipcMain } from 'electron'

loadEnv()

// Disable Autofill in DevTools to avoid noise in console
app.commandLine.appendSwitch('disable-features', 'AutofillServerCommunication')
// More specific switch if the above isn't enough
app.commandLine.appendSwitch('disable-autofill')

import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { PrismaClient } from '../generated/prisma/client'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'

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
}

type BillingResult = {
  patient: PatientRecord
  bill: Record<string, unknown>
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
    throw new Error(`Missing API configuration in .env: ${missing.join(', ')}`)
  }

  return {
    baseUrl: baseUrl!.replace(/\/+$/, ''),
    apiKey: apiKey!,
    referer: referer!,
    authToken: authToken!
  }
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
    return payload.filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null)
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
          const first = value.find((item): item is string => typeof item === 'string' && item.trim().length > 0)
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
  return {
    id: getNumber(record, 'id') ?? 0,
    name: getString(record, 'name'),
    telephone: getString(record, 'telephone') || getString(record, 'phone'),
    email: getString(record, 'email'),
    age:
      getString(record, 'age') ||
      String(getNumber(record, 'age') ?? ''),
    gender: getString(record, 'gender'),
    address: getString(record, 'address'),
    registrationNo:
      getString(record, 'registrationNo') ||
      getString(record, 'registration_no')
  }
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

function findExactPatientMatch(candidates: PatientRecord[], draft: PatientDraft): PatientRecord | null {
  const telephone = normalizePhone(draft.telephone)
  const name = normalizeWhitespace(draft.name).toLowerCase()

  return (
    candidates.find((candidate) => telephone && normalizePhone(candidate.telephone) === telephone) ||
    candidates.find((candidate) => name && normalizeWhitespace(candidate.name).toLowerCase() === name) ||
    null
  )
}

function patientPayloadFromDraft(draft: PatientDraft): Record<string, unknown> {
  return {
    name: normalizeWhitespace(draft.name),
    telephone: normalizeWhitespace(draft.telephone),
    email: normalizeWhitespace(draft.email) || undefined,
    age: Number(draft.age),
    gender: draft.gender.toLowerCase(),
    address: normalizeWhitespace(draft.address) || undefined
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

async function createBill(payload: BillingSubmission, patientId: number): Promise<Record<string, unknown>> {
  return apiRequest<Record<string, unknown>>('/api/public/bills', {
    method: 'POST',
    body: JSON.stringify({
      bill_amount: payload.total,
      payment_type: 'cash',
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

async function submitBilling(payload: BillingSubmission): Promise<BillingResult> {
  const patient = await upsertPatient(payload.patient)
  const bill = await createBill(payload, patient.id)
  return { patient, bill }
}

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
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
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

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

  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
