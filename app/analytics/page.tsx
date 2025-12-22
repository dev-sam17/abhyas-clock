import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { prisma } from "@/lib/prisma"
import { ArrowLeft, TrendingUp, Award, Clock, Target } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { PerformanceChart } from "@/components/performance-chart"
import { TestBreakdown } from "@/components/test-breakdown"
import { QuestionAnalytics } from "@/components/question-analytics"

async function getAnalytics() {
  const attempts = await prisma.testAttempt.findMany({
    where: {
      isEvaluated: true,
    },
    include: {
      preset: {
        select: {
          name: true,
          startingQuestion: true,
        },
      },
      answers: {
        orderBy: { questionNumber: "asc" },
      },
    },
    orderBy: {
      completedAt: "desc",
    },
  })

  if (attempts.length === 0) {
    return {
      totalAttempts: 0,
      averageScore: 0,
      totalTime: 0,
      bestScore: 0,
      attempts: [],
      questionStats: [],
    }
  }

  const totalAttempts = attempts.length
  const averageScore = attempts.reduce((sum, a) => sum + Number(a.percentage || 0), 0) / totalAttempts
  const totalTime = attempts.reduce((sum, a) => sum + (a.timeTakenSeconds || 0), 0)
  const bestScore = Math.max(...attempts.map((a) => Number(a.percentage || 0)))

  const formattedAttempts = attempts.map((attempt) => ({
    id: attempt.id,
    preset_id: attempt.presetId,
    percentage: Number(attempt.percentage || 0),
    correct_answers: attempt.correctAnswers || 0,
    incorrect_answers: attempt.incorrectAnswers || 0,
    unanswered: attempt.unanswered || 0,
    time_taken_seconds: attempt.timeTakenSeconds || 0,
    total_questions: attempt.totalQuestions,
    completed_at: attempt.completedAt,
    preset_name: attempt.preset.name,
  }))

  const questionStatsMap = new Map<number, { correct: number; incorrect: number; unanswered: number; total: number }>()

  attempts.forEach((attempt) => {
    attempt.answers.forEach((answer) => {
      const qNum = answer.questionNumber
      if (!questionStatsMap.has(qNum)) {
        questionStatsMap.set(qNum, { correct: 0, incorrect: 0, unanswered: 0, total: 0 })
      }
      const stats = questionStatsMap.get(qNum)!
      stats.total++

      if (answer.selectedAnswer === null) {
        stats.unanswered++
      } else if (answer.isCorrect) {
        stats.correct++
      } else {
        stats.incorrect++
      }
    })
  })

  const questionStats = Array.from(questionStatsMap.entries())
    .map(([questionNumber, stats]) => ({
      questionNumber,
      timesAttempted: stats.total,
      timesCorrect: stats.correct,
      timesIncorrect: stats.incorrect,
      timesUnanswered: stats.unanswered,
      accuracy: stats.total > 0 ? (stats.correct / stats.total) * 100 : 0,
    }))
    .sort((a, b) => a.questionNumber - b.questionNumber)

  return {
    totalAttempts,
    averageScore,
    totalTime,
    bestScore,
    attempts: formattedAttempts,
    questionStats,
  }
}

export default async function AnalyticsPage() {
  const analytics = await getAnalytics()

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    return hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 py-6">
          <Link href="/home">
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="mr-2 size-4" />
              Back to Home
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-foreground">Performance Analytics</h1>
          <p className="mt-1 text-sm text-muted-foreground">Track your progress and identify areas for improvement</p>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8">
        {analytics.totalAttempts === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Target className="mb-4 size-12 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No evaluated tests yet</h3>
              <p className="mb-4 text-sm text-muted-foreground">Complete and evaluate a test to see analytics</p>
              <Link href="/presets">
                <Button>Browse Test Presets</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Attempts</CardTitle>
                  <Target className="size-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics.totalAttempts}</div>
                  <p className="text-xs text-muted-foreground">Tests completed</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Average Score</CardTitle>
                  <TrendingUp className="size-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics.averageScore.toFixed(1)}%</div>
                  <p className="text-xs text-muted-foreground">Across all tests</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Best Score</CardTitle>
                  <Award className="size-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics.bestScore.toFixed(1)}%</div>
                  <p className="text-xs text-muted-foreground">Personal best</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Time</CardTitle>
                  <Clock className="size-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatTime(analytics.totalTime)}</div>
                  <p className="text-xs text-muted-foreground">Practice time</p>
                </CardContent>
              </Card>
            </div>

            <PerformanceChart attempts={analytics.attempts} />

            <TestBreakdown attempts={analytics.attempts} />

            <QuestionAnalytics questionStats={analytics.questionStats} />
          </div>
        )}
      </main>
    </div>
  )
}
