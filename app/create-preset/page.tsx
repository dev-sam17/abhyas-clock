import { CreatePresetForm } from "@/components/create-preset-form"

export default function CreatePresetPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 py-6">
          <h1 className="text-3xl font-bold text-foreground">Create Test Preset</h1>
          <p className="mt-1 text-sm text-muted-foreground">Set up a test configuration for OMR answer entry</p>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-8">
        <CreatePresetForm />
      </main>
    </div>
  )
}
