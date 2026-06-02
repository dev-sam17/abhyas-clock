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
      try {
        const session = await authClient.getSession();
        if (!session?.data) {
          router.push("/");
          return;
        }
        setUser(session.data.user);
        setLoading(false);
      } catch (error) {
        console.error("Auth check failed:", error);
        router.push("/");
      }
    };

    if (typeof window !== "undefined") {
      checkAuth();
    }
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
        <div className="mx-auto max-w-7xl px-3 py-3 sm:px-4 sm:py-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
                Abhyas Clock
              </h1>
              <p className="mt-0.5 text-xs text-muted-foreground sm:mt-1 sm:text-sm">
                Practice offline, enter answers online, and track your progress
                with smart analytics.
              </p>
            </div>
            <div className="flex items-center justify-between gap-2 sm:gap-4">
              {user && (
                <div className="flex items-center gap-2">
                  {user.image && (
                    <img
                      src={user.image}
                      alt={user.name}
                      className="size-7 rounded-full sm:size-8"
                    />
                  )}
                  <div className="hidden flex-col md:flex">
                    <span className="text-sm font-medium">{user.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {user.email}
                    </span>
                  </div>
                </div>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={handleSignOut}
                className="text-xs sm:text-sm"
              >
                <LogOut className="mr-1 size-3 sm:mr-2 sm:size-4" />
                <span className="hidden sm:inline">Sign Out</span>
                <span className="sm:hidden">Out</span>
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
                  <CardTitle>Create Test</CardTitle>
                  <CardDescription>Set up test configuration</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-sm text-muted-foreground">
                Define tests with question count, time limits, and test
                modes for OMR answer entry.
              </p>
              <Link href="/create-preset">
                <Button className="w-full">Create New Test</Button>
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
                Select a test and use the online OMR sheet to enter
                answers from your offline exam.
              </p>
              <Link href="/presets">
                <Button className="w-full" variant="secondary">
                  Browse Tests
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
                  <CardDescription>Organize tests</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-sm text-muted-foreground">
                Create and manage collections to organize your tests into
                chapters and modules.
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
