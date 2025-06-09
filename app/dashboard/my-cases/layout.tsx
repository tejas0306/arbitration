import { Suspense } from 'react'

export default function MyCasesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
      {children}
    </Suspense>
  )
} 