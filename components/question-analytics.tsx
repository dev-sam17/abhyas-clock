"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle2, XCircle, TrendingUp, TrendingDown } from "lucide-react"
import { cn } from "@/lib/utils"

type QuestionStat = {
  questionNumber: number
  timesAttempted: number
  timesCorrect: number
  timesIncorrect: number
  timesUnanswered: number
  accuracy: number
}

export function QuestionAnalytics({ questionStats }: { questionStats: QuestionStat[] }) {
  if (questionStats.length === 0) {
    return null
  }

  // Calculate average accuracy
  const avgAccuracy = questionStats.reduce((sum, stat) => sum + stat.accuracy, 0) / questionStats.length

  // Find strongest and weakest questions
  const sortedByAccuracy = [...questionStats].sort((a, b) => b.accuracy - a.accuracy)
  const strongestQuestions = sortedByAccuracy.slice(0, 5)
  const weakestQuestions = sortedByAccuracy.slice(-5).reverse()

  return (
    <Card>
      <CardHeader>
        <CardTitle>Question-wise Analytics</CardTitle>
        <CardDescription>
          Detailed performance breakdown for each question across all attempts. Average accuracy:{" "}
          {avgAccuracy.toFixed(1)}%
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Summary Stats */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <TrendingUp className="size-4 text-green-600" />
                Strongest Questions (Top 5)
              </h3>
              <div className="space-y-2">
                {strongestQuestions.map((stat) => (
                  <div
                    key={stat.questionNumber}
                    className="flex items-center justify-between rounded-lg border border-border p-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex size-8 items-center justify-center rounded bg-green-100 dark:bg-green-950 font-semibold text-green-700 dark:text-green-400">
                        {stat.questionNumber}
                      </div>
                      <div className="text-sm">
                        <div className="font-medium">{stat.accuracy.toFixed(1)}% accuracy</div>
                        <div className="text-xs text-muted-foreground">
                          {stat.timesCorrect}/{stat.timesAttempted} correct
                        </div>
                      </div>
                    </div>
                    <CheckCircle2 className="size-5 text-green-600" />
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <TrendingDown className="size-4 text-red-600" />
                Needs Improvement (Bottom 5)
              </h3>
              <div className="space-y-2">
                {weakestQuestions.map((stat) => (
                  <div
                    key={stat.questionNumber}
                    className="flex items-center justify-between rounded-lg border border-border p-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex size-8 items-center justify-center rounded bg-red-100 dark:bg-red-950 font-semibold text-red-700 dark:text-red-400">
                        {stat.questionNumber}
                      </div>
                      <div className="text-sm">
                        <div className="font-medium">{stat.accuracy.toFixed(1)}% accuracy</div>
                        <div className="text-xs text-muted-foreground">
                          {stat.timesCorrect}/{stat.timesAttempted} correct
                        </div>
                      </div>
                    </div>
                    <XCircle className="size-5 text-red-600" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Detailed Question List */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold">All Questions</h3>
            <div className="grid gap-2 max-h-96 overflow-y-auto">
              {questionStats.map((stat) => {
                const accuracyColor =
                  stat.accuracy >= 80 ? "text-green-600" : stat.accuracy >= 60 ? "text-yellow-600" : "text-red-600"

                return (
                  <div
                    key={stat.questionNumber}
                    className="flex items-center gap-3 rounded-lg border border-border p-3 hover:bg-muted/50 transition-colors"
                  >
                    {/* Question Number */}
                    <div className="flex size-10 items-center justify-center rounded-lg bg-muted font-bold text-foreground shrink-0">
                      {stat.questionNumber}
                    </div>

                    {/* Stats */}
                    <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                      <div>
                        <div className="text-xs text-muted-foreground">Attempted</div>
                        <div className="font-semibold">{stat.timesAttempted}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Correct</div>
                        <div className="font-semibold text-green-600">{stat.timesCorrect}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Incorrect</div>
                        <div className="font-semibold text-red-600">{stat.timesIncorrect}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Accuracy</div>
                        <div className={cn("font-semibold", accuracyColor)}>{stat.accuracy.toFixed(1)}%</div>
                      </div>
                    </div>

                    {/* Visual Indicator */}
                    <div className="shrink-0">
                      <div className="h-2 w-20 rounded-full bg-muted overflow-hidden">
                        <div
                          className={cn(
                            "h-full transition-all",
                            stat.accuracy >= 80 ? "bg-green-600" : stat.accuracy >= 60 ? "bg-yellow-600" : "bg-red-600",
                          )}
                          style={{ width: `${stat.accuracy}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
