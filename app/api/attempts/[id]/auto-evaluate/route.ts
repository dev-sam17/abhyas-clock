import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { cachePrefixes, invalidateByPrefix } from "@/lib/redis";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const attemptId = Number.parseInt(id);

    if (Number.isNaN(attemptId)) {
      return NextResponse.json(
        { error: "Invalid attempt id" },
        { status: 400 }
      );
    }

    const attempt = await prisma.testAttempt.findUnique({
      where: { id: attemptId },
      include: {
        preset: {
          include: {
            presetAnswerKey: true,
          },
        },
        answers: {
          orderBy: { questionNumber: "asc" },
        },
      },
    });

    if (!attempt) {
      return NextResponse.json({ error: "Attempt not found" }, { status: 404 });
    }

    if (attempt.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (attempt.isEvaluated) {
      return NextResponse.json({ success: true, attemptId: attempt.id });
    }

    if (!attempt.preset.presetAnswerKey) {
      return NextResponse.json(
        { error: "No preset answer key found" },
        { status: 400 }
      );
    }

    const correctAnswers = attempt.preset.presetAnswerKey
      .correctAnswers as string[];

    let correct = 0;
    let incorrect = 0;
    let unanswered = 0;

    const answerUpdates = attempt.answers.map((answer) => {
      const correctAnswer =
        correctAnswers[answer.questionNumber - attempt.preset.startingQuestion];
      const isCorrect = answer.selectedAnswer === correctAnswer;

      if (answer.selectedAnswer === null) {
        unanswered++;
        return { id: answer.id, isCorrect: false };
      }

      if (isCorrect) {
        correct++;
        return { id: answer.id, isCorrect: true };
      }

      incorrect++;
      return { id: answer.id, isCorrect: false };
    });

    const percentage =
      attempt.totalQuestions > 0 ? (correct / attempt.totalQuestions) * 100 : 0;

    await prisma.$transaction(
      async (tx) => {
        await tx.testAttempt.update({
          where: { id: attemptId },
          data: {
            isEvaluated: true,
            correctAnswers: correct,
            incorrectAnswers: incorrect,
            unanswered,
            percentage,
          },
        });

        for (const update of answerUpdates) {
          await tx.answer.update({
            where: { id: update.id },
            data: { isCorrect: update.isCorrect },
          });
        }
      },
      {
        maxWait: 5000,
        timeout: 30000,
      }
    );

    // Evaluation changes the attempt, history and analytics payloads.
    await invalidateByPrefix(
      cachePrefixes.attempt,
      cachePrefixes.history,
      cachePrefixes.analytics
    );

    return NextResponse.json({ success: true, attemptId });
  } catch (error) {
    console.error("[v0] Error auto-evaluating attempt:", error);
    return NextResponse.json(
      { error: "Failed to auto-evaluate attempt" },
      { status: 500 }
    );
  }
}
