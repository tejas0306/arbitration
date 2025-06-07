import { Scale, User } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function Header() {
  const { user, isAuthenticated, logout } = useAuth()
  const isAdmin = user?.role === 'ADMIN'

  return (
    <header className="bg-purple-700 text-white py-3 px-6 shadow-md">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Scale className="h-8 w-8 text-indigo-200" />
          <div>
            <Link href="/">
              <h1 className="text-xl font-bold">ADDS Legal AI LLP</h1>
              <p className="text-xs text-indigo-200">Arbitration & Dispute Resolution System</p>
            </Link>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <div className="hidden md:flex space-x-6">
            <Link href="/" className="text-white hover:text-indigo-200 transition-colors px-2 py-1">
              Home
            </Link>
            
            {!isAuthenticated && (
              <>
                <Link href="#" className="text-white hover:text-indigo-200 transition-colors px-2 py-1">
                  About
                </Link>
                <Link href="#" className="text-white hover:text-indigo-200 transition-colors px-2 py-1">
                  Services
                </Link>
                <Link href="#" className="text-white hover:text-indigo-200 transition-colors px-2 py-1">
                  FAQs
                </Link>
                <Link href="#" className="text-white hover:text-indigo-200 transition-colors px-2 py-1">
                  Contact
                </Link>
              </>
            )}
            
            {isAuthenticated && (
              <>
                <Link href="/dashboard/my-cases" className="text-white hover:text-indigo-200 transition-colors px-2 py-1">
                  My Cases
                </Link>
                <Link href="/support" className="text-white hover:text-indigo-200 transition-colors px-2 py-1">
                  Support
                </Link>
              </>
            )}
          </div>
          
          {isAuthenticated ? (
            <div className="flex items-center space-x-3">
              <span className="text-sm mr-2">Welcome, {user?.name || 'User'}</span>
              
              <Link href="/dashboard" className="bg-blue-700 text-white px-4 py-1.5 rounded-md hover:bg-blue-800 transition-colors shadow-sm">
                Dashboard
              </Link>
              
              {/* Only show New Petition for CLAIMANT role */}
              {user?.role === 'CLAIMANT' && (
                <Link href="/arbitration/new" className="bg-blue-700 text-white px-4 py-1.5 rounded-md hover:bg-blue-800 transition-colors shadow-sm">
                  New Petition
                </Link>
              )}
              
              {isAdmin && (
                <Link href="/admin" className="bg-blue-700 text-white px-4 py-1.5 rounded-md hover:bg-blue-800 transition-colors shadow-sm">
                  Admin
                </Link>
              )}
              
              <Link href="/profile" className="bg-blue-700 text-white px-4 py-1.5 rounded-md hover:bg-blue-800 transition-colors shadow-sm flex items-center space-x-1">
                <User className="h-4 w-4" />
                <span>Profile</span>
              </Link>
              
              <Button 
                variant="destructive" 
                size="sm" 
                onClick={logout} 
                className="bg-red-600 hover:bg-red-700 shadow-sm rounded-md px-4 py-1.5"
              >
                Logout
              </Button>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Link href="/auth/login">
                <Button className="bg-white text-purple-700 hover:bg-indigo-100">
                  Login
                </Button>
              </Link>
              <Link href="/auth/register">
                <Button className="bg-white text-purple-700 hover:bg-indigo-100">
                  Register
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
