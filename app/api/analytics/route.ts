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

    const cacheKey = cacheKeys.analytics(session.user.id);
    const cached = await getCache(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    const attempts = await prisma.testAttempt.findMany({
      where: {
        isEvaluated: true,
        userId: session.user.id,
      },
      include: {
        preset: {
          select: {
            name: true,
            startingQuestion: true,
          },
        },
        answers: {
          orderBy: { questionNumber: "asc" },
        },
      },
      orderBy: {
        completedAt: "desc",
      },
    });

    if (attempts.length === 0) {
      const emptyPayload = {
        totalAttempts: 0,
        averageScore: 0,
        totalTime: 0,
        bestScore: 0,
        averageTimePerQuestion: 0,
        attempts: [],
        questionStats: [],
        attemptsWithTimes: [],
      };
      await setCache(cacheKey, emptyPayload);
      return NextResponse.json(emptyPayload);
    }

    const totalAttempts = attempts.length;
    const averageScore =
      attempts.reduce((sum, a) => sum + Number(a.percentage || 0), 0) /
      totalAttempts;
    const totalTime = attempts.reduce(
      (sum, a) => sum + (a.timeTakenSeconds || 0),
      0
    );
    const bestScore = Math.max(
      ...attempts.map((a) => Number(a.percentage || 0))
    );

    const totalQuestions = attempts.reduce(
      (sum, a) => sum + a.totalQuestions,
      0
    );
    const averageTimePerQuestion =
      totalQuestions > 0 ? Math.round(totalTime / totalQuestions) : 0;

    const formattedAttempts = attempts.map((attempt) => ({
      id: attempt.id,
      preset_id: attempt.presetId,
      test_id: attempt.presetId,
      test_name: attempt.preset.name,
      percentage: String(attempt.percentage || 0),
      correct_answers: attempt.correctAnswers || 0,
      incorrect_answers: attempt.incorrectAnswers || 0,
      unanswered: attempt.unanswered || 0,
      time_taken_seconds: attempt.timeTakenSeconds || 0,
      total_questions: attempt.totalQuestions,
      completed_at: attempt.completedAt,
      preset_name: attempt.preset.name,
    }));

    const questionStatsMap = new Map<
      number,
      { correct: number; incorrect: number; unanswered: number; total: number }
    >();

    attempts.forEach((attempt) => {
      attempt.answers.forEach((answer) => {
        const qNum = answer.questionNumber;
        if (!questionStatsMap.has(qNum)) {
          questionStatsMap.set(qNum, {
            correct: 0,
            incorrect: 0,
            unanswered: 0,
            total: 0,
          });
        }
        const stats = questionStatsMap.get(qNum)!;
        stats.total++;

        if (answer.selectedAnswer === null) {
          stats.unanswered++;
        } else if (answer.isCorrect) {
          stats.correct++;
        } else {
          stats.incorrect++;
        }
      });
    });

    const questionStats = Array.from(questionStatsMap.entries())
      .map(([questionNumber, stats]) => ({
        questionNumber,
        timesAttempted: stats.total,
        timesCorrect: stats.correct,
        timesIncorrect: stats.incorrect,
        timesUnanswered: stats.unanswered,
        accuracy: stats.total > 0 ? (stats.correct / stats.total) * 100 : 0,
      }))
      .sort((a, b) => a.questionNumber - b.questionNumber);

    const attemptsWithTimes = attempts.map((attempt) => ({
      id: attempt.id,
      preset: {
        name: attempt.preset.name,
      },
      answers: attempt.answers.map((answer) => ({
        questionNumber: answer.questionNumber,
        timeSpentSeconds: answer.timeSpentSeconds || 0,
        isCorrect: answer.isCorrect,
        selectedAnswer: answer.selectedAnswer,
      })),
      timeTakenSeconds: attempt.timeTakenSeconds || 0,
    }));

    const payload = {
      totalAttempts,
      averageScore,
      totalTime,
      bestScore,
      averageTimePerQuestion,
      attempts: formattedAttempts,
      questionStats,
      attemptsWithTimes,
    };

    await setCache(cacheKey, payload);

    return NextResponse.json(payload);
  } catch (error) {
    console.error("[v0] Error fetching analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}
