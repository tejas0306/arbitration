"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import Footer from "@/components/footer"
import Header from "@/components/header"
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, Shield, Scale, Clock } from 'lucide-react';

export default function HomePageClient() {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()
  const [shouldRedirect, setShouldRedirect] = useState(true)

  useEffect(() => {
    // Check if this is a direct landing on the homepage
    const fromExternalNavigation = document.referrer === '' || 
      !document.referrer.includes(window.location.host)
    
    // Only redirect automatically if user is not coming from external navigation
    // and is navigating within the app (not refreshing or direct landing)
    if (!isLoading && isAuthenticated && shouldRedirect && !fromExternalNavigation) {
      // We're allowing users to stay on the homepage even when logged in,
      // but we'll update the UI to show appropriate options
      setShouldRedirect(false)
    }
  }, [isAuthenticated, isLoading, router, shouldRedirect])

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-indigo-700 to-purple-800 text-white py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold mb-6">
                Dispute Resolution Simplified
              </h1>
              <p className="text-xl mb-8">
                Our online arbitration platform provides a faster, more affordable
                alternative to traditional litigation with expert arbitrators.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                {!isAuthenticated ? (
                  <>
                    <Link href="/auth/login">
                      <Button size="lg" className="bg-white text-indigo-700 hover:bg-indigo-100">
                        Sign In
                      </Button>
                    </Link>
                    <Link href="/arbitration/new">
                      <Button size="lg" className="bg-yellow-500 text-indigo-900 hover:bg-yellow-400 font-medium shadow-md">
                        File Petition
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </>
                ) : (
                  <>
                    <Link href="/dashboard">
                      <Button size="lg" className="bg-white text-indigo-700 hover:bg-indigo-100">
                        Dashboard
                      </Button>
                    </Link>
                    <Link href="/arbitration/new">
                      <Button size="lg" className="bg-yellow-500 text-indigo-900 hover:bg-yellow-400 font-medium shadow-md">
                        File Petition
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </div>
            <div className="hidden md:block">
              <img 
                src="/arbitration-hero.svg" 
                alt="Arbitration Illustration" 
                className="w-full" 
                onError={(e) => {
                  e.currentTarget.src = 'https://placehold.co/600x400/EEE/31343C?text=Arbitration+Portal';
                }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-4 bg-white">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-3xl font-bold text-center mb-16 text-indigo-800">Why Choose Our Arbitration Services</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <div className="bg-gray-50 p-8 rounded-lg border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="bg-indigo-100 text-indigo-600 p-3 rounded-full inline-block mb-4">
                <Clock className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-indigo-800">Fast Resolution</h3>
              <p className="text-gray-600">
                Cases are typically resolved within 3-6 months, significantly faster than court litigation which can take years.
              </p>
            </div>
            
            <div className="bg-gray-50 p-8 rounded-lg border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="bg-indigo-100 text-indigo-600 p-3 rounded-full inline-block mb-4">
                <Shield className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-indigo-800">Confidential Process</h3>
              <p className="text-gray-600">
                Unlike court cases, arbitration proceedings are private, protecting your business reputation and sensitive information.
              </p>
            </div>
            
            <div className="bg-gray-50 p-8 rounded-lg border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="bg-indigo-100 text-indigo-600 p-3 rounded-full inline-block mb-4">
                <Scale className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-indigo-800">Expert Arbitrators</h3>
              <p className="text-gray-600">
                Our panel consists of industry specialists with deep domain knowledge to ensure fair and informed decisions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 px-4 bg-indigo-50">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-3xl font-bold text-center mb-16 text-indigo-800">How The Arbitration Process Works</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="bg-indigo-600 text-white rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4 text-xl font-bold">1</div>
              <h3 className="text-xl font-semibold mb-2 text-indigo-800">File Request</h3>
              <p className="text-gray-600">Submit your arbitration request with relevant details and documents</p>
            </div>
            
            <div className="text-center">
              <div className="bg-indigo-600 text-white rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4 text-xl font-bold">2</div>
              <h3 className="text-xl font-semibold mb-2 text-indigo-800">Respondent Reply</h3>
              <p className="text-gray-600">Respondent is notified and submits their response to your claims</p>
            </div>
            
            <div className="text-center">
              <div className="bg-indigo-600 text-white rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4 text-xl font-bold">3</div>
              <h3 className="text-xl font-semibold mb-2 text-indigo-800">Hearing Process</h3>
              <p className="text-gray-600">Virtual or physical hearings are conducted with all relevant parties</p>
            </div>
            
            <div className="text-center">
              <div className="bg-indigo-600 text-white rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4 text-xl font-bold">4</div>
              <h3 className="text-xl font-semibold mb-2 text-indigo-800">Final Award</h3>
              <p className="text-gray-600">Arbitrator issues a binding decision that resolves the dispute</p>
            </div>
          </div>
          
          <div className="mt-16 text-center">
            <Link href={isAuthenticated ? "/arbitration/new" : "/auth/login"}>
              <Button size="lg" className="bg-yellow-500 text-indigo-900 hover:bg-yellow-400 shadow-md font-medium">
                {isAuthenticated ? "File Your Petition" : "Sign In to Get Started"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4 bg-gradient-to-r from-indigo-700 to-purple-800 text-white">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold mb-2">90%</div>
              <p className="text-xl">Cases Resolved Faster Than Court</p>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">40%</div>
              <p className="text-xl">Average Cost Savings</p>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">95%</div>
              <p className="text-xl">Client Satisfaction Rate</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-white">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-bold mb-6 text-indigo-800">Ready to Resolve Your Dispute?</h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Join thousands of businesses and individuals who have successfully resolved their disputes through our arbitration platform.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {!isAuthenticated ? (
              <>
                <Link href="/auth/login">
                  <Button size="lg" className="bg-yellow-500 text-indigo-900 hover:bg-yellow-400 shadow-md font-medium">
                    Get Started
                  </Button>
                </Link>
                <Link href="/contact">
                  <Button size="lg" variant="outline" className="border-indigo-600 text-indigo-600 hover:bg-indigo-50">
                    Contact Us
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <Link href="/arbitration/new">
                  <Button size="lg" className="bg-yellow-500 text-indigo-900 hover:bg-yellow-400 shadow-md font-medium">
                    File New Petition
                  </Button>
                </Link>
                <Link href="/dashboard">
                  <Button size="lg" variant="outline" className="border-indigo-600 text-indigo-600 hover:bg-indigo-50">
                    View Dashboard
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
} 