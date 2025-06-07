"use client"

import { AuthProvider } from "@/contexts/auth-context"
import "./globals.css"
import { Toaster } from 'sonner'
import { SessionProvider } from "next-auth/react"

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>
        <SessionProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </SessionProvider>
        <Toaster />
      </body>
    </html>
  )
}
