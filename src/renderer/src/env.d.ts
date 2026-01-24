/// <reference types="vite/client" />
export {}

declare global {
  interface Window {
    api: {
      listUsers(): Promise<Array<{ id: number; [key: string]: unknown }>>
      searchUsers(query: string): Promise<Array<{ id: number; [key: string]: unknown }>>
    }
  }
}
