import { NextResponse } from "next/server";
import { prisma } from "@/lib/models";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = (await params);
    
    if (!id || typeof id !== 'string') {
      console.error('Invalid or missing case ID:', id);
      return NextResponse.json(
        { error: "Case ID is required" },
        { status: 400 }
      );
    }

    let body;
    try {
      body = await request.json();
    } catch (e) {
      console.error('Failed to parse request body:', e);
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    const { status } = body;

    if (!["active", "pending", "closed"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid status value" },
        { status: 400 }
      );
    }

    // First verify the case exists
    const existingCase = await prisma.case.findUnique({
      where: { id }
    });

    if (!existingCase) {
      return NextResponse.json(
        { error: "Case not found" },
        { status: 404 }
      );
    }

    try {
      const updatedCase = await prisma.case.update({
        where: { id },
        data: { status },
        select: {
          id: true,
          status: true,
          title: true,
          client: {
            select: {
              id: true,
              firstName: true,
              lastName: true
            }
          }
        }
      });

      return NextResponse.json(updatedCase);
    } catch (error: any) {
      console.error("Failed to update case in database:", error);
      if (error?.code === 'P2025' || (error?.message && error.message.includes('Record not found'))) {
        return NextResponse.json(
          { error: "Case not found" },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { error: "Failed to update case status" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Failed to process request:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}