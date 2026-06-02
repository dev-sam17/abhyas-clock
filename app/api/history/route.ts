import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { cacheKeys, getCache, setCache } from "@/lib/redis";

export async function GET() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const cacheKey = cacheKeys.history(session.user.id);
    const cached = await getCache(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    const attempts = await prisma.testAttempt.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        preset: {
          select: {
            name: true,
            testMode: true,
          },
        },
      },
      orderBy: {
        completedAt: "desc",
      },
    });

    const payload = attempts.map((attempt) => ({
        id: attempt.id,
        preset_id: attempt.presetId,
        percentage: attempt.isEvaluated ? Number(attempt.percentage) : null,
        correct_answers: attempt.correctAnswers,
        incorrect_answers: attempt.incorrectAnswers,
        unanswered: attempt.unanswered,
        time_taken_seconds: attempt.timeTakenSeconds || 0,
        overtime_seconds: attempt.overtimeSeconds,
        total_questions: attempt.totalQuestions,
        completed_at: attempt.completedAt,
        is_evaluated: attempt.isEvaluated,
        preset_name: attempt.preset.name,
        test_mode: attempt.preset.testMode,
    }));

    await setCache(cacheKey, payload);

    return NextResponse.json(payload);
  } catch (error) {
    console.error("[v0] Error fetching history:", error);
    return NextResponse.json(
      { error: "Failed to fetch history" },
      { status: 500 }
    );
  }
}
