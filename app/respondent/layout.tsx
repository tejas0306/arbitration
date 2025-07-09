// This layout is no longer needed since we're using ProtectedRoute directly in the page component
// The ProtectedRoute component handles header/footer rendering
export default function RespondentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
} 