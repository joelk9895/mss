import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { prisma } from "@/lib/models";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body?.email || !body?.password) {
      return NextResponse.json(
        { error: "email and password are required" },
        { status: 400 }
      );
    }

    // First try to find user (lawyer/assistant)
    let user = await prisma.user.findUnique({
      where: { email: body.email },
    });

    let userType = "user";

    if (user) {
      // Check password for user
      const isValidPassword = await bcrypt.compare(body.password, user.password);
      if (!isValidPassword) {
        return NextResponse.json(
          { error: "Invalid credentials" },
          { status: 401 }
        );
      }
    } else {
      // Try to find client
      const client = await prisma.client.findUnique({
        where: { email: body.email },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          password: true,
          createdAt: true,
        },
      });

      if (client && client.password) {
        // Check password for client
        const isValidPassword = await bcrypt.compare(body.password, client.password);
        if (!isValidPassword) {
          return NextResponse.json(
            { error: "Invalid credentials" },
            { status: 401 }
          );
        }
        // Convert client to user-like object for consistency
        user = {
          id: client.id,
          email: client.email,
          firstName: client.firstName,
          lastName: client.lastName,
          role: "client",
          phone: client.phone,
          createdAt: client.createdAt,
          updatedAt: client.createdAt, // clients don't have updatedAt
        } as any;
        userType = "client";
      } else {
        return NextResponse.json(
          { error: "Invalid credentials" },
          { status: 401 }
        );
      }
    }

    // Return user data (in a real app, you'd return a JWT token)
    const userWithoutPassword = { ...user };
    delete (userWithoutPassword as any).password;
    return NextResponse.json({
      ...userWithoutPassword,
      userType, // Add userType to distinguish between user and client
    });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: "Failed to login" }, { status: 500 });
  }
}