import { CreatePresetForm } from "@/components/create-preset-form";
import { BackButton } from "@/components/back-button";
import { HomeButton } from "@/components/home-button";
import { Footer } from "@/components/footer";

export default function CreatePresetPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 py-6">
          <div className="flex items-center gap-2">
            <BackButton />
            <HomeButton />
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Create Test Preset
              </h1>
              <p className="text-sm text-muted-foreground">
                Set up a test configuration for OMR answer entry
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-8 flex-1">
        <CreatePresetForm />
      </main>
      <Footer />
    </div>
  );
}
