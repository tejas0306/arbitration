"use client"

import { useState } from 'react'
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
  ChevronRight
} from 'lucide-react'

interface DashboardLayoutProps {
  children: React.ReactNode
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
  const [notifications] = useState(3) // This would come from API
  const { user, logout } = useAuth()
  const pathname = usePathname()
  const router = useRouter()

  const toggleSidebar = () => setSidebarCollapsed(!sidebarCollapsed)
  const toggleDarkMode = () => setIsDarkMode(!isDarkMode)

  const handleLogout = () => {
    logout()
    router.push('/auth/login')
  }

  return (
    <div className={`min-h-screen ${isDarkMode ? 'dark' : ''}`}>
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
        {/* Sidebar */}
        <aside
          className={cn(
            "fixed left-0 top-0 z-40 h-screen transition-all duration-300 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700",
            sidebarCollapsed ? "w-16" : "w-64"
          )}
        >
          {/* Logo Section */}
          <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200 dark:border-gray-700">
            {!sidebarCollapsed && (
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">A</span>
                </div>
                <span className="text-lg font-semibold text-gray-900 dark:text-white">
                  Arbitration
                </span>
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleSidebar}
              className="p-1"
            >
              {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </Button>
          </div>

          {/* Navigation */}
          <nav className="mt-4 px-2">
            <ul className="space-y-1">
              {navigationItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href || (pathname && pathname.startsWith(item.href + '/'))
                
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                        isActive
                          ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200"
                          : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700",
                        sidebarCollapsed ? "justify-center" : "justify-start"
                      )}
                    >
                      <Icon className={cn("h-5 w-5", !sidebarCollapsed && "mr-3")} />
                      {!sidebarCollapsed && <span>{item.title}</span>}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </nav>
        </aside>

        {/* Main Content */}
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
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search cases, users..."
                  className="pl-10 w-64"
                />
              </div>

              {/* Notifications */}
              <Button variant="ghost" size="sm" className="relative">
                <Bell className="h-5 w-5" />
                {notifications > 0 && (
                  <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs">
                    {notifications}
                  </Badge>
                )}
              </Button>

              {/* Dark mode toggle */}
              <Button variant="ghost" size="sm" onClick={toggleDarkMode}>
                {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </Button>

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src="/avatars/admin.png" alt={user?.name || 'Admin'} />
                      <AvatarFallback>{user?.name?.charAt(0) || 'A'}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user?.name || 'Administrator'}</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user?.email || 'admin@arbitration.com'}
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

          {/* Main Content Area */}
          <main className="flex-1 overflow-y-auto p-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  )
} 