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

declare global {
  interface Window {
    api: {
      listUsers(): Promise<Array<{ id: number; [key: string]: unknown }>>
      searchPatients(query: string): Promise<PatientRecord[]>
      listDoctors(): Promise<DoctorRecord[]>
      submitBilling(
        payload: BillingSubmission
      ): Promise<{ patient: PatientRecord; bill: Record<string, unknown>; print: Record<string, unknown> }>
      submitBooking(payload: BookingSubmission): Promise<BookingRecord>
      printReceipt(payload: PrintPayload): Promise<Record<string, unknown>>
      onAppNotification(callback: (notification: AppNotification) => void): () => void
    }
  }
}
