"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { PresetsList } from "@/components/presets-list";
import { Footer } from "@/components/footer";
import { Navbar } from "@/components/navbar";

export default function PresetsPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <header className="border-b border-border/40 bg-card/50">
        <div className="mx-auto max-w-7xl px-4 py-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Tests
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Choose a test to start practicing or set up a new one
            </p>
          </div>
          <Link href="/create-preset" className="self-start sm:self-auto">
            <Button size="sm" className="gap-2">
              <PlusCircle className="size-4" />
              Create Test
            </Button>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-9xl px-4 py-8 flex-1">
        <PresetsList />
      </main>
      <Footer />
    </div>
  );
}
