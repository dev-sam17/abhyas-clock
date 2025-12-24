import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      presetId,
      timeTakenSeconds,
      overtimeSeconds,
      totalQuestions,
      answers,
    } = body;

    // Validation
    if (!presetId || !timeTakenSeconds || !totalQuestions || !answers) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Create test attempt with answers (no evaluation yet)
    const attempt = await prisma.testAttempt.create({
      data: {
        presetId,
        userId: session.user.id,
        timeTakenSeconds,
        overtimeSeconds: overtimeSeconds || null,
        totalQuestions,
        completedAt: new Date(),
        isEvaluated: false,
        answers: {
          create: answers.map((answer: any) => ({
            questionNumber: answer.questionNumber,
            selectedAnswer: answer.selectedAnswer,
            timeSpentSeconds: answer.timeSpentSeconds || 0,
          })),
        },
      },
    });

    return NextResponse.json({ success: true, attemptId: attempt.id });
  } catch (error) {
    console.error("[v0] Error creating attempt:", error);
    return NextResponse.json(
      { error: "Failed to submit test" },
      { status: 500 }
    );
  }
}
