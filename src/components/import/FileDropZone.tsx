import { useState, useCallback, useRef } from 'react'
import { FileSpreadsheet, Upload } from 'lucide-react'

interface FileDropZoneProps {
  displayName: string
  placeholder: string
  accept?: string
  multiple?: boolean
  onFileSelect?: (file: File) => void
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

  const handleDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setIsDragOver(true) }, [])
  const handleDragLeave = useCallback((e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setIsDragOver(false) }, [])
  const handleDrop = useCallback((e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setIsDragOver(false); handleFiles(e.dataTransfer.files) }, [handleFiles])

  return (
    <div
      onClick={() => inputRef.current?.click()}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`flex cursor-pointer items-center gap-3 rounded-xl border-2 border-dashed px-4 py-3.5 text-[13px] transition-all duration-200 ${
        isDragOver
          ? 'border-[#007AFF] bg-[#007AFF]/[0.06] text-[#007AFF]'
          : displayName
            ? 'border-[#34C759]/30 bg-[#34C759]/[0.04] text-[#1d1d1f]'
            : 'border-black/[0.1] bg-black/[0.02] text-[#86868b] hover:border-black/[0.15] hover:bg-black/[0.04]'
      }`}
    >
      {isDragOver ? (
        <Upload size={16} className="text-[#007AFF]" />
      ) : (
        <FileSpreadsheet size={16} className={displayName ? 'text-[#34C759]' : 'text-[#86868b]'} />
      )}
      <span className={isDragOver ? 'font-medium' : ''}>
        {isDragOver ? 'ここにドロップ' : displayName || placeholder}
      </span>
      <input ref={inputRef} type="file" accept={accept} multiple={multiple} className="hidden" onChange={(e) => handleFiles(e.target.files)} />
    </div>
  )
}
