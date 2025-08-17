"use client"

import { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/protected-route';
import Link from 'next/link';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import DashboardWorklist from '@/components/dashboard-worklist';
import { User, Settings, FileText, PlusCircle, HelpCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Define types for our state
interface UserData {
  name?: string;
  [key: string]: any;
}

interface Draft {
  [key: string]: any;
}

export default function DashboardPage() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('cases');

  // Define fetchData at the component level so it can be used by multiple functions
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null); // Clear any previous errors
      
      
      // Fetch user data
      try {
        const user = await api.auth.getCurrentUser();
        setUserData(user);
      } catch (userErr) {
        toast.error('Unable to load your profile information');
        // Continue execution to try loading other data
      }

      // Fetch drafts
      try {
        const draftsData = await api.arbitration.getDrafts();
        setDrafts(draftsData || []);
      } catch (draftErr: unknown) {
        
        // Safely log error details
        if (draftErr && typeof draftErr === 'object') {
          const err = draftErr as any;
          console.error('Draft loading error:', {
            message: err.message,
            response: err.response?.data,
            status: err.response?.status,
            url: err.config?.url,
            baseURL: err.config?.baseURL
          });
        }
        
        toast.error('Unable to load your saved drafts');
        setDrafts([]);
      }

    } catch (err: unknown) {
      setError('Failed to load dashboard data');
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <ProtectedRoute>
      <main className="container mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {userData?.name || 'User'}!
          </h1>
          <p className="text-gray-600">
            Manage your arbitration cases and track your progress
          </p>
        </div>

        {/* Quick Actions Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {(userData?.role === 'CLAIMANT' || userData?.role === 'ADMIN') && (
            <Link href="/arbitration/new">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer border-blue-200 hover:border-blue-300">
                <CardContent className="flex items-center space-x-4 p-6">
                  <div className="bg-blue-100 p-3 rounded-full">
                    <PlusCircle className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">New Petition</h3>
                    <p className="text-sm text-gray-600">File a new case</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          )}

          <Link href="/dashboard/my-cases">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer border-green-200 hover:border-green-300">
              <CardContent className="flex items-center space-x-4 p-6">
                <div className="bg-green-100 p-3 rounded-full">
                  <FileText className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">My Cases</h3>
                  <p className="text-sm text-gray-600">View all cases</p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/profile">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer border-purple-200 hover:border-purple-300">
              <CardContent className="flex items-center space-x-4 p-6">
                <div className="bg-purple-100 p-3 rounded-full">
                  <User className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Profile</h3>
                  <p className="text-sm text-gray-600">Update your info</p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/support">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer border-orange-200 hover:border-orange-300">
              <CardContent className="flex items-center space-x-4 p-6">
                <div className="bg-orange-100 p-3 rounded-full">
                  <HelpCircle className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Support</h3>
                  <p className="text-sm text-gray-600">Get help & support</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        <DashboardWorklist 
          userData={userData} 
          drafts={drafts}
          loading={loading}
          error={error}
          onRefresh={fetchData}
        />
      </main>
    </ProtectedRoute>
  );
}