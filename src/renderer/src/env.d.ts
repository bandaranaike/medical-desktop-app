/// <reference types="vite/client" />
export {}

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
  items: Array<{
    name: string
    price: string
  }>
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

type AppNotification = {
  level: 'error' | 'warning' | 'info' | 'success'
  title: string
  message: string
}

declare global {
  interface Window {
    api: {
      listUsers(): Promise<Array<{ id: number; [key: string]: unknown }>>
      searchPatients(query: string): Promise<PatientRecord[]>
      listDoctors(options?: DoctorListOptions): Promise<DoctorRecord[]>
      submitBilling(payload: BillingSubmission): Promise<{
        patient: PatientRecord
        bill: Record<string, unknown>
        print: Record<string, unknown>
      }>
      submitBooking(payload: BookingSubmission): Promise<BookingRecord>
      listBookings(date: string): Promise<BookingQueueItem[]>
      updateBooking(payload: BookingUpdatePayload): Promise<BookingRecord>
      deleteBooking(id: number): Promise<{ message: string; deletedId: number }>
      proceedBookingToPayment(payload: BookingProceedPayload): Promise<{
        message: string
        bill: Record<string, unknown>
      }>
      printReceipt(payload: PrintPayload): Promise<Record<string, unknown>>
      onAppNotification(callback: (notification: AppNotification) => void): () => void
    }
  }
}
