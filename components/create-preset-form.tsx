"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export function CreatePresetForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [testName, setTestName] = useState("");
  const [totalQuestions, setTotalQuestions] = useState("");
  const [startingQuestion, setStartingQuestion] = useState("1");
  const [inputType, setInputType] = useState<"radio" | "text">("radio");
  const [testMode, setTestMode] = useState<"timer" | "stopwatch">("timer");
  const [timeLimitMinutes, setTimeLimitMinutes] = useState("");
  const [allowOvertime, setAllowOvertime] = useState(false);
  const [isPublic, setIsPublic] = useState(false);
  const [collectionId, setCollectionId] = useState<string>("none");
  const [chapterId, setChapterId] = useState<string>("none");
  const [collections, setCollections] = useState<any[]>([]);

  useEffect(() => {
    const fetchCollections = async () => {
      try {
        const response = await fetch("/api/collections");
        if (response.ok) {
          const data = await response.json();
          setCollections(data);
        }
      } catch (error) {
        console.error("Error fetching collections:", error);
      }
    };
    fetchCollections();
  }, []);

  const selectedCollection = collections.find((c) => c.id.toString() === collectionId);

  const calculateEndingQuestion = () => {
    const start = Number.parseInt(startingQuestion);
    const total = Number.parseInt(totalQuestions);
    if (isNaN(start) || isNaN(total)) return null;
    return start + total - 1;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!testName.trim()) {
      toast.error("Please enter a test name");
      return;
    }

    const questions = Number.parseInt(totalQuestions);
    if (isNaN(questions) || questions < 1) {
      toast.error("Please enter a valid number of questions (minimum 1)");
      return;
    }

    const startingQ = Number.parseInt(startingQuestion);
    if (isNaN(startingQ) || startingQ < 1) {
      toast.error("Please enter a valid starting question number (minimum 1)");
      return;
    }

    if (testMode === "timer") {
      const timeLimit = Number.parseInt(timeLimitMinutes);
      if (isNaN(timeLimit) || timeLimit < 1) {
        toast.error("Please enter a valid time limit in minutes");
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/presets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: testName.trim(),
          totalQuestions: questions,
          startingQuestion: startingQ,
          inputType,
          testMode,
          timeLimitMinutes:
            testMode === "timer" ? Number.parseInt(timeLimitMinutes) : null,
          allowOvertime: testMode === "timer" ? allowOvertime : false,
          isPublic,
          chapterId: chapterId && chapterId !== "none" ? parseInt(chapterId) : null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create preset");
      }

      const data = await response.json();
      toast.success("Test created successfully!");
      router.push("/presets");
    } catch (error) {
      console.error("[v0] Error creating preset:", error);
      toast.error("Failed to create test. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const endingQuestion = calculateEndingQuestion();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Test Configuration</CardTitle>
        <CardDescription>
          Create a test that defines the structure and timing for your
          OMR answer entry
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Test Name */}
          <div className="space-y-2">
            <Label htmlFor="testName">Test Name</Label>
            <Input
              id="testName"
              placeholder="e.g., JEE Main Mock Test 1"
              value={testName}
              onChange={(e) => setTestName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-4 rounded-lg border border-border bg-muted/50 p-4">
            <div className="space-y-2">
              <Label htmlFor="startingQuestion">Starting Question Number</Label>
              <Input
                id="startingQuestion"
                type="number"
                min="1"
                placeholder="e.g., 21"
                value={startingQuestion}
                onChange={(e) => setStartingQuestion(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">
                The first question number in your test
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="totalQuestions">Number of Questions</Label>
              <Input
                id="totalQuestions"
                type="number"
                min="1"
                placeholder="e.g., 50"
                value={totalQuestions}
                onChange={(e) => setTotalQuestions(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">
                Total number of questions in the test
              </p>
            </div>

            {endingQuestion && (
              <div className="rounded-lg bg-primary/10 p-3 border border-primary/20">
                <p className="text-sm font-medium">
                  Questions will be numbered from{" "}
                  <span className="font-bold text-primary">
                    {startingQuestion}
                  </span>{" "}
                  to{" "}
                  <span className="font-bold text-primary">
                    {endingQuestion}
                  </span>
                </p>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <Label>Answer Input Type</Label>
            <RadioGroup
              value={inputType}
              onValueChange={(value) => setInputType(value as "radio" | "text")}
            >
              <div className="flex items-start space-x-3 rounded-lg border border-border p-4">
                <RadioGroupItem value="radio" id="radio" className="mt-1" />
                <div className="flex-1">
                  <Label htmlFor="radio" className="font-medium cursor-pointer">
                    Multiple Choice (A/B/C/D/E)
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Radio button options - Students select from A, B, C, D, or E
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3 rounded-lg border border-border p-4">
                <RadioGroupItem value="text" id="text" className="mt-1" />
                <div className="flex-1">
                  <Label htmlFor="text" className="font-medium cursor-pointer">
                    Text Input
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Free text input - Students type their answers for each
                    question
                  </p>
                </div>
              </div>
            </RadioGroup>
          </div>

          {/* Test Mode */}
          <div className="space-y-3">
            <Label>Test Mode</Label>
            <RadioGroup
              value={testMode}
              onValueChange={(value) =>
                setTestMode(value as "timer" | "stopwatch")
              }
            >
              <div className="flex items-start space-x-3 rounded-lg border border-border p-4">
                <RadioGroupItem value="timer" id="timer" className="mt-1" />
                <div className="flex-1">
                  <Label htmlFor="timer" className="font-medium cursor-pointer">
                    Timer-Based Test
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Countdown timer with optional overtime tracking. Simulates
                    exam-like pressure.
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3 rounded-lg border border-border p-4">
                <RadioGroupItem
                  value="stopwatch"
                  id="stopwatch"
                  className="mt-1"
                />
                <div className="flex-1">
                  <Label
                    htmlFor="stopwatch"
                    className="font-medium cursor-pointer"
                  >
                    Stopwatch-Based Test
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    No time limit. Total time is tracked until the user ends the
                    test.
                  </p>
                </div>
              </div>
            </RadioGroup>
          </div>

          {/* Timer Settings - Only shown for timer mode */}
          {testMode === "timer" && (
            <div className="space-y-4 rounded-lg border border-border bg-muted/50 p-4">
              <div className="space-y-2">
                <Label htmlFor="timeLimitMinutes">Time Limit (minutes)</Label>
                <Input
                  id="timeLimitMinutes"
                  type="number"
                  min="1"
                  placeholder="e.g., 180"
                  value={timeLimitMinutes}
                  onChange={(e) => setTimeLimitMinutes(e.target.value)}
                  required={testMode === "timer"}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="allowOvertime">Allow Overtime</Label>
                  <p className="text-sm text-muted-foreground">
                    Continue tracking time after the limit expires
                  </p>
                </div>
                <Switch
                  id="allowOvertime"
                  checked={allowOvertime}
                  onCheckedChange={setAllowOvertime}
                />
              </div>
            </div>
          )}

          {/* Public/Private Toggle */}
          <div className="flex items-center justify-between rounded-lg border border-border bg-muted/50 p-4">
            <div className="space-y-0.5">
              <Label htmlFor="isPublic">Public Test</Label>
              <p className="text-sm text-muted-foreground">
                Make this test available for all users to attempt
              </p>
            </div>
            <Switch
              id="isPublic"
              checked={isPublic}
              onCheckedChange={setIsPublic}
            />
          </div>

          {/* Collection and Chapter Selection */}
          <div className="space-y-4 rounded-lg border border-border bg-muted/50 p-4">
            <div className="space-y-2">
              <Label htmlFor="collection">Collection (Book)</Label>
              <Select
                value={collectionId}
                onValueChange={(val) => {
                  setCollectionId(val);
                  setChapterId("none"); // Reset chapter when collection changes
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a collection" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Collection</SelectItem>
                  {collections.map((collection) => (
                    <SelectItem
                      key={collection.id}
                      value={collection.id.toString()}
                    >
                      {collection.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                First select a collection
              </p>
            </div>

            {collectionId !== "none" && (
              <div className="space-y-2">
                <Label htmlFor="chapter">Chapter (Module)</Label>
                <Select value={chapterId} onValueChange={setChapterId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a chapter" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Chapter</SelectItem>
                    {selectedCollection?.chapters?.map((chapter: any) => (
                      <SelectItem
                        key={chapter.id}
                        value={chapter.id.toString()}
                      >
                        Ch. {chapter.chapterNumber}: {chapter.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Then select which chapter to assign this test to
                </p>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Creating Test...
              </>
            ) : (
              "Create Test"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
