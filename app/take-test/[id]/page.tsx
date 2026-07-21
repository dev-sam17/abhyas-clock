import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { OMRInterface } from "@/components/omr-interface";

export default async function TakeTestPage({
  params,
}: {
  params: { id: string };
}) {
  const presetId = Number.parseInt((await params).id);


  if (isNaN(presetId)) {
    notFound();
  }

  const preset = await prisma.testPreset.findUnique({
    where: { id: presetId },
    include: {
      chapter: {
        include: {
          collection: true,
        },
      },
    },
  });

  if (!preset) {
    notFound();
  }

  return <OMRInterface preset={preset} />;
}
