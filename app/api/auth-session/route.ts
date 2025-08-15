import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import { authOptions } from "../[...nextauth]/route";

// This is a simple proxy route that forwards requests to the NextAuth session endpoint
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    return NextResponse.json(session);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to get session" },
      { status: 500 }
    );
  }
} 