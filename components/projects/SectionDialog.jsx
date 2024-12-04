"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  useCreateSectionMutation,
  useDeleteSectionMutation,
} from "@/redux/features/services/api";
import { useToast } from "@/hooks/use-toast";

function SectionDialog({
  isOpen,
  onClose,
  projectId,
  mode = "create",
  sectionToDelete,
}) {
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const [createSection] = useCreateSectionMutation();
  const [deleteSection] = useDeleteSectionMutation();

  const handleCreate = async () => {
    if (!name.trim()) {
      toast({
        title: "Validation Error",
        description: "Section name is required",
        variant: "destructive",
      });
      return;
    }

    if (name.trim().length < 2) {
      toast({
        title: "Validation Error",
        description: "Section name must be at least 2 characters",
        variant: "destructive",
      });
      return;
    }

    if (name.trim().length > 50) {
      toast({
        title: "Validation Error",
        description: "Section name must be less than 50 characters",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      await createSection({
        name: name.trim(),
        project_id: projectId,
        position: 9999,
        created_at: new Date().toISOString(),
      }).unwrap();

      toast({
        title: "Success",
        description: "Section created successfully",
      });
      onClose();
      setName("");
    } catch (error) {
      console.error("Error creating section:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create section",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    setIsLoading(true);
    try {
      await deleteSection(sectionToDelete.id).unwrap();
      toast({
        title: "Success",
        description: "Section deleted successfully",
      });
      onClose();
    } catch (error) {
      console.error("Error deleting section:", error);
      toast({
        title: "Error",
        description: "Failed to delete section",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Create New Section" : "Delete Section"}
          </DialogTitle>
        </DialogHeader>

        {mode === "create" ? (
          <div className="space-y-4">
            <div>
              <Input
                placeholder="Enter section name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={50}
                className="w-full"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !isLoading && name.trim()) {
                    handleCreate();
                  }
                }}
              />
              <div className="mt-1 text-xs text-muted-foreground">
                {name.length}/50 characters
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  onClose();
                  setName("");
                }}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreate}
                disabled={isLoading || !name.trim()}
              >
                {isLoading ? "Creating..." : "Create"}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-foreground">
              Are you sure you want to delete this section?
            </p>
            <p className="text-sm text-muted-foreground">
              This will delete the section &quot;{sectionToDelete?.name}&quot;
              and all its tasks.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={onClose} disabled={isLoading}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={isLoading}
              >
                {isLoading ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default SectionDialog;
