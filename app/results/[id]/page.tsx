"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { CheckCircle, XCircle, Clock, Award, AlertCircle } from "lucide-react";
import { BackButton } from "@/components/back-button";
import { HomeButton } from "@/components/home-button";
import { Footer } from "@/components/footer";

type Attempt = {
  id: number;
  isEvaluated: boolean;
  percentage: unknown;
  correctAnswers: number;
  incorrectAnswers: number;
  unanswered: number;
  totalQuestions: number;
  timeTakenSeconds: number | null;
  overtimeSeconds: number | null;
  preset: {
    name: string;
    startingQuestion: number;
    presetAnswerKey: { correctAnswers: unknown } | null;
  };
  answers: Array<{
    id: number;
    questionNumber: number;
    selectedAnswer: string | null;
    isCorrect: boolean | null;
  }>;
};

export default function ResultsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params?.id;

  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const fetchAttempt = async () => {
      if (!id) return;
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/attempts/${id}`);
        if (res.status === 404) {
          throw new Error("Attempt not found");
        }
        if (!res.ok) {
          throw new Error("Failed to load results");
        }
        const data = (await res.json()) as Attempt;
        if (cancelled) return;

        if (!data.isEvaluated) {
          router.replace(`/enter-key/${id}`);
          return;
        }

        setAttempt(data);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to load results");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchAttempt();
    return () => {
      cancelled = true;
    };
  }, [id, router]);

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${String(hrs).padStart(2, "0")}:${String(mins).padStart(
      2,
      "0"
    )}:${String(secs).padStart(2, "0")}`;
  };

  const correctAnswers = useMemo(() => {
    const raw = attempt?.preset.presetAnswerKey?.correctAnswers as
      | string[]
      | undefined;
    return raw;
  }, [attempt]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <header className="border-b border-border bg-card">
          <div className="mx-auto max-w-7xl px-3 py-3 sm:px-4 sm:py-4">
            <div className="flex items-center gap-2 mb-2 sm:mb-3">
              <BackButton />
              <HomeButton />
            </div>
            <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
              Test Results
            </h1>
          </div>
        </header>
        <main className="mx-auto max-w-7xl px-4 py-8 flex-1">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-sm text-muted-foreground">Loading...</p>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !attempt) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <header className="border-b border-border bg-card">
          <div className="mx-auto max-w-7xl px-3 py-3 sm:px-4 sm:py-4">
            <div className="flex items-center gap-2 mb-2 sm:mb-3">
              <BackButton />
              <HomeButton />
            </div>
            <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
              Test Results
            </h1>
          </div>
        </header>
        <main className="mx-auto max-w-7xl px-4 py-8 flex-1">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-sm text-destructive">
                {error || "Attempt not found"}
              </p>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-3 py-3 sm:px-4 sm:py-4">
          <div className="flex items-center gap-2 mb-2 sm:mb-3">
            <BackButton />
            <HomeButton />
          </div>
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
            Test Results
          </h1>
          <p className="mt-0.5 text-xs text-muted-foreground sm:mt-1 sm:text-sm">
            {attempt.preset.name}
          </p>
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
