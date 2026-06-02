import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { cachePrefixes, invalidateByPrefix } from "@/lib/redis";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const presetId = Number.parseInt(id);
    if (Number.isNaN(presetId)) {
      return NextResponse.json({ error: "Invalid preset id" }, { status: 400 });
    }

    const preset = await prisma.testPreset.findUnique({
      where: { id: presetId },
      include: { presetAnswerKey: true },
    });

    if (!preset) {
      return NextResponse.json({ error: "Test not found" }, { status: 404 });
    }

    if (preset.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({
      correctAnswers: preset.presetAnswerKey?.correctAnswers ?? null,
    });
  } catch (error) {
    console.error("[v0] Error fetching preset answer key:", error);
    return NextResponse.json(
      { error: "Failed to fetch answer key" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const presetId = Number.parseInt(id);
    if (Number.isNaN(presetId)) {
      return NextResponse.json({ error: "Invalid preset id" }, { status: 400 });
    }

    const body = await request.json();
    const { correctAnswers } = body;

    if (!correctAnswers || !Array.isArray(correctAnswers)) {
      return NextResponse.json(
        { error: "correctAnswers must be an array" },
        { status: 400 }
      );
    }

    const preset = await prisma.testPreset.findUnique({
      where: { id: presetId },
    });

    if (!preset) {
      return NextResponse.json({ error: "Test not found" }, { status: 404 });
    }

    if (preset.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (correctAnswers.length !== preset.totalQuestions) {
      return NextResponse.json(
        {
          error: `Expected ${preset.totalQuestions} answers, received ${correctAnswers.length}`,
        },
        { status: 400 }
      );
    }

    await prisma.presetAnswerKey.upsert({
      where: { presetId },
      create: {
        presetId,
        correctAnswers,
      },
      update: {
        correctAnswers,
        updatedAt: new Date(),
      },
    });

    // The answer key is consumed during attempt auto-evaluation; clear preset
    // and collection caches that may embed preset data.
    await invalidateByPrefix(cachePrefixes.presets, cachePrefixes.collection);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[v0] Error saving preset answer key:", error);
    return NextResponse.json(
      { error: "Failed to save answer key" },
      { status: 500 }
    );
  }
}
