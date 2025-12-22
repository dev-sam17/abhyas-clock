import { notFound, redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { AnswerKeyForm } from "@/components/answer-key-form"

export default async function EnterAnswerKeyPage({ params }: { params: { id: string } }) {
  const attemptId = Number.parseInt((await params).id)

  if (isNaN(attemptId)) {
    notFound()
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
      answerKey: true,
    },
  })

  if (!attempt) {
    notFound()
  }

  if (attempt.preset.presetAnswerKey && !attempt.isEvaluated) {
    const correctAnswers = attempt.preset.presetAnswerKey.correctAnswers as string[]

    // Calculate results
    let correct = 0
    let incorrect = 0
    let unanswered = 0

    const answerUpdates = attempt.answers.map((answer) => {
      const correctAnswer = correctAnswers[answer.questionNumber - attempt.preset.startingQuestion]
      const isCorrect = answer.selectedAnswer === correctAnswer

      if (answer.selectedAnswer === null) {
        unanswered++
        return { id: answer.id, isCorrect: false }
      } else if (isCorrect) {
        correct++
        return { id: answer.id, isCorrect: true }
      } else {
        incorrect++
        return { id: answer.id, isCorrect: false }
      }
    })

    const percentage = attempt.totalQuestions > 0 ? (correct / attempt.totalQuestions) * 100 : 0

    // Auto-evaluate using stored answer key
    await prisma.$transaction([
      // Create answer key for this attempt
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
          where: { id: update.id },
          data: { isCorrect: update.isCorrect },
        }),
      ),
    ])

    // Redirect to results page after auto-evaluation
    redirect(`/results/${attemptId}`)
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 py-6">
          <h1 className="text-3xl font-bold text-foreground">Enter Answer Key</h1>
          <p className="mt-1 text-sm text-muted-foreground">Enter the correct answers to evaluate your performance</p>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8">
        <AnswerKeyForm attempt={attempt} />
      </main>
    </div>
  )
}
