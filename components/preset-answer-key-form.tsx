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
import { toast } from "sonner";
import { Loader2, CheckCircle2, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  presetId: number;
  presetName: string;
  totalQuestions: number;
  startingQuestion: number;
  inputType: string;
  existingAnswers: (string | null)[] | null;
};

export function PresetAnswerKeyForm({
  presetId,
  presetName,
  totalQuestions,
  startingQuestion,
  inputType,
  existingAnswers,
}: Props) {
  const router = useRouter();
  const [correctAnswers, setCorrectAnswers] = useState<(string | null)[]>(
    existingAnswers && existingAnswers.length === totalQuestions
      ? existingAnswers
      : Array(totalQuestions).fill(null)
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectCorrectAnswer = (questionNumber: number, option: string) => {
    setCorrectAnswers((prev) => {
      const updated = [...prev];
      const index = questionNumber - startingQuestion;
      updated[index] = updated[index] === option ? null : option;
      return updated;
    });
  };

  const setTextCorrectAnswer = (questionNumber: number, text: string) => {
    setCorrectAnswers((prev) => {
      const updated = [...prev];
      const index = questionNumber - startingQuestion;
      updated[index] = text.trim() || null;
      return updated;
    });
  };

  const handleSubmit = async () => {
    const unansweredKeys = correctAnswers
      .map((ans, idx) => (ans === null ? startingQuestion + idx : null))
      .filter((num) => num !== null);

    if (unansweredKeys.length > 0) {
      toast.error(
        `Please enter correct answers for all questions. Missing: ${unansweredKeys.join(", ")}`
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/presets/${presetId}/answer-key`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ correctAnswers }),
      });

      if (!response.ok) {
        throw new Error("Failed to save answer key");
      }

      toast.success("Answer key saved! This test is ready to use.");
      router.push("/presets");
    } catch (error) {
      console.error("[v0] Error saving preset answer key:", error);
      toast.error("Failed to save answer key. Please try again.");
      setIsSubmitting(false);
    }
  };

  const handleSkip = () => {
    router.push("/presets");
  };

  const filledCount = correctAnswers.filter((ans) => ans !== null).length;
  const progress = (filledCount / totalQuestions) * 100;

  return (
    <div className="space-y-6">
      {/* Progress Card */}
      <Card>
        <CardHeader>
          <CardTitle>{presetName}</CardTitle>
          <CardDescription>
            Enter the correct answer for each question. This answer key will be
            used to automatically evaluate every attempt of this test.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">
                {filledCount} / {totalQuestions}
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
            {inputType === "radio"
              ? "Select the correct answer for each question."
              : "Enter the correct answer for each question."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {Array.from(
              { length: totalQuestions },
              (_, i) => startingQuestion + i
            ).map((questionNumber) => {
              const correctAnswer = correctAnswers[questionNumber - startingQuestion];

              return (
                <div
                  key={questionNumber}
                  className="flex items-center gap-4 rounded-lg border border-border p-4 hover:bg-muted/50 transition-colors"
                >
                  {/* Question Number */}
                  <div className="flex size-12 items-center justify-center rounded-lg bg-muted font-bold text-foreground shrink-0">
                    {questionNumber}
                  </div>

                  {inputType === "radio" ? (
                    /* Radio Button Options */
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

      {/* Actions */}
      <Card>
        <CardContent className="pt-6 space-y-3">
          <Button
            onClick={handleSubmit}
            size="lg"
            className="w-full"
            disabled={isSubmitting || filledCount < totalQuestions}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Saving Answer Key...
              </>
            ) : (
              <>Save Answer Key</>
            )}
          </Button>
          <Button
            onClick={handleSkip}
            size="lg"
            variant="ghost"
            className="w-full"
            disabled={isSubmitting}
          >
            Skip for now
          </Button>
          {filledCount < totalQuestions && (
            <p className="text-sm text-muted-foreground text-center">
              Enter correct answers for all {totalQuestions} questions, or skip
              to add them later.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
