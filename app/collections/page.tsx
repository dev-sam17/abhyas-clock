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
  FileText,
  Globe,
  Lock,
} from "lucide-react";
import { BackButton } from "@/components/back-button";
import { HomeButton } from "@/components/home-button";
import { Footer } from "@/components/footer";
import { LoadingSpinner } from "@/components/loading-spinner";
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

  const handleCreate = async () => {
    if (!name.trim()) {
      toast.error("Please enter a collection name");
      return;
    }

    try {
      const response = await fetch("/api/collections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
          isPublic,
        }),
      });

      if (response.ok) {
        toast.success("Collection created successfully");
        setName("");
        setDescription("");
        setIsPublic(false);
        setShowCreateDialog(false);
        fetchCollections();
      } else {
        toast.error("Failed to create collection");
      }
    } catch (error) {
      console.error("Error creating collection:", error);
      toast.error("Failed to create collection");
    } finally {
      fetchCollections();
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

  if (loading) {
    return <LoadingSpinner message="Loading collections..." />;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-3 py-3 sm:px-4 sm:py-4">
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <div className="flex items-center gap-2">
              <BackButton />
              <HomeButton />
            </div>
            <Button
              onClick={() => setShowCreateDialog(true)}
              size="sm"
              className="text-xs sm:text-sm"
            >
              <PlusCircle className="mr-1 size-3 sm:mr-2 sm:size-4" />
              <span className="hidden sm:inline">Create Collection</span>
              <span className="sm:hidden">Create</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 flex-1">
        {collections.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FolderOpen className="size-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No collections yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Create your first collection to organize your test presets
              </p>
              <Button onClick={() => setShowCreateDialog(true)}>
                <PlusCircle className="mr-2 size-4" />
                Create Collection
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {collections.map((collection) => (
              <Card
                key={collection.id}
                className="hover:shadow-lg transition-shadow"
              >
                <Link href={`/collections/${collection.id}`}>
                  <CardHeader className="cursor-pointer">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2 flex-1">
                        <FolderOpen className="size-5 text-primary" />
                        <CardTitle className="text-lg">
                          {collection.name}
                        </CardTitle>
                      </div>
                      <Badge variant="secondary">
                        {collection._count.presets} presets
                      </Badge>
                    </div>
                    {collection.description && (
                      <CardDescription className="mt-2">
                        {collection.description}
                      </CardDescription>
                    )}
                  </CardHeader>
                </Link>
                <CardContent>
                  <div className="space-y-3">
                    {collection.presets.length > 0 && (
                      <div className="space-y-1">
                        {collection.presets.slice(0, 3).map((preset: any) => (
                          <div
                            key={preset.id}
                            className="flex items-center gap-2 text-sm"
                          >
                            <FileText className="size-3 text-muted-foreground" />
                            <span className="truncate">{preset.name}</span>
                          </div>
                        ))}
                        {collection.presets.length > 3 && (
                          <div className="text-xs text-muted-foreground">
                            +{collection.presets.length - 3} more
                          </div>
                        )}
                      </div>
                    )}
                    <div className="flex gap-2 pt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={(e) => {
                          e.preventDefault();
                          handleEdit(collection);
                        }}
                      >
                        <Pencil className="mr-2 size-3" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={(e) => {
                          e.preventDefault();
                          setDeleteId(collection.id);
                        }}
                      >
                        <Trash2 className="mr-2 size-3" />
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Collection</DialogTitle>
            <DialogDescription>
              Create a new collection to organize your test presets
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
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCreateDialog(false)}
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
              Are you sure you want to delete this collection? The presets in
              this collection will not be deleted, they will just be removed
              from the collection.
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
