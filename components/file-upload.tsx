"use client"

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { toast } from 'sonner'
import { FileText, X, Upload, AlertCircle, File, Trash } from 'lucide-react'

interface FileUploadProps {
  onFilesSelected: (files: File[]) => void
  maxFiles?: number
  maxSize?: number // in MB
  accept?: string
  className?: string
}

export function FileUpload({
  onFilesSelected,
  maxFiles = 5,
  maxSize = 10, // Default max 10MB
  accept = '*',
  className = ''
}: FileUploadProps) {
  const [files, setFiles] = useState<File[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const handleFileSelect = (selectedFiles: FileList | null) => {
    if (!selectedFiles) return
    
    const newFiles: File[] = []
    let hasErrors = false
    
    // Check if adding these files would exceed the limit
    if (files.length + selectedFiles.length > maxFiles) {
      toast.error(`You can only upload a maximum of ${maxFiles} files`)
      return
    }
    
    // Validate each file
    Array.from(selectedFiles).forEach(file => {
      // Check file size
      if (file.size > maxSize * 1024 * 1024) {
        toast.error(`File "${file.name}" exceeds the maximum size of ${maxSize}MB`)
        hasErrors = true
        return
      }
      
      // Add to new files array
      newFiles.push(file)
    })
    
    if (hasErrors) return
    
    // Update state with new files
    const updatedFiles = [...files, ...newFiles]
    setFiles(updatedFiles)
    onFilesSelected(updatedFiles)
  }
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }
  
  const handleDragLeave = () => {
    setIsDragging(false)
  }
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    handleFileSelect(e.dataTransfer.files)
  }
  
  const handleRemoveFile = (index: number) => {
    const updatedFiles = [...files]
    updatedFiles.splice(index, 1)
    setFiles(updatedFiles)
    onFilesSelected(updatedFiles)
  }
  
  const handleButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }
  
  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase()
    
    switch (extension) {
      case 'pdf':
        return <FileText className="text-red-500" />
      case 'doc':
      case 'docx':
        return <FileText className="text-blue-500" />
      case 'xls':
      case 'xlsx':
        return <FileText className="text-green-500" />
      case 'jpg':
      case 'jpeg':
      case 'png':
        return <FileText className="text-purple-500" />
      default:
        return <File className="text-gray-500" />
    }
  }
  
  const formatFileSize = (size: number) => {
    if (size < 1024) {
      return `${size} B`
    } else if (size < 1024 * 1024) {
      return `${(size / 1024).toFixed(1)} KB`
    } else {
      return `${(size / (1024 * 1024)).toFixed(1)} MB`
    }
  }
  
  return (
    <div className={className}>
      <input
        type="file"
        ref={fileInputRef}
        onChange={(e) => handleFileSelect(e.target.files)}
        multiple={maxFiles > 1}
        accept={accept}
        className="hidden"
      />
      
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center ${
          isDragging ? 'border-primary bg-primary/5' : 'border-gray-300'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="flex flex-col items-center justify-center space-y-2">
          <Upload className="h-8 w-8 text-muted-foreground mb-2" />
          <h3 className="font-medium">Drag and drop files here</h3>
          <p className="text-sm text-muted-foreground mb-2">
            or click the button below to browse
          </p>
          <Button type="button" variant="outline" onClick={handleButtonClick}>
            Browse Files
          </Button>
          <p className="text-xs text-muted-foreground mt-2">
            Maximum {maxFiles} files, up to {maxSize}MB each
          </p>
        </div>
      </div>
      
      {files.length > 0 && (
        <div className="mt-4 space-y-2">
          <h4 className="text-sm font-medium">Selected Files ({files.length}/{maxFiles})</h4>
          <div className="space-y-2">
            {files.map((file, index) => (
              <div 
                key={`${file.name}-${index}`}
                className="flex items-center justify-between p-3 border rounded-md bg-background"
              >
                <div className="flex items-center">
                  <div className="h-8 w-8 flex items-center justify-center">
                    {getFileIcon(file.name)}
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium truncate max-w-[200px]">{file.name}</p>
                    <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemoveFile(index)}
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                >
                  <Trash className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
} 