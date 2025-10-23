import { NextResponse } from "next/server";
import { prisma } from "@/lib/models";

// This is a simplified version. In a real app, you'd verify JWT tokens or session cookies
export async function GET(request: Request) {
  try {
    // For now, we'll assume the client sends their email in a header or cookie
    // In a real implementation, you'd decode a JWT token from Authorization header

    // This is just a placeholder - in production you'd have proper session management
    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    // For demo purposes, we'll assume the auth header contains the user ID
    // In reality, you'd decode a JWT token here
    const userId = authHeader.replace("Bearer ", "");

    // Try to find user first
    let user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        phone: true,
        createdAt: true,
      },
    });

    if (user) {
      return NextResponse.json({
        ...user,
        userType: "user",
      });
    }

    // Try to find client
    const client = await prisma.client.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        createdAt: true,
      },
    });

    if (client) {
      return NextResponse.json({
        ...client,
        userType: "client",
      });
    }

    return NextResponse.json(
      { error: "User not found" },
      { status: 404 }
    );
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: "Failed to get user" }, { status: 500 });
  }
}