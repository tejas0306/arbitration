import { Metadata } from 'next'
import DebugAuth from '@/components/debug-auth'

export const metadata: Metadata = {
  title: 'Authentication Debug',
}

export default function DebugPage() {
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">Authentication Debug</h1>
      <DebugAuth />
    </div>
  )
} 