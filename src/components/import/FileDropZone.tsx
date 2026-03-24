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
          ? 'border-[#0a84ff] bg-[#0a84ff]/10 text-[#0a84ff]'
          : displayName
            ? 'border-[#30d158]/30 bg-[#30d158]/[0.06] text-[#f5f5f7]'
            : 'border-white/[0.1] bg-white/[0.03] text-[#636366] hover:border-white/[0.15] hover:bg-white/[0.05]'
      }`}
    >
      {isDragOver ? (
        <Upload size={16} className="text-[#0a84ff]" />
      ) : (
        <FileSpreadsheet size={16} className={displayName ? 'text-[#30d158]' : 'text-[#636366]'} />
      )}
      <span className={isDragOver ? 'font-medium' : ''}>
        {isDragOver ? 'ここにドロップ' : displayName || placeholder}
      </span>
      <input ref={inputRef} type="file" accept={accept} multiple={multiple} className="hidden" onChange={(e) => handleFiles(e.target.files)} />
    </div>
  )
}
