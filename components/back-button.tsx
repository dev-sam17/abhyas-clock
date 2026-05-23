"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export function BackButton() {
  const router = useRouter();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => router.back()}
      title="Go back"
    >
      <ArrowLeft className="size-5" />
    </Button>
  );
}
