import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

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

const api = {
  createUser: (user: { name: string; email: string }) => ipcRenderer.invoke('user:create', user),
  listUsers: () => ipcRenderer.invoke('user:list'),
  searchPatients: (query: string): Promise<PatientRecord[]> =>
    ipcRenderer.invoke('patients:search', query),
  listDoctors: (): Promise<DoctorRecord[]> => ipcRenderer.invoke('doctors:list'),
  submitBilling: (
    payload: BillingSubmission
  ): Promise<{ patient: PatientRecord; bill: Record<string, unknown> }> =>
    ipcRenderer.invoke('billing:submit', payload)
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
