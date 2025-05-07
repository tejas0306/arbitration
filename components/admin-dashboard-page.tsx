"use client"

import { useState, useEffect } from 'react';
import Header from '@/components/header';
import Footer from '@/components/footer';
import ProtectedRoute from '@/components/protected-route';
import { api } from '@/lib/api';
import Link from 'next/link';

export default function AdminDashboardPage() {
  const [users, setUsers] = useState([]);
  const [arbitrationCases, setArbitrationCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('users');

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        // Fetch users
        const usersResponse = await api.auth.getCurrentUser();
        if (usersResponse.role === 'ADMIN') {
          // Only admins can see all users
          const allUsersResponse = await fetch('/api/admin/users');
          const usersData = await allUsersResponse.json();
          setUsers(usersData);
          
          // Fetch arbitration cases
          const casesResponse = await fetch('/api/admin/cases');
          const casesData = await casesResponse.json();
          setArbitrationCases(casesData);
        } else {
          setError('Access denied. Admin privileges required.');
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Error loading data. Please try again later.');
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow container mx-auto px-4 py-8">
          <div className="flex justify-center items-center h-full">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
              <p className="mt-4 text-indigo-600">Loading...</p>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow container mx-auto px-4 py-8">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            <p>{error}</p>
            <Link href="/dashboard" className="text-indigo-600 hover:underline mt-2 inline-block">
              Return to Dashboard
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const handleQueryDB = async () => {
    try {
      // This is a direct view - you would need to implement an API endpoint for this
      // For now, we'll just log to console for demonstration
      console.log("Please implement a direct database view API endpoint");
      alert("Database query feature would go here. Currently, view the data using the tabs above.");
    } catch (err) {
      console.error('Error:', err);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-6 text-indigo-800">Admin Dashboard</h1>
          
          <div className="mb-6">
            <div className="border-b border-gray-200">
              <nav className="flex -mb-px">
                <button
                  onClick={() => setActiveTab('users')}
                  className={`py-2 px-4 border-b-2 font-medium text-sm ${
                    activeTab === 'users'
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Users
                </button>
                <button
                  onClick={() => setActiveTab('cases')}
                  className={`ml-8 py-2 px-4 border-b-2 font-medium text-sm ${
                    activeTab === 'cases'
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Arbitration Cases
                </button>
                <button
                  onClick={() => setActiveTab('query')}
                  className={`ml-8 py-2 px-4 border-b-2 font-medium text-sm ${
                    activeTab === 'query'
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Direct DB Query
                </button>
              </nav>
            </div>
          </div>

          {activeTab === 'users' && (
            <div>
              <h2 className="text-xl font-semibold mb-4 text-indigo-700">Registered Users</h2>
              <div className="bg-white shadow overflow-hidden rounded-md">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Organization
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created At
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users.length > 0 ? (
                      users.map((user) => (
                        <tr key={user.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {user.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {user.email}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {user.role}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {user.organization || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(user.createdAt).toLocaleString()}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                          No users found or you don't have permission to view them.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'cases' && (
            <div>
              <h2 className="text-xl font-semibold mb-4 text-indigo-700">Arbitration Cases</h2>
              <div className="bg-white shadow overflow-hidden rounded-md">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Case Number
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Claimant Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Draft?
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created At
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {arbitrationCases.length > 0 ? (
                      arbitrationCases.map((case_) => (
                        <tr key={case_.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {case_.caseNumber}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {case_.type}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {case_.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <span
                              className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                case_.status === 'pending'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : case_.status === 'approved'
                                  ? 'bg-green-100 text-green-800'
                                  : case_.status === 'rejected'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}
                            >
                              {case_.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {case_.isDraft ? 'Yes' : 'No'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(case_.createdAt).toLocaleString()}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                          No arbitration cases found. Please submit a case using the form.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'query' && (
            <div>
              <h2 className="text-xl font-semibold mb-4 text-indigo-700">Direct Database Query</h2>
              <div className="bg-white shadow overflow-hidden rounded-md p-6">
                <p className="mb-4 text-gray-600">
                  This feature allows administrators to run direct database queries to view data. 
                  For security reasons, only SELECT queries are allowed.
                </p>
                <div className="flex flex-col space-y-4">
                  <div className="flex flex-col">
                    <label className="mb-2 text-sm font-medium text-gray-700">Query Type</label>
                    <select 
                      className="border border-gray-300 rounded-md px-3 py-2"
                      defaultValue="users"
                    >
                      <option value="users">Users</option>
                      <option value="arbitrations">Arbitrations</option>
                      <option value="custom">Custom SQL (SELECT only)</option>
                    </select>
                  </div>
                  <button
                    onClick={handleQueryDB}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 w-full sm:w-auto"
                  >
                    Run Query
                  </button>
                </div>
                <div className="mt-6 border-t border-gray-200 pt-4">
                  <p className="text-sm text-gray-500">
                    Alternatively, you can connect directly to the database using the connection string in the .env file with tools like pgAdmin, DBeaver, or TablePlus.
                  </p>
                </div>
              </div>
            </div>
          )}
        </main>
        <Footer />
      </div>
    </ProtectedRoute>
  );
} 