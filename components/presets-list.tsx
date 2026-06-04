"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/loading-spinner";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Clock,
  FileText,
  PlusCircle,
  Timer,
  Pencil,
  Trash2,
  Globe,
  Lock,
  FolderOpen,
  BookOpen,
  KeyRound,
} from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function PresetsList() {
  const [presets, setPresets] = useState<any[]>([]);
  const [collections, setCollections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [editPreset, setEditPreset] = useState<any | null>(null);
  const [editName, setEditName] = useState("");
  const [editIsPublic, setEditIsPublic] = useState(false);
  const [editCollectionId, setEditCollectionId] = useState<string>("none");
  const [editChapterId, setEditChapterId] = useState<string>("none");
  const [editTestMode, setEditTestMode] = useState<string>("timer");
  const [editTimeLimitMinutes, setEditTimeLimitMinutes] = useState<number>(60);
  const [editAllowOvertime, setEditAllowOvertime] = useState(false);
  const [userId, setUserId] = useState<string>("");
  const [inProgressTests, setInProgressTests] = useState<Record<number, boolean>>({});

  useEffect(() => {
    fetchPresets();
    fetchCollections();
    fetchUser();
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const inProgress: Record<number, boolean> = {};
      presets.forEach((preset) => {
        if (localStorage.getItem(`test-${preset.id}`)) {
          inProgress[preset.id] = true;
        }
      });
      setInProgressTests(inProgress);
    }
  }, [presets]);

  const handleDiscardProgress = (presetId: number) => {
    if (confirm("Are you sure you want to discard your saved progress for this test? This cannot be undone.")) {
      localStorage.removeItem(`test-${presetId}`);
      setInProgressTests((prev) => {
        const next = { ...prev };
        delete next[presetId];
        return next;
      });
      toast.success("Progress reset successfully");
    }
  };

  const fetchUser = async () => {
    try {
      const session = await authClient.getSession();
      if (session?.data?.user) {
        setUserId(session.data.user.id);
      }
    } catch (error) {
      console.error("Error fetching user:", error);
    }
  };

  const fetchPresets = async () => {
    try {
      const response = await fetch("/api/presets");
      if (response.ok) {
        const data = await response.json();
        setPresets(data);
      }
    } catch (error) {
      console.error("Error fetching presets:", error);
      toast.error("Failed to load tests");
    } finally {
      setLoading(false);
    }
  };

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

  const handleDelete = async (id: number) => {
    try {
      const response = await fetch(`/api/presets?id=${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Test deleted successfully");
        setPresets(presets.filter((p) => p.id !== id));
      } else {
        toast.error("Failed to delete test");
      }
    } catch (error) {
      console.error("Error deleting preset:", error);
      toast.error("Failed to delete test");
    } finally {
      setDeleteId(null);
    }
  };

  const handleEdit = (preset: any) => {
    setEditPreset(preset);
    setEditName(preset.name);
    setEditIsPublic(preset.isPublic);
    setEditCollectionId(preset.chapter?.collectionId?.toString() || "none");
    setEditChapterId(preset.chapterId?.toString() || "none");
    setEditTestMode(preset.testMode || "timer");
    setEditTimeLimitMinutes(preset.timeLimitMinutes || 60);
    setEditAllowOvertime(preset.allowOvertime || false);
  };

  const handleSaveEdit = async () => {
    if (!editPreset) return;

    try {
      const response = await fetch("/api/presets", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editPreset.id,
          name: editName,
          isPublic: editIsPublic,
          chapterId:
            editChapterId && editChapterId !== "none"
              ? parseInt(editChapterId)
              : null,
          testMode: editTestMode,
          timeLimitMinutes:
            editTestMode === "timer" ? editTimeLimitMinutes : null,
          allowOvertime: editTestMode === "timer" ? editAllowOvertime : false,
        }),
      });

      if (response.ok) {
        toast.success("Test updated successfully");
        fetchPresets();
        setEditPreset(null);
      } else {
        toast.error("Failed to update test");
      }
    } catch (error) {
      console.error("Error updating preset:", error);
      toast.error("Failed to update test");
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading tests..." />;
  }

  return (
    <>
      {presets.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="size-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No tests yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Create your first test to get started
            </p>
            <Link href="/create-preset">
              <Button>
                <PlusCircle className="mr-2 size-4" />
                Create Test
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
          {presets.map((preset) => {
            const isOwner = preset.userId === userId;
            return (
              <Card
                key={preset.id}
                className="flex flex-col hover:shadow-xl hover:scale-[1.02] transition-all duration-300 border-2"
              >
                <CardHeader className="pb-3">
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-end gap-2 flex-wrap">
                      {inProgressTests[preset.id] && (
                        <Badge
                          variant="default"
                          className="bg-amber-500 hover:bg-amber-600 animate-pulse text-white gap-1 px-2 py-1"
                        >
                          In Progress
                        </Badge>
                      )}
                      <Badge
                        variant={
                          preset.testMode === "timer" ? "default" : "secondary"
                        }
                        className="px-2 py-1"
                      >
                        {preset.testMode === "timer" ? (
                          <>
                            <Timer className="mr-1 size-3" />
                            Timer
                          </>
                        ) : (
                          <>
                            <Clock className="mr-1 size-3" />
                            Stopwatch
                          </>
                        )}
                      </Badge>
                      {preset.isPublic ? (
                        <Badge variant="outline" className="gap-1 px-2 py-1">
                          <Globe className="size-3" />
                          Public
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="gap-1 px-2 py-1">
                          <Lock className="size-3" />
                          Private
                        </Badge>
                      )}
                      {isOwner && !preset.presetAnswerKey && (
                        <Badge
                          variant="outline"
                          className="gap-1 px-2 py-1 border-amber-500/50 text-amber-600 dark:text-amber-400"
                        >
                          <KeyRound className="size-3" />
                          No key
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="text-xl font-bold leading-tight">
                      {preset.name}
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col justify-between pt-0">
                  <CardDescription className="text-sm space-y-1 mb-4">
                    <div className="flex items-center gap-2 flex-wrap">
                      <FileText className="size-3" />
                      <span>{preset.totalQuestions} questions</span>
                      {preset.testMode === "timer" &&
                        preset.timeLimitMinutes && (
                          <>
                            <span>•</span>
                            <Timer className="size-3" />
                            <span>{preset.timeLimitMinutes} min</span>
                          </>
                        )}
                    </div>
                    {preset.testMode === "timer" && preset.allowOvertime && (
                      <div className="text-xs text-muted-foreground">
                        ⏱️ Overtime allowed
                      </div>
                    )}
                    {preset.chapter && preset.chapter.collection && (
                      <div className="text-xs font-medium truncate flex flex-wrap gap-1">
                        <FolderOpen className="size-3" /> {preset.chapter.collection.name}
                        <span className="text-muted-foreground">/</span>
                        <BookOpen className="size-3" /> Ch. {preset.chapter.chapterNumber}: {preset.chapter.name}
                      </div>
                    )}
                    {!isOwner && preset.user && (
                      <div className="text-xs truncate">
                        By {preset.user.name}
                      </div>
                    )}
                  </CardDescription>

                  <div className="flex items-center justify-between gap-2 pt-3 border-t">
                    <span className="text-xs text-muted-foreground">
                      {preset._count.attempts} attempt
                      {preset._count.attempts !== 1 ? "s" : ""}
                    </span>
                    <div className="flex gap-1">
                      {isOwner && (
                        <>
                          <Link href={`/preset-answer-key/${preset.id}`}>
                            <Button
                              size="sm"
                              variant="ghost"
                              className={cn(
                                "h-8 w-8 p-0",
                                !preset.presetAnswerKey &&
                                  "text-amber-600 dark:text-amber-400"
                              )}
                              title={
                                preset.presetAnswerKey
                                  ? "Edit answer key"
                                  : "Add answer key"
                              }
                            >
                              <KeyRound className="size-4" />
                            </Button>
                          </Link>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEdit(preset)}
                            className="h-8 w-8 p-0"
                          >
                            <Pencil className="size-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setDeleteId(preset.id)}
                            className="h-8 w-8 p-0"
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </>
                      )}
                      {inProgressTests[preset.id] ? (
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-destructive border-destructive hover:bg-destructive/10 text-xs px-2 h-9"
                            onClick={() => handleDiscardProgress(preset.id)}
                            title="Discard progress and start fresh"
                          >
                            Reset
                          </Button>
                          <Link href={`/take-test/${preset.id}`}>
                            <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-white text-xs px-3 h-9">
                              Resume
                            </Button>
                          </Link>
                        </div>
                      ) : (
                        <Link href={`/take-test/${preset.id}`}>
                          <Button size="sm">Take Test</Button>
                        </Link>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <AlertDialog
        open={deleteId !== null}
        onOpenChange={() => setDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Test</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this test? This action cannot be
              undone. All attempts associated with this test will also be
              deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && handleDelete(deleteId)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog
        open={editPreset !== null}
        onOpenChange={() => setEditPreset(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Test</DialogTitle>
            <DialogDescription>Update test details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Test Name</Label>
              <Input
                id="edit-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-test-mode">Test Mode</Label>
              <Select value={editTestMode} onValueChange={setEditTestMode}>
                <SelectTrigger id="edit-test-mode">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="timer">Timer</SelectItem>
                  <SelectItem value="stopwatch">Stopwatch</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {editTestMode === "timer" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="edit-time-limit">Time Limit (minutes)</Label>
                  <Input
                    id="edit-time-limit"
                    type="number"
                    min="1"
                    value={editTimeLimitMinutes}
                    onChange={(e) =>
                      setEditTimeLimitMinutes(parseInt(e.target.value) || 60)
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="edit-allow-overtime">Allow Overtime</Label>
                    <p className="text-sm text-muted-foreground">
                      Allow test to continue after time limit
                    </p>
                  </div>
                  <Switch
                    id="edit-allow-overtime"
                    checked={editAllowOvertime}
                    onCheckedChange={setEditAllowOvertime}
                  />
                </div>
              </>
            )}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="edit-public">Public Test</Label>
                <p className="text-sm text-muted-foreground">
                  Make this test available to all users
                </p>
              </div>
              <Switch
                id="edit-public"
                checked={editIsPublic}
                onCheckedChange={setEditIsPublic}
              />
            </div>
            {/* Collection and Chapter Selection */}
            <div className="space-y-4 rounded-lg border border-border bg-muted/50 p-4">
              <div className="space-y-2">
                <Label htmlFor="edit-collection">Collection (Book)</Label>
                <Select
                  value={editCollectionId}
                  onValueChange={(val) => {
                    setEditCollectionId(val);
                    setEditChapterId("none"); // Reset chapter when collection changes
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
              </div>

              {editCollectionId !== "none" && (
                <div className="space-y-2">
                  <Label htmlFor="edit-chapter">Chapter (Module)</Label>
                  <Select value={editChapterId} onValueChange={setEditChapterId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a chapter" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Chapter</SelectItem>
                      {collections
                        .find((c) => c.id.toString() === editCollectionId)
                        ?.chapters?.map((chapter: any) => (
                          <SelectItem
                            key={chapter.id}
                            value={chapter.id.toString()}
                          >
                            Ch. {chapter.chapterNumber}: {chapter.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditPreset(null)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
