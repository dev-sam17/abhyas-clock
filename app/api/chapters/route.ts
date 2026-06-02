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

// Chapters appear inside collection list/detail payloads, so chapter
// mutations invalidate those caches as well.
async function invalidateChapterCaches() {
  await invalidateByPrefix(
    cachePrefixes.chapters,
    cachePrefixes.collection,
    cachePrefixes.collections,
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
    const { collectionId, name, chapterNumber } = body;

    if (!collectionId || !name || chapterNumber === undefined) {
      return NextResponse.json(
        { error: "Collection ID, name, and chapter number are required" },
        { status: 400 }
      );
    }

    // Verify user owns the collection
    const collection = await prisma.collection.findUnique({
      where: { id: collectionId },
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

    const chapter = await prisma.chapter.create({
      data: {
        name,
        chapterNumber,
        collectionId,
      },
    });

    await invalidateChapterCaches();

    return NextResponse.json(chapter, { status: 201 });
  } catch (error) {
    console.error("Error creating chapter:", error);
    return NextResponse.json(
      { error: "Failed to create chapter" },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const collectionId = searchParams.get("collectionId");

    if (!collectionId) {
      return NextResponse.json(
        { error: "Collection ID required" },
        { status: 400 }
      );
    }

    const collection = await prisma.collection.findUnique({
      where: { id: parseInt(collectionId) },
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

    const cacheKey = cacheKeys.chapters(session.user.id, collectionId);
    const cached = await getCache(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    const chapters = await prisma.chapter.findMany({
      where: { collectionId: parseInt(collectionId) },
      orderBy: { chapterNumber: "asc" },
      include: {
        _count: {
          select: { presets: true },
        },
        presets: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    await setCache(cacheKey, chapters);

    return NextResponse.json(chapters);
  } catch (error) {
    console.error("Error fetching chapters:", error);
    return NextResponse.json(
      { error: "Failed to fetch chapters" },
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
    const { id, name, chapterNumber } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Chapter ID required" },
        { status: 400 }
      );
    }

    const chapter = await prisma.chapter.findUnique({
      where: { id },
      include: { collection: true },
    });

    if (!chapter) {
      return NextResponse.json(
        { error: "Chapter not found" },
        { status: 404 }
      );
    }

    if (chapter.collection.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updatedChapter = await prisma.chapter.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(chapterNumber !== undefined && { chapterNumber }),
      },
    });

    await invalidateChapterCaches();

    return NextResponse.json(updatedChapter);
  } catch (error) {
    console.error("Error updating chapter:", error);
    return NextResponse.json(
      { error: "Failed to update chapter" },
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
        { error: "Chapter ID required" },
        { status: 400 }
      );
    }

    const chapter = await prisma.chapter.findUnique({
      where: { id: parseInt(id) },
      include: { collection: true },
    });

    if (!chapter) {
      return NextResponse.json(
        { error: "Chapter not found" },
        { status: 404 }
      );
    }

    if (chapter.collection.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.chapter.delete({
      where: { id: parseInt(id) },
    });

    await invalidateChapterCaches();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting chapter:", error);
    return NextResponse.json(
      { error: "Failed to delete chapter" },
      { status: 500 }
    );
  }
}
