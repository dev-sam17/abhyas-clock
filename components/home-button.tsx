"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";

export function HomeButton() {
  return (
    <Link href="/home">
      <Button variant="ghost" size="icon" title="Go to home">
        <Home className="size-5" />
      </Button>
    </Link>
  );
}
