"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Clock, Timer, Loader2, ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { cn } from "@/lib/utils";

type TestPreset = {
  id: number;
  name: string;
  totalQuestions: number;
  startingQuestion: number;
  inputType: string;
  testMode: string;
  timeLimitMinutes: number | null;
  allowOvertime: boolean;
};

type Answer = {
  questionNumber: number;
  selectedAnswer: string | null;
  timeSpentSeconds?: number;
  markedForReview?: boolean;
};

export function OMRInterface({ preset }: { preset: TestPreset }) {
  const router = useRouter();
  const [testStarted, setTestStarted] = useState(false);
  const [showDisclaimerDialog, setShowDisclaimerDialog] = useState(true);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isOvertime, setIsOvertime] = useState(false);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [questionTimes, setQuestionTimes] = useState<Map<number, number>>(
    new Map()
  );
  const [currentQuestionStartTime, setCurrentQuestionStartTime] =
    useState<number>(Date.now());

  // Load persisted state from sessionStorage
  useEffect(() => {
    const savedState = sessionStorage.getItem(`test-${preset.id}`);
    if (savedState) {
      try {
        const {
          seconds: savedSeconds,
          answers: savedAnswers,
          questionTimes: savedTimes,
        } = JSON.parse(savedState);
        setSeconds(savedSeconds);
        if (savedAnswers) setAnswers(savedAnswers);
        if (savedTimes)
          setQuestionTimes(
            new Map(
              Object.entries(savedTimes).map(([k, v]) => [
                Number(k),
                v as number,
              ])
            )
          );
        setTestStarted(true);
        setShowDisclaimerDialog(false);
        setIsRunning(true);
      } catch (e) {
        console.error("Failed to restore test state", e);
      }
    }
  }, [preset.id]);

  // Persist state to sessionStorage
  useEffect(() => {
    if (testStarted) {
      const state = {
        seconds,
        answers,
        questionTimes: Object.fromEntries(questionTimes),
      };
      sessionStorage.setItem(`test-${preset.id}`, JSON.stringify(state));
    }
  }, [seconds, answers, questionTimes, testStarted, preset.id]);

  // Disable right-click and browser navigation during test
  useEffect(() => {
    if (!testStarted) return;

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      return false;
    };

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
      return "";
    };

    const handlePopState = (e: PopStateEvent) => {
      e.preventDefault();
      history.pushState(null, "", window.location.href);
      toast.warning("Please use the submit button to exit the test.");
    };

    // Push state to prevent back navigation
    history.pushState(null, "", window.location.href);

    document.addEventListener("contextmenu", handleContextMenu);
    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("popstate", handlePopState);

    return () => {
      document.removeEventListener("contextmenu", handleContextMenu);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("popstate", handlePopState);
    };
  }, [testStarted]);

  // Initialize answers
  useEffect(() => {
    const initialAnswers: Answer[] = [];
    for (let i = 0; i < preset.totalQuestions; i++) {
      initialAnswers.push({
        questionNumber: preset.startingQuestion + i,
        selectedAnswer: null,
        markedForReview: false,
      });
    }
    setAnswers(initialAnswers);
  }, [preset.totalQuestions, preset.startingQuestion]);

  // Timer/Stopwatch logic
  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      setSeconds((prev) => {
        const newSeconds = prev + 1;

        if (preset.testMode === "timer" && preset.timeLimitMinutes) {
          const timeLimit = preset.timeLimitMinutes * 60;
          if (newSeconds >= timeLimit && !isOvertime) {
            setIsOvertime(true);
            if (!preset.allowOvertime) {
              setIsRunning(false);
              toast.warning("Time's up! Auto-submitting your answers...");
              // Auto-submit after a short delay
              setTimeout(() => {
                handleSubmit();
              }, 2000);
            } else {
              toast.info("Time limit reached. Now in overtime mode.");
            }
          }
        }

        return newSeconds;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [
    isRunning,
    preset.testMode,
    preset.timeLimitMinutes,
    preset.allowOvertime,
    isOvertime,
  ]);

  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const getTimeRemaining = () => {
    if (preset.testMode === "stopwatch" || !preset.timeLimitMinutes)
      return null;
    const timeLimit = preset.timeLimitMinutes * 60;
    const remaining = timeLimit - seconds;
    return remaining > 0 ? remaining : 0;
  };

  const trackQuestionTime = (questionNumber: number) => {
    const now = Date.now();
    const timeSpent = Math.floor((now - currentQuestionStartTime) / 1000);

    setQuestionTimes((prev) => {
      const newMap = new Map(prev);
      const existingTime = newMap.get(questionNumber) || 0;
      newMap.set(questionNumber, existingTime + timeSpent);
      return newMap;
    });

    setCurrentQuestionStartTime(now);
  };

  const currentQuestion = answers[currentQuestionIndex];

  const selectAnswer = (option: string) => {
    if (!currentQuestion) return;

    setAnswers((prev) =>
      prev.map((ans, idx) =>
        idx === currentQuestionIndex
          ? {
              ...ans,
              selectedAnswer: ans.selectedAnswer === option ? null : option,
            }
          : ans
      )
    );
  };

  const setTextAnswer = (text: string) => {
    if (!currentQuestion) return;

    setAnswers((prev) =>
      prev.map((ans, idx) =>
        idx === currentQuestionIndex
          ? { ...ans, selectedAnswer: text.trim() || null }
          : ans
      )
    );
  };

  const clearResponse = () => {
    setAnswers((prev) =>
      prev.map((ans, idx) =>
        idx === currentQuestionIndex ? { ...ans, selectedAnswer: null } : ans
      )
    );
    toast.success("Response cleared");
  };

  const markForReview = () => {
    setAnswers((prev) =>
      prev.map((ans, idx) =>
        idx === currentQuestionIndex
          ? { ...ans, markedForReview: !ans.markedForReview }
          : ans
      )
    );
  };

  const saveAndNext = () => {
    if (currentQuestion) {
      trackQuestionTime(currentQuestion.questionNumber);
    }
    if (currentQuestionIndex < preset.totalQuestions - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const goToPrevious = () => {
    if (currentQuestion) {
      trackQuestionTime(currentQuestion.questionNumber);
    }
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const goToQuestion = (index: number) => {
    if (currentQuestion) {
      trackQuestionTime(currentQuestion.questionNumber);
    }
    setCurrentQuestionIndex(index);
  };

  const handleSubmit = async () => {
    setShowSubmitDialog(false);
    setIsSubmitting(true);
    setIsRunning(false);

    if (currentQuestion) {
      trackQuestionTime(currentQuestion.questionNumber);
    }

    try {
      let overtimeSeconds = 0;
      if (
        preset.testMode === "timer" &&
        preset.timeLimitMinutes &&
        isOvertime
      ) {
        const timeLimit = preset.timeLimitMinutes * 60;
        overtimeSeconds = Math.max(0, seconds - timeLimit);
      }

      const response = await fetch("/api/attempts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          presetId: preset.id,
          timeTakenSeconds: seconds,
          overtimeSeconds,
          totalQuestions: preset.totalQuestions,
          answers: answers.map((ans) => ({
            questionNumber: ans.questionNumber,
            selectedAnswer: ans.selectedAnswer,
            timeSpentSeconds: questionTimes.get(ans.questionNumber) || 0,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit answers");
      }

      const data = await response.json();
      // Clear saved state after successful submission
      sessionStorage.removeItem(`test-${preset.id}`);
      toast.success("Answers submitted successfully!");
      router.replace(`/enter-key/${data.attemptId}`);
    } catch (error) {
      console.error("Error submitting answers:", error);
      toast.error("Failed to submit answers. Please try again.");
      setIsSubmitting(false);
      setIsRunning(true);
    }
  };

  const getQuestionStatus = (answer: Answer) => {
    if (answer.markedForReview && answer.selectedAnswer) {
      return "marked-answered";
    }
    if (answer.markedForReview) {
      return "marked";
    }
    if (answer.selectedAnswer) {
      return "answered";
    }
    return "not-answered";
  };

  const answeredCount = answers.filter(
    (ans) => ans.selectedAnswer !== null
  ).length;
  const markedCount = answers.filter((ans) => ans.markedForReview).length;
  const notAnsweredCount = preset.totalQuestions - answeredCount;

  const timeRemaining = getTimeRemaining();
  const isTimerMode = preset.testMode === "timer";
  const isStopwatchMode = preset.testMode === "stopwatch";
  const isPaused = isStopwatchMode && !isRunning && !isSubmitting && testStarted;

  const togglePause = () => {
    if (isRunning) {
      // Pausing: save accumulated time for the current question
      if (currentQuestion) {
        trackQuestionTime(currentQuestion.questionNumber);
      }
      setIsRunning(false);
    } else {
      // Resuming: reset the question start time so pause duration isn't counted
      setCurrentQuestionStartTime(Date.now());
      setIsRunning(true);
    }
  };

  const handleStartTest = () => {
    setTestStarted(true);
    setShowDisclaimerDialog(false);
    setIsRunning(true);
    setCurrentQuestionStartTime(Date.now());
  };

  // Show disclaimer before test starts
  if (!testStarted) {
    return (
      <Dialog open={showDisclaimerDialog} onOpenChange={() => {}}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl">
              Test Instructions & Disclaimer
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <h4 className="font-semibold text-foreground">
                Important Guidelines:
              </h4>
              <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                <li>
                  Once you start the test, browser navigation buttons will be
                  disabled
                </li>
                <li>
                  You cannot use the back/forward buttons to exit the test
                </li>
                <li>
                  Right-click is disabled during the test to prevent cheating
                </li>
                <li>
                  Refreshing the page will not reset your timer - your progress
                  is saved
                </li>
                {preset.testMode === "timer" && preset.timeLimitMinutes && (
                  <li className="font-semibold text-orange-600 dark:text-orange-400">
                    Time Limit: {preset.timeLimitMinutes} minutes
                    {!preset.allowOvertime &&
                      " (Test will auto-submit when time runs out)"}
                  </li>
                )}
                <li>
                  Use the "Submit Test" button to complete and exit the test
                </li>
                <li>
                  A confirmation prompt will appear if you try to leave the page
                </li>
              </ul>
            </div>
            <div className="rounded-lg border border-orange-200 bg-orange-50 p-4 dark:border-orange-800 dark:bg-orange-950">
              <p className="text-sm font-medium text-orange-900 dark:text-orange-100">
                ⚠️ By starting this test, you acknowledge that you understand
                these restrictions and agree to complete the test using only the
                submit button.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button onClick={handleStartTest}>I Understand, Start Test</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <>
      <div className="h-screen overflow-hidden bg-background p-2 sm:p-4 md:p-6 flex flex-col">
        <Card className="mx-auto w-full max-w-6xl flex flex-1 min-h-0 flex-col overflow-hidden">
          <CardContent className="p-3 sm:p-4 md:p-6 flex flex-1 min-h-0 flex-col overflow-hidden">
            <header className="shrink-0 mb-4 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
              <div>
                <h2 className="text-xl font-bold sm:text-2xl">{preset.name}</h2>
                <p className="text-xs text-muted-foreground sm:text-sm">
                  {preset.totalQuestions} questions • Starting from Q
                  {preset.startingQuestion}
                </p>
              </div>
              <div className="flex items-center gap-4">
                {/* Timer Display */}
                <Card className="border-2">
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2 sm:gap-4">
                      {preset.testMode === "timer" && (
                        <div className="flex items-center gap-1.5 sm:gap-2">
                          <Timer className="size-4 sm:size-5" />
                          <span
                            className={cn(
                              "text-base font-bold sm:text-lg",
                              isOvertime && "text-destructive"
                            )}
                          >
                            {formatTime(seconds)}
                          </span>
                          {isOvertime && (
                            <Badge variant="destructive" className="text-xs">
                              Overtime
                            </Badge>
                          )}
                        </div>
                      )}
                      {preset.testMode === "stopwatch" && (
                        <div className="flex items-center gap-1.5 sm:gap-2">
                          <Clock className="size-4 sm:size-5" />
                          <span className={cn(
                            "text-base font-bold sm:text-lg",
                            !isRunning && !isSubmitting && "text-muted-foreground"
                          )}>
                            {formatTime(seconds)}
                          </span>
                          {!isSubmitting && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-7 sm:size-8"
                              onClick={togglePause}
                              title={isRunning ? "Pause" : "Resume"}
                            >
                              {isRunning ? (
                                <Pause className="size-3.5 sm:size-4" />
                              ) : (
                                <Play className="size-3.5 sm:size-4" />
                              )}
                            </Button>
                          )}
                          {!isRunning && !isSubmitting && (
                            <Badge variant="secondary" className="text-xs">
                              Paused
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Submit Button */}
                <Button
                  onClick={() => setShowSubmitDialog(true)}
                  disabled={isSubmitting}
                  variant="destructive"
                >
                  {isSubmitting ? (
                    <Loader2 className="mr-2 size-4 animate-spin" />
                  ) : null}
                  Submit
                </Button>
              </div>
            </header>

            {/* Main Content */}
            <div className="flex flex-1 min-h-0 flex-col lg:flex-row gap-4 overflow-hidden">
              {/* Question Area */}
              <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
                <Card className="flex min-h-0 flex-col overflow-hidden">
                  <CardContent className="p-4 sm:p-6">
                    <div className="mb-6">
                      <h2 className="text-lg sm:text-xl font-semibold mb-4">
                        Question {currentQuestion?.questionNumber}
                      </h2>

                      {/* Answer Options */}
                      {preset.inputType === "radio" ? (
                        <div className="space-y-2 sm:space-y-3">
                          {["A", "B", "C", "D", "E"].map((option) => (
                            <div
                              key={option}
                              onClick={() => !isPaused && selectAnswer(option)}
                              className={cn(
                                "flex items-center space-x-3 rounded-lg border-2 p-3 sm:p-4 transition-all",
                                isPaused ? "cursor-not-allowed opacity-50" : "cursor-pointer",
                                currentQuestion?.selectedAnswer === option
                                  ? "border-primary bg-primary/10"
                                  : isPaused ? "border-border" : "border-border hover:border-primary/50"
                              )}
                            >
                              <div
                                className={cn(
                                  "flex size-5 sm:size-6 items-center justify-center rounded-full border-2",
                                  currentQuestion?.selectedAnswer === option
                                    ? "border-primary bg-primary text-primary-foreground"
                                    : "border-muted-foreground"
                                )}
                              >
                                {currentQuestion?.selectedAnswer === option && (
                                  <div className="size-2.5 sm:size-3 rounded-full bg-primary-foreground" />
                                )}
                              </div>
                              <span className="text-sm sm:text-base font-medium">
                                {option}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <Input
                          value={currentQuestion?.selectedAnswer || ""}
                          onChange={(e) => setTextAnswer(e.target.value)}
                          placeholder="Enter your answer"
                          className="text-base sm:text-lg"
                          disabled={isPaused}
                        />
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 sm:gap-4 pt-4 border-t">
                      <div className="flex gap-2">
                        <Button
                          onClick={markForReview}
                          variant="outline"
                          size="sm"
                          disabled={isPaused}
                          className="flex-1 sm:flex-none text-xs sm:text-sm"
                        >
                          {currentQuestion?.markedForReview ? "Unmark" : "Mark"}
                        </Button>
                        <Button
                          onClick={clearResponse}
                          variant="outline"
                          size="sm"
                          disabled={isPaused}
                          className="flex-1 sm:flex-none text-xs sm:text-sm"
                        >
                          Clear
                        </Button>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          onClick={goToPrevious}
                          disabled={currentQuestionIndex === 0 || isPaused}
                          variant="outline"
                          size="sm"
                          className="flex-1 sm:flex-none text-xs sm:text-sm"
                        >
                          <ChevronLeft className="mr-1 size-3 sm:size-4" />
                          <span className="hidden sm:inline">Previous</span>
                          <span className="sm:hidden">Prev</span>
                        </Button>
                        <Button
                          onClick={saveAndNext}
                          disabled={
                            currentQuestionIndex === preset.totalQuestions - 1 || isPaused
                          }
                          size="sm"
                          className="flex-1 sm:flex-none text-xs sm:text-sm"
                        >
                          <span className="hidden sm:inline">Save & Next</span>
                          <span className="sm:hidden">Next</span>
                          <ChevronRight className="ml-1 size-3 sm:size-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Question Palette Sidebar */}
              <div className="lg:w-80 min-h-0 border-t lg:border-t-0 lg:border-l bg-card p-4 sm:p-6 flex flex-col overflow-hidden">
                <div className="flex h-full min-h-0 flex-col">
                  <h3 className="shrink-0 text-sm sm:text-base font-semibold mb-3 sm:mb-4">
                    Question Palette
                  </h3>

                  {/* Legend */}
                  <div className="shrink-0 mb-4 sm:mb-6 space-y-2 text-xs sm:text-sm">
                    <div className="flex items-center gap-2">
                      <div className="size-6 sm:size-8 rounded bg-green-500" />
                      <span>Answered ({answeredCount})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="size-6 sm:size-8 rounded bg-orange-500" />
                      <span>Marked ({markedCount})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="size-6 sm:size-8 rounded bg-muted" />
                      <span>Not Answered ({notAnsweredCount})</span>
                    </div>
                  </div>

                  {/* Question Numbers Grid */}
                  <div className="palette-scrollbar grid grid-cols-5 sm:grid-cols-6 lg:grid-cols-4 gap-2 flex-1 min-h-0 overflow-y-auto px-1 pt-1">
                    {answers.map((answer, index) => {
                      const status = getQuestionStatus(answer);
                      return (
                        <button
                          key={index}
                          onClick={() => !isPaused && goToQuestion(index)}
                          disabled={isPaused}
                          className={cn(
                            "size-10 sm:size-12 rounded text-sm sm:text-base font-semibold transition-all",
                            currentQuestionIndex === index &&
                              "ring-2 ring-primary ring-offset-2",
                            status === "answered" &&
                              "bg-green-500 text-white hover:bg-green-600",
                            status === "marked" &&
                              "bg-orange-500 text-white hover:bg-orange-600",
                            status === "marked-answered" &&
                              "bg-purple-500 text-white hover:bg-purple-600",
                            status === "not-answered" &&
                              "bg-muted hover:bg-muted/80"
                          )}
                        >
                          {answer.questionNumber}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Submit Confirmation Dialog */}
      <Dialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Submit Test?</DialogTitle>
            <DialogDescription>
              You have answered {answeredCount} out of {preset.totalQuestions}{" "}
              questions.
              {notAnsweredCount > 0 &&
                ` ${notAnsweredCount} questions are not answered.`}
              {markedCount > 0 &&
                ` ${markedCount} questions are marked for review.`}
              <br />
              <br />
              Are you sure you want to submit your test?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowSubmitDialog(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmit}>Submit Test</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
