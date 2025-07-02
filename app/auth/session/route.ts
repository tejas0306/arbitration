import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import { authOptions } from "../../api/auth/[...nextauth]/route";

// This is a direct handler for /auth/session which NextAuth client tries to access
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