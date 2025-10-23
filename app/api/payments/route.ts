import { NextResponse } from "next/server";
import { prisma } from "@/lib/models";

// GET /api/payments
export async function GET() {
  try {
    const payments = await prisma.payment.findMany({
      include: { billing: true },
    });
    return NextResponse.json(payments);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch payments" }, { status: 500 });
  }
}

// POST /api/payments
export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body?.billingId || typeof body?.amountCents !== "number" || !body?.method) {
      return NextResponse.json(
        { error: "billingId, amountCents and method are required" },
        { status: 400 }
      );
    }
    const payment = await prisma.payment.create({
      data: {
        billingId: body.billingId,
        amountCents: body.amountCents,
        method: body.method,
      },
    });
    return NextResponse.json(payment, { status: 201 });
  } catch (error: any) {
    console.error(error);
    if (error.code === 'P2003') {
      return NextResponse.json({ error: "Billing not found" }, { status: 404 });
    }
    return NextResponse.json({ error: "Failed to create payment" }, { status: 500 });
  }
}