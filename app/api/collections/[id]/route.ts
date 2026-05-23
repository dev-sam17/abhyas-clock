import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const collectionId = Number.parseInt(id);

    if (Number.isNaN(collectionId)) {
      return NextResponse.json(
        { error: "Invalid collection id" },
        { status: 400 }
      );
    }

    const collection = await prisma.collection.findUnique({
      where: { id: collectionId },
      include: {
        chapters: {
          orderBy: { chapterNumber: "asc" },
          include: {
            presets: {
              orderBy: { createdAt: "desc" },
              include: {
                _count: {
                  select: { attempts: true },
                },
                user: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!collection) {
      return NextResponse.json(
        { error: "Collection not found" },
        { status: 404 }
      );
    }

    const canAccess =
      collection.isPublic || collection.userId === session.user.id;
    if (!canAccess) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json(collection);
  } catch (error) {
    console.error("[v0] Error fetching collection:", error);
    return NextResponse.json(
      { error: "Failed to fetch collection" },
      { status: 500 }
    );
  }
}
