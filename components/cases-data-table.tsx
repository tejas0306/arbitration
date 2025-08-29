"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal, ArrowUpDown, Eye, Edit, FileText, Calendar, Download, ExternalLink } from "lucide-react"
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
export interface ArbitrationCase {
  id: string
  caseNumber: string
  claimant: string
  respondent: string
  category: string
  subCategory: string
  natureOfDispute: string
  arbitratorName: string
  arbitratorAssigned: "Assigned" | "Not Assigned"
  status: string
  hearingMode: "Online" | "Physical"
  lastUpdatedDate: string
  nextHearingDate: string | null
  agreementFile: string | null
  disputeAmount?: string
  priority?: "High" | "Medium" | "Low"
  userRole?: "claimant" | "respondent" | "admin"
  [key: string]: any
}

interface CasesDataTableProps {
  data: ArbitrationCase[]
  loading?: boolean
  onRefresh?: () => void
}

export function CasesDataTable({ data, loading = false, onRefresh }: CasesDataTableProps) {
  const router = useRouter()

  // Helper function to determine if we're in admin context
  const isAdminContext = React.useCallback(() => {
    if (typeof window !== 'undefined') {
      return window.location.pathname.includes('/admin/');
    }
    return false;
  }, []);

  const handleViewCase = React.useCallback((id: string, status?: string) => {
    try {
      
      // Check if the case exists
      if (!id) {
        toast.error("Case ID is missing")
        return
      }
      
      // Determine if we're in admin context
      const adminContext = isAdminContext();
      
      // For drafts in user context, navigate to edit page instead of view
      if (!adminContext && status && status.toLowerCase() === 'draft') {
        router.push(`/dashboard/petition/edit/${id}`)
        return
      }
      
      // Select appropriate URL based on context
      let viewUrl;
      
      if (adminContext) {
        viewUrl = `/admin/cases/${id}`;
      } else {
        viewUrl = `/dashboard/case/${id}`;
      }
      
      router.push(viewUrl)
    } catch (error) {
      toast.error("Failed to navigate to case details. Please try again.")
    }
  }, [router, isAdminContext])

  const handleEditCase = React.useCallback((id: string, status?: string) => {
    try {
      
      // Check if the case exists
      if (!id) {
        toast.error("Case ID is missing")
        return
      }
      
      // Determine if we're in an admin context
      const adminContext = isAdminContext();
      
      // Use appropriate edit URL based on context
      let editUrl = `/dashboard/petition/edit/${id}`
      
      if (adminContext) {
        editUrl = `/admin/cases/edit/${id}`
      } else {
      }
      
      router.push(editUrl)
    } catch (error) {
      toast.error("Failed to navigate to edit case. Please try again.")
    }
  }, [router, isAdminContext])

  const handleDownloadDocuments = React.useCallback((id: string) => {
    toast.info('Document download will be available soon')
  }, [])

  const handleRespond = React.useCallback((caseId: string) => {
    try {
      if (!caseId) {
        toast.error("Case ID is missing")
        return
      }
      
      // Navigate to respondent form page
      router.push(`/respondent/respond/${caseId}`)
    } catch (error) {
      toast.error("Failed to navigate to respondent form. Please try again.")
    }
  }, [router])

  const handleCounterResponse = React.useCallback((caseId: string) => {
    try {
      if (!caseId) {
        toast.error("Case ID is missing")
        return
      }
      
      // Navigate to counter-response page
      router.push(`/cases/${caseId}/counter-response`)
    } catch (error) {
      toast.error("Failed to navigate to counter-response form. Please try again.")
    }
  }, [router])

  const handleViewDocument = React.useCallback((documentUrl: string | null) => {
    if (!documentUrl) {
      toast.error('No document file available')
      return
    }

    try {
      const filename = documentUrl.includes('/') 
        ? documentUrl.split('/').pop() 
        : documentUrl

      if (documentUrl.startsWith('http')) {
        window.open(documentUrl, '_blank')
      } else if (filename) {
        const baseUrl = window.location.origin
        const directUrl = `${baseUrl}/files/${filename}`
        window.open(directUrl, '_blank')
      } else {
        const baseUrl = window.location.origin
        const documentPath = `/api/documents/download?filename=${encodeURIComponent(documentUrl)}`
        window.open(`${baseUrl}${documentPath}`, '_blank')
      }
    } catch (error) {
      toast.error('Could not open the document. Please try again later.')
    }
  }, [])

  const getStatusBadgeVariant = React.useCallback((status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
      case 'draft':
        return 'secondary'
      case 'approved':
      case 'completed':
      case 'closed':
        return 'default'
      case 'rejected':
      case 'withdrawn':
        return 'destructive'
      case 'arbitrator_assigned':
      case 'under_review':
        return 'default'
      case 'in_progress':
      case 'hearing_scheduled':
        return 'default'
      default:
        return 'outline'
    }
  }, [])

  const getStatusColor = React.useCallback((status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'approved':
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'rejected':
        return 'bg-red-100 text-red-800'
      case 'arbitrator_assigned':
        return 'bg-blue-100 text-blue-800'
      case 'in_progress':
        return 'bg-indigo-100 text-indigo-800'
      case 'under_review':
        return 'bg-purple-100 text-purple-800'
      case 'hearing_scheduled':
        return 'bg-orange-100 text-orange-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }, [])

  const formatDate = React.useCallback((dateString: string | null) => {
    if (!dateString) return 'Not set'
    try {
      return format(new Date(dateString), 'MMM dd, yyyy')
    } catch {
      return 'Invalid date'
    }
  }, [])

  const formatCurrency = React.useCallback((amount: string | undefined) => {
    if (!amount) return 'N/A'
    try {
      const numAmount = parseFloat(amount)
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
      }).format(numAmount)
    } catch {
      return amount
    }
  }, [])

  const columns: ColumnDef<ArbitrationCase>[] = React.useMemo(
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
        accessorKey: "caseNumber",
        header: ({ column }) => (
          <SortableHeader column={column}>Case Number</SortableHeader>
        ),
        cell: ({ row }) => (
          <div className="font-medium text-blue-600 hover:text-blue-800">
            <Button
              variant="link"
              className="p-0 h-auto font-medium text-blue-600 hover:text-blue-800"
              onClick={() => handleViewCase(row.original.id, row.original.status)}
            >
              {row.getValue("caseNumber") || "Pending"}
            </Button>
          </div>
        ),
      },
      {
        accessorKey: "claimant",
        header: ({ column }) => (
          <SortableHeader column={column}>Claimant</SortableHeader>
        ),
        cell: ({ row }) => (
          <div className="max-w-[150px] truncate">
            {row.getValue("claimant")}
          </div>
        ),
      },
      {
        accessorKey: "respondent",
        header: ({ column }) => (
          <SortableHeader column={column}>Respondent</SortableHeader>
        ),
        cell: ({ row }) => (
          <div className="max-w-[150px] truncate">
            {row.getValue("respondent")}
          </div>
        ),
      },
      {
        accessorKey: "category",
        header: "Category",
        cell: ({ row }) => (
          <Badge variant="outline" className="whitespace-nowrap">
            {row.getValue("category")}
          </Badge>
        ),
      },
      {
        accessorKey: "disputeAmount",
        header: ({ column }) => (
          <SortableHeader column={column}>Amount</SortableHeader>
        ),
        cell: ({ row }) => (
          <div className="font-medium">
            {formatCurrency(row.original.disputeAmount)}
          </div>
        ),
      },
      {
        accessorKey: "arbitratorAssigned",
        header: "Arbitrator",
        cell: ({ row }) => {
          const assigned = row.getValue("arbitratorAssigned") as string
          return (
            <div className="flex flex-col space-y-1">
              <Badge 
                variant={assigned === "Assigned" ? "default" : "secondary"}
                className="w-fit"
              >
                {assigned}
              </Badge>
              {assigned === "Assigned" && (
                <span className="text-xs text-muted-foreground">
                  {row.original.arbitratorName}
                </span>
              )}
            </div>
          )
        },
      },
      {
        accessorKey: "status",
        header: ({ column }) => (
          <SortableHeader column={column}>Status</SortableHeader>
        ),
        cell: ({ row }) => {
          const status = row.getValue("status") as string
          return (
            <span
              className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(status)}`}
            >
              {status.replace(/_/g, ' ').toUpperCase()}
            </span>
          )
        },
      },
      {
        accessorKey: "hearingMode",
        header: "Mode",
        cell: ({ row }) => (
          <Badge 
            variant={row.getValue("hearingMode") === "Online" ? "default" : "secondary"}
            className="whitespace-nowrap"
          >
            {row.getValue("hearingMode")}
          </Badge>
        ),
      },
      {
        accessorKey: "lastUpdatedDate",
        header: ({ column }) => (
          <SortableHeader column={column}>Last Updated</SortableHeader>
        ),
        cell: ({ row }) => (
          <div className="whitespace-nowrap">
            {formatDate(row.getValue("lastUpdatedDate"))}
          </div>
        ),
      },
      {
        accessorKey: "nextHearingDate",
        header: ({ column }) => (
          <SortableHeader column={column}>Next Hearing</SortableHeader>
        ),
        cell: ({ row }) => {
          const date = row.getValue("nextHearingDate") as string | null
          return (
            <div className="flex items-center space-x-1">
              <Calendar className="h-3 w-3 text-muted-foreground" />
              <span className="whitespace-nowrap">
                {date ? formatDate(date) : "Not scheduled"}
              </span>
            </div>
          )
        },
      },
      {
        accessorKey: "agreementFile",
        header: "Agreement",
        cell: ({ row }) => {
          const file = row.getValue("agreementFile") as string | null
          return file ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleViewDocument(file)}
              className="h-auto p-1"
            >
              <ExternalLink className="h-3 w-3" />
            </Button>
          ) : (
            <span className="text-muted-foreground text-xs">None</span>
          )
        },
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => {
          const caseData = row.original
          
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
                <DropdownMenuItem onClick={() => handleViewCase(caseData.id, caseData.status)}>
                  <Eye className="mr-2 h-4 w-4" />
                  View Details
                </DropdownMenuItem>
                {caseData.userRole === 'respondent' ? (
                  <DropdownMenuItem onClick={() => handleRespond(caseData.id)}>
                    <FileText className="mr-2 h-4 w-4" />
                    Respond to Case
                  </DropdownMenuItem>
                ) : (
                  <>
                    <DropdownMenuItem onClick={() => handleEditCase(caseData.id, caseData.status)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit Case
                    </DropdownMenuItem>
                    {/* Show Counter-Response option for claimants when case is in appropriate status */}
                    {caseData.userRole === 'claimant' && caseData.status === 'RESPONSE SUBMITTED' && (
                      <DropdownMenuItem onClick={() => handleCounterResponse(caseData.id)}>
                        <FileText className="mr-2 h-4 w-4" />
                        Counter-Response
                      </DropdownMenuItem>
                    )}
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleDownloadDocuments(caseData.id)}>
                  <Download className="mr-2 h-4 w-4" />
                  Download Docs
                </DropdownMenuItem>
                {caseData.agreementFile && (
                  <DropdownMenuItem onClick={() => handleViewDocument(caseData.agreementFile)}>
                    <FileText className="mr-2 h-4 w-4" />
                    View Agreement
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )
        },
        enableSorting: false,
        enableHiding: false,
      },
    ],
    [handleViewCase, handleEditCase, handleDownloadDocuments, handleRespond, handleCounterResponse, handleViewDocument, getStatusColor, formatDate, formatCurrency]
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Your Cases</h2>
          <p className="text-muted-foreground">
            Manage and track your arbitration cases
          </p>
        </div>
        {onRefresh && (
          <Button onClick={onRefresh} variant="outline" size="sm">
            Refresh
          </Button>
        )}
      </div>
      
      <DataTable
        columns={columns}
        data={data}
        searchKey="caseNumber"
        searchPlaceholder="Search cases..."
        loading={loading}
      />
    </div>
  )
} 