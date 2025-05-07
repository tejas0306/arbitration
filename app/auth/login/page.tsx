"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { auth } from "@/lib/api"
import { toast } from "sonner"
import { useAuth } from "@/contexts/auth-context"

export default function LoginPage() {
  const router = useRouter()
  const { login: authContextLogin } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      // Use the direct API call to authenticate
      const result = await auth.login({ email, password })
      
      // Update the auth context with the user data
      if (result.user) {
        authContextLogin(result.token, result.user)
      }
      
      toast.success("Login successful!")
      
      // Redirect to dashboard or home
      router.push("/dashboard")
    } catch (err: any) {
      console.error("Login error:", err)
      
      // Handle specific error scenarios
      if (err.response?.status === 401) {
        setError("Invalid email or password. Please try again.")
        toast.error("Invalid credentials")
      } else if (err.response?.status === 429) {
        setError("Too many login attempts. Please try again later.")
        toast.error("Rate limited")
      } else {
        setError(err.message || "Failed to login. Please try again.")
        toast.error("Login failed. Please check your email and password.")
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Login</CardTitle>
        </CardHeader>
        <CardContent>
          {error && <div className="bg-red-50 text-red-500 p-3 rounded mb-4">{error}</div>}
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium">
                Email
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-medium">
                Password
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Logging in..." : "Login"}
            </Button>
          </form>
          
          <div className="mt-4 text-center text-sm">
            Don't have an account?{" "}
            <a href="/auth/register" className="text-blue-600 hover:underline">
              Register
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}