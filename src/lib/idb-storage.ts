import { get, set, del } from 'idb-keyval'
import { createJSONStorage } from 'zustand/middleware'
import type { StateStorage } from 'zustand/middleware'

/**
 * IndexedDB ベースの StateStorage
 * 初回アクセス時に localStorage から自動マイグレーションする
 */
const idbStateStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    const value = (await get(name)) ?? null
    if (value !== null) return value

    // IndexedDB にデータがなければ localStorage からマイグレーション
    const lsValue = localStorage.getItem(name)
    if (lsValue !== null) {
      await set(name, lsValue)
      localStorage.removeItem(name)
      return lsValue
    }
    return null
  },
  setItem: async (name: string, value: string): Promise<void> => {
    await set(name, value)
  },
  removeItem: async (name: string): Promise<void> => {
    await del(name)
  },
}

/**
 * Zustand persist 用 IndexedDB ストレージ
 * localStorage の 5-10MB 制限を超えて数百MB級のデータを保存可能
 */
export const idbStorage = createJSONStorage(() => idbStateStorage)
