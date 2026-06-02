"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BackButton } from "@/components/back-button";
import { LoadingSpinner } from "@/components/loading-spinner";
import { HomeButton } from "@/components/home-button";
import { Footer } from "@/components/footer";
import Link from "next/link";
import {
  FileText,
  Clock,
  Timer,
  Globe,
  Lock,
  BookOpen,
  PlusCircle,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

type Preset = {
  id: number;
  name: string;
  testMode: string;
  isPublic: boolean;
  totalQuestions: number;
  timeLimitMinutes: number | null;
  allowOvertime: boolean;
  _count: { attempts: number };
  user: { id: string; name: string } | null;
};

type Chapter = {
  id: number;
  name: string;
  chapterNumber: string;
  presets: Preset[];
};

type Collection = {
  id: number;
  name: string;
  description: string | null;
  isPublic: boolean;
  userId: string;
  user: { id: string; name: string } | null;
  chapters: Chapter[];
};

export default function CollectionDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const [collection, setCollection] = useState<Collection | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedChapters, setExpandedChapters] = useState<Set<number>>(
    new Set()
  );

  // Add chapter dialog
  const [showAddChapter, setShowAddChapter] = useState(false);
  const [newChapterName, setNewChapterName] = useState("");
  const [newChapterNumber, setNewChapterNumber] = useState("");

  // Edit chapter dialog
  const [editChapter, setEditChapter] = useState<Chapter | null>(null);
  const [editChapterName, setEditChapterName] = useState("");
  const [editChapterNumber, setEditChapterNumber] = useState("");

  // Delete chapter
  const [deleteChapterId, setDeleteChapterId] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchCollection = async () => {
      if (!id) return;
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/collections/${id}`);
        if (res.status === 404) {
          throw new Error("Collection not found");
        }
        if (!res.ok) {
          throw new Error("Failed to load collection");
        }
        const data = (await res.json()) as Collection;
        if (!cancelled) {
          setCollection(data);
          setExpandedChapters(new Set());
        }
      } catch (e) {
        if (!cancelled) {
          setError(
            e instanceof Error ? e.message : "Failed to load collection"
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchCollection();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const toggleChapter = (chapterId: number) => {
    setExpandedChapters((prev) => {
      const next = new Set(prev);
      if (next.has(chapterId)) {
        next.delete(chapterId);
      } else {
        next.add(chapterId);
      }
      return next;
    });
  };

  const handleAddChapter = async () => {
    if (!newChapterName.trim()) {
      toast.error("Please enter a chapter name");
      return;
    }
    if (!newChapterNumber.trim()) {
      toast.error("Please enter a chapter number");
      return;
    }

    try {
      const res = await fetch("/api/chapters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          collectionId: parseInt(id!),
          name: newChapterName.trim(),
          chapterNumber: newChapterNumber.trim(),
        }),
      });

      if (res.ok) {
        toast.success("Chapter added successfully");
        setShowAddChapter(false);
        setNewChapterName("");
        setNewChapterNumber("");
        // Refetch
        const res2 = await fetch(`/api/collections/${id}`);
        if (res2.ok) {
          const data = await res2.json();
          setCollection(data);
        }
      } else {
        const errData = await res.json();
        toast.error(errData.error || "Failed to add chapter");
      }
    } catch (error) {
      console.error("Error adding chapter:", error);
      toast.error("Failed to add chapter");
    }
  };

  const handleEditChapter = async () => {
    if (!editChapter || !editChapterName.trim()) {
      toast.error("Please enter a chapter name");
      return;
    }
    if (!editChapterNumber.trim()) {
      toast.error("Please enter a chapter number");
      return;
    }

    try {
      const res = await fetch("/api/chapters", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editChapter.id,
          name: editChapterName.trim(),
          chapterNumber: editChapterNumber.trim(),
        }),
      });

      if (res.ok) {
        toast.success("Chapter updated successfully");
        setEditChapter(null);
        // Refetch
        const res2 = await fetch(`/api/collections/${id}`);
        if (res2.ok) {
          setCollection(await res2.json());
        }
      } else {
        toast.error("Failed to update chapter");
      }
    } catch (error) {
      console.error("Error updating chapter:", error);
      toast.error("Failed to update chapter");
    }
  };

  const handleDeleteChapter = async (chapterId: number) => {
    try {
      const res = await fetch(`/api/chapters?id=${chapterId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success("Chapter deleted successfully");
        // Refetch
        const res2 = await fetch(`/api/collections/${id}`);
        if (res2.ok) {
          const data = await res2.json();
          setCollection(data);
        }
      } else {
        toast.error("Failed to delete chapter");
      }
    } catch (error) {
      console.error("Error deleting chapter:", error);
      toast.error("Failed to delete chapter");
    } finally {
      setDeleteChapterId(null);
    }
  };

  const totalPresets =
    collection?.chapters.reduce(
      (sum, ch) => sum + ch.presets.length,
      0
    ) || 0;

  if (loading) {
    return <LoadingSpinner message="Loading collection..." />;
  }

  if (error || !collection) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <header className="border-b border-border bg-card">
          <div className="mx-auto max-w-9xl px-3 py-3 sm:px-4 sm:py-4">
            <div className="flex items-center gap-2">
              <BackButton />
              <HomeButton />
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-9xl px-4 py-8 flex-1">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-sm text-destructive">
                {error || "Collection not found"}
              </p>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-9xl px-3 py-3 sm:px-4 sm:py-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <div className="flex items-center gap-2">
              <BackButton />
              <HomeButton />
              <div>
                <h1 className="text-xl font-bold text-foreground sm:text-2xl">
                  {collection.name}
                </h1>
                <p className="text-xs text-muted-foreground sm:text-sm">
                  {collection.description ||
                    "View all chapters and tests in this collection"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={collection.isPublic ? "default" : "secondary"}>
                {collection.isPublic ? (
                  <>
                    <Globe className="mr-1 size-3" />
                    Public
                  </>
                ) : (
                  <>
                    <Lock className="mr-1 size-3" />
                    Private
                  </>
                )}
              </Badge>
              <Badge variant="outline">
                {collection.chapters.length} chapter
                {collection.chapters.length !== 1 ? "s" : ""}
              </Badge>
              <Badge variant="outline">
                {totalPresets} test
                {totalPresets !== 1 ? "s" : ""}
              </Badge>
              <Button
                size="sm"
                onClick={() => {
                  setNewChapterNumber(
                    String(collection.chapters.length + 1)
                  );
                  setShowAddChapter(true);
                }}
              >
                <PlusCircle className="mr-1 size-3" />
                Add Chapter
              </Button>
            </div>
          </div>
          {collection.user && (
            <p className="text-sm text-muted-foreground mt-1">
              Created by {collection.user.name}
            </p>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-9xl px-4 py-8 flex-1 w-full">
        {collection.chapters.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <BookOpen className="size-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                No chapters in this collection yet
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Add chapters to organize your tests
              </p>
              <Button
                onClick={() => {
                  setNewChapterNumber("1");
                  setShowAddChapter(true);
                }}
              >
                <PlusCircle className="mr-2 size-4" />
                Add First Chapter
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {collection.chapters.map((chapter) => {
              const isExpanded = expandedChapters.has(chapter.id);
              return (
                <Card key={chapter.id}>
                  <CardHeader
                    className="cursor-pointer select-none"
                    onClick={() => toggleChapter(chapter.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {isExpanded ? (
                          <ChevronDown className="size-5 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="size-5 text-muted-foreground" />
                        )}
                        <BookOpen className="size-5 text-primary" />
                        <CardTitle className="text-lg">
                          Chapter {chapter.chapterNumber}: {chapter.name}
                        </CardTitle>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">
                          {chapter.presets.length} test
                          {chapter.presets.length !== 1 ? "s" : ""}
                        </Badge>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditChapter(chapter);
                            setEditChapterName(chapter.name);
                            setEditChapterNumber(
                              String(chapter.chapterNumber)
                            );
                          }}
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteChapterId(chapter.id);
                          }}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  {isExpanded && (
                    <CardContent>
                      {chapter.presets.length === 0 ? (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                          <Link href={`/create-preset?collectionId=${collection.id}&chapterId=${chapter.id}`}>
                            <Card className="flex flex-col items-center justify-center p-3.5 border-dashed border-2 border-border/50 hover:border-primary/50 hover:shadow-md hover:scale-[1.01] transition-all duration-200 rounded-xl min-h-[135px] cursor-pointer bg-transparent">
                              <PlusCircle className="size-6 text-muted-foreground mb-2" />
                              <span className="text-xs font-medium text-muted-foreground">Add Test</span>
                            </Card>
                          </Link>
                        </div>
                      ) : (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                          {chapter.presets.sort((a, b) => {
                            const aNum = Number(a.name.split(" ")[0]);
                            const bNum = Number(b.name.split(" ")[0]);
                            return aNum - bNum;
                          }).map((preset) => (
                            <Card
                              key={preset.id}
                              className="relative overflow-hidden group flex flex-col justify-between p-3.5 hover:shadow-md hover:scale-[1.01] hover:border-primary/40 transition-all duration-200 border bg-gradient-to-b from-card to-card/60 rounded-xl min-h-[135px]"
                            >
                              <div className="space-y-2">
                                {/* Badges Header */}
                                <div className="flex items-center justify-between gap-2">
                                  <Badge
                                    variant={preset.testMode === "timer" ? "default" : "secondary"}
                                    className="text-[9px] px-1.5 py-0 h-4 uppercase tracking-wider font-semibold shrink-0"
                                  >
                                    {preset.testMode === "timer" ? (
                                      <span className="flex items-center gap-0.5"><Timer className="size-2.5" /> Timer</span>
                                    ) : (
                                      <span className="flex items-center gap-0.5"><Clock className="size-2.5" /> Static</span>
                                    )}
                                  </Badge>

                                  <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 border-border/60 shrink-0">
                                    {preset.isPublic ? "Public" : "Private"}
                                  </Badge>
                                </div>

                                {/* Test Name */}
                                <h4 className="text-sm font-bold text-foreground line-clamp-1 tracking-tight leading-snug group-hover:text-primary transition-colors">
                                  {preset.name}
                                </h4>

                                {/* Questions & Time info */}
                                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-muted-foreground font-medium">
                                  <span className="flex items-center gap-1">
                                    <FileText className="size-3" /> {preset.totalQuestions} Qs
                                  </span>
                                  {preset.testMode === "timer" && preset.timeLimitMinutes && (
                                    <>
                                      <span>•</span>
                                      <span className="flex items-center gap-0.5">
                                        <Timer className="size-3" /> {preset.timeLimitMinutes} min
                                      </span>
                                    </>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center justify-between gap-2 pt-2.5 border-t border-border/20 mt-1 shrink-0">
                                <span className="text-[10px] text-muted-foreground font-medium">
                                  {preset._count.attempts} attempt{preset._count.attempts !== 1 ? "s" : ""}
                                </span>
                                <Link href={`/take-test/${preset.id}`}>
                                  <Button size="sm" className="h-7 text-xs px-3 font-semibold shadow-sm hover:scale-[1.03] transition-transform">
                                    Take Test
                                  </Button>
                                </Link>
                              </div>
                            </Card>
                          ))}
                          <Link href={`/create-preset?collectionId=${collection.id}&chapterId=${chapter.id}`}>
                            <Card className="flex flex-col items-center justify-center p-3.5 border-dashed border-2 border-border/50 hover:border-primary/50 hover:shadow-md hover:scale-[1.01] transition-all duration-200 rounded-xl min-h-[135px] cursor-pointer bg-transparent">
                              <PlusCircle className="size-6 text-muted-foreground mb-2" />
                              <span className="text-xs font-medium text-muted-foreground">Add Test</span>
                            </Card>
                          </Link>
                        </div>
                      )}
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </main>

      {/* Add Chapter Dialog */}
      <Dialog open={showAddChapter} onOpenChange={setShowAddChapter}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Chapter</DialogTitle>
            <DialogDescription>
              Add a new chapter to this collection
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="chapter-number">Chapter Number</Label>
              <Input
                id="chapter-number"
                type="text"
                placeholder="e.g., 1a, 2b, 3c"
                value={newChapterNumber}
                onChange={(e) => setNewChapterNumber(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="chapter-name">Chapter Name</Label>
              <Input
                id="chapter-name"
                placeholder="e.g., Kinematics"
                value={newChapterName}
                onChange={(e) => setNewChapterName(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowAddChapter(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleAddChapter}>Add Chapter</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Chapter Dialog */}
      <Dialog
        open={editChapter !== null}
        onOpenChange={() => setEditChapter(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Chapter</DialogTitle>
            <DialogDescription>Update chapter details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-chapter-number">Chapter Number</Label>
              <Input
                id="edit-chapter-number"
                type="text"
                placeholder="e.g., 1a, 2b, 3c"
                value={editChapterNumber}
                onChange={(e) => setEditChapterNumber(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-chapter-name">Chapter Name</Label>
              <Input
                id="edit-chapter-name"
                value={editChapterName}
                onChange={(e) => setEditChapterName(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditChapter(null)}>
              Cancel
            </Button>
            <Button onClick={handleEditChapter}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Chapter Confirmation */}
      <AlertDialog
        open={deleteChapterId !== null}
        onOpenChange={() => setDeleteChapterId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Chapter</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this chapter? The test presets in
              this chapter will not be deleted, they will just be unlinked from
              the chapter.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                deleteChapterId && handleDeleteChapter(deleteChapterId)
              }
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Footer />
    </div>
  );
}
