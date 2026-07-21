"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { ChevronRight, Clock, Target } from "lucide-react";

type Attempt = {
  id: number;
  test_id: number;
  test_name: string;
  percentage: string;
  correct_answers: number;
  incorrect_answers: number;
  unanswered: number;
  total_questions: number;
  time_taken_seconds: number;
  completed_at: Date | null;
  collection_name?: string;
  chapter_name?: string;
};

export function TestBreakdown({ attempts }: { attempts: Attempt[] }) {
  const sortedAttempts = [...attempts].sort((a, b) => {
    const dateA = a.completed_at ? new Date(a.completed_at).getTime() : 0;
    const dateB = b.completed_at ? new Date(b.completed_at).getTime() : 0;
    return dateB - dateA; // Latest first
  });

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Attempts</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {sortedAttempts.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No recent attempts found.
            </p>
          ) : (
            sortedAttempts.map((attempt) => (
              <Link key={attempt.id} href={`/results/${attempt.id}`}>
                <div className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors group">
                  <div className="flex flex-col gap-1">
                    <span className="font-semibold">
                      {attempt.test_name}
                      {attempt.collection_name && attempt.chapter_name && (
                        <span className="ml-2 font-normal text-muted-foreground text-xs">
                          ({attempt.collection_name} / {attempt.chapter_name})
                        </span>
                      )}
                    </span>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Target className="size-3" />
                        {Number(attempt.percentage).toFixed(1)}% Score
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="size-3" />
                        {formatTime(attempt.time_taken_seconds)}
                      </span>
                      <span>
                        {new Date(attempt.completed_at || 0).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="size-4 text-muted-foreground opacity-50 group-hover:opacity-100 transition-opacity" />
                </div>
              </Link>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
