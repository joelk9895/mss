import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { prisma } from "@/lib/models";

// GET /api/clients
export async function GET() {
  try {
    const clients = await prisma.client.findMany({
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        notes: true,
        createdAt: true,
        // Exclude password from response
      },
    });
    return NextResponse.json(clients);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch clients" }, { status: 500 });
  }
}

// POST /api/clients
export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body?.firstName || !body?.lastName || !body?.email) {
      return NextResponse.json(
        { error: "firstName, lastName and email are required" },
        { status: 400 }
      );
    }

    // Check if client already exists
    const existingClient = await prisma.client.findUnique({
      where: { email: body.email },
    });

    if (existingClient) {
      return NextResponse.json(
        { error: "Client with this email already exists" },
        { status: 409 }
      );
    }

    // Hash password if provided
    let hashedPassword = null;
    if (body.password) {
      hashedPassword = await bcrypt.hash(body.password, 10);
    }

    const client = await prisma.client.create({
      data: {
        firstName: body.firstName,
        lastName: body.lastName,
        email: body.email,
        password: hashedPassword,
        phone: body.phone || null,
        notes: body.notes || null,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        notes: true,
        createdAt: true,
      },
    });
    return NextResponse.json(client, { status: 201 });
  } catch (error: any) {
    console.error(error);
    if (error.code === 'P2002') {
      return NextResponse.json({ error: "Email already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: "Failed to create client" }, { status: 500 });
  }
}