"use client"

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts/auth-context'
import {
  LayoutDashboard,
  Briefcase,
  Users,
  Settings,
  BarChart3,
  Bell,
  FileText,
  FilePlus,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  Calendar,
  UserPlus
} from 'lucide-react'

export default function DashboardSidebar() {
  const { user } = useAuth()
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const isAdmin = user?.role === 'ADMIN'
  
  // Define navigation items based on user role
  const commonNavItems = [
    {
      title: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
    },
    {
      title: 'My Cases',
      href: '/dashboard/my-cases',
      icon: Briefcase,
    }
  ]
  
  const adminNavItems = [
    {
      title: 'Arbitrators',
      href: '/dashboard/arbitrators',
      icon: GraduationCap,
    },
    {
      title: 'Users',
      href: '/admin/users',
      icon: Users,
    },
    {
      title: 'Case Management',
      href: '/dashboard/cases',
      icon: FileText,
    },
    {
      title: 'Audit Logs',
      href: '/dashboard/audit',
      icon: BarChart3,
    },
    {
      title: 'Scheduling',
      href: '/dashboard/scheduling',
      icon: Calendar,
    },
    {
      title: 'Settings',
      href: '/dashboard/settings',
      icon: Settings,
    }
  ]
  
  const claimantNavItems = [
    {
      title: 'New Petition',
      href: '/dashboard/petition',
      icon: FilePlus,
    },
    {
      title: 'Notifications',
      href: '/dashboard/notifications',
      icon: Bell,
    }
  ]
  
  // Combine navigation items based on user role
  const navigationItems = [
    ...commonNavItems,
    ...(isAdmin ? adminNavItems : []),
    ...(user?.role === 'CLAIMANT' ? claimantNavItems : [])
  ]
  
  return (
    <div className={cn(
      "h-screen fixed left-0 top-0 z-30 bg-gray-50 border-r border-gray-200 transition-all duration-300",
      collapsed ? "w-16" : "w-64"
    )}>
      {/* Sidebar Toggle */}
      <div className="absolute -right-3 top-20">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="bg-white rounded-full p-1 border border-gray-200 shadow-sm"
        >
          {collapsed ? 
            <ChevronRight className="h-4 w-4 text-gray-600" /> : 
            <ChevronLeft className="h-4 w-4 text-gray-600" />
          }
        </button>
      </div>
      
      {/* Sidebar Content */}
      <div className="pt-20 px-2">
        <nav>
          <ul className="space-y-1">
            {navigationItems.map((item) => {
              const Icon = item.icon
              const isActive = 
                pathname === item.href || 
                (item.href !== '/dashboard' && pathname?.startsWith(item.href))
              
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      isActive 
                        ? "bg-purple-100 text-purple-700" 
                        : "text-gray-700 hover:bg-gray-100",
                      collapsed ? "justify-center" : "justify-start"
                    )}
                  >
                    <Icon className={cn("h-5 w-5", !collapsed && "mr-3")} />
                    {!collapsed && <span>{item.title}</span>}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>
      </div>
    </div>
  )
} 