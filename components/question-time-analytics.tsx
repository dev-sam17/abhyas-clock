"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock } from "lucide-react";

type QuestionTimeData = {
  questionNumber: number;
  timeSpentSeconds: number;
  isCorrect: boolean | null;
  selectedAnswer: string | null;
};

type AttemptWithTimes = {
  id: number;
  preset: {
    name: string;
  };
  answers: QuestionTimeData[];
  timeTakenSeconds: number;
};

export function QuestionTimeAnalytics({
  attempts,
}: {
  attempts: AttemptWithTimes[];
}) {
  if (attempts.length === 0) {
    return null;
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Per-Question Time Analysis</CardTitle>
        <CardDescription>
          Time spent on each question in your recent attempts
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {attempts.slice(0, 5).map((attempt) => (
            <div key={attempt.id} className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold">{attempt.preset.name}</h4>
                <Badge variant="outline">
                  <Clock className="mr-1 size-3" />
                  Total: {formatTime(attempt.timeTakenSeconds)}
                </Badge>
              </div>

              <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
                {attempt.answers
                  .sort((a, b) => a.questionNumber - b.questionNumber)
                  .map((answer) => (
                    <div
                      key={answer.questionNumber}
                      className="relative group"
                      title={`Q${answer.questionNumber}: ${formatTime(answer.timeSpentSeconds || 0)} - ${
                        answer.isCorrect === null
                          ? "Not answered"
                          : answer.isCorrect
                            ? "Correct"
                            : "Incorrect"
                      }`}
                    >
                      <div
                        className={`
                          relative h-12 rounded border flex flex-col items-center justify-center text-xs font-medium
                          ${
                            answer.isCorrect === true
                              ? "bg-green-500/10 border-green-500 text-green-700 dark:text-green-400"
                              : answer.isCorrect === false
                                ? "bg-red-500/10 border-red-500 text-red-700 dark:text-red-400"
                                : "bg-muted border-muted-foreground/20"
                          }
                        `}
                      >
                        <div className="text-[10px] font-bold">
                          {answer.questionNumber}
                        </div>
                        <div className="text-[9px]">
                          {formatTime(answer.timeSpentSeconds || 0)}
                        </div>
                      </div>

                      {/* Tooltip on hover */}
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10 border">
                        Q{answer.questionNumber}:{" "}
                        {formatTime(answer.timeSpentSeconds || 0)}
                        <br />
                        {answer.isCorrect === null
                          ? "Not answered"
                          : answer.isCorrect
                            ? "✓ Correct"
                            : "✗ Incorrect"}
                      </div>
                    </div>
                  ))}
              </div>

              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded border border-green-500 bg-green-500/10" />
                  <span>Correct</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded border border-red-500 bg-red-500/10" />
                  <span>Incorrect</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded border border-muted-foreground/20 bg-muted" />
                  <span>Not answered</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
