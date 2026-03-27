import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

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
  patient: {
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
  patient: {
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
  doctorId: number
  doctorType: 'specialist' | 'dental'
  date: string
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

type AppNotification = {
  level: 'error' | 'warning' | 'info' | 'success'
  title: string
  message: string
}

const APP_NOTIFICATION_CHANNEL = 'app:notification'

const api = {
  createUser: (user: { name: string; email: string }) => ipcRenderer.invoke('user:create', user),
  listUsers: () => ipcRenderer.invoke('user:list'),
  searchPatients: (query: string): Promise<PatientRecord[]> =>
    ipcRenderer.invoke('patients:search', query),
  listDoctors: (): Promise<DoctorRecord[]> => ipcRenderer.invoke('doctors:list'),
  submitBilling: (
    payload: BillingSubmission
  ): Promise<{ patient: PatientRecord; bill: Record<string, unknown>; print: Record<string, unknown> }> =>
    ipcRenderer.invoke('billing:submit', payload),
  submitBooking: (payload: BookingSubmission): Promise<BookingRecord> =>
    ipcRenderer.invoke('booking:submit', payload),
  printReceipt: (payload: PrintPayload): Promise<Record<string, unknown>> =>
    ipcRenderer.invoke('receipt:print', payload),
  onAppNotification: (callback: (notification: AppNotification) => void): (() => void) => {
    const listener = (_event: Electron.IpcRendererEvent, notification: AppNotification) => {
      callback(notification)
    }

    ipcRenderer.on(APP_NOTIFICATION_CHANNEL, listener)

    return () => {
      ipcRenderer.removeListener(APP_NOTIFICATION_CHANNEL, listener)
    }
  }
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
