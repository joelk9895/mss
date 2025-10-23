import { NextResponse } from "next/server";
import { prisma } from "@/lib/models";

// GET /api/cases
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get("clientId");

    const where = clientId ? { clientId } : {};

    const cases = await prisma.case.findMany({
      where,
      include: {
        client: true,
        appointments: {
          where: {
            datetime: {
              gte: new Date()
            }
          },
          orderBy: {
            datetime: 'asc'
          },
          take: 1
        }
      },
    });
    return NextResponse.json(cases);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch cases" }, { status: 500 });
  }
}

// POST /api/cases
export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body?.clientId || !body?.title) {
      return NextResponse.json(
        { error: "clientId and title are required" },
        { status: 400 }
      );
    }
    const caseEntity = await prisma.case.create({
      data: {
        clientId: body.clientId,
        title: body.title,
        description: body.description || null,
        status: body.status || "pending",
      },
    });
    return NextResponse.json(caseEntity, { status: 201 });
  } catch (error: any) {
    console.error(error);
    if (error.code === 'P2003') {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }
    return NextResponse.json({ error: "Failed to create case" }, { status: 500 });
  }
}