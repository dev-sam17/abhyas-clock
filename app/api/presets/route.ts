import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      name,
      totalQuestions,
      startingQuestion,
      inputType,
      testMode,
      timeLimitMinutes,
      allowOvertime,
    } = body;

    console.log("[v0] Creating preset with data:", body);

    // Validation
    if (!name || !totalQuestions || !testMode || !inputType) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (totalQuestions < 1) {
      return NextResponse.json(
        { error: "Total questions must be at least 1" },
        { status: 400 }
      );
    }

    if (startingQuestion === undefined || startingQuestion < 1) {
      return NextResponse.json(
        { error: "Starting question number must be at least 1" },
        { status: 400 }
      );
    }

    if (inputType !== "radio" && inputType !== "text") {
      return NextResponse.json(
        { error: "Invalid input type" },
        { status: 400 }
      );
    }

    if (testMode !== "timer" && testMode !== "stopwatch") {
      return NextResponse.json({ error: "Invalid test mode" }, { status: 400 });
    }

    if (testMode === "timer" && (!timeLimitMinutes || timeLimitMinutes < 1)) {
      return NextResponse.json(
        { error: "Time limit is required for timer-based tests" },
        { status: 400 }
      );
    }

    const preset = await prisma.testPreset.create({
      data: {
        name,
        totalQuestions,
        startingQuestion,
        inputType,
        testMode,
        timeLimitMinutes: testMode === "timer" ? timeLimitMinutes : null,
        allowOvertime: testMode === "timer" ? allowOvertime : false,
      },
    });

    console.log("[v0] Preset created successfully:", preset);

    return NextResponse.json(preset, { status: 201 });
  } catch (error) {
    console.error("[v0] Error creating preset:", error);
    console.error(
      "[v0] Error details:",
      error instanceof Error ? error.message : "Unknown error"
    );
    return NextResponse.json(
      { error: "Failed to create test preset" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const presets = await prisma.testPreset.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { attempts: true },
        },
      },
    });

    return NextResponse.json(presets);
  } catch (error) {
    console.error("[v0] Error fetching presets:", error);
    return NextResponse.json(
      { error: "Failed to fetch test presets" },
      { status: 500 }
    );
  }
}
