"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/loading-spinner";
import { authClient } from "@/lib/auth-client";
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
  const [editCollectionId, setEditCollectionId] = useState<string>("");
  const [editTestMode, setEditTestMode] = useState<string>("timer");
  const [editTimeLimitMinutes, setEditTimeLimitMinutes] = useState<number>(60);
  const [editAllowOvertime, setEditAllowOvertime] = useState(false);
  const [userId, setUserId] = useState<string>("");

  useEffect(() => {
    fetchPresets();
    fetchCollections();
    fetchUser();
  }, []);

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
      toast.error("Failed to load presets");
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
        toast.success("Preset deleted successfully");
        setPresets(presets.filter((p) => p.id !== id));
      } else {
        toast.error("Failed to delete preset");
      }
    } catch (error) {
      console.error("Error deleting preset:", error);
      toast.error("Failed to delete preset");
    } finally {
      setDeleteId(null);
    }
  };

  const handleEdit = (preset: any) => {
    setEditPreset(preset);
    setEditName(preset.name);
    setEditIsPublic(preset.isPublic);
    setEditCollectionId(preset.collectionId?.toString() || "none");
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
          collectionId:
            editCollectionId && editCollectionId !== "none"
              ? parseInt(editCollectionId)
              : null,
          testMode: editTestMode,
          timeLimitMinutes:
            editTestMode === "timer" ? editTimeLimitMinutes : null,
          allowOvertime: editTestMode === "timer" ? editAllowOvertime : false,
        }),
      });

      if (response.ok) {
        toast.success("Preset updated successfully");
        fetchPresets();
        setEditPreset(null);
      } else {
        toast.error("Failed to update preset");
      }
    } catch (error) {
      console.error("Error updating preset:", error);
      toast.error("Failed to update preset");
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading presets..." />;
  }

  return (
    <>
      {presets.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="size-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No test presets yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Create your first test preset to get started
            </p>
            <Link href="/create-preset">
              <Button>
                <PlusCircle className="mr-2 size-4" />
                Create Preset
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {presets.map((preset) => {
            const isOwner = preset.userId === userId;
            console.log({ presetID: preset.userId, userId });
            return (
              <Card
                key={preset.id}
                className="flex flex-col hover:shadow-xl hover:scale-[1.02] transition-all duration-300 border-2"
              >
                <CardHeader className="pb-3">
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-end gap-2">
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
                    {preset.collection && (
                      <div className="text-xs font-medium truncate">
                        📁 {preset.collection.name}
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
                      <Link href={`/take-test/${preset.id}`}>
                        <Button size="sm">Take Test</Button>
                      </Link>
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
            <AlertDialogTitle>Delete Preset</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this preset? This action cannot be
              undone. All attempts associated with this preset will also be
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
            <DialogTitle>Edit Preset</DialogTitle>
            <DialogDescription>Update preset details</DialogDescription>
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
                <Label htmlFor="edit-public">Public Preset</Label>
                <p className="text-sm text-muted-foreground">
                  Make this preset available to all users
                </p>
              </div>
              <Switch
                id="edit-public"
                checked={editIsPublic}
                onCheckedChange={setEditIsPublic}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-collection">Collection</Label>
              <Select
                value={editCollectionId}
                onValueChange={setEditCollectionId}
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
