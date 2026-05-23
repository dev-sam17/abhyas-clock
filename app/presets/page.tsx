"use client";

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
        <div className="mx-auto max-w-7xl px-3 py-3 sm:px-4 sm:py-4">
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <div className="flex items-center gap-2">
              <BackButton />
              <HomeButton />
            </div>
            <Link href="/create-preset">
              <Button size="sm" className="text-xs sm:text-sm">
                <PlusCircle className="mr-1 size-3 sm:mr-2 sm:size-4" />
                <span className="hidden sm:inline">Create Preset</span>
                <span className="sm:hidden">Create</span>
              </Button>
            </Link>
          </div>
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
            Test Presets
          </h1>
          <p className="mt-0.5 text-xs text-muted-foreground sm:mt-1 sm:text-sm">
            Choose a test preset to start practicing
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 flex-1">
        <PresetsList />
      </main>
      <Footer />
    </div>
  );
}
