/// <reference types="vite/client" />
export {}

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
  patient: {
    id?: number | null
    name: string
    telephone: string
    email: string
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
}

declare global {
  interface Window {
    api: {
      listUsers(): Promise<Array<{ id: number; [key: string]: unknown }>>
      searchPatients(query: string): Promise<PatientRecord[]>
      listDoctors(): Promise<DoctorRecord[]>
      submitBilling(
        payload: BillingSubmission
      ): Promise<{ patient: PatientRecord; bill: Record<string, unknown> }>
    }
  }
}
