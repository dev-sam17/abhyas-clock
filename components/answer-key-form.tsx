"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, CheckCircle2, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

type Answer = {
  id: number;
  questionNumber: number;
  selectedAnswer: string | null;
  isCorrect: boolean | null;
};

type Attempt = {
  id: number;
  totalQuestions: number;
  preset: {
    name: string;
    startingQuestion: number;
    inputType: string;
  };
  answers: Answer[];
};

export function AnswerKeyForm({ attempt }: { attempt: Attempt }) {
  const router = useRouter();
  const [correctAnswers, setCorrectAnswers] = useState<(string | null)[]>(
    Array(attempt.totalQuestions).fill(null)
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectCorrectAnswer = (questionNumber: number, option: string) => {
    setCorrectAnswers((prev) => {
      const updated = [...prev];
      const index = questionNumber - attempt.preset.startingQuestion;
      updated[index] = updated[index] === option ? null : option;
      return updated;
    });
  };

  const setTextCorrectAnswer = (questionNumber: number, text: string) => {
    setCorrectAnswers((prev) => {
      const updated = [...prev];
      const index = questionNumber - attempt.preset.startingQuestion;
      updated[index] = text.trim() || null;
      return updated;
    });
  };

  const handleSubmit = async () => {
    const unansweredKeys = correctAnswers
      .map((ans, idx) =>
        ans === null ? attempt.preset.startingQuestion + idx : null
      )
      .filter((num) => num !== null);

    if (unansweredKeys.length > 0) {
      toast.error(
        `Please enter correct answers for all questions. Missing: ${unansweredKeys.join(", ")}`
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/answer-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          attemptId: attempt.id,
          correctAnswers,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit answer key");
      }

      const data = await response.json();
      toast.success("Answer key submitted! Your test has been evaluated.");
      router.push(`/results/${attempt.id}`);
    } catch (error) {
      console.error("[v0] Error submitting answer key:", error);
      toast.error("Failed to submit answer key. Please try again.");
      setIsSubmitting(false);
    }
  };

  const filledCount = correctAnswers.filter((ans) => ans !== null).length;
  const progress = (filledCount / attempt.totalQuestions) * 100;

  const getUserAnswer = (questionNumber: number) => {
    const answer = attempt.answers.find(
      (ans) => ans.questionNumber === questionNumber
    );
    return answer?.selectedAnswer || null;
  };

  return (
    <div className="space-y-6">
      {/* Progress Card */}
      <Card>
        <CardHeader>
          <CardTitle>{attempt.preset.name}</CardTitle>
          <CardDescription>
            Enter the correct answer for each question. This will be used to
            calculate your score.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">
                {filledCount} / {attempt.totalQuestions}
              </span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Answer Key Grid */}
      <Card>
        <CardHeader>
          <CardTitle>Correct Answers</CardTitle>
          <CardDescription>
            {attempt.preset.inputType === "radio"
              ? "Select the correct answer for each question. Your submitted answer is shown for reference."
              : "Enter the correct answer for each question. Your submitted answer is shown for reference."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {Array.from(
              { length: attempt.totalQuestions },
              (_, i) => attempt.preset.startingQuestion + i
            ).map((questionNumber) => {
              const userAnswer = getUserAnswer(questionNumber);
              const correctAnswer =
                correctAnswers[
                  questionNumber - attempt.preset.startingQuestion
                ];

              return (
                <div
                  key={questionNumber}
                  className="flex items-center gap-4 rounded-lg border border-border p-4 hover:bg-muted/50 transition-colors"
                >
                  {/* Question Number */}
                  <div className="flex size-12 items-center justify-center rounded-lg bg-muted font-bold text-foreground shrink-0">
                    {questionNumber}
                  </div>

                  {/* User's Answer */}
                  <div className="shrink-0 w-32">
                    <div className="text-xs text-muted-foreground mb-1">
                      Your answer:
                    </div>
                    {userAnswer ? (
                      <Badge
                        variant="secondary"
                        className="max-w-full truncate"
                      >
                        {userAnswer}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="gap-1">
                        <Circle className="size-3" />
                        Empty
                      </Badge>
                    )}
                  </div>

                  {attempt.preset.inputType === "radio" ? (
                    /* Radio Button Options */
                    <>
                      <div className="flex-1">
                        <div className="text-xs text-muted-foreground mb-2">
                          Correct answer:
                        </div>
                        <div className="flex gap-2">
                          {["A", "B", "C", "D", "E"].map((option) => (
                            <button
                              key={option}
                              type="button"
                              onClick={() =>
                                selectCorrectAnswer(questionNumber, option)
                              }
                              className={cn(
                                "flex size-12 items-center justify-center rounded-lg border-2 font-semibold transition-all hover:scale-105",
                                correctAnswer === option
                                  ? "border-primary bg-primary text-primary-foreground shadow-lg scale-105"
                                  : "border-border bg-background text-foreground hover:border-primary/50"
                              )}
                            >
                              {option}
                            </button>
                          ))}
                        </div>
                      </div>
                    </>
                  ) : (
                    /* Text Input */
                    <div className="flex-1">
                      <div className="text-xs text-muted-foreground mb-2">
                        Correct answer:
                      </div>
                      <Input
                        placeholder="Enter correct answer..."
                        value={correctAnswer || ""}
                        onChange={(e) =>
                          setTextCorrectAnswer(questionNumber, e.target.value)
                        }
                        className="h-10"
                      />
                    </div>
                  )}

                  {/* Visual Indicator */}
                  <div className="shrink-0">
                    {correctAnswer ? (
                      <CheckCircle2 className="size-6 text-green-600" />
                    ) : (
                      <Circle className="size-6 text-muted-foreground" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Submit Button */}
      <Card>
        <CardContent className="pt-6">
          <Button
            onClick={handleSubmit}
            size="lg"
            className="w-full"
            disabled={isSubmitting || filledCount < attempt.totalQuestions}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Evaluating Test...
              </>
            ) : (
              <>Submit Answer Key & View Results</>
            )}
          </Button>
          {filledCount < attempt.totalQuestions && (
            <p className="text-sm text-muted-foreground text-center mt-2">
              Please enter correct answers for all {attempt.totalQuestions}{" "}
              questions
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
