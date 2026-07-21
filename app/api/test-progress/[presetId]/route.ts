import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redis } from "@/lib/redis";

const testProgressKey = (userId: string, presetId: number) =>
  `test-progress:${userId}:${presetId}`;

/**
 * GET /api/test-progress/[presetId]
 * Fetch full state for a single in-progress test.
 * Used when loading the OMR interface on a new device.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ presetId: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { presetId: presetIdStr } = await params;
    const presetId = Number.parseInt(presetIdStr);

    if (Number.isNaN(presetId)) {
      return NextResponse.json(
        { error: "Invalid preset id" },
        { status: 400 }
      );
    }

    const key = testProgressKey(session.user.id, presetId);
    const data = await redis.get(key);

    if (!data) {
      return NextResponse.json(null);
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("[test-progress] GET single error:", error);
    return NextResponse.json(
      { error: "Failed to fetch test progress" },
      { status: 500 }
    );
  }
}
