import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { AnswerKeyForm } from "@/components/answer-key-form"

export default async function EnterAnswerKeyPage({ params }: { params: { id: string } }) {
  const attemptId = Number.parseInt(params.id)

  if (isNaN(attemptId)) {
    notFound()
  }

  const attempt = await prisma.testAttempt.findUnique({
    where: { id: attemptId },
    include: {
      preset: true,
      answers: {
        orderBy: { questionNumber: "asc" },
      },
      answerKey: true,
    },
  })

  if (!attempt) {
    notFound()
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
