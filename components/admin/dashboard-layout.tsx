"use client"

import { useState, useEffect, useCallback, FormEvent } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/contexts/auth-context'
import { toast } from 'sonner'
import { getApiUrl } from '@/lib/config'
import {
  LayoutDashboard,
  Briefcase,
  Users,
  Calendar,
  Settings,
  BarChart3,
  HelpCircle,
  Search,
  Bell,
  Menu,
  X,
  Sun,
  Moon,
  LogOut,
  User,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  MessageSquare,
  FileText
} from 'lucide-react'

interface DashboardLayoutProps {
  children: React.ReactNode
}

interface Notification {
  id: string
  title: string
  message: string
  type: string
  status: 'READ' | 'UNREAD'
  createdAt: string
  readAt: string | null
  actionUrl?: string
  caseId?: string
}

const navigationItems = [
  {
    title: 'Dashboard',
    href: '/admin',
    icon: LayoutDashboard,
  },
  {
    title: 'Cases',
    href: '/admin/cases',
    icon: Briefcase,
  },
  {
    title: 'Users',
    href: '/admin/users',
    icon: Users,
  },
  {
    title: 'Scheduling',
    href: '/admin/scheduling',
    icon: Calendar,
  },
  {
    title: 'Configuration',
    href: '/admin/configuration',
    icon: Settings,
  },
  {
    title: 'Analytics',
    href: '/admin/analytics',
    icon: BarChart3,
  },
  {
    title: 'Help Desk',
    href: '/admin/helpdesk',
    icon: HelpCircle,
  },
]

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const { user, logout } = useAuth()
  const pathname = usePathname()
  const router = useRouter()
  const searchInputRef = useCallback((inputElement: HTMLInputElement) => {
    if (inputElement) {
      const handleKeyDown = (e: KeyboardEvent) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
          e.preventDefault()
          inputElement.focus()
        }
      }
      
      window.addEventListener('keydown', handleKeyDown)
      
      return () => {
        window.removeEventListener('keydown', handleKeyDown)
      }
    }
  }, [])

  const toggleSidebar = () => setSidebarCollapsed(!sidebarCollapsed)
  const toggleDarkMode = () => setIsDarkMode(!isDarkMode)

  // Handle global search
  const handleSearch = (e: FormEvent) => {
    e.preventDefault()
    
    if (!searchTerm.trim()) return
    
    // Route to appropriate search page with the search term
    // This will depend on current path or context
    if (pathname.startsWith('/admin/cases')) {
      // If already on cases page, just modify the URL with the search param
      router.push(`/admin/cases?search=${encodeURIComponent(searchTerm)}`)
    } else {
      // Otherwise go to cases page with search term
      router.push(`/admin/cases?search=${encodeURIComponent(searchTerm)}`)
    }
  }

  const handleLogout = () => {
    logout()
    router.push('/auth/login')
  }

  // Fetch notifications from API
  const fetchNotifications = useCallback(async () => {
    if (!user?.id) return
    
    try {
      setIsLoadingNotifications(true)
      const response = await fetch(getApiUrl('api/notifications'), {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch notifications')
      }
      
      const data = await response.json()
      setNotifications(data)
    } catch (error) {
      console.error('Error fetching notifications:', error)
    } finally {
      setIsLoadingNotifications(false)
    }
  }, [user?.id])

  // Load notifications on mount
  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  // Get number of unread notifications
  const unreadCount = notifications.filter(n => n.status === 'UNREAD').length

  // Handle marking a notification as read
  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(getApiUrl(`api/notifications/${notificationId}/read`), {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      })
      
      if (!response.ok) {
        throw new Error('Failed to mark notification as read')
      }
      
      // Update local state
      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId 
            ? { ...n, status: 'READ' as const, readAt: new Date().toISOString() } 
            : n
        )
      )
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  // Handle marking all notifications as read
  const markAllAsRead = async () => {
    try {
      const response = await fetch(getApiUrl('api/notifications/read-all'), {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      })
      
      if (!response.ok) {
        throw new Error('Failed to mark all notifications as read')
      }
      
      // Update local state
      setNotifications(prev => 
        prev.map(n => ({ ...n, status: 'READ' as const, readAt: new Date().toISOString() }))
      )
      
      toast.success('All notifications marked as read')
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
      toast.error('Failed to mark all as read')
    }
  }

  // Handle notification click
  const handleNotificationClick = (notification: Notification) => {
    // Mark as read
    if (notification.status === 'UNREAD') {
      markAsRead(notification.id)
    }
    
    // Navigate if there's an action URL
    if (notification.actionUrl) {
      router.push(notification.actionUrl)
    } else if (notification.caseId) {
      router.push(`/admin/cases/${notification.caseId}`)
    }
  }

  // Function to get icon based on notification type
  const getNotificationIcon = (type: string) => {
    switch(type.toLowerCase()) {
      case 'case':
        return <Briefcase className="h-4 w-4 text-blue-600" />
      case 'document':
        return <FileText className="h-4 w-4 text-green-600" />
      case 'meeting':
      case 'hearing':
        return <Calendar className="h-4 w-4 text-purple-600" />
      case 'system':
        return <CheckCircle className="h-4 w-4 text-orange-600" />
      default:
        return <MessageSquare className="h-4 w-4 text-gray-600" />
    }
  }

  // Format relative time
  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffSecs = Math.floor(diffMs / 1000)
    const diffMins = Math.floor(diffSecs / 60)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffSecs < 60) return `${diffSecs} seconds ago`
    if (diffMins < 60) return `${diffMins} ${diffMins === 1 ? 'minute' : 'minutes'} ago`
    if (diffHours < 24) return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`
    if (diffDays < 30) return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`
    
    return date.toLocaleDateString()
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
      {/* Sidebar */}
      <nav
        className={cn(
          "h-screen bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col fixed top-0 bottom-0 left-0 z-10 transition-all duration-300",
          sidebarCollapsed ? "w-16" : "w-64"
        )}
      >
        {/* Logo and branding */}
        <div className="h-16 flex items-center px-4 border-b border-gray-200 dark:border-gray-700">
          <Link href="/admin" className="flex items-center">
            <div className="flex items-center justify-center h-10 w-10 bg-blue-600 text-white rounded-lg">
              <span className="font-bold">AP</span>
            </div>
            {!sidebarCollapsed && (
              <span className="ml-3 text-lg font-bold">Arbitration Portal</span>
            )}
          </Link>
          <button
            onClick={toggleSidebar}
            className={cn(
              "p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 ml-auto",
              sidebarCollapsed ? "" : "ml-auto"
            )}
          >
            {sidebarCollapsed ? (
              <ChevronRight className="h-5 w-5" />
            ) : (
              <ChevronLeft className="h-5 w-5" />
            )}
          </button>
        </div>

        {/* Navigation items */}
        <div className="flex-1 overflow-y-auto py-4">
          <div className="px-3 space-y-1">
            {navigationItems.map((item) => (
              <Link
                key={item.title}
                href={item.href}
                className={cn(
                  "flex items-center px-3 py-2 rounded-md text-sm font-medium",
                  pathname === item.href || (pathname && pathname.startsWith(item.href + '/'))
                    ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                    : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700",
                  sidebarCollapsed ? "justify-center" : ""
                )}
              >
                <item.icon className={cn("h-5 w-5", sidebarCollapsed ? "" : "mr-3")} />
                {!sidebarCollapsed && <span>{item.title}</span>}
              </Link>
            ))}
          </div>
        </div>
      </nav>

      {/* Main content */}
      <div
        className={cn(
          "flex-1 flex flex-col transition-all duration-300",
          sidebarCollapsed ? "ml-16" : "ml-64"
        )}
      >
        {/* Top Bar */}
        <header className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-6">
          {/* Left side - Page title/breadcrumb */}
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
              {navigationItems.find(item => pathname === item.href || (pathname && pathname.startsWith(item.href + '/')))?.title || 'Admin'}
            </h1>
          </div>

          {/* Right side - Search, notifications, user menu */}
          <div className="flex items-center space-x-4">
            {/* Global Search */}
            <form onSubmit={handleSearch} className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search cases, users..."
                className="pl-10 w-64"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                ref={searchInputRef}
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-50">
                  <span className="text-xs">⌘</span>K
                </kbd>
              </div>
            </form>

            {/* Notifications */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="relative">
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs">
                      {unreadCount}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel className="flex justify-between items-center">
                  <span>Notifications</span>
                  {unreadCount > 0 && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-6 text-xs"
                      onClick={markAllAsRead}
                      disabled={isLoadingNotifications}
                    >
                      Mark all as read
                    </Button>
                  )}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                
                {isLoadingNotifications ? (
                  <div className="py-8 flex justify-center items-center">
                    <div className="animate-spin h-5 w-5 border-2 border-gray-300 border-t-blue-600 rounded-full"></div>
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="py-6 text-center text-sm text-gray-500">
                    No notifications
                  </div>
                ) : (
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.map((notification) => (
                      <DropdownMenuItem 
                        key={notification.id} 
                        className="py-3 px-4 cursor-pointer flex items-start gap-3"
                        onClick={() => handleNotificationClick(notification)}
                      >
                        <div className="flex-shrink-0 bg-gray-100 rounded-full p-2">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={cn("text-sm font-medium", notification.status === 'READ' ? "text-gray-600" : "text-gray-900")}>
                            {notification.title}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {formatTimeAgo(notification.createdAt)}
                          </p>
                        </div>
                        {notification.status === 'UNREAD' && (
                          <div className="w-2 h-2 bg-blue-600 rounded-full mt-1.5"></div>
                        )}
                      </DropdownMenuItem>
                    ))}
                  </div>
                )}
                
                <DropdownMenuSeparator />
                <DropdownMenuItem className="py-2 justify-center">
                  <Link href="/admin/notifications" className="text-blue-600 text-sm font-medium">
                    View all notifications
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Dark mode toggle */}
            <Button variant="ghost" size="sm" onClick={toggleDarkMode}>
              {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="relative h-8 flex items-center gap-2 pl-2 pr-2">
                  <Avatar className="h-7 w-7">
                    <AvatarImage src="/avatars/01.png" alt={user?.name || 'User'} />
                    <AvatarFallback>{user?.name?.charAt(0) || 'U'}</AvatarFallback>
                  </Avatar>
                  {!sidebarCollapsed && (
                    <div className="flex flex-col items-start text-sm">
                      <span className="font-medium">{user?.name || 'User'}</span>
                      <span className="text-xs text-gray-500">{user?.role || 'Admin'}</span>
                    </div>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user?.name || 'User'}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user?.email || 'user@example.com'}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-6 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
} 