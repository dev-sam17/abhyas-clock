import { CreatePresetForm } from "@/components/create-preset-form";
import { BackButton } from "@/components/back-button";
import { HomeButton } from "@/components/home-button";
import { Footer } from "@/components/footer";

export default function CreatePresetPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-3 py-3 sm:px-4 sm:py-4">
          <div className="flex items-center gap-2 mb-2 sm:mb-3">
            <BackButton />
            <HomeButton />
          </div>
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
            Create Test Preset
          </h1>
          <p className="mt-0.5 text-xs text-muted-foreground sm:mt-1 sm:text-sm">
            Set up a new test configuration
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-8 flex-1">
        <CreatePresetForm />
      </main>
      <Footer />
    </div>
  );
}
