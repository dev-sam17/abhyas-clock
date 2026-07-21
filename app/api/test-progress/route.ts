import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redis } from "@/lib/redis";
import { prisma } from "@/lib/prisma";

// Key helpers
const activeTestsKey = (userId: string) => `active-tests:${userId}`;
const testProgressKey = (userId: string, presetId: number) =>
  `test-progress:${userId}:${presetId}`;

const TTL_24H = 60 * 60 * 24;

/**
 * GET /api/test-progress
 * Returns all active in-progress tests for the current user.
 * Uses a Redis SET to track active test IDs, then batch-fetches metadata.
 */
export async function GET() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const setKey = activeTestsKey(userId);

    // Get all active preset IDs from the set
    const presetIds = await redis.smembers(setKey);

    if (!presetIds || presetIds.length === 0) {
      return NextResponse.json([]);
    }

    // Batch-fetch metadata for all active tests using pipeline
    const pipeline = redis.pipeline();
    for (const pid of presetIds) {
      pipeline.get(testProgressKey(userId, Number(pid)));
    }
    const results = await pipeline.exec();

    // Fetch DB presets to guarantee we have collection and chapter names (especially for legacy tests)
    const presets = await prisma.testPreset.findMany({
      where: { id: { in: presetIds.map(Number) } },
      include: { chapter: { include: { collection: true } } },
    });
    const presetMap = new Map(presets.map((p) => [p.id, p]));

    const activeTests: {
      presetId: number;
      presetName: string;
      collectionName?: string;
      chapterName?: string;
      answeredCount: number;
      totalQuestions: number;
      seconds: number;
      updatedAt: string;
    }[] = [];

    // Clean up stale entries (key expired but still in set)
    const staleIds: string[] = [];

    for (let i = 0; i < presetIds.length; i++) {
      const data = results[i] as Record<string, unknown> | null;
      if (!data) {
        staleIds.push(String(presetIds[i]));
        continue;
      }

      const answers = (data.answers as { selectedAnswer: string | null }[]) || [];
      const answeredCount = answers.filter(
        (a) => a.selectedAnswer !== null
      ).length;

      // Reconstruct elapsed seconds from startedAt + elapsedAtSync
      const elapsedAtSync = (data.elapsedAtSync as number) || 0;
      
      const pidNum = Number(presetIds[i]);
      const presetDb = presetMap.get(pidNum);

      activeTests.push({
        presetId: pidNum,
        presetName: presetDb?.name || (data.presetName as string) || `Test #${presetIds[i]}`,
        collectionName: presetDb?.chapter?.collection.name || data.collectionName as string | undefined,
        chapterName: presetDb?.chapter?.name || data.chapterName as string | undefined,
        answeredCount,
        totalQuestions: presetDb?.totalQuestions || (data.totalQuestions as number) || 0,
        seconds: elapsedAtSync,
        updatedAt: (data.updatedAt as string) || "",
      });
    }

    // Remove stale IDs from the set (expired test-progress keys)
    if (staleIds.length > 0) {
      await redis.srem(setKey, ...staleIds);
    }

    return NextResponse.json(activeTests);
  } catch (error) {
    console.error("[test-progress] GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch active tests" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/test-progress
 * Upsert test progress state. Called with debouncing from the client.
 * Body: { presetId, state: { answers, currentQuestionIndex, ... } }
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await request.json();
    const { presetId, state } = body;

    if (!presetId || !state) {
      return NextResponse.json(
        { error: "Missing presetId or state" },
        { status: 400 }
      );
    }

    const progressKey = testProgressKey(userId, presetId);
    const setKey = activeTestsKey(userId);

    // Add timestamp
    state.updatedAt = new Date().toISOString();

    // Pipeline: SET the state + SADD to active set + refresh TTLs (3 Redis ops in 1 round-trip)
    const pipeline = redis.pipeline();
    pipeline.set(progressKey, state, { ex: TTL_24H });
    pipeline.sadd(setKey, String(presetId));
    pipeline.expire(setKey, TTL_24H);
    await pipeline.exec();

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[test-progress] PUT error:", error);
    return NextResponse.json(
      { error: "Failed to save test progress" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/test-progress
 * Remove a test from active progress (on submit or discard).
 * Body: { presetId }
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const { presetId } = await request.json();

    if (!presetId) {
      return NextResponse.json(
        { error: "Missing presetId" },
        { status: 400 }
      );
    }

    const progressKey = testProgressKey(userId, presetId);
    const setKey = activeTestsKey(userId);

    // Pipeline: DEL the state + SREM from active set (2 Redis ops in 1 round-trip)
    const pipeline = redis.pipeline();
    pipeline.del(progressKey);
    pipeline.srem(setKey, String(presetId));
    await pipeline.exec();

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[test-progress] DELETE error:", error);
    return NextResponse.json(
      { error: "Failed to delete test progress" },
      { status: 500 }
    );
  }
}
