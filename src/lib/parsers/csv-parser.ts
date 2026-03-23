import Papa from 'papaparse'

export interface ParsedFileResult {
  headers: string[]
  rows: Record<string, string>[]
  encoding: string
}

export function parseCSVFile(file: File): Promise<ParsedFileResult> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      encoding: 'UTF-8',
      complete: (results) => {
        const headers = results.meta.fields ?? []
        const rows = results.data as Record<string, string>[]
        // Check for mojibake (garbled characters indicating wrong encoding)
        const firstRow = rows[0]
        if (firstRow && hasMojibake(Object.values(firstRow).join(''))) {
          // Re-parse as Shift_JIS
          Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            encoding: 'Shift_JIS',
            complete: (sjisResults) => {
              resolve({
                headers: sjisResults.meta.fields ?? [],
                rows: sjisResults.data as Record<string, string>[],
                encoding: 'Shift_JIS',
              })
            },
            error: (err) => reject(err),
          })
          return
        }
        resolve({ headers, rows, encoding: 'UTF-8' })
      },
      error: (err) => reject(err),
    })
  })
}

function hasMojibake(text: string): boolean {
  // Common mojibake patterns when Shift_JIS is read as UTF-8
  return /\ufffd/.test(text) || /ï¿½/.test(text)
}
