"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Award, Clock, Target } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PerformanceChart } from "@/components/performance-chart";
import { TestBreakdown } from "@/components/test-breakdown";
import { QuestionAnalytics } from "@/components/question-analytics";
import { QuestionTimeAnalytics } from "@/components/question-time-analytics";
import { BackButton } from "@/components/back-button";
import { HomeButton } from "@/components/home-button";
import { Footer } from "@/components/footer";

type AnalyticsData = {
  totalAttempts: number;
  averageScore: number;
  totalTime: number;
  bestScore: number;
  averageTimePerQuestion: number;
  attempts: any[];
  questionStats: any[];
  attemptsWithTimes: any[];
};

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchAnalytics = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/analytics");
        if (!res.ok) {
          throw new Error("Failed to load analytics");
        }
        const data = (await res.json()) as AnalyticsData;
        if (!cancelled) {
          setAnalytics(data);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to load analytics");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchAnalytics();
    return () => {
      cancelled = true;
    };
  }, []);

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-3 py-3 sm:px-4 sm:py-4">
          <div className="flex items-center gap-2 mb-2 sm:mb-3">
            <BackButton />
            <HomeButton />
          </div>
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
            Performance Analytics
          </h1>
          <p className="mt-0.5 text-xs text-muted-foreground sm:mt-1 sm:text-sm">
            Track your progress and identify areas for improvement
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 flex-1">
        {loading ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-sm text-muted-foreground">Loading...</p>
            </CardContent>
          </Card>
        ) : error || !analytics ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-sm text-destructive">
                {error || "Failed to load analytics"}
              </p>
            </CardContent>
          </Card>
        ) : analytics.totalAttempts === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Target className="mb-4 size-12 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">
                No evaluated tests yet
              </h3>
              <p className="mb-4 text-sm text-muted-foreground">
                Complete and evaluate a test to see analytics
              </p>
              <Link href="/presets">
                <Button>Browse Tests</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Attempts
                  </CardTitle>
                  <Target className="size-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {analytics.totalAttempts}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Tests completed
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Average Score
                  </CardTitle>
                  <TrendingUp className="size-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {analytics.averageScore.toFixed(1)}%
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Across all tests
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Best Score
                  </CardTitle>
                  <Award className="size-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {analytics.bestScore.toFixed(1)}%
                  </div>
                  <p className="text-xs text-muted-foreground">Personal best</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Time
                  </CardTitle>
                  <Clock className="size-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatTime(analytics.totalTime)}
                  </div>
                  <p className="text-xs text-muted-foreground">Practice time</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Avg Time/Question
                  </CardTitle>
                  <Clock className="size-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {analytics.averageTimePerQuestion}s
                  </div>
                  <p className="text-xs text-muted-foreground">Per question</p>
                </CardContent>
              </Card>
            </div>

            <PerformanceChart attempts={analytics.attempts} />

            <TestBreakdown attempts={analytics.attempts} />

            <QuestionAnalytics questionStats={analytics.questionStats} />

            <QuestionTimeAnalytics attempts={analytics.attemptsWithTimes} />
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
