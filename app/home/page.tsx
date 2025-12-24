"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  PlusCircle,
  FileText,
  BarChart3,
  History,
  LogOut,
  User,
  FolderOpen,
} from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LoadingSpinner } from "@/components/loading-spinner";
import { Footer } from "@/components/footer";

export default function HomePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const session = await authClient.getSession();
      if (!session?.data) {
        router.push("/");
        return;
      }
      setUser(session.data.user);
      setLoading(false);
    };
    checkAuth();
  }, [router]);

  const handleSignOut = async () => {
    await authClient.signOut();
    router.push("/");
  };

  if (loading) {
    return <LoadingSpinner message="Loading your dashboard..." />;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                Abhyas Clock
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Practice offline, enter answers online, and track your progress
                with smart analytics.
              </p>
            </div>
            <div className="flex items-center gap-4">
              {user && (
                <div className="flex items-center gap-2">
                  {user.image && (
                    <img
                      src={user.image}
                      alt={user.name}
                      className="size-8 rounded-full"
                    />
                  )}
                  <div className="hidden flex-col sm:flex">
                    <span className="text-sm font-medium">{user.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {user.email}
                    </span>
                  </div>
                </div>
              )}
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                <LogOut className="mr-2 size-4" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-12 flex-1">
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
                Define test presets with question count, time limits, and test
                modes for OMR answer entry.
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
                Select a test preset and use the online OMR sheet to enter
                answers from your offline exam.
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
                View detailed analytics with score trends, time analysis, and
                performance insights.
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
                  <FolderOpen className="size-6" />
                </div>
                <div>
                  <CardTitle>Collections</CardTitle>
                  <CardDescription>Organize presets</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-sm text-muted-foreground">
                Create and manage collections to organize your test presets by
                topic or subject.
              </p>
              <Link href="/collections">
                <Button className="w-full" variant="secondary">
                  Manage Collections
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
                Review all previous test attempts with detailed results and
                answer evaluations.
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
      <Footer />
    </div>
  );
}
