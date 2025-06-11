"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "../../../components/ui/button"
import { Input } from "../../../components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select"
import { Textarea } from "../../../components/ui/textarea"
import { auth } from "../../../lib/api"

const UserRole = {
  CLAIMANT: "CLAIMANT",
  RESPONDENT: "RESPONDENT",
  ARBITRATOR: "ARBITRATOR"
}

export default function RegisterPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: UserRole.CLAIMANT,
    organization: "",
    // Arbitrator-specific fields
    expertise: "",
    qualifications: "",
    experience: 0,
    bio: ""
  })
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    const numberValue = parseInt(value) || 0
    setFormData(prev => ({ ...prev, [name]: numberValue }))
  }

  const handleRoleChange = (value: string) => {
    setFormData(prev => ({ ...prev, role: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      // Only include relevant fields based on role
      const registrationData = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        organization: formData.organization,
        ...(formData.role === UserRole.ARBITRATOR ? {
          expertise: formData.expertise,
          qualifications: formData.qualifications,
          experience: formData.experience,
          bio: formData.bio
        } : {})
      }
      
      await auth.register(registrationData)
      
      // Redirect to login page after successful registration
      router.push("/auth/login?registered=true")
    } catch (err: any) {
      setError(err.message || "Failed to register. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const isArbitrator = formData.role === UserRole.ARBITRATOR

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Register</CardTitle>
        </CardHeader>
        <CardContent>
          {error && <div className="bg-red-50 text-red-500 p-3 rounded mb-4">{error}</div>}
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="role" className="block text-sm font-medium">
                Register As
              </label>
              <Select value={formData.role} onValueChange={handleRoleChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={UserRole.CLAIMANT}>Claimant (Filing a Case)</SelectItem>
                  <SelectItem value={UserRole.RESPONDENT}>Respondent (Responding to a Case)</SelectItem>
                  <SelectItem value={UserRole.ARBITRATOR}>Arbitrator (Professional)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="name" className="block text-sm font-medium">
                Full Name*
              </label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium">
                Email*
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-medium">
                Password*
              </label>
              <Input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                required
                minLength={8}
              />
              <p className="text-xs text-gray-500">Password must be at least 8 characters long</p>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="organization" className="block text-sm font-medium">
                Organization {isArbitrator && "(Law Firm/Chamber)"}
              </label>
              <Input
                id="organization"
                name="organization"
                value={formData.organization}
                onChange={handleChange}
              />
            </div>
            
            {isArbitrator && (
              <>
                <div className="space-y-2">
                  <label htmlFor="expertise" className="block text-sm font-medium">
                    Areas of Expertise*
                  </label>
                  <Input
                    id="expertise"
                    name="expertise"
                    value={formData.expertise}
                    onChange={handleChange}
                    placeholder="E.g. Commercial, Construction, IP, International"
                    required={isArbitrator}
                  />
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="qualifications" className="block text-sm font-medium">
                    Qualifications*
                  </label>
                  <Input
                    id="qualifications"
                    name="qualifications"
                    value={formData.qualifications}
                    onChange={handleChange}
                    placeholder="E.g. LLB, PhD, FCIARB"
                    required={isArbitrator}
                  />
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="experience" className="block text-sm font-medium">
                    Years of Experience*
                  </label>
                  <Input
                    id="experience"
                    name="experience"
                    type="number"
                    min={0}
                    max={100}
                    value={formData.experience}
                    onChange={handleNumberChange}
                    required={isArbitrator}
                  />
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="bio" className="block text-sm font-medium">
                    Professional Bio*
                  </label>
                  <Textarea
                    id="bio"
                    name="bio"
                    value={formData.bio}
                    onChange={handleChange}
                    placeholder="Brief professional background and arbitration experience"
                    rows={4}
                    required={isArbitrator}
                  />
                </div>
              </>
            )}
            
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Registering..." : "Register"}
            </Button>
          </form>
          
          <div className="mt-4 text-center text-sm">
            Already have an account?{" "}
            <a href="/auth/login" className="text-blue-600 hover:underline">
              Login
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}