import { Suspense } from "react";
import { CreatePresetForm } from "@/components/create-preset-form";
import { BackButton } from "@/components/back-button";
import { Footer } from "@/components/footer";
import { LoadingSpinner } from "@/components/loading-spinner";
import { Navbar } from "@/components/navbar";

export default function CreatePresetPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <header className="border-b border-border/40 bg-card/50">
        <div className="mx-auto max-w-7xl px-4 py-2">
          <div className="flex items-center gap-3">
            <BackButton />
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                Create Test
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Set up a new test configuration
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-8 flex-1">
        <Suspense fallback={<LoadingSpinner message="Loading form..." />}>
          <CreatePresetForm />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
