import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { prisma } from "@/lib/prisma"
import { Clock, FileText, PlusCircle, Timer } from "lucide-react"

export default async function PresetsPage() {
  const presets = await prisma.testPreset.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: { attempts: true },
      },
    },
  })

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Test Presets</h1>
              <p className="mt-1 text-sm text-muted-foreground">Manage your test configurations</p>
            </div>
            <Link href="/create-preset">
              <Button>
                <PlusCircle className="mr-2 size-4" />
                Create Preset
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8">
        {presets.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="size-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No test presets yet</h3>
              <p className="text-sm text-muted-foreground mb-4">Create your first test preset to get started</p>
              <Link href="/create-preset">
                <Button>
                  <PlusCircle className="mr-2 size-4" />
                  Create Preset
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {presets.map((preset) => (
              <Card key={preset.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg leading-relaxed">{preset.name}</CardTitle>
                    <Badge variant={preset.testMode === "timer" ? "default" : "secondary"}>
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
                  </div>
                  <CardDescription>
                    {preset.totalQuestions} questions
                    {preset.testMode === "timer" && preset.timeLimitMinutes && (
                      <> • {preset.timeLimitMinutes} minutes</>
                    )}
                    {preset.testMode === "timer" && preset.allowOvertime && <> • Overtime allowed</>}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      {preset._count.attempts} attempt{preset._count.attempts !== 1 ? "s" : ""}
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
    </div>
  )
}
