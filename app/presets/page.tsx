import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { PresetsList } from "@/components/presets-list";
import { BackButton } from "@/components/back-button";
import { HomeButton } from "@/components/home-button";
import { Footer } from "@/components/footer";

export default function PresetsPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BackButton />
              <HomeButton />
              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  Test Presets
                </h1>
                <p className="text-sm text-muted-foreground">
                  Manage your test configurations
                </p>
              </div>
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

      <main className="mx-auto max-w-7xl px-4 py-8 flex-1">
        <PresetsList />
      </main>
      <Footer />
    </div>
  );
}
