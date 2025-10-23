import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    // In a real app, you'd invalidate the session/token
    // For now, we just return success since the client will clear sessionStorage
    return NextResponse.json({ message: "Logged out successfully" });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: "Failed to logout" }, { status: 500 });
  }
}