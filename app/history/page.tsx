import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import {
  Clock,
  CheckCircle,
  XCircle,
  FileText,
  Eye,
  Timer,
} from "lucide-react";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { BackButton } from "@/components/back-button";
import { HomeButton } from "@/components/home-button";
import { Footer } from "@/components/footer";

async function getTestHistory() {
  const attempts = await prisma.testAttempt.findMany({
    include: {
      preset: {
        select: {
          name: true,
          testMode: true,
        },
      },
    },
    orderBy: {
      completedAt: "desc",
    },
  });

  return attempts.map((attempt) => ({
    id: attempt.id,
    preset_id: attempt.presetId,
    percentage: attempt.isEvaluated ? Number(attempt.percentage) : null,
    correct_answers: attempt.correctAnswers,
    incorrect_answers: attempt.incorrectAnswers,
    unanswered: attempt.unanswered,
    time_taken_seconds: attempt.timeTakenSeconds || 0,
    overtime_seconds: attempt.overtimeSeconds,
    total_questions: attempt.totalQuestions,
    completed_at: attempt.completedAt,
    is_evaluated: attempt.isEvaluated,
    preset_name: attempt.preset.name,
    test_mode: attempt.preset.testMode,
  }));
}

export default async function HistoryPage() {
  const history = await getTestHistory();

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return hrs > 0
      ? `${hrs}h ${mins}m ${secs}s`
      : mins > 0
        ? `${mins}m ${secs}s`
        : `${secs}s`;
  };

  const formatDate = (date: Date | null) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getScoreBadge = (percentage: number) => {
    if (percentage >= 90)
      return <Badge className="bg-green-600">Excellent</Badge>;
    if (percentage >= 75) return <Badge className="bg-blue-600">Good</Badge>;
    if (percentage >= 60)
      return <Badge className="bg-yellow-600">Average</Badge>;
    return <Badge className="bg-red-600">Needs Work</Badge>;
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 py-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <BackButton />
              <HomeButton />
              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  Test History
                </h1>
                <p className="text-sm text-muted-foreground">
                  View all your past test attempts
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 flex-1">
        {history.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="mb-4 size-12 text-muted-foreground" />
              <p className="mb-4 text-lg font-medium">No test history yet</p>
              <p className="mb-6 text-sm text-muted-foreground">
                Take a test to see your history here
              </p>
              <Link href="/presets">
                <Button>Browse Test Presets</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>All Attempts ({history.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Test Name</TableHead>
                      <TableHead>Mode</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Score</TableHead>
                      <TableHead className="text-center">Correct</TableHead>
                      <TableHead className="text-center">Incorrect</TableHead>
                      <TableHead className="text-center">Unanswered</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {history.map((attempt) => (
                      <TableRow key={attempt.id}>
                        <TableCell className="font-medium">
                          {attempt.preset_name}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {attempt.test_mode === "timer" ? (
                              <Timer className="mr-1 size-3" />
                            ) : (
                              <Clock className="mr-1 size-3" />
                            )}
                            {attempt.test_mode}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(attempt.completed_at)}
                        </TableCell>
                        <TableCell>
                          {attempt.is_evaluated ? (
                            <Badge variant="default">Evaluated</Badge>
                          ) : (
                            <Badge variant="secondary">Pending</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {attempt.is_evaluated &&
                          attempt.percentage !== null ? (
                            <span className="text-lg font-bold">
                              {attempt.percentage.toFixed(1)}%
                            </span>
                          ) : (
                            <span className="text-sm text-muted-foreground">
                              -
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {attempt.is_evaluated ? (
                            <div className="flex items-center justify-center gap-1">
                              <CheckCircle className="size-4 text-green-600" />
                              <span>{attempt.correct_answers}</span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {attempt.is_evaluated ? (
                            <div className="flex items-center justify-center gap-1">
                              <XCircle className="size-4 text-red-600" />
                              <span>{attempt.incorrect_answers}</span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {attempt.is_evaluated ? (
                            <span className="text-muted-foreground">
                              {attempt.unanswered}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Clock className="size-4 text-muted-foreground" />
                            <span className="text-sm">
                              {formatTime(attempt.time_taken_seconds)}
                            </span>
                            {attempt.overtime_seconds &&
                              attempt.overtime_seconds > 0 && (
                                <span className="text-xs text-destructive">
                                  +{formatTime(attempt.overtime_seconds)}
                                </span>
                              )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          {attempt.is_evaluated ? (
                            <Link href={`/results/${attempt.id}`}>
                              <Button variant="ghost" size="sm">
                                <Eye className="mr-2 size-4" />
                                View
                              </Button>
                            </Link>
                          ) : (
                            <Link href={`/enter-key/${attempt.id}`}>
                              <Button variant="default" size="sm">
                                Enter Key
                              </Button>
                            </Link>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
      <Footer />
    </div>
  );
}
