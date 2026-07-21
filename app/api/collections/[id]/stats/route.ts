import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { cacheKeys, getCache, setCache } from "@/lib/redis";

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

    // Check cache
    const cacheKey = `collection-stats:${collectionId}:user:${session.user.id}`;
    const cached = await getCache(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    // 1. Fetch collection with chapters, presets, and all attempts for the user
    const collection = await prisma.collection.findUnique({
      where: { id: collectionId },
      include: {
        chapters: {
          orderBy: { chapterNumber: "asc" },
          include: {
            presets: {
              include: {
                attempts: {
                  where: {
                    userId: session.user.id,
                    completedAt: { not: null },
                  },
                  select: {
                    id: true,
                    completedAt: true,
                    timeTakenSeconds: true,
                    overtimeSeconds: true,
                    isEvaluated: true,
                    totalQuestions: true,
                    correctAnswers: true,
                    incorrectAnswers: true,
                    unanswered: true,
                    percentage: true,
                  },
                },
                _count: {
                  select: { attempts: true },
                },
              },
            },
          },
        },
        user: {
          select: { id: true, name: true },
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

    // 2. Aggregate stats
    const allPresets = collection.chapters.flatMap((ch) => ch.presets);
    const totalTests = allPresets.length;

    // A test is "attempted" if the user has at least one completed attempt
    const presetsWithAttempts = allPresets.filter(
      (p) => p.attempts.length > 0
    );
    const completedTests = presetsWithAttempts.length;

    // All evaluated attempts across the collection
    const allAttempts = allPresets.flatMap((p) => p.attempts);
    const evaluatedAttempts = allAttempts.filter((a) => a.isEvaluated);
    const totalAttempts = allAttempts.length;

    // Score stats (from evaluated attempts)
    const scores = evaluatedAttempts
      .map((a) => (a.percentage !== null ? Number(a.percentage) : null))
      .filter((s): s is number => s !== null);

    const avgScore =
      scores.length > 0
        ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 100) / 100
        : null;
    const highestScore = scores.length > 0 ? Math.max(...scores) : null;
    const lowestScore = scores.length > 0 ? Math.min(...scores) : null;

    // Accuracy stats
    const totalCorrect = evaluatedAttempts.reduce(
      (sum, a) => sum + (a.correctAnswers ?? 0),
      0
    );
    const totalIncorrect = evaluatedAttempts.reduce(
      (sum, a) => sum + (a.incorrectAnswers ?? 0),
      0
    );
    const totalUnanswered = evaluatedAttempts.reduce(
      (sum, a) => sum + (a.unanswered ?? 0),
      0
    );
    const totalQuestionsAnswered = totalCorrect + totalIncorrect + totalUnanswered;

    // Time stats
    const timesInSeconds = allAttempts
      .map((a) => a.timeTakenSeconds)
      .filter((t): t is number => t !== null);
    const avgTimeSeconds =
      timesInSeconds.length > 0
        ? Math.round(
            timesInSeconds.reduce((a, b) => a + b, 0) / timesInSeconds.length
          )
        : null;
    const totalTimeSeconds =
      timesInSeconds.length > 0
        ? timesInSeconds.reduce((a, b) => a + b, 0)
        : 0;

    // Score distribution buckets (0-20, 20-40, 40-60, 60-80, 80-100)
    const scoreDistribution = [
      { range: "0-20%", count: 0 },
      { range: "20-40%", count: 0 },
      { range: "40-60%", count: 0 },
      { range: "60-80%", count: 0 },
      { range: "80-100%", count: 0 },
    ];
    for (const s of scores) {
      if (s < 20) scoreDistribution[0].count++;
      else if (s < 40) scoreDistribution[1].count++;
      else if (s < 60) scoreDistribution[2].count++;
      else if (s < 80) scoreDistribution[3].count++;
      else scoreDistribution[4].count++;
    }

    // Per-chapter stats — only include attempted chapters, sorted by most recent attempt
    const chapterStats = collection.chapters.map((ch) => {
      const chPresets = ch.presets;
      const chAttempts = chPresets.flatMap((p) => p.attempts);
      const chEvaluated = chAttempts.filter((a) => a.isEvaluated);
      const chScores = chEvaluated
        .map((a) => (a.percentage !== null ? Number(a.percentage) : null))
        .filter((s): s is number => s !== null);

      const attemptDates = chAttempts
        .map((a) => a.completedAt)
        .filter((d): d is Date => d !== null)
        .map((d) => new Date(d).getTime());
      const latestAttemptAt = attemptDates.length > 0
        ? new Date(Math.max(...attemptDates)).toISOString()
        : null;

      return {
        id: ch.id,
        name: ch.name,
        chapterNumber: ch.chapterNumber,
        totalTests: chPresets.length,
        completedTests: chPresets.filter((p) => p.attempts.length > 0).length,
        totalAttempts: chAttempts.length,
        avgScore:
          chScores.length > 0
            ? Math.round(
                (chScores.reduce((a, b) => a + b, 0) / chScores.length) * 100
              ) / 100
            : null,
        highestScore: chScores.length > 0 ? Math.max(...chScores) : null,
        latestAttemptAt,
      };
    })
      .filter((ch) => ch.totalAttempts > 0)
      .sort((a, b) => {
        const aTime = a.latestAttemptAt ? new Date(a.latestAttemptAt).getTime() : 0;
        const bTime = b.latestAttemptAt ? new Date(b.latestAttemptAt).getTime() : 0;
        return bTime - aTime; // most recent first
      });

    // Recent attempts (last 10)
    const recentAttempts = allAttempts
      .filter((a) => a.completedAt !== null)
      .sort(
        (a, b) =>
          new Date(b.completedAt!).getTime() -
          new Date(a.completedAt!).getTime()
      )
      .slice(0, 10)
      .map((a) => {
        // Find which preset this attempt belongs to
        const preset = allPresets.find((p) =>
          p.attempts.some((at) => at.id === a.id)
        );
        return {
          ...a,
          percentage: a.percentage !== null ? Number(a.percentage) : null,
          presetName: preset?.name ?? "Unknown",
        };
      });

    const stats = {
      collectionName: collection.name,
      collectionDescription: collection.description,
      totalTests,
      completedTests,
      notStartedTests: totalTests - completedTests,
      totalAttempts,
      evaluatedAttempts: evaluatedAttempts.length,
      avgScore,
      highestScore,
      lowestScore,
      totalCorrect,
      totalIncorrect,
      totalUnanswered,
      totalQuestionsAnswered,
      avgTimeSeconds,
      totalTimeSeconds,
      scoreDistribution,
      chapterStats,
      recentAttempts,
    };

    await setCache(cacheKey, stats);

    return NextResponse.json(stats);
  } catch (error) {
    console.error("[stats] Error fetching collection stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch collection stats" },
      { status: 500 }
    );
  }
}
