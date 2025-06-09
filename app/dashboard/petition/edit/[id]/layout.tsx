export default function PetitionEditLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="container mx-auto max-w-screen-xl">
      <div className="py-4">
        {children}
      </div>
    </div>
  )
} 