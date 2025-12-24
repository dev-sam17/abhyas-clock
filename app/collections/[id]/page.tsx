import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { BackButton } from "@/components/back-button";
import { HomeButton } from "@/components/home-button";
import { Footer } from "@/components/footer";
import { notFound } from "next/navigation";
import Link from "next/link";
import { FileText, Clock, Timer, Globe, Lock } from "lucide-react";

async function getCollection(id: string) {
  const collection = await prisma.collection.findUnique({
    where: { id: parseInt(id) },
    include: {
      presets: {
        orderBy: { createdAt: "desc" },
        include: {
          _count: {
            select: { attempts: true },
          },
          user: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
      user: {
        select: {
          name: true,
        },
      },
    },
  });

  if (!collection) {
    notFound();
  }

  return collection;
}

export default async function CollectionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const collection = await getCollection(id);

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
                  {collection.name}
                </h1>
                <p className="text-sm text-muted-foreground">
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
