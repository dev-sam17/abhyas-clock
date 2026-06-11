import { notFound, redirect } from "next/navigation";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { PresetAnswerKeyForm } from "@/components/preset-answer-key-form";
import { BackButton } from "@/components/back-button";
import { Footer } from "@/components/footer";
import { Navbar } from "@/components/navbar";

export default async function PresetAnswerKeyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    redirect("/");
  }

  const presetId = Number.parseInt((await params).id);
  if (Number.isNaN(presetId)) {
    notFound();
  }

  const preset = await prisma.testPreset.findUnique({
    where: { id: presetId },
    include: { presetAnswerKey: true },
  });

  if (!preset) {
    notFound();
  }

  if (preset.userId !== session.user.id) {
    redirect("/presets");
  }

  const existingAnswers =
    (preset.presetAnswerKey?.correctAnswers as (string | null)[] | undefined) ??
    null;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <header className="border-b border-border/40 bg-card/50">
        <div className="mx-auto max-w-7xl px-4 py-6">
          <div className="flex items-center gap-3">
            <BackButton />
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                Add Answer Key
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Set the correct answers for &quot;{preset.name}&quot; so
                attempts can be evaluated automatically
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 flex-1">
        <PresetAnswerKeyForm
          presetId={preset.id}
          presetName={preset.name}
          totalQuestions={preset.totalQuestions}
          startingQuestion={preset.startingQuestion}
          inputType={preset.inputType}
          existingAnswers={existingAnswers}
        />
      </main>
      <Footer />
    </div>
  );
}
