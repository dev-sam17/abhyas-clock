import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import {
  cacheKeys,
  cachePrefixes,
  getCache,
  invalidateByPrefix,
  setCache,
} from "@/lib/redis";

// Collections are nested inside collection detail / chapter / preset payloads,
// so any collection mutation invalidates those related caches too.
async function invalidateCollectionCaches() {
  await invalidateByPrefix(
    cachePrefixes.collections,
    cachePrefixes.collection,
    cachePrefixes.chapters,
    cachePrefixes.presets
  );
}

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, isPublic, chapters } = body;

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const newCollection = await prisma.collection.create({
      data: {
        name,
        description: description || null,
        isPublic: isPublic || false,
        userId: session.user.id,
        ...(chapters && chapters.length > 0 && {
          chapters: {
            create: chapters.map((ch: { name: string; chapterNumber: string }) => ({
              name: ch.name,
              chapterNumber: ch.chapterNumber,
            })),
          },
        }),
      },
      include: {
        chapters: {
          orderBy: { chapterNumber: "asc" },
        },
      },
    });

    await invalidateCollectionCaches();

    return NextResponse.json(newCollection, { status: 201 });
  } catch (error) {
    console.error("Error creating collection:", error);
    return NextResponse.json(
      { error: "Failed to create collection" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const cacheKey = cacheKeys.collections(session.user.id);
    const cached = await getCache(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    const collections = await prisma.collection.findMany({
      where: {
        OR: [{ userId: session.user.id }, { isPublic: true }],
      },
      orderBy: { createdAt: "desc" },
      include: {
        chapters: {
          orderBy: { chapterNumber: "asc" },
          include: {
            _count: {
              select: { presets: true },
            },
          },
        },
        _count: {
          select: { chapters: true },
        },
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    await setCache(cacheKey, collections);

    return NextResponse.json(collections);
  } catch (error) {
    console.error("Error fetching collections:", error);
    return NextResponse.json(
      { error: "Failed to fetch collections" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Collection ID required" },
        { status: 400 }
      );
    }

    const collection = await prisma.collection.findUnique({
      where: { id: parseInt(id) },
    });

    if (!collection) {
      return NextResponse.json(
        { error: "Collection not found" },
        { status: 404 }
      );
    }

    if (collection.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.collection.delete({
      where: { id: parseInt(id) },
    });

    await invalidateCollectionCaches();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting collection:", error);
    return NextResponse.json(
      { error: "Failed to delete collection" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, name, description, isPublic } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Collection ID required" },
        { status: 400 }
      );
    }

    const collection = await prisma.collection.findUnique({
      where: { id },
    });

    if (!collection) {
      return NextResponse.json(
        { error: "Collection not found" },
        { status: 404 }
      );
    }

    if (collection.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updatedCollection = await prisma.collection.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(isPublic !== undefined && { isPublic }),
      },
    });

    await invalidateCollectionCaches();

    return NextResponse.json(updatedCollection);
  } catch (error) {
    console.error("Error updating collection:", error);
    return NextResponse.json(
      { error: "Failed to update collection" },
      { status: 500 }
    );
  }
}
