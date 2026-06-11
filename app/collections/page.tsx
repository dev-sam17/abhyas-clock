"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  PlusCircle,
  FolderOpen,
  Pencil,
  Trash2,
  BookOpen,
  Globe,
  Lock,
  Plus,
  X,
} from "lucide-react";
import { Footer } from "@/components/footer";
import { LoadingSpinner } from "@/components/loading-spinner";
import { toast } from "sonner";
import { Navbar } from "@/components/navbar";
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

type ChapterInput = {
  name: string;
  chapterNumber: string;
};

export default function CollectionsPage() {
  const [collections, setCollections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [editCollection, setEditCollection] = useState<any | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [chapters, setChapters] = useState<ChapterInput[]>([]);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editIsPublic, setEditIsPublic] = useState(false);

  useEffect(() => {
    fetchCollections();
  }, []);

  const fetchCollections = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/collections");
      if (response.ok) {
        const data = await response.json();
        setCollections(data);
      }
    } catch (error) {
      console.error("Error fetching collections:", error);
      toast.error("Failed to load collections");
    } finally {
      setLoading(false);
    }
  };

  const addChapterInput = () => {
    setChapters([
      ...chapters,
      { name: "", chapterNumber: String(chapters.length + 1) },
    ]);
  };

  const removeChapterInput = (index: number) => {
    setChapters(chapters.filter((_, i) => i !== index));
  };

  const updateChapterInput = (
    index: number,
    field: keyof ChapterInput,
    value: string
  ) => {
    const updated = [...chapters];
    updated[index] = { ...updated[index], [field]: value };
    setChapters(updated);
  };

  const handleCreate = async () => {
    if (!name.trim()) {
      toast.error("Please enter a collection name");
      return;
    }

    // Validate chapters if any
    for (const ch of chapters) {
      if (!ch.name.trim()) {
        toast.error("All chapters must have a name");
        return;
      }
      if (!ch.chapterNumber.trim()) {
        toast.error("All chapters must have a chapter number");
        return;
      }
    }

    try {
      const response = await fetch("/api/collections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
          isPublic,
          chapters: chapters.map((ch) => ({
            name: ch.name.trim(),
            chapterNumber: ch.chapterNumber.trim(),
          })),
        }),
      });

      if (response.ok) {
        toast.success("Collection created successfully");
        setName("");
        setDescription("");
        setIsPublic(false);
        setChapters([]);
        setShowCreateDialog(false);
        fetchCollections();
      } else {
        toast.error("Failed to create collection");
      }
    } catch (error) {
      console.error("Error creating collection:", error);
      toast.error("Failed to create collection");
    }
  };

  const handleEdit = (collection: any) => {
    setEditCollection(collection);
    setEditName(collection.name);
    setEditDescription(collection.description || "");
    setEditIsPublic(collection.isPublic || false);
    setShowEditDialog(true);
  };

  const handleSaveEdit = async () => {
    if (!editCollection || !editName.trim()) {
      toast.error("Please enter a collection name");
      return;
    }

    try {
      const response = await fetch("/api/collections", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editCollection.id,
          name: editName.trim(),
          description: editDescription.trim() || null,
          isPublic: editIsPublic,
        }),
      });

      if (response.ok) {
        toast.success("Collection updated successfully");
        setShowEditDialog(false);
        setEditCollection(null);
        fetchCollections();
      } else {
        toast.error("Failed to update collection");
      }
    } catch (error) {
      console.error("Error updating collection:", error);
      toast.error("Failed to update collection");
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const response = await fetch(`/api/collections?id=${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Collection deleted successfully");
        setCollections(collections.filter((c) => c.id !== id));
      } else {
        toast.error("Failed to delete collection");
      }
    } catch (error) {
      console.error("Error deleting collection:", error);
      toast.error("Failed to delete collection");
    } finally {
      setDeleteId(null);
    }
  };

  const getTotalPresets = (collection: any) => {
    return (
      collection.chapters?.reduce(
        (sum: number, ch: any) => sum + (ch._count?.presets || 0),
        0
      ) || 0
    );
  };

  if (loading) {
    return <LoadingSpinner message="Loading collections..." />;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <header className="border-b border-border/40 bg-card/50">
        <div className="mx-auto max-w-9xl px-4 py-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Collections
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage and organize your test papers into distinct collections and chapters
            </p>
          </div>
          <Button
            onClick={() => setShowCreateDialog(true)}
            size="sm"
            className="gap-2 self-start sm:self-auto"
          >
            <PlusCircle className="size-4" />
            Create Collection
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-9xl px-4 py-8 flex-1">
        {collections.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FolderOpen className="size-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No collections yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Create your first collection to organize your tests into
                chapters
              </p>
              <Button onClick={() => setShowCreateDialog(true)}>
                <PlusCircle className="mr-2 size-4" />
                Create Collection
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            {collections.map((collection) => (
              <Card
                key={collection.id}
                className="relative overflow-hidden group flex flex-col hover:scale-[1.02] hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-border/60 bg-gradient-to-b from-card to-card/50 transition-all duration-300 rounded-xl"
              >
                {/* Visual Accent top bar */}
                <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-primary/40 via-violet-500/40 to-primary/40 opacity-70 group-hover:opacity-100 transition-opacity" />
                
                <Link href={`/collections/${collection.id}`} className="flex-1 flex flex-col">
                  <CardHeader className="cursor-pointer pb-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5 flex-1 min-w-0">
                        <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 border border-primary/20 text-primary shadow-sm shrink-0">
                          <FolderOpen className="size-5" />
                        </div>
                        <div className="min-w-0">
                          <CardTitle className="text-base font-bold tracking-tight text-foreground truncate group-hover:text-primary transition-colors">
                            {collection.name}
                          </CardTitle>
                          {/* Visibility badge */}
                          <div className="flex items-center gap-1 mt-0.5">
                            {collection.isPublic ? (
                              <span className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground">
                                <Globe className="size-2.5" /> Public
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground">
                                <Lock className="size-2.5" /> Private
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Glass capsules */}
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <Badge variant="secondary" className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 bg-violet-500/10 text-violet-400 border border-violet-500/20">
                          {collection._count?.chapters || 0} Ch
                        </Badge>
                        <Badge variant="outline" className="text-[10px] font-medium px-2 py-0.5 bg-muted/30 border-border/55">
                          {getTotalPresets(collection)} Tests
                        </Badge>
                      </div>
                    </div>
                    
                    {collection.description && (
                      <CardDescription className="mt-2.5 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                        {collection.description}
                      </CardDescription>
                    )}
                  </CardHeader>
                </Link>

                <CardContent className="pt-0">
                  <div className="space-y-4">
                    {collection.chapters && collection.chapters.length > 0 && (
                      <div className="rounded-lg border border-border/40 bg-muted/30 p-2.5 space-y-1.5">
                        <div className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase px-1 pb-1 border-b border-border/20">
                          Modules Overview
                        </div>
                        {collection.chapters.slice(0, 3).map((ch: any) => (
                          <div
                            key={ch.id}
                            className="flex items-center justify-between gap-2 text-xs py-1 px-1 rounded hover:bg-muted/40 transition-colors"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <BookOpen className="size-3.5 text-primary/70 shrink-0" />
                              <span className="font-medium text-foreground/80 truncate">
                                Ch. {ch.chapterNumber}: {ch.name}
                              </span>
                            </div>
                            <span className="text-[10px] bg-primary/10 text-primary font-bold px-1.5 py-0.5 rounded-full shrink-0">
                              {ch._count?.presets || 0}
                            </span>
                          </div>
                        ))}
                        {collection.chapters.length > 3 && (
                          <div className="text-[10px] text-muted-foreground font-medium text-center pt-1 border-t border-border/10">
                            + {collection.chapters.length - 3} more modules
                          </div>
                        )}
                      </div>
                    )}
                    
                    <div className="flex gap-2 pt-1">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 text-xs font-semibold h-8 hover:bg-primary/5 hover:text-primary hover:border-primary/30 transition-all"
                        onClick={(e) => {
                          e.preventDefault();
                          handleEdit(collection);
                        }}
                      >
                        <Pencil className="mr-1.5 size-3.5" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 text-xs font-semibold h-8 hover:bg-destructive/5 hover:text-destructive hover:border-destructive/30 transition-all"
                        onClick={(e) => {
                          e.preventDefault();
                          setDeleteId(collection.id);
                        }}
                      >
                        <Trash2 className="mr-1.5 size-3.5" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Collection</DialogTitle>
            <DialogDescription>
              Create a new collection with chapters to organize your tests
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                placeholder="e.g., JEE Mains Practice"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                placeholder="Describe what this collection is for"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="create-public">Public Collection</Label>
                <p className="text-sm text-muted-foreground">
                  Make this collection visible to all users
                </p>
              </div>
              <Switch
                id="create-public"
                checked={isPublic}
                onCheckedChange={setIsPublic}
              />
            </div>

            {/* Chapters Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Chapters (Optional)</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addChapterInput}
                >
                  <Plus className="mr-1 size-3" />
                  Add Chapter
                </Button>
              </div>
              {chapters.length > 0 && (
                <div className="space-y-2">
                  {chapters.map((ch, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 rounded-lg border border-border p-2"
                    >
                      <Input
                        type="text"
                        placeholder="e.g., 1a"
                        value={ch.chapterNumber}
                        onChange={(e) =>
                          updateChapterInput(
                            index,
                            "chapterNumber",
                            e.target.value
                          )
                        }
                        className="w-20"
                      />
                      <Input
                        placeholder="Chapter name"
                        value={ch.name}
                        onChange={(e) =>
                          updateChapterInput(index, "name", e.target.value)
                        }
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeChapterInput(index)}
                        className="h-8 w-8 p-0"
                      >
                        <X className="size-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateDialog(false);
                setChapters([]);
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleCreate}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Collection</DialogTitle>
            <DialogDescription>Update collection details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description (Optional)</Label>
              <Textarea
                id="edit-description"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                rows={3}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="edit-public">Public Collection</Label>
                <p className="text-sm text-muted-foreground">
                  Make this collection visible to all users
                </p>
              </div>
              <Switch
                id="edit-public"
                checked={editIsPublic}
                onCheckedChange={setEditIsPublic}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={deleteId !== null}
        onOpenChange={() => setDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Collection</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this collection? All chapters will
              be deleted. The tests in the chapters will not be deleted,
              they will just be unlinked.
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
      <Footer />
    </div>
  );
}
