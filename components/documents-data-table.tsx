"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal, FileText, Download, Eye, Trash2, Upload, Share, Lock } from "lucide-react"
import { format } from "date-fns"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { DataTable, SortableHeader } from "@/components/ui/data-table"
import { toast } from "sonner"

// Type definitions
export interface Document {
  id: string
  name: string
  filename: string
  type: string
  category: "agreement" | "evidence" | "filing" | "correspondence" | "award" | "other"
  size: number // in bytes
  uploadedAt: string
  uploadedBy: string
  caseId?: string
  caseNumber?: string
  isConfidential: boolean
  description?: string
  tags?: string[]
  downloadUrl?: string
  [key: string]: any
}

interface DocumentsDataTableProps {
  data: Document[]
  loading?: boolean
  onRefresh?: () => void
  showCaseInfo?: boolean
  allowUpload?: boolean
}

export function DocumentsDataTable({ 
  data, 
  loading = false, 
  onRefresh,
  showCaseInfo = true,
  allowUpload = true
}: DocumentsDataTableProps) {
  const router = useRouter()

  const handleViewDocument = React.useCallback((document: Document) => {
    if (document.downloadUrl) {
      window.open(document.downloadUrl, '_blank')
    } else {
      // Fallback to direct file access
      const baseUrl = window.location.origin
      const directUrl = `${baseUrl}/api/direct-file/${document.filename}`
      window.open(directUrl, '_blank')
    }
  }, [])

  const handleDownloadDocument = React.useCallback((document: Document) => {
    try {
      const link = document.createElement('a')
      link.href = document.downloadUrl || `/api/documents/download/${document.id}`
      link.download = document.name
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      toast.success(`Downloaded ${document.name}`)
    } catch (error) {
      console.error('Download error:', error)
      toast.error('Failed to download document')
    }
  }, [])

  const handleDeleteDocument = React.useCallback((document: Document) => {
    // This would typically open a confirmation modal
    toast.info("Delete document functionality will be implemented")
  }, [])

  const handleShareDocument = React.useCallback((document: Document) => {
    // This would typically open a sharing modal
    toast.info("Share document functionality will be implemented")
  }, [])

  const getCategoryColor = React.useCallback((category: string) => {
    switch (category.toLowerCase()) {
      case 'agreement':
        return 'bg-blue-100 text-blue-800'
      case 'evidence':
        return 'bg-green-100 text-green-800'
      case 'filing':
        return 'bg-purple-100 text-purple-800'
      case 'correspondence':
        return 'bg-yellow-100 text-yellow-800'
      case 'award':
        return 'bg-orange-100 text-orange-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }, [])

  const formatFileSize = React.useCallback((bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }, [])

  const formatDate = React.useCallback((dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy HH:mm')
    } catch {
      return 'Invalid date'
    }
  }, [])

  const getFileIcon = React.useCallback((type: string) => {
    const mimeType = type.toLowerCase()
    if (mimeType.includes('pdf')) {
      return <FileText className="h-4 w-4 text-red-500" />
    } else if (mimeType.includes('image')) {
      return <FileText className="h-4 w-4 text-blue-500" />
    } else if (mimeType.includes('word') || mimeType.includes('document')) {
      return <FileText className="h-4 w-4 text-blue-600" />
    } else if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) {
      return <FileText className="h-4 w-4 text-green-600" />
    }
    return <FileText className="h-4 w-4 text-gray-500" />
  }, [])

  const columns: ColumnDef<Document>[] = React.useMemo(
    () => [
      {
        id: "select",
        header: ({ table }) => (
          <input
            type="checkbox"
            checked={table.getIsAllPageRowsSelected()}
            onChange={(e) => table.toggleAllPageRowsSelected(!!e.target.checked)}
            className="rounded border border-input"
          />
        ),
        cell: ({ row }) => (
          <input
            type="checkbox"
            checked={row.getIsSelected()}
            onChange={(e) => row.toggleSelected(!!e.target.checked)}
            className="rounded border border-input"
          />
        ),
        enableSorting: false,
        enableHiding: false,
      },
      {
        accessorKey: "name",
        header: ({ column }) => (
          <SortableHeader column={column}>Document Name</SortableHeader>
        ),
        cell: ({ row }) => {
          const document = row.original
          return (
            <div className="flex items-center space-x-3 min-w-0">
              {getFileIcon(document.type)}
              <div className="min-w-0 flex-1">
                <div className="font-medium truncate">
                  <Button
                    variant="link"
                    className="p-0 h-auto font-medium text-blue-600 hover:text-blue-800 text-left"
                    onClick={() => handleViewDocument(document)}
                  >
                    {document.name}
                  </Button>
                </div>
                {document.description && (
                  <div className="text-xs text-muted-foreground truncate">
                    {document.description}
                  </div>
                )}
              </div>
              {document.isConfidential && (
                <Lock className="h-3 w-3 text-red-500" />
              )}
            </div>
          )
        },
      },
      ...(showCaseInfo ? [{
        accessorKey: "caseNumber",
        header: ({ column }: any) => (
          <SortableHeader column={column}>Case</SortableHeader>
        ),
        cell: ({ row }: any) => {
          const document = row.original
          return document.caseNumber ? (
            <Button
              variant="link"
              className="p-0 h-auto font-medium text-blue-600 hover:text-blue-800"
              onClick={() => router.push(`/dashboard/case/${document.caseId}`)}
            >
              {document.caseNumber}
            </Button>
          ) : (
            <span className="text-muted-foreground">-</span>
          )
        },
      }] : []),
      {
        accessorKey: "category",
        header: "Category",
        cell: ({ row }) => {
          const category = row.getValue("category") as string
          return (
            <span
              className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getCategoryColor(category)}`}
            >
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </span>
          )
        },
      },
      {
        accessorKey: "type",
        header: "Type",
        cell: ({ row }) => {
          const type = row.getValue("type") as string
          const extension = type.split('/').pop()?.toUpperCase() || 'FILE'
          return (
            <Badge variant="outline" className="text-xs">
              {extension}
            </Badge>
          )
        },
      },
      {
        accessorKey: "size",
        header: ({ column }) => (
          <SortableHeader column={column}>Size</SortableHeader>
        ),
        cell: ({ row }) => (
          <div className="text-sm text-muted-foreground">
            {formatFileSize(row.getValue("size"))}
          </div>
        ),
      },
      {
        accessorKey: "uploadedBy",
        header: "Uploaded By",
        cell: ({ row }) => (
          <div className="text-sm">
            {row.getValue("uploadedBy")}
          </div>
        ),
      },
      {
        accessorKey: "uploadedAt",
        header: ({ column }) => (
          <SortableHeader column={column}>Upload Date</SortableHeader>
        ),
        cell: ({ row }) => (
          <div className="text-sm text-muted-foreground">
            {formatDate(row.getValue("uploadedAt"))}
          </div>
        ),
      },
      {
        accessorKey: "tags",
        header: "Tags",
        cell: ({ row }) => {
          const tags = row.original.tags || []
          return (
            <div className="flex flex-wrap gap-1">
              {tags.slice(0, 2).map((tag: string, index: number) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {tags.length > 2 && (
                <Badge variant="secondary" className="text-xs">
                  +{tags.length - 2}
                </Badge>
              )}
            </div>
          )
        },
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => {
          const document = row.original
          
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[160px]">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleViewDocument(document)}>
                  <Eye className="mr-2 h-4 w-4" />
                  View
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleDownloadDocument(document)}>
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleShareDocument(document)}>
                  <Share className="mr-2 h-4 w-4" />
                  Share
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => handleDeleteDocument(document)}
                  className="text-red-600"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )
        },
        enableSorting: false,
        enableHiding: false,
      },
    ],
    [handleViewDocument, handleDownloadDocument, handleDeleteDocument, handleShareDocument, getCategoryColor, formatFileSize, formatDate, getFileIcon, showCaseInfo, router]
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Documents</h2>
          <p className="text-muted-foreground">
            Manage case documents and evidence
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {onRefresh && (
            <Button onClick={onRefresh} variant="outline" size="sm">
              Refresh
            </Button>
          )}
          {allowUpload && (
            <Button onClick={() => router.push('/dashboard/documents/upload')} size="sm">
              <Upload className="mr-2 h-4 w-4" />
              Upload
            </Button>
          )}
        </div>
      </div>
      
      <DataTable
        columns={columns}
        data={data}
        searchKey="name"
        searchPlaceholder="Search documents..."
        loading={loading}
      />
    </div>
  )
} 