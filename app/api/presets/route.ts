import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    const {
      name,
      totalQuestions,
      startingQuestion,
      inputType,
      testMode,
      timeLimitMinutes,
      allowOvertime,
      isPublic,
      chapterId,
    } = body;


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
        isPublic: isPublic || false,
        userId: session.user.id,
        chapterId: chapterId || null,
      },
    });


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
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const presets = await prisma.testPreset.findMany({
      where: {
        OR: [{ userId: session.user.id }, { isPublic: true }],
      },
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { attempts: true },
        },
        chapter: {
          include: {
            collection: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
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

export async function DELETE(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Preset ID required" },
        { status: 400 }
      );
    }

    const preset = await prisma.testPreset.findUnique({
      where: { id: parseInt(id) },
    });

    if (!preset) {
      return NextResponse.json({ error: "Preset not found" }, { status: 404 });
    }

    if (preset.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.testPreset.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[v0] Error deleting preset:", error);
    return NextResponse.json(
      { error: "Failed to delete preset" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      id,
      name,
      isPublic,
      chapterId,
      testMode,
      timeLimitMinutes,
      allowOvertime,
    } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Preset ID required" },
        { status: 400 }
      );
    }

    const preset = await prisma.testPreset.findUnique({
      where: { id },
    });

    if (!preset) {
      return NextResponse.json({ error: "Preset not found" }, { status: 404 });
    }

    if (preset.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updatedPreset = await prisma.testPreset.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(isPublic !== undefined && { isPublic }),
        ...(chapterId !== undefined && { chapterId }),
        ...(testMode !== undefined && { testMode }),
        ...(timeLimitMinutes !== undefined && { timeLimitMinutes }),
        ...(allowOvertime !== undefined && { allowOvertime }),
      },
    });

    return NextResponse.json(updatedPreset);
  } catch (error) {
    console.error("[v0] Error updating preset:", error);
    return NextResponse.json(
      { error: "Failed to update preset" },
      { status: 500 }
    );
  }
}
