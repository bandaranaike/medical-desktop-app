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

type BillingServiceSuggestion = {
  id: number
  name: string
  key: string
  inHousePrice: number
  referredPrice: number
}

type DoctorListOptions = {
  date?: string
  doctorType?: 'opd' | 'specialist' | 'dental' | 'treatment'
}

type BillLineItem = {
  name: string
  price: string
  serviceId?: number | null
  serviceKey?: string
  category?: 'opd' | 'channeling' | 'dental' | 'others'
  doctorId?: number | null
  inHouseAmount?: number
  referredAmount?: number
  totalAmount?: number
  isAdHoc?: boolean
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
  systemAmount: number
  serviceType: 'opd' | 'specialist' | 'dental' | 'treatment'
  shift: 'morning' | 'evening'
  date: string
  doctorName: string
  paymentType: 'cash' | 'card' | 'online'
  items: BillLineItem[]
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

type BookingQueueItem = {
  id: number
  billId: number
  reference: string
  bookingNumber: number | null
  date: string
  status: string
  patient: {
    id: number | null
    name: string
    telephone: string
    email: string
    age: string
    gender: string
    address: string
    dateOfBirth: string
    registrationNo: string
  }
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

type BookingUpdatePayload = {
  id: number
  patient: BookingSubmission['patient']
  doctorId: number
  doctorType: 'specialist' | 'dental'
  date: string
  shift: 'morning' | 'evening'
  paymentType: 'cash' | 'card' | 'online'
  serviceType: 'opd' | 'specialist' | 'dental' | 'treatment'
  billAmount: number
  systemAmount: number
  items: BillLineItem[]
}

type BookingProceedPayload = {
  id: number
  paymentType: 'cash' | 'card' | 'online'
  shift: 'morning' | 'evening'
  billAmount: number
  systemAmount: number
  items: BillLineItem[]
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

type SummaryShift = 'morning' | 'evening'

type DaySummaryItem = {
  service_name: string
  quantity: number
  total: number
}

type DaySummaryReport = {
  start_date: string
  end_date: string
  items: DaySummaryItem[]
}

type SummaryPrintResult = {
  shift: SummaryShift
  report: DaySummaryReport
  print: Record<string, unknown>
}

type AppNotification = {
  level: 'error' | 'warning' | 'info' | 'success'
  title: string
  message: string
}

type ThemeConfig = {
  baseColor: string
}

const APP_NOTIFICATION_CHANNEL = 'app:notification'

const api = {
  createUser: (user: { name: string; email: string }) => ipcRenderer.invoke('user:create', user),
  listUsers: () => ipcRenderer.invoke('user:list'),
  getThemeConfig: (): Promise<ThemeConfig> => ipcRenderer.invoke('theme:config'),
  searchPatients: (query: string): Promise<PatientRecord[]> =>
    ipcRenderer.invoke('patients:search', query),
  listDoctors: (options?: DoctorListOptions): Promise<DoctorRecord[]> =>
    ipcRenderer.invoke('doctors:list', options),
  searchBillingServices: (
    query: string,
    operation?: 'opd' | 'channeling' | 'dental' | 'others'
  ): Promise<BillingServiceSuggestion[]> =>
    ipcRenderer.invoke('billing-services:search', query, operation),
  submitBilling: (
    payload: BillingSubmission
  ): Promise<{
    patient: PatientRecord
    bill: Record<string, unknown>
    print: Record<string, unknown>
  }> => ipcRenderer.invoke('billing:submit', payload),
  submitBooking: (payload: BookingSubmission): Promise<BookingRecord> =>
    ipcRenderer.invoke('booking:submit', payload),
  listBookings: (date: string): Promise<BookingQueueItem[]> =>
    ipcRenderer.invoke('bookings:list', date),
  updateBooking: (payload: BookingUpdatePayload): Promise<BookingRecord> =>
    ipcRenderer.invoke('booking:update', payload),
  deleteBooking: (id: number): Promise<{ message: string; deletedId: number }> =>
    ipcRenderer.invoke('booking:delete', id),
  proceedBookingToPayment: (
    payload: BookingProceedPayload
  ): Promise<{ message: string; bill: Record<string, unknown> }> =>
    ipcRenderer.invoke('booking:proceed-to-payment', payload),
  printReceipt: (payload: PrintPayload): Promise<Record<string, unknown>> =>
    ipcRenderer.invoke('receipt:print', payload),
  printSummaryReport: (payload: {
    date: string
    shift: SummaryShift
  }): Promise<SummaryPrintResult> => ipcRenderer.invoke('summary-report:print', payload),
  printDaySummary: (date: string): Promise<SummaryPrintResult[]> =>
    ipcRenderer.invoke('summary-report:print-day', date),
  onAppNotification: (callback: (notification: AppNotification) => void): (() => void) => {
    const listener = (_event: Electron.IpcRendererEvent, notification: AppNotification): void => {
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
