import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AnswerKeyForm } from "@/components/answer-key-form";
import { BackButton } from "@/components/back-button";
import { HomeButton } from "@/components/home-button";
import { Footer } from "@/components/footer";

export default async function EnterAnswerKeyPage({
  params,
}: {
  params: { id: string };
}) {
  const attemptId = Number.parseInt((await params).id);

  if (isNaN(attemptId)) {
    notFound();
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
    notFound();
  }

  if (attempt.preset.presetAnswerKey && !attempt.isEvaluated) {
    const correctAnswers = attempt.preset.presetAnswerKey
      .correctAnswers as string[];

    // Calculate results
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
      } else if (isCorrect) {
        correct++;
        return { id: answer.id, isCorrect: true };
      } else {
        incorrect++;
        return { id: answer.id, isCorrect: false };
      }
    });

    const percentage =
      attempt.totalQuestions > 0 ? (correct / attempt.totalQuestions) * 100 : 0;

    // Auto-evaluate using stored answer key
    await prisma.$transaction(
      async (tx) => {
        // Update attempt with results
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

        // Update all answers with isCorrect status
        for (const update of answerUpdates) {
          await tx.answer.update({
            where: { id: update.id },
            data: { isCorrect: update.isCorrect },
          });
        }
      },
      {
        maxWait: 5000, // 5 seconds to acquire connection
        timeout: 30000, // 30 seconds to complete transaction
      }
    );

    // Redirect to results page after auto-evaluation
    redirect(`/results/${attemptId}`);
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 py-6">
          <div className="flex items-center gap-2">
            <BackButton />
            <HomeButton />
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Enter Answer Key
              </h1>
              <p className="text-sm text-muted-foreground">
                Enter the correct answers to evaluate your performance
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 flex-1">
        <AnswerKeyForm attempt={attempt} />
      </main>
      <Footer />
    </div>
  );
}
