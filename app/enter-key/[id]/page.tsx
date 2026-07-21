"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AnswerKeyForm } from "@/components/answer-key-form";
import { BackButton } from "@/components/back-button";
import { Footer } from "@/components/footer";
import { Navbar } from "@/components/navbar";

type Attempt = {
  id: number;
  isEvaluated: boolean;
  totalQuestions: number;
  preset: {
    name: string;
    startingQuestion: number;
    inputType: string;
    presetAnswerKey: { correctAnswers: unknown } | null;
  };
  answers: Array<{
    id: number;
    questionNumber: number;
    selectedAnswer: string | null;
    isCorrect: boolean | null;
  }>;
};

export default function EnterAnswerKeyPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params?.id;

  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchAttempt = async () => {
      if (!id) return;
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/attempts/${id}`);
        if (res.status === 404) {
          throw new Error("Attempt not found");
        }
        if (!res.ok) {
          throw new Error("Failed to load attempt");
        }
        const data = (await res.json()) as Attempt;
        if (cancelled) return;

        if (data.isEvaluated) {
          router.replace(`/results/${data.id}`);
          return;
        }

        const hasPresetKey = !!data.preset.presetAnswerKey;
        if (hasPresetKey) {
          const evalRes = await fetch(`/api/attempts/${id}/auto-evaluate`, {
            method: "POST",
          });
          if (!evalRes.ok) {
            throw new Error("Failed to auto-evaluate attempt");
          }
          router.replace(`/results/${data.id}`);
          return;
        }

        setAttempt(data);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to load attempt");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchAttempt();
    return () => {
      cancelled = true;
    };
  }, [id, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <header className="border-b border-border/40 bg-card/50">
          <div className="mx-auto max-w-7xl px-4 py-2">
            <div className="flex items-center gap-3">
              <BackButton />
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                  Enter Answer Key
                </h1>
              </div>
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-7xl px-4 py-8 flex-1">
          <p className="text-sm text-muted-foreground">Loading...</p>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !attempt) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <header className="border-b border-border/40 bg-card/50">
          <div className="mx-auto max-w-7xl px-4 py-2">
            <div className="flex items-center gap-3">
              <BackButton />
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                  Enter Answer Key
                </h1>
              </div>
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-7xl px-4 py-8 flex-1">
          <p className="text-sm text-destructive">
            {error || "Attempt not found"}
          </p>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <header className="border-b border-border/40 bg-card/50">
        <div className="mx-auto max-w-7xl px-4 py-2">
          <div className="flex items-center gap-3">
            <BackButton />
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                Enter Answer Key
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Enter the correct answers to evaluate your performance
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 flex-1">
        <AnswerKeyForm attempt={attempt} />
      </main>
      <Footer />
    </div>
  );
}
