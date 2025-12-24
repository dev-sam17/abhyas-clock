import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { CheckCircle, XCircle, Clock, Award, AlertCircle } from "lucide-react";
import { BackButton } from "@/components/back-button";
import { HomeButton } from "@/components/home-button";
import { Footer } from "@/components/footer";

async function getAttempt(id: string) {
  const attempt = await prisma.testAttempt.findUnique({
    where: { id: Number.parseInt(id) },
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

  return attempt;
}

export default async function ResultsPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = await params;
  const attempt = await getAttempt(id);

  if (!attempt) {
    notFound();
  }

  // Redirect to answer key entry if not yet evaluated
  if (!attempt.isEvaluated) {
    redirect(`/enter-key/${id}`);
  }

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${String(hrs).padStart(2, "0")}:${String(mins).padStart(
      2,
      "0"
    )}:${String(secs).padStart(2, "0")}`;
  };

  const correctAnswers = attempt.preset.presetAnswerKey?.correctAnswers as
    | string[]
    | undefined;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 py-6">
          <div className="flex items-center gap-2">
            <BackButton />
            <HomeButton />
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Test Results
              </h1>
              <p className="text-sm text-muted-foreground">
                {attempt.preset.name}
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 flex-1">
        {/* Stats Cards */}
        <div className="mb-8 grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Score</CardTitle>
              <Award className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Number(attempt.percentage).toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground">
                {attempt.correctAnswers}/{attempt.totalQuestions} correct
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Correct</CardTitle>
              <CheckCircle className="size-4 shrink-0 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {attempt.correctAnswers}
              </div>
              <p className="text-xs text-muted-foreground">Answers</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Incorrect</CardTitle>
              <XCircle className="size-4 shrink-0 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {attempt.incorrectAnswers}
              </div>
              <p className="text-xs text-muted-foreground">Answers</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Time Taken</CardTitle>
              <Clock className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatTime(attempt.timeTakenSeconds || 0)}
              </div>
              {attempt.overtimeSeconds && attempt.overtimeSeconds > 0 && (
                <p className="text-xs text-destructive">
                  +{formatTime(attempt.overtimeSeconds)} overtime
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Answer Review */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Answer Review</CardTitle>
            <p className="text-sm text-muted-foreground">
              Compare your answers with the correct ones
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {attempt.answers.map((answer) => {
                const isCorrect = answer.isCorrect;
                const correctAnswer =
                  correctAnswers?.[
                    answer.questionNumber - attempt.preset.startingQuestion
                  ];

                return (
                  <div
                    key={answer.id}
                    className={`flex items-center gap-4 rounded-lg border p-4 ${
                      isCorrect
                        ? "border-green-600/50 bg-green-50 dark:bg-green-950/20"
                        : answer.selectedAnswer === null
                          ? "border-border bg-muted/30"
                          : "border-red-600/50 bg-red-50 dark:bg-red-950/20"
                    }`}
                  >
                    {/* Question Number */}
                    <div className="flex size-12 items-center justify-center rounded-lg bg-background font-bold shrink-0">
                      {answer.questionNumber}
                    </div>

                    {/* Your Answer */}
                    <div className="flex-1">
                      <div className="text-xs text-muted-foreground mb-1">
                        Your answer:
                      </div>
                      {answer.selectedAnswer ? (
                        <Badge
                          variant={isCorrect ? "default" : "destructive"}
                          className="text-base px-3 py-1"
                        >
                          {answer.selectedAnswer}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="gap-1">
                          <AlertCircle className="size-3" />
                          Unanswered
                        </Badge>
                      )}
                    </div>

                    {/* Correct Answer */}
                    {correctAnswer && (
                      <div className="flex-1">
                        <div className="text-xs text-muted-foreground mb-1">
                          Correct answer:
                        </div>
                        <Badge
                          variant="default"
                          className="bg-green-600 text-base px-3 py-1"
                        >
                          {correctAnswer}
                        </Badge>
                      </div>
                    )}

                    {/* Status Icon */}
                    <div className="shrink-0">
                      {isCorrect ? (
                        <CheckCircle className="size-6 text-green-600" />
                      ) : (
                        <XCircle className="size-6 text-red-600" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <Link href="/presets" className="flex-1">
            <Button variant="outline" className="w-full bg-transparent">
              Take Another Test
            </Button>
          </Link>
          <Link href="/analytics" className="flex-1">
            <Button className="w-full">View Analytics</Button>
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
