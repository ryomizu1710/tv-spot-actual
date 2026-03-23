import { useState, useCallback, useRef } from 'react'
import { FileSpreadsheet, Upload } from 'lucide-react'

interface FileDropZoneProps {
  /** 選択済みファイル名の表示 */
  displayName: string
  /** プレースホルダー */
  placeholder: string
  /** 受け付ける拡張子 */
  accept?: string
  /** 複数ファイル */
  multiple?: boolean
  /** ファイル選択時コールバック（単一） */
  onFileSelect?: (file: File) => void
  /** ファイル選択時コールバック（複数） */
  onFilesSelect?: (files: File[]) => void
}

export function FileDropZone({
  displayName,
  placeholder,
  accept = '.xlsx,.xls',
  multiple = false,
  onFileSelect,
  onFilesSelect,
}: FileDropZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFiles = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return
    if (multiple && onFilesSelect) {
      onFilesSelect(Array.from(files))
    } else if (onFileSelect && files[0]) {
      onFileSelect(files[0])
    }
  }, [multiple, onFileSelect, onFilesSelect])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
    handleFiles(e.dataTransfer.files)
  }, [handleFiles])

  const handleClick = () => {
    inputRef.current?.click()
  }

  return (
    <div
      onClick={handleClick}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`flex cursor-pointer items-center gap-3 rounded-lg border-2 border-dashed px-4 py-3 text-sm transition-colors ${
        isDragOver
          ? 'border-blue-400 bg-blue-50 text-blue-600'
          : displayName
            ? 'border-green-300 bg-green-50/50 text-gray-700'
            : 'border-gray-300 bg-gray-50/50 text-gray-500 hover:border-gray-400 hover:bg-gray-50'
      }`}
    >
      {isDragOver ? (
        <Upload size={16} className="text-blue-400" />
      ) : (
        <FileSpreadsheet size={16} className={displayName ? 'text-green-500' : 'text-gray-400'} />
      )}
      <span className={isDragOver ? 'font-medium' : ''}>
        {isDragOver
          ? 'ここにドロップ'
          : displayName || placeholder}
      </span>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  )
}
