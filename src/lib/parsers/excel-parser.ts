import * as XLSX from 'xlsx'
import type { ParsedFileResult } from './csv-parser'

export function parseExcelFile(file: File): Promise<ParsedFileResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer)
        const workbook = XLSX.read(data, { type: 'array', codepage: 932 })
        const sheetName = workbook.SheetNames[0]
        const sheet = workbook.Sheets[sheetName]
        const jsonData = XLSX.utils.sheet_to_json<Record<string, string>>(sheet, {
          defval: '',
          raw: false,
        })
        const headers = jsonData.length > 0 ? Object.keys(jsonData[0]) : []
        resolve({ headers, rows: jsonData, encoding: 'Excel' })
      } catch (err) {
        reject(err)
      }
    }
    reader.onerror = () => reject(reader.error)
    reader.readAsArrayBuffer(file)
  })
}
