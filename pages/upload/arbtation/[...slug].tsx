import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function LegacyUploadRedirect({ slug }: { slug: string[] }) {
  const router = useRouter();

  useEffect(() => {
    const relativePath = slug.join('/');
    console.log(`Redirecting from legacy path: /upload/arbtation/${relativePath}`);
    
    // Redirect to the correct new path
    const correctPath = `/api/uploads/arbitration/${relativePath}`;
    window.location.href = correctPath;
  }, [slug]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
        <h1 className="text-2xl font-bold text-center mb-4">Redirecting...</h1>
        <p className="text-gray-600 text-center mb-6">
          Please wait while we redirect you to the file.
        </p>
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
        </div>
      </div>
    </div>
  );
}

export async function getServerSideProps({ params }: { params: { slug: string[] } }) {
  return {
    props: {
      slug: params.slug,
    },
  };
} 