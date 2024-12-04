"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Plus, Users, MoreHorizontal, Trash2 } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import {
  useDeleteProjectMutation,
  useGetProjectsQuery,
} from "@/redux/features/services/api";

const ProjectCard = ({ onNewProject, selectedProjectId }) => {
  const router = useRouter();
  const { toast } = useToast();

  const { data: projects = [], isLoading } = useGetProjectsQuery();
  const [deleteProject] = useDeleteProjectMutation();

  const [deleteConfirmation, setDeleteConfirmation] = useState({
    isOpen: false,
    projectId: null,
    projectName: "",
  });

  const handleProjectClick = (projectId) => {
    router.push(`/projects/${projectId}`);
  };

  const handleDeleteClick = async () => {
    try {
      await deleteProject(deleteConfirmation.projectId).unwrap();
      toast({
        title: "Success",
        description: "Project deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting project:", error);
      toast({
        title: "Error",
        description: "Failed to delete project",
        variant: "destructive",
      });
    } finally {
      setDeleteConfirmation({
        isOpen: false,
        projectId: null,
        projectName: "",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-4 border rounded-lg animate-pulse bg-muted">
            <div className="h-5 w-1/3 bg-muted-foreground/15 rounded mb-2" />
            <div className="h-4 w-1/4 bg-muted-foreground/15 rounded" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-foreground">Projects</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={onNewProject}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          New Project
        </Button>
      </div>

      {projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center bg-muted rounded-lg border border-dashed">
          <div className="space-y-4">
            <Users className="h-12 w-12 text-muted-foreground" />
            <div className="space-y-2">
              <h3 className="text-lg font-medium text-foreground">
                No projects yet
              </h3>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                Get started by creating your first project. You can collaborate
                with team members and manage tasks efficiently.
              </p>
            </div>
            <Button onClick={onNewProject} className="gap-2">
              <Plus className="h-4 w-4" />
              Create your first project
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {projects.map((project) => (
            <div
              key={project.id}
              className={cn(
                "p-4 border rounded-lg hover:bg-muted group relative",
                "transition-colors duration-200",
                selectedProjectId === project.id && "bg-muted border-border"
              )}
            >
              <div
                className="flex items-center justify-between cursor-pointer"
                onClick={() => handleProjectClick(project.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleProjectClick(project.id);
                }}
              >
                <div>
                  <h3 className="font-medium text-foreground">
                    {project.name}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Created {new Date(project.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {project.teams?.team_members?.length || 0} members
                    </span>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      asChild
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Button
                        variant="ghost"
                        className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Project actions</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive flex gap-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteConfirmation({
                            isOpen: true,
                            projectId: project.id,
                            projectName: project.name,
                          });
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete Project
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <AlertDialog
        open={deleteConfirmation.isOpen}
        onOpenChange={(isOpen) =>
          setDeleteConfirmation((prev) => ({ ...prev, isOpen }))
        }
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Project</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;
              {deleteConfirmation.projectName}
              &quot;? This action cannot be undone and will remove all
              associated tasks and sections.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteClick}
              variant="destructive"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ProjectCard;
