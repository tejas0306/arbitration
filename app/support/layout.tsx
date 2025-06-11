import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Support - Arbitration Portal',
  description: 'Get help and submit support requests for the arbitration portal'
}

export default function SupportLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
} 