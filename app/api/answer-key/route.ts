import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { attemptId, correctAnswers } = body

    // Validation
    if (!attemptId || !correctAnswers || !Array.isArray(correctAnswers)) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Get the attempt with answers
    const attempt = await prisma.testAttempt.findUnique({
      where: { id: attemptId },
      include: {
        answers: true,
        preset: true,
      },
    })

    if (!attempt) {
      return NextResponse.json({ error: "Attempt not found" }, { status: 404 })
    }

    if (attempt.isEvaluated) {
      return NextResponse.json({ error: "This attempt has already been evaluated" }, { status: 400 })
    }

    // Calculate results
    let correct = 0
    let incorrect = 0
    let unanswered = 0

    const answerUpdates = attempt.answers.map((answer) => {
      const correctAnswer = correctAnswers[answer.questionNumber - attempt.preset.startingQuestion]
      const isCorrect = answer.selectedAnswer === correctAnswer

      if (answer.selectedAnswer === null) {
        unanswered++
        return {
          where: { id: answer.id },
          data: { isCorrect: false },
        }
      } else if (isCorrect) {
        correct++
        return {
          where: { id: answer.id },
          data: { isCorrect: true },
        }
      } else {
        incorrect++
        return {
          where: { id: answer.id },
          data: { isCorrect: false },
        }
      }
    })

    const percentage = attempt.totalQuestions > 0 ? (correct / attempt.totalQuestions) * 100 : 0

    await prisma.$transaction([
      // Create/update preset-level answer key for future attempts
      prisma.presetAnswerKey.upsert({
        where: { presetId: attempt.presetId },
        create: {
          presetId: attempt.presetId,
          correctAnswers,
        },
        update: {
          correctAnswers,
          updatedAt: new Date(),
        },
      }),
      // Create answer key for this attempt (legacy support)
      prisma.answerKey.create({
        data: {
          attemptId,
          correctAnswers,
        },
      }),
      // Update attempt with results
      prisma.testAttempt.update({
        where: { id: attemptId },
        data: {
          isEvaluated: true,
          correctAnswers: correct,
          incorrectAnswers: incorrect,
          unanswered,
          percentage,
        },
      }),
      // Update all answers with isCorrect status
      ...answerUpdates.map((update) =>
        prisma.answer.update({
          where: update.where,
          data: update.data,
        }),
      ),
    ])

    return NextResponse.json({
      success: true,
      results: {
        correct,
        incorrect,
        unanswered,
        percentage: percentage.toFixed(2),
      },
    })
  } catch (error) {
    console.error("[v0] Error submitting answer key:", error)
    return NextResponse.json({ error: "Failed to submit answer key" }, { status: 500 })
  }
}
