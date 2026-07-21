"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BackButton } from "@/components/back-button";
import { LoadingSpinner } from "@/components/loading-spinner";
import { Footer } from "@/components/footer";
import { Navbar } from "@/components/navbar";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  AreaChart, Area,
} from "recharts";
import {
  Target, TrendingUp, TrendingDown, Clock, CheckCircle,
  XCircle, MinusCircle, Award, BarChart3, BookOpen, Zap,
} from "lucide-react";

type ChapterStat = {
  id: number; name: string; chapterNumber: string;
  totalTests: number; completedTests: number; totalAttempts: number;
  avgScore: number | null; highestScore: number | null;
  latestAttemptAt: string | null;
};

type RecentAttempt = {
  id: number; completedAt: string | null; percentage: number | null;
  isEvaluated: boolean; presetName: string;
};

type Stats = {
  collectionName: string; collectionDescription: string | null;
  totalTests: number; completedTests: number; notStartedTests: number;
  totalAttempts: number; evaluatedAttempts: number;
  avgScore: number | null; highestScore: number | null; lowestScore: number | null;
  totalCorrect: number; totalIncorrect: number; totalUnanswered: number;
  totalQuestionsAnswered: number; avgTimeSeconds: number | null;
  totalTimeSeconds: number;
  scoreDistribution: { range: string; count: number }[];
  chapterStats: ChapterStat[]; recentAttempts: RecentAttempt[];
};

const PIE_COLORS = ["hsl(142, 71%, 45%)", "hsl(220, 13%, 26%)"];
const BAR_COLORS = ["#ef4444", "#f97316", "#eab308", "#3b82f6", "#22c55e"];

function formatTime(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return h > 0 ? `${h}h ${m}m` : m > 0 ? `${m}m ${s}s` : `${s}s`;
}

function StatCard({ icon: Icon, label, value, sub, color }: {
  icon: React.ElementType; label: string; value: string | number;
  sub?: string; color?: string;
}) {
  return (
    <Card className="relative overflow-hidden">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
            <p className={`text-2xl font-bold tracking-tight ${color || "text-foreground"}`}>{value}</p>
            {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
          </div>
          <div className="rounded-lg bg-primary/10 p-2.5">
            <Icon className="size-5 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-card px-3 py-2 shadow-lg">
      <p className="text-sm font-medium">{payload[0].name}: {payload[0].value}</p>
    </div>
  );
};

export default function CollectionStatsPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const fetchStats = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const res = await fetch(`/api/collections/${id}/stats`);
        if (!res.ok) throw new Error(res.status === 404 ? "Collection not found" : "Failed to load stats");
        const data = await res.json();
        if (!cancelled) setStats(data);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load stats");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchStats();
    return () => { cancelled = true; };
  }, [id]);

  if (loading) return <LoadingSpinner message="Loading collection stats..." />;

  if (error || !stats) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <header className="border-b border-border/40 bg-card/50">
          <div className="mx-auto max-w-7xl px-4 py-2"><BackButton /></div>
        </header>
        <main className="mx-auto max-w-7xl px-4 py-8 flex-1">
          <Card><CardContent className="flex items-center justify-center py-12">
            <p className="text-sm text-destructive">{error || "Stats not available"}</p>
          </CardContent></Card>
        </main>
        <Footer />
      </div>
    );
  }

  const completionPct = stats.totalTests > 0 ? Math.round((stats.completedTests / stats.totalTests) * 100) : 0;
  const accuracyPct = stats.totalQuestionsAnswered > 0
    ? Math.round((stats.totalCorrect / stats.totalQuestionsAnswered) * 100) : 0;
  const pieData = [
    { name: "Completed", value: stats.completedTests },
    { name: "Not Started", value: stats.notStartedTests },
  ];
  const trendData = stats.recentAttempts
    .filter((a) => a.isEvaluated && a.percentage !== null)
    .reverse()
    .map((a, i) => ({ name: `#${i + 1}`, score: a.percentage, test: a.presetName }));

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <header className="border-b border-border/40 bg-card/50">
        <div className="mx-auto max-w-7xl px-4 py-2">
          <div className="flex items-center gap-3">
            <BackButton />
            <div>
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                {stats.collectionName}
                <Badge variant="outline" className="ml-3 text-xs align-middle">Stats</Badge>
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Performance overview &amp; analytics
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 flex-1 w-full space-y-8">
        {/* KPI Cards */}
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          <StatCard icon={BarChart3} label="Total Tests" value={stats.totalTests}
            sub={`${stats.completedTests} completed`} />
          <StatCard icon={Target} label="Avg Score" value={stats.avgScore !== null ? `${stats.avgScore}%` : "—"}
            sub={stats.evaluatedAttempts > 0 ? `from ${stats.evaluatedAttempts} evaluated` : "No evaluations yet"} />
          <StatCard icon={TrendingUp} label="Highest Score" value={stats.highestScore !== null ? `${stats.highestScore}%` : "—"}
            color="text-green-500" />
          <StatCard icon={TrendingDown} label="Lowest Score" value={stats.lowestScore !== null ? `${stats.lowestScore}%` : "—"}
            color="text-red-400" />
        </div>

        {/* Charts Row */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Completion Pie */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Test Completion</CardTitle>
            </CardHeader>
            <CardContent>
              {stats.totalTests === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No tests yet</p>
              ) : (
                <div className="flex flex-col items-center">
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={80}
                        paddingAngle={3} dataKey="value" stroke="none">
                        {pieData.map((_, i) => (
                          <Cell key={i} fill={PIE_COLORS[i]} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="text-center -mt-2">
                    <p className="text-3xl font-bold">{completionPct}%</p>
                    <p className="text-xs text-muted-foreground">
                      {stats.completedTests} / {stats.totalTests} tests
                    </p>
                  </div>
                  <div className="flex gap-4 mt-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <span className="size-2.5 rounded-full" style={{ background: PIE_COLORS[0] }} />
                      Completed
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="size-2.5 rounded-full" style={{ background: PIE_COLORS[1] }} />
                      Not Started
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Score Distribution Bar */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Score Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              {stats.evaluatedAttempts === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No evaluated attempts</p>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={stats.scoreDistribution} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="range" className="text-[10px]" tick={{ fontSize: 10 }} />
                    <YAxis allowDecimals={false} className="text-[10px]" tick={{ fontSize: 10 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="count" name="Attempts" radius={[4, 4, 0, 0]}>
                      {stats.scoreDistribution.map((_, i) => (
                        <Cell key={i} fill={BAR_COLORS[i]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Performance Trend */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Recent Performance</CardTitle>
            </CardHeader>
            <CardContent>
              {trendData.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No performance data yet</p>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <AreaChart data={trendData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(142, 71%, 45%)" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="hsl(142, 71%, 45%)" stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="name" className="text-[10px]" tick={{ fontSize: 10 }} />
                    <YAxis domain={[0, 100]} className="text-[10px]" tick={{ fontSize: 10 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="score" name="Score (%)"
                      stroke="hsl(142, 71%, 45%)" strokeWidth={2}
                      fill="url(#scoreGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Accuracy + Time Row */}
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-5">
          <StatCard icon={CheckCircle} label="Correct" value={stats.totalCorrect}
            sub={`${accuracyPct}% accuracy`} color="text-green-500" />
          <StatCard icon={XCircle} label="Incorrect" value={stats.totalIncorrect}
            color="text-red-400" />
          <StatCard icon={MinusCircle} label="Unanswered" value={stats.totalUnanswered}
            color="text-yellow-500" />
          <StatCard icon={Clock} label="Avg Time" value={stats.avgTimeSeconds !== null ? formatTime(stats.avgTimeSeconds) : "—"}
            sub="per attempt" />
          <StatCard icon={Zap} label="Total Time" value={formatTime(stats.totalTimeSeconds)}
            sub={`${stats.totalAttempts} attempt${stats.totalAttempts !== 1 ? "s" : ""}`} />
        </div>

        {/* Chapter Breakdown */}
        {stats.chapterStats.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <BookOpen className="size-4" /> Chapter-wise Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="pb-2 pr-4 font-medium">Chapter</th>
                      <th className="pb-2 px-4 font-medium text-center">Tests</th>
                      <th className="pb-2 px-4 font-medium text-center">Progress</th>
                      <th className="pb-2 px-4 font-medium text-center">Attempts</th>
                      <th className="pb-2 px-4 font-medium text-center">Avg Score</th>
                      <th className="pb-2 pl-4 font-medium text-center">Best</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {stats.chapterStats.map((ch) => {
                      const prog = ch.totalTests > 0
                        ? Math.round((ch.completedTests / ch.totalTests) * 100) : 0;
                      return (
                        <tr key={ch.id} className="hover:bg-muted/30 transition-colors">
                          <td className="py-3 pr-4 font-medium">
                            Ch. {ch.chapterNumber}: {ch.name}
                          </td>
                          <td className="py-3 px-4 text-center">{ch.totalTests}</td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2 justify-center">
                              <div className="h-2 w-20 rounded-full bg-muted overflow-hidden">
                                <div className="h-full rounded-full bg-primary transition-all"
                                  style={{ width: `${prog}%` }} />
                              </div>
                              <span className="text-xs text-muted-foreground w-8">{prog}%</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-center">{ch.totalAttempts}</td>
                          <td className="py-3 px-4 text-center">
                            {ch.avgScore !== null ? (
                              <Badge variant={ch.avgScore >= 60 ? "default" : "secondary"}>
                                {ch.avgScore}%
                              </Badge>
                            ) : <span className="text-muted-foreground">—</span>}
                          </td>
                          <td className="py-3 pl-4 text-center">
                            {ch.highestScore !== null ? (
                              <span className="font-semibold text-green-500 flex items-center justify-center gap-1">
                                <Award className="size-3" /> {ch.highestScore}%
                              </span>
                            ) : <span className="text-muted-foreground">—</span>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
      <Footer />
    </div>
  );
}
