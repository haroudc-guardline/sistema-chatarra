'use client'

import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { X, Upload, File as FileIcon, Image as ImageIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FileUploadProps {
  onFilesSelected: (files: File[]) => void
  acceptedTypes?: string[]
  maxFiles?: number
  maxSize?: number // in bytes
}

export function FileUpload({
  onFilesSelected,
  acceptedTypes = ['image/*', '.pdf', '.doc', '.docx'],
  maxFiles = 5,
  maxSize = 10 * 1024 * 1024, // 10MB
}: FileUploadProps) {
  const [files, setFiles] = useState<File[]>([])
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({})

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const newFiles = [...files, ...acceptedFiles].slice(0, maxFiles)
      setFiles(newFiles)
      onFilesSelected(newFiles)

      // Simulate upload progress
      acceptedFiles.forEach((file) => {
        setUploadProgress((prev) => ({ ...prev, [file.name]: 0 }))
        const interval = setInterval(() => {
          setUploadProgress((prev) => {
            const current = prev[file.name] || 0
            if (current >= 100) {
              clearInterval(interval)
              return prev
            }
            return { ...prev, [file.name]: current + 10 }
          })
        }, 100)
      })
    },
    [files, maxFiles, onFilesSelected]
  )

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    accept: acceptedTypes.reduce((acc, type) => {
      if (type.includes('/')) {
        acc[type] = []
      } else {
        acc[type] = []
      }
      return acc
    }, {} as Record<string, string[]>),
    maxFiles: maxFiles - files.length,
    maxSize,
  })

  const removeFile = (fileToRemove: File) => {
    const newFiles = files.filter((file) => file !== fileToRemove)
    setFiles(newFiles)
    onFilesSelected(newFiles)
    setUploadProgress((prev) => {
      const newProgress = { ...prev }
      delete newProgress[fileToRemove.name]
      return newProgress
    })
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return <ImageIcon className="h-8 w-8 text-red-600" />
    }
    return <FileIcon className="h-8 w-8 text-blue-500" />
  }

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <div
        {...getRootProps()}
        className={cn(
          'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
          isDragActive
            ? 'border-red-600 bg-red-50'
            : 'border-slate-300 hover:border-slate-400 hover:bg-slate-50',
          files.length >= maxFiles && 'opacity-50 cursor-not-allowed'
        )}
      >
        <input {...getInputProps()} disabled={files.length >= maxFiles} />
        <Upload className="h-10 w-10 text-slate-400 mx-auto mb-4" />
        {isDragActive ? (
          <p className="text-red-700 font-medium">Suelta los archivos aquí...</p>
        ) : (
          <>
            <p className="text-slate-600 font-medium">
              Arrastra y suelta archivos aquí, o haz clic para seleccionar
            </p>
            <p className="text-slate-400 text-sm mt-2">
              Máximo {maxFiles} archivos, hasta {formatFileSize(maxSize)} cada uno
            </p>
          </>
        )}
      </div>

      {/* Errors */}
      {fileRejections.length > 0 && (
        <div className="text-red-600 text-sm">
          {fileRejections.map(({ file, errors }) => (
            <p key={file.name}>
              {file.name}: {errors.map((e) => e.message).join(', ')}
            </p>
          ))}
        </div>
      )}

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-3">
          {files.map((file) => (
            <div
              key={file.name}
              className="flex items-center gap-3 p-3 border rounded-lg bg-white"
            >
              {getFileIcon(file)}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">
                  {file.name}
                </p>
                <p className="text-xs text-slate-500">{formatFileSize(file.size)}</p>
                {uploadProgress[file.name] !== undefined && uploadProgress[file.name] < 100 && (
                  <Progress value={uploadProgress[file.name]} className="h-1 mt-2" />
                )}
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeFile(file)}
                className="text-slate-400 hover:text-red-500"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
