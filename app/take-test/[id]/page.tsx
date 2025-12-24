import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { OMRInterface } from "@/components/omr-interface";
import { Footer } from "@/components/footer";

export default async function TakeTestPage({
  params,
}: {
  params: { id: string };
}) {
  const presetId = Number.parseInt((await params).id);

  console.log("Preset ID:", presetId);

  if (isNaN(presetId)) {
    notFound();
  }

  const preset = await prisma.testPreset.findUnique({
    where: { id: presetId },
  });

  if (!preset) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <OMRInterface preset={preset} />
      <Footer />
    </div>
  );
}
