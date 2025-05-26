import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useSession } from 'next-auth/react'
import Header from '@/components/header'
import Footer from '@/components/footer'
import ProtectedRoute from '@/components/protected-route'
import { api } from '@/lib/api'
import { toast } from 'sonner'

interface Evidence {
  id: string
  type: 'document' | 'photo' | 'video' | 'audio' | 'statement' | 'expert'
  title: string
  description: string
  fileName: string
  fileSize: number
  uploadedAt: string
  uploadedBy: string
  category: string
  status: 'pending' | 'approved' | 'rejected'
}

interface CaseData {
  id: string
  caseNumber: string
  claimant: string
  respondent: string
  status: string
}

export default function EvidenceManagementPage() {
  const router = useRouter()
  const { id } = router.query
  const { data: session } = useSession()
  const [caseData, setCaseData] = useState<CaseData | null>(null)
  const [evidence, setEvidence] = useState<Evidence[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [activeTab, setActiveTab] = useState<'upload' | 'manage'>('manage')

  // Upload form state
  const [uploadForm, setUploadForm] = useState({
    title: '',
    description: '',
    type: 'document' as Evidence['type'],
    category: '',
    file: null as File | null
  })

  useEffect(() => {
    if (id) {
      fetchCaseData()
      fetchEvidence()
    }
  }, [id])

  const fetchCaseData = async () => {
    try {
      const response = await api.arbitration.getById(id as string)
      setCaseData(response)
    } catch (error) {
      console.error('Error fetching case:', error)
      toast.error('Failed to load case details')
    }
  }

  const fetchEvidence = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/arbitration/cases/${id}/evidence`)
      if (response.ok) {
        const data = await response.json()
        setEvidence(data)
      }
    } catch (error) {
      console.error('Error fetching evidence:', error)
      toast.error('Failed to load evidence')
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!uploadForm.file || !uploadForm.title || !uploadForm.type) {
      toast.error('Please fill in all required fields')
      return
    }

    if (uploadForm.file.size > 50 * 1024 * 1024) { // 50MB limit
      toast.error('File size must be less than 50MB')
      return
    }

    try {
      setUploading(true)
      
      const formData = new FormData()
      formData.append('file', uploadForm.file)
      formData.append('title', uploadForm.title)
      formData.append('description', uploadForm.description)
      formData.append('type', uploadForm.type)
      formData.append('category', uploadForm.category)

      const response = await fetch(`/api/arbitration/cases/${id}/evidence/upload`, {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        toast.success('Evidence uploaded successfully')
        setUploadForm({
          title: '',
          description: '',
          type: 'document',
          category: '',
          file: null
        })
        fetchEvidence() // Refresh evidence list
        setActiveTab('manage')
      } else {
        throw new Error('Upload failed')
      }
    } catch (error) {
      console.error('Upload error:', error)
      toast.error('Failed to upload evidence')
    } finally {
      setUploading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'text-green-600 bg-green-100'
      case 'rejected': return 'text-red-600 bg-red-100'
      case 'pending': return 'text-yellow-600 bg-yellow-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'document': return '📄'
      case 'photo': return '📷'
      case 'video': return '🎥'
      case 'audio': return '🎵'
      case 'statement': return '📝'
      case 'expert': return '🎓'
      default: return '📎'
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <ProtectedRoute>
      <Header />
      <main className="container mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-2 text-sm text-gray-500 mb-2">
            <button onClick={() => router.push(`/arbitration/cases/${id}`)} className="hover:text-blue-600">
              Case {caseData?.caseNumber}
            </button>
            <span>›</span>
            <span>Evidence Management</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Evidence Management</h1>
          <p className="text-gray-600 mt-2">
            Upload and manage evidence for your arbitration case.
          </p>
        </div>

        {/* Case Summary */}
        {caseData && (
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Case Summary</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Case Number</p>
                <p className="text-base">{caseData.caseNumber}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Claimant</p>
                <p className="text-base">{caseData.claimant}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Respondent</p>
                <p className="text-base">{caseData.respondent}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Status</p>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(caseData.status)}`}>
                  {caseData.status}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="bg-white shadow rounded-lg">
          <div className="border-b border-gray-200">
            <nav className="flex">
              <button
                onClick={() => setActiveTab('manage')}
                className={`py-4 px-6 border-b-2 font-medium text-sm ${
                  activeTab === 'manage'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Evidence Library ({evidence.length})
              </button>
              <button
                onClick={() => setActiveTab('upload')}
                className={`py-4 px-6 border-b-2 font-medium text-sm ${
                  activeTab === 'upload'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Upload Evidence
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'manage' && (
              <div>
                {loading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : evidence.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No evidence uploaded yet.</p>
                    <button
                      onClick={() => setActiveTab('upload')}
                      className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                    >
                      Upload First Evidence
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {evidence.map((item) => (
                      <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-3">
                            <span className="text-2xl">{getTypeIcon(item.type)}</span>
                            <div className="flex-1">
                              <h3 className="text-lg font-medium text-gray-900">{item.title}</h3>
                              <p className="text-gray-600 text-sm mt-1">{item.description}</p>
                              <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                                <span>Type: {item.type}</span>
                                <span>Size: {formatFileSize(item.fileSize)}</span>
                                <span>Uploaded: {new Date(item.uploadedAt).toLocaleDateString()}</span>
                                <span>By: {item.uploadedBy}</span>
                              </div>
                              {item.category && (
                                <span className="inline-block mt-2 px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                                  {item.category}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(item.status)}`}>
                              {item.status}
                            </span>
                            <button className="text-blue-600 hover:text-blue-800 text-sm">
                              Download
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'upload' && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-6">Upload New Evidence</h3>
                
                <form onSubmit={handleFileUpload} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Evidence Title *
                      </label>
                      <input
                        type="text"
                        value={uploadForm.title}
                        onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter a descriptive title"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Evidence Type *
                      </label>
                      <select
                        value={uploadForm.type}
                        onChange={(e) => setUploadForm({ ...uploadForm, type: e.target.value as Evidence['type'] })}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      >
                        <option value="document">Document</option>
                        <option value="photo">Photo</option>
                        <option value="video">Video</option>
                        <option value="audio">Audio</option>
                        <option value="statement">Statement</option>
                        <option value="expert">Expert Opinion</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category
                    </label>
                    <input
                      type="text"
                      value={uploadForm.category}
                      onChange={(e) => setUploadForm({ ...uploadForm, category: e.target.value })}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., Contracts, Correspondence, Technical Evidence"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      value={uploadForm.description}
                      onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
                      rows={3}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Describe the evidence and its relevance to the case"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Upload File *
                    </label>
                    <input
                      type="file"
                      onChange={(e) => setUploadForm({ ...uploadForm, file: e.target.files?.[0] || null })}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.mp4,.mp3,.wav"
                      required
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Supported formats: PDF, DOC, DOCX, JPG, PNG, MP4, MP3, WAV (Max 50MB)
                    </p>
                  </div>

                  <div className="flex justify-end space-x-4">
                    <button
                      type="button"
                      onClick={() => setActiveTab('manage')}
                      className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={uploading}
                      className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                    >
                      {uploading ? 'Uploading...' : 'Upload Evidence'}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </ProtectedRoute>
  )
} 