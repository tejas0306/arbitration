"use client"

import { useState, useEffect } from 'react';
import Header from '@/components/header';
import Footer from '@/components/footer';
import ProtectedRoute from '@/components/protected-route';
import Link from 'next/link';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import DashboardWorklist from '@/components/dashboard-worklist';
import { User, Settings, FileText, PlusCircle, HelpCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function DashboardPage() {
  const [userData, setUserData] = useState(null);
  const [drafts, setDrafts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('cases');

  // Define fetchData at the component level so it can be used by multiple functions
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null); // Clear any previous errors
      
      console.log('Fetching dashboard data...');
      
      // Fetch user data
      try {
        const user = await api.auth.getCurrentUser();
        setUserData(user);
        console.log('User data fetched successfully');
      } catch (userErr) {
        console.error('Error fetching user data:', userErr);
        toast.error('Unable to load your profile information');
        // Continue execution to try loading other data
      }

      // Fetch drafts
      try {
        console.log('Fetching draft submissions...');
        const draftsData = await api.arbitration.getDrafts();
        setDrafts(draftsData || []);
        console.log(`Fetched ${draftsData?.length || 0} drafts`);
      } catch (draftErr) {
        console.error('Error fetching drafts:', draftErr);
        console.error('Drafts error details:', {
          message: draftErr.message,
          response: draftErr.response?.data,
          status: draftErr.response?.status,
          url: draftErr.config?.url,
          baseURL: draftErr.config?.baseURL
        });
        
        toast.error('Unable to load your saved drafts');
        setDrafts([]);
      }

    } catch (error) {
      console.error('Dashboard error:', error);
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
      <Header />
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
      <Footer />
    </ProtectedRoute>
  );
}