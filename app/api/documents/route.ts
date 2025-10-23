import { NextResponse } from "next/server";
import { prisma } from "@/lib/models";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";

// GET /api/documents
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get("clientId");

    const where = clientId ? {
      case: {
        clientId: clientId
      }
    } : {};

    const documents = await prisma.document.findMany({
      where,
      include: { case: { include: { client: true } } },
    });
    return NextResponse.json(documents);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch documents" }, { status: 500 });
  }
}

// POST /api/documents
export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const caseId = formData.get("caseId") as string;
    const file = formData.get("file") as File;

    if (!caseId || !file) {
      return NextResponse.json(
        { error: "caseId and file are required" },
        { status: 400 }
      );
    }

    // Validate case exists
    const caseExists = await prisma.case.findUnique({
      where: { id: caseId },
    });

    if (!caseExists) {
      return NextResponse.json({ error: "Case not found" }, { status: 404 });
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), "uploads");
    try {
      await mkdir(uploadsDir, { recursive: true });
    } catch (error) {
      // Directory might already exist
    }

    // Generate unique filename
    const timestamp = Date.now();
    const originalName = file.name;
    const extension = originalName.split('.').pop();
    const filename = `${timestamp}-${originalName}`;
    const filepath = join(uploadsDir, filename);

    // Save file to disk
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filepath, buffer);

    // Save document record to database
    const document = await prisma.document.create({
      data: {
        caseId: caseId,
        filename: originalName,
        mimeType: file.type,
        url: `/uploads/${filename}`,
      },
      include: {
        case: {
          include: { client: true }
        }
      },
    });

    return NextResponse.json(document, { status: 201 });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: "Failed to upload document" }, { status: 500 });
  }
}