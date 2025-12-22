import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PlusCircle, FileText, BarChart3, History } from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 py-6">
          <h1 className="text-3xl font-bold text-foreground">Online OMR Sheet System</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Practice offline, enter answers online, and track your progress with smart analytics
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-12">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="transition-shadow hover:shadow-lg">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex size-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <PlusCircle className="size-6" />
                </div>
                <div>
                  <CardTitle>Create Preset</CardTitle>
                  <CardDescription>Set up test configuration</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-sm text-muted-foreground">
                Define test presets with question count, time limits, and test modes for OMR answer entry.
              </p>
              <Link href="/create-preset">
                <Button className="w-full">Create New Preset</Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="transition-shadow hover:shadow-lg">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex size-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <FileText className="size-6" />
                </div>
                <div>
                  <CardTitle>Take Test</CardTitle>
                  <CardDescription>Enter your answers online</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-sm text-muted-foreground">
                Select a test preset and use the online OMR sheet to enter answers from your offline exam.
              </p>
              <Link href="/presets">
                <Button className="w-full" variant="secondary">
                  Browse Presets
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="transition-shadow hover:shadow-lg">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex size-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <BarChart3 className="size-6" />
                </div>
                <div>
                  <CardTitle>Analytics</CardTitle>
                  <CardDescription>Track your performance</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-sm text-muted-foreground">
                View detailed analytics with score trends, time analysis, and performance insights.
              </p>
              <Link href="/analytics">
                <Button className="w-full" variant="secondary">
                  View Analytics
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="transition-shadow hover:shadow-lg">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex size-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <History className="size-6" />
                </div>
                <div>
                  <CardTitle>History</CardTitle>
                  <CardDescription>View past attempts</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-sm text-muted-foreground">
                Review all previous test attempts with detailed results and answer evaluations.
              </p>
              <Link href="/history">
                <Button className="w-full" variant="secondary">
                  View History
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
