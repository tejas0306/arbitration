// Mock API route to handle arbitration cases
import { NextResponse } from 'next/server';
import { mockCases } from '@/lib/mock-data';

export async function GET(req) {
  console.log('🔶 Mock API - Getting all cases');
  console.log(`🔶 Current mock cases: ${mockCases.length}`);
  
  // Return mock data
  return NextResponse.json(mockCases);
} 