/// <reference types="vite/client" />
export {}

declare global {
  interface Window {
    api: {
      listUsers(): Promise<{ id: number; name: string; email: string }[]>
    }
  }
}
