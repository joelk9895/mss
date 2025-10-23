import { NextResponse } from "next/server";
import { prisma } from "@/lib/models";

// GET /api/billings
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get("clientId");

    const where = clientId ? {
      case: {
        clientId: clientId
      }
    } : {};

    const billings = await prisma.billing.findMany({
      where,
      include: { case: true },
    });
    return NextResponse.json(billings);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch billings" }, { status: 500 });
  }
}

// POST /api/billings
export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body?.caseId || typeof body?.amountCents !== "number") {
      return NextResponse.json(
        { error: "caseId and amountCents are required" },
        { status: 400 }
      );
    }
    const billing = await prisma.billing.create({
      data: {
        caseId: body.caseId,
        amountCents: body.amountCents,
        description: body.description || null,
      },
    });
    return NextResponse.json(billing, { status: 201 });
  } catch (error: any) {
    console.error(error);
    if (error.code === 'P2003') {
      return NextResponse.json({ error: "Case not found" }, { status: 404 });
    }
    return NextResponse.json({ error: "Failed to create billing" }, { status: 500 });
  }
}