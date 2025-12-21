"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import { Clock, Timer, AlertCircle, CheckCircle2, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

type TestPreset = {
  id: number
  name: string
  totalQuestions: number
  startingQuestion: number
  inputType: string
  testMode: string
  timeLimitMinutes: number | null
  allowOvertime: boolean
}

type Answer = {
  questionNumber: number
  selectedAnswer: string | null
}

export function OMRInterface({ preset }: { preset: TestPreset }) {
  const router = useRouter()
  const [answers, setAnswers] = useState<Answer[]>([])
  const [seconds, setSeconds] = useState(0)
  const [isRunning, setIsRunning] = useState(true)
  const [isOvertime, setIsOvertime] = useState(false)
  const [showSubmitDialog, setShowSubmitDialog] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [attemptId, setAttemptId] = useState<number | null>(null)
  const [startTime] = useState(Date.now())

  useEffect(() => {
    const initialAnswers: Answer[] = []
    for (let i = 0; i < preset.totalQuestions; i++) {
      initialAnswers.push({
        questionNumber: preset.startingQuestion + i,
        selectedAnswer: null,
      })
    }
    setAnswers(initialAnswers)
  }, [preset.totalQuestions, preset.startingQuestion])

  // Timer/Stopwatch logic
  useEffect(() => {
    if (!isRunning) return

    const interval = setInterval(() => {
      setSeconds((prev) => {
        const newSeconds = prev + 1

        // Check for overtime in timer mode
        if (preset.testMode === "timer" && preset.timeLimitMinutes) {
          const timeLimit = preset.timeLimitMinutes * 60
          if (newSeconds >= timeLimit && !isOvertime) {
            setIsOvertime(true)
            if (!preset.allowOvertime) {
              setIsRunning(false)
              toast.warning("Time's up! Please submit your answers.")
            } else {
              toast.info("Time limit reached. Now in overtime mode.")
            }
          }
        }

        return newSeconds
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [isRunning, preset.testMode, preset.timeLimitMinutes, preset.allowOvertime, isOvertime])

  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const secs = totalSeconds % 60
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const getTimeRemaining = () => {
    if (preset.testMode === "stopwatch" || !preset.timeLimitMinutes) return null
    const timeLimit = preset.timeLimitMinutes * 60
    const remaining = timeLimit - seconds
    return remaining > 0 ? remaining : 0
  }

  const selectAnswer = (questionNumber: number, option: string) => {
    setAnswers((prev) =>
      prev.map((ans) =>
        ans.questionNumber === questionNumber
          ? { ...ans, selectedAnswer: ans.selectedAnswer === option ? null : option }
          : ans,
      ),
    )
  }

  const setTextAnswer = (questionNumber: number, text: string) => {
    setAnswers((prev) =>
      prev.map((ans) =>
        ans.questionNumber === questionNumber ? { ...ans, selectedAnswer: text.trim() || null } : ans,
      ),
    )
  }

  const handleSubmit = async () => {
    setShowSubmitDialog(false)
    setIsSubmitting(true)
    setIsRunning(false)

    try {
      // Calculate overtime if applicable
      let overtimeSeconds = 0
      if (preset.testMode === "timer" && preset.timeLimitMinutes && isOvertime) {
        const timeLimit = preset.timeLimitMinutes * 60
        overtimeSeconds = Math.max(0, seconds - timeLimit)
      }

      // Create test attempt
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
          })),
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to submit answers")
      }

      const data = await response.json()
      toast.success("Answers submitted successfully!")
      router.push(`/enter-key/${data.attemptId}`)
    } catch (error) {
      console.error("[v0] Error submitting answers:", error)
      toast.error("Failed to submit answers. Please try again.")
      setIsSubmitting(false)
      setIsRunning(true)
    }
  }

  const answeredCount = answers.filter((ans) => ans.selectedAnswer !== null).length
  const unansweredCount = preset.totalQuestions - answeredCount

  const timeRemaining = getTimeRemaining()
  const isTimerMode = preset.testMode === "timer"

  return (
    <>
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-border bg-card shadow-sm">
        <div className="mx-auto max-w-7xl px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-foreground">{preset.name}</h1>
              <p className="text-sm text-muted-foreground">{preset.totalQuestions} Questions</p>
            </div>

            <div className="flex items-center gap-4">
              {/* Timer/Stopwatch Display */}
              <Card className="border-2">
                <CardContent className="p-3">
                  <div className="flex items-center gap-2">
                    {isTimerMode ? <Timer className="size-5" /> : <Clock className="size-5" />}
                    <div className="text-center">
                      {isTimerMode && timeRemaining !== null ? (
                        <>
                          <div
                            className={cn(
                              "text-2xl font-mono font-bold tabular-nums",
                              isOvertime && "text-destructive",
                            )}
                          >
                            {formatTime(timeRemaining)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {isOvertime
                              ? `+${formatTime(seconds - preset.timeLimitMinutes! * 60)} overtime`
                              : "remaining"}
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="text-2xl font-mono font-bold tabular-nums">{formatTime(seconds)}</div>
                          <div className="text-xs text-muted-foreground">elapsed</div>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Submit Button */}
              <Button onClick={() => setShowSubmitDialog(true)} size="lg" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit Test"
                )}
              </Button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-4 flex items-center gap-4">
            <div className="flex-1">
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${(answeredCount / preset.totalQuestions) * 100}%` }}
                />
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <Badge variant="default" className="gap-1">
                <CheckCircle2 className="size-3" />
                {answeredCount} Answered
              </Badge>
              <Badge variant="secondary" className="gap-1">
                <AlertCircle className="size-3" />
                {unansweredCount} Unanswered
              </Badge>
            </div>
          </div>
        </div>
      </header>

      {/* OMR Sheet */}
      <main className="mx-auto max-w-7xl px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Answer Sheet</CardTitle>
            <p className="text-sm text-muted-foreground">
              {preset.inputType === "radio"
                ? "Click on an option to mark your answer. Click again to unmark."
                : "Type your answer for each question. Leave blank if unanswered."}
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {answers.map((answer) => (
                <div
                  key={answer.questionNumber}
                  className="flex items-center gap-4 rounded-lg border border-border p-4 hover:bg-muted/50 transition-colors"
                >
                  {/* Question Number */}
                  <div className="flex size-12 items-center justify-center rounded-lg bg-muted font-bold text-foreground shrink-0">
                    {answer.questionNumber}
                  </div>

                  {preset.inputType === "radio" ? (
                    /* Radio Button Options */
                    <>
                      <div className="flex flex-1 gap-2">
                        {["A", "B", "C", "D", "E"].map((option) => (
                          <button
                            key={option}
                            type="button"
                            onClick={() => selectAnswer(answer.questionNumber, option)}
                            className={cn(
                              "flex size-12 items-center justify-center rounded-lg border-2 font-semibold transition-all hover:scale-105",
                              answer.selectedAnswer === option
                                ? "border-primary bg-primary text-primary-foreground shadow-lg scale-105"
                                : "border-border bg-background text-foreground hover:border-primary/50",
                            )}
                          >
                            {option}
                          </button>
                        ))}
                      </div>

                      {/* Status Indicator */}
                      <div className="shrink-0 w-20 text-right">
                        {answer.selectedAnswer ? (
                          <Badge variant="default" className="gap-1">
                            <CheckCircle2 className="size-3" />
                            {answer.selectedAnswer}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="gap-1">
                            <AlertCircle className="size-3" />
                            Empty
                          </Badge>
                        )}
                      </div>
                    </>
                  ) : (
                    /* Text Input */
                    <>
                      <div className="flex-1">
                        <Input
                          placeholder="Type your answer here..."
                          value={answer.selectedAnswer || ""}
                          onChange={(e) => setTextAnswer(answer.questionNumber, e.target.value)}
                          className="h-12 text-base"
                        />
                      </div>

                      {/* Status Indicator */}
                      <div className="shrink-0 w-24 text-right">
                        {answer.selectedAnswer ? (
                          <Badge variant="default" className="gap-1">
                            <CheckCircle2 className="size-3" />
                            Filled
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="gap-1">
                            <AlertCircle className="size-3" />
                            Empty
                          </Badge>
                        )}
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Submit Confirmation Dialog */}
      <Dialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Submit Test?</DialogTitle>
            <DialogDescription>
              Are you sure you want to submit your answers? You have answered {answeredCount} out of{" "}
              {preset.totalQuestions} questions.
              {unansweredCount > 0 && (
                <span className="block mt-2 text-destructive font-medium">
                  Warning: {unansweredCount} question{unansweredCount !== 1 ? "s" : ""} left unanswered!
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSubmitDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>Confirm Submit</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
