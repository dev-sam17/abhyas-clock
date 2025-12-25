"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BackButton } from "@/components/back-button";
import { HomeButton } from "@/components/home-button";
import { Footer } from "@/components/footer";
import Link from "next/link";
import { FileText, Clock, Timer, Globe, Lock } from "lucide-react";

type Collection = {
  id: number;
  name: string;
  description: string | null;
  isPublic: boolean;
  user: { name: string } | null;
  presets: Array<{
    id: number;
    name: string;
    testMode: string;
    isPublic: boolean;
    totalQuestions: number;
    timeLimitMinutes: number | null;
    allowOvertime: boolean;
    _count: { attempts: number };
    user: { id: string; name: string } | null;
  }>;
};

export default function CollectionDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const [collection, setCollection] = useState<Collection | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchCollection = async () => {
      if (!id) return;
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/collections/${id}`);
        if (res.status === 404) {
          throw new Error("Collection not found");
        }
        if (!res.ok) {
          throw new Error("Failed to load collection");
        }
        const data = (await res.json()) as Collection;
        if (!cancelled) {
          setCollection(data);
        }
      } catch (e) {
        if (!cancelled) {
          setError(
            e instanceof Error ? e.message : "Failed to load collection"
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchCollection();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <header className="border-b border-border bg-card">
          <div className="mx-auto max-w-7xl px-3 py-3 sm:px-4 sm:py-4">
            <div className="flex items-center gap-2">
              <BackButton />
              <HomeButton />
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-7xl px-4 py-8 flex-1">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-sm text-muted-foreground">Loading...</p>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !collection) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <header className="border-b border-border bg-card">
          <div className="mx-auto max-w-7xl px-3 py-3 sm:px-4 sm:py-4">
            <div className="flex items-center gap-2">
              <BackButton />
              <HomeButton />
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-7xl px-4 py-8 flex-1">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-sm text-destructive">
                {error || "Collection not found"}
              </p>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-3 py-3 sm:px-4 sm:py-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <div className="flex items-center gap-2">
              <BackButton />
              <HomeButton />
              <div>
                <h1 className="text-xl font-bold text-foreground sm:text-2xl">
                  {collection.name}
                </h1>
                <p className="text-xs text-muted-foreground sm:text-sm">
                  {collection.description ||
                    "View all presets in this collection"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={collection.isPublic ? "default" : "secondary"}>
                {collection.isPublic ? (
                  <>
                    <Globe className="mr-1 size-3" />
                    Public
                  </>
                ) : (
                  <>
                    <Lock className="mr-1 size-3" />
                    Private
                  </>
                )}
              </Badge>
              <Badge variant="outline">
                {collection.presets.length} preset
                {collection.presets.length !== 1 ? "s" : ""}
              </Badge>
            </div>
          </div>
          {collection.user && (
            <p className="text-sm text-muted-foreground">
              Created by {collection.user.name}
            </p>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 flex-1">
        {collection.presets.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="size-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                No presets in this collection yet
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Add presets to this collection from the presets page
              </p>
              <Link href="/presets">
                <Button>Browse Presets</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {collection.presets.map((preset) => (
              <Card
                key={preset.id}
                className="flex flex-col hover:shadow-xl hover:scale-[1.02] transition-all duration-300 border-2"
              >
                <CardHeader className="pb-3">
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-end gap-2">
                      <Badge
                        variant={
                          preset.testMode === "timer" ? "default" : "secondary"
                        }
                        className="px-2 py-1"
                      >
                        {preset.testMode === "timer" ? (
                          <>
                            <Timer className="mr-1 size-3" />
                            Timer
                          </>
                        ) : (
                          <>
                            <Clock className="mr-1 size-3" />
                            Stopwatch
                          </>
                        )}
                      </Badge>
                      {preset.isPublic ? (
                        <Badge variant="outline" className="gap-1 px-2 py-1">
                          <Globe className="size-3" />
                          Public
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="gap-1 px-2 py-1">
                          <Lock className="size-3" />
                          Private
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="text-xl font-bold leading-tight">
                      {preset.name}
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col justify-between pt-0">
                  <div className="text-sm space-y-1 mb-4">
                    <div className="flex items-center gap-2 flex-wrap">
                      <FileText className="size-3" />
                      <span>{preset.totalQuestions} questions</span>
                      {preset.testMode === "timer" &&
                        preset.timeLimitMinutes && (
                          <>
                            <span>•</span>
                            <Timer className="size-3" />
                            <span>{preset.timeLimitMinutes} min</span>
                          </>
                        )}
                    </div>
                    {preset.testMode === "timer" && preset.allowOvertime && (
                      <div className="text-xs text-muted-foreground">
                        ⏱️ Overtime allowed
                      </div>
                    )}
                    {preset.user && (
                      <div className="text-xs truncate">
                        By {preset.user.name}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-3 border-t">
                    <span className="text-xs text-muted-foreground">
                      {preset._count.attempts} attempt
                      {preset._count.attempts !== 1 ? "s" : ""}
                    </span>
                    <Link href={`/take-test/${preset.id}`}>
                      <Button size="sm">Take Test</Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
