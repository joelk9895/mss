import { NextResponse } from "next/server";
import {prisma} from "@/lib/models";

// GET /api/appointments
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get("clientId");
    const userId = searchParams.get("userId");

    const where: any = {};

    if (clientId) {
      where.OR = where.OR || [];
      where.OR.push({
        case: {
          clientId: clientId
        }
      });
      where.OR.push({
        clientId: clientId
      });
    }

    if (userId) {
      where.OR = where.OR || [];
      where.OR.push({
        userId: userId
      });
    }

    const appointments = await prisma.appointment.findMany({
      where,
      include: {
        case: true,
        user: true,
        client: true
      },
    });
    return NextResponse.json(appointments);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch appointments" }, { status: 500 });
  }
}

// POST /api/appointments
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const appointment = await prisma.appointment.create({
      data: {
        datetime: new Date(body.datetime),
        location: body.location,
        notes: body.notes,
        type: body.type,
        caseId: body.caseId,
        clientId: body.clientId,
        userId: body.userId,
      },
    });
    return NextResponse.json(appointment, { status: 201 });
  } catch (error) {
    console.error("Failed to create appointment:", error);
    return NextResponse.json(
      { error: "Failed to create appointment" },
      { status: 500 }
    );
  }
}