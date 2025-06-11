"use client"

import { AuthProvider } from "../contexts/auth-context"
import "./globals.css"
import { Toaster } from 'sonner'
import NextTopLoader from 'nextjs-toploader'
import { ApiProgressBar } from "../components/ui/api-progress-bar"
import { SessionProvider } from "next-auth/react"

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Arbitration Portal</title>
      </head>
      <body>
        <NextTopLoader 
          color="#2563eb" // Blue color matching the UI theme
          initialPosition={0.08}
          height={3}
          showSpinner={false}
          shadow="0 0 10px #2563eb,0 0 5px #2563eb"
          zIndex={9999}
        />
        <ApiProgressBar />
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
