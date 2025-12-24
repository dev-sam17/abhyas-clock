"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

type Attempt = {
  id: number;
  test_id: number;
  test_name: string;
  percentage: string;
  correct_answers: number;
  incorrect_answers: number;
  unanswered: number;
  total_questions: number;
  time_taken_seconds: number;
};

export function TestBreakdown({ attempts }: { attempts: Attempt[] }) {
  // Group attempts by test
  const testStats = attempts.reduce(
    (acc, attempt) => {
      const testId = attempt.test_id;
      if (!acc[testId]) {
        acc[testId] = {
          testName: attempt.test_name,
          attempts: [],
        };
      }
      acc[testId].attempts.push(attempt);
      return acc;
    },
    {} as Record<number, { testName: string; attempts: Attempt[] }>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Test Performance Breakdown</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {Object.entries(testStats).map(([testId, stats]) => {
          const avgScore =
            stats.attempts.reduce((sum, a) => sum + Number(a.percentage), 0) /
            stats.attempts.length;
          const bestScore = Math.max(
            ...stats.attempts.map((a) => Number(a.percentage))
          );
          const totalCorrect = stats.attempts.reduce(
            (sum, a) => sum + a.correct_answers,
            0
          );
          const totalQuestions = stats.attempts.reduce(
            (sum, a) => sum + a.total_questions,
            0
          );
          const accuracyRate =
            totalQuestions > 0 ? (totalCorrect / totalQuestions) * 100 : 0;
          const avgTimePerQuestion =
            totalQuestions > 0
              ? Math.round(
                  stats.attempts.reduce(
                    (sum, a) => sum + a.time_taken_seconds,
                    0
                  ) / totalQuestions
                )
              : 0;

          return (
            <div key={testId} className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">{stats.testName}</p>
                  <p className="text-sm text-muted-foreground">
                    {stats.attempts.length} attempts
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">
                    Avg: {avgScore.toFixed(1)}%
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Best: {bestScore.toFixed(1)}%
                  </p>
                </div>
              </div>
              <Progress value={avgScore} className="h-2" />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Accuracy: {accuracyRate.toFixed(1)}%</span>
                <span>Avg: {avgTimePerQuestion}s/q</span>
                <span>
                  {totalCorrect}/{totalQuestions} correct
                </span>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
