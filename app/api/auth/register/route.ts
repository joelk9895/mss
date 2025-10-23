import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { prisma } from "@/lib/models";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body?.email || !body?.password || !body?.firstName || !body?.lastName) {
      return NextResponse.json(
        { error: "email, password, firstName and lastName are required" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: body.email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(body.password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: body.email,
        password: hashedPassword,
        firstName: body.firstName,
        lastName: body.lastName,
        role: body.role || "lawyer",
        phone: body.phone || null,
      },
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

    return NextResponse.json(user, { status: 201 });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: "Failed to register user" }, { status: 500 });
  }
}