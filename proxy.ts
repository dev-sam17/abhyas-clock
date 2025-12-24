import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

export async function proxy(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/home",
    "/presets",
    "/collections",
    "/results",
    "/analytics",
    "/create-preset",
    "/collections/:id",
    "/presets/:id",
    "/results/:id",
    "/analytics/:id",
  ],
};
