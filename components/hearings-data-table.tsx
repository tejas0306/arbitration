"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal, Calendar, Video, MapPin, Users, Clock, Edit, Eye, X } from "lucide-react"
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
export interface Hearing {
  id: string
  caseId: string
  caseNumber: string
  title: string
  date: string
  time: string
  duration: number // in minutes
  type: "virtual" | "physical"
  status: "scheduled" | "in_progress" | "completed" | "cancelled" | "postponed"
  meetingLink?: string
  location?: string
  attendees?: string[]
  notes?: string
  arbitratorName?: string
  [key: string]: any
}

interface HearingsDataTableProps {
  data: Hearing[]
  loading?: boolean
  onRefresh?: () => void
  showCaseInfo?: boolean
}

export function HearingsDataTable({ 
  data, 
  loading = false, 
  onRefresh,
  showCaseInfo = true 
}: HearingsDataTableProps) {
  const router = useRouter()

  const handleViewHearing = React.useCallback((hearing: Hearing) => {
    router.push(`/dashboard/hearings/${hearing.id}`)
  }, [router])

  const handleEditHearing = React.useCallback((hearing: Hearing) => {
    router.push(`/dashboard/hearings/${hearing.id}/edit`)
  }, [router])

  const handleJoinHearing = React.useCallback((hearing: Hearing) => {
    if (hearing.type === "virtual" && hearing.meetingLink) {
      window.open(hearing.meetingLink, '_blank')
    } else {
      toast.error("No meeting link available for this hearing")
    }
  }, [])

  const handleCancelHearing = React.useCallback((hearing: Hearing) => {
    // This would typically open a modal or make an API call
    toast.info("Cancel hearing functionality will be implemented")
  }, [])

  const getStatusColor = React.useCallback((status: string) => {
    switch (status.toLowerCase()) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800'
      case 'in_progress':
        return 'bg-green-100 text-green-800'
      case 'completed':
        return 'bg-gray-100 text-gray-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      case 'postponed':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }, [])

  const formatDateTime = React.useCallback((dateString: string, timeString?: string) => {
    try {
      const date = new Date(dateString)
      const dateFormatted = format(date, 'MMM dd, yyyy')
      return timeString ? `${dateFormatted} at ${timeString}` : dateFormatted
    } catch {
      return 'Invalid date'
    }
  }, [])

  const formatDuration = React.useCallback((minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0) {
      return `${hours}h ${mins > 0 ? `${mins}m` : ''}`
    }
    return `${mins}m`
  }, [])

  const isUpcoming = React.useCallback((dateString: string, timeString?: string) => {
    try {
      const hearingDate = new Date(dateString)
      if (timeString) {
        const [hours, minutes] = timeString.split(':').map(Number)
        hearingDate.setHours(hours, minutes)
      }
      return hearingDate > new Date()
    } catch {
      return false
    }
  }, [])

  const columns: ColumnDef<Hearing>[] = React.useMemo(
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
      ...(showCaseInfo ? [{
        accessorKey: "caseNumber",
        header: ({ column }: any) => (
          <SortableHeader column={column}>Case</SortableHeader>
        ),
        cell: ({ row }: any) => (
          <div className="font-medium text-blue-600">
            <Button
              variant="link"
              className="p-0 h-auto font-medium text-blue-600 hover:text-blue-800"
              onClick={() => router.push(`/dashboard/case/${row.original.caseId}`)}
            >
              {row.getValue("caseNumber")}
            </Button>
          </div>
        ),
      }] : []),
      {
        accessorKey: "title",
        header: ({ column }) => (
          <SortableHeader column={column}>Hearing Title</SortableHeader>
        ),
        cell: ({ row }) => (
          <div className="max-w-[200px]">
            <div className="font-medium truncate">
              {row.getValue("title") || "Hearing Session"}
            </div>
            {row.original.arbitratorName && (
              <div className="text-xs text-muted-foreground">
                Arbitrator: {row.original.arbitratorName}
              </div>
            )}
          </div>
        ),
      },
      {
        accessorKey: "date",
        header: ({ column }) => (
          <SortableHeader column={column}>Date & Time</SortableHeader>
        ),
        cell: ({ row }) => {
          const hearing = row.original
          const upcoming = isUpcoming(hearing.date, hearing.time)
          return (
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className={`font-medium ${upcoming ? 'text-blue-600' : 'text-gray-900'}`}>
                  {formatDateTime(hearing.date, hearing.time)}
                </div>
                <div className="text-xs text-muted-foreground">
                  Duration: {formatDuration(hearing.duration)}
                </div>
              </div>
            </div>
          )
        },
      },
      {
        accessorKey: "type",
        header: "Type",
        cell: ({ row }) => {
          const type = row.getValue("type") as string
          const Icon = type === "virtual" ? Video : MapPin
          return (
            <div className="flex items-center space-x-2">
              <Icon className="h-4 w-4" />
              <Badge variant={type === "virtual" ? "default" : "secondary"}>
                {type === "virtual" ? "Virtual" : "Physical"}
              </Badge>
            </div>
          )
        },
      },
      {
        accessorKey: "location",
        header: "Location/Link",
        cell: ({ row }) => {
          const hearing = row.original
          if (hearing.type === "virtual") {
            return hearing.meetingLink ? (
              <Button
                variant="link"
                size="sm"
                onClick={() => handleJoinHearing(hearing)}
                className="p-0 h-auto text-blue-600"
              >
                Join Meeting
              </Button>
            ) : (
              <span className="text-muted-foreground text-sm">Link not set</span>
            )
          }
          return (
            <div className="max-w-[150px] truncate text-sm">
              {hearing.location || "Location TBD"}
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
        accessorKey: "attendees",
        header: "Attendees",
        cell: ({ row }) => {
          const attendees = row.original.attendees || []
          return (
            <div className="flex items-center space-x-1">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                {attendees.length > 0 ? attendees.length : "TBD"}
              </span>
            </div>
          )
        },
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => {
          const hearing = row.original
          const canJoin = hearing.type === "virtual" && 
                         hearing.meetingLink && 
                         hearing.status === "scheduled" &&
                         isUpcoming(hearing.date, hearing.time)
          
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
                <DropdownMenuItem onClick={() => handleViewHearing(hearing)}>
                  <Eye className="mr-2 h-4 w-4" />
                  View Details
                </DropdownMenuItem>
                {hearing.status === "scheduled" && (
                  <DropdownMenuItem onClick={() => handleEditHearing(hearing)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Hearing
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                {canJoin && (
                  <DropdownMenuItem onClick={() => handleJoinHearing(hearing)}>
                    <Video className="mr-2 h-4 w-4" />
                    Join Meeting
                  </DropdownMenuItem>
                )}
                {hearing.status === "scheduled" && (
                  <DropdownMenuItem 
                    onClick={() => handleCancelHearing(hearing)}
                    className="text-red-600"
                  >
                    <X className="mr-2 h-4 w-4" />
                    Cancel
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
    [handleViewHearing, handleEditHearing, handleJoinHearing, handleCancelHearing, getStatusColor, formatDateTime, formatDuration, isUpcoming, showCaseInfo, router]
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Hearings</h2>
          <p className="text-muted-foreground">
            Manage and track arbitration hearings
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {onRefresh && (
            <Button onClick={onRefresh} variant="outline" size="sm">
              Refresh
            </Button>
          )}
          <Button onClick={() => router.push('/dashboard/hearings/new')} size="sm">
            Schedule Hearing
          </Button>
        </div>
      </div>
      
      <DataTable
        columns={columns}
        data={data}
        searchKey="title"
        searchPlaceholder="Search hearings..."
        loading={loading}
      />
    </div>
  )
} 