import type { Region } from './campaign'

export interface ColumnMapping {
  stationName: string
  broadcastDate: string
  broadcastTime: string
  programName: string
  creativeName: string
  creativeLength: string
  householdRating: string
  individualRating: string
}

export interface ImportError {
  rowIndex: number
  columnName: string
  value: string
  message: string
}

export interface ImportBatch {
  id: string
  campaignId: string
  region: Region
  fileName: string
  fileType: 'csv' | 'xlsx'
  importedAt: string
  rowCount: number
  successCount: number
  errorCount: number
  errors: ImportError[]
  columnMapping: ColumnMapping
}
