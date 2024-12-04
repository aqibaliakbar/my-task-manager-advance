"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Plus, Lock, Globe, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
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
import TeamMemberDialog from "@/components/teams/TeamMemberDialog";
import {
  useDeleteProjectMutation,
  useGetProjectsQuery,
  useGetTeamMembersQuery,
} from "@/redux/features/services/api";
import { useToast } from "@/hooks/use-toast";
import ProjectCreationDialog from "@/components/projects/ProjectCreationDialog";

const TeamsPage = () => {
  const { teamId } = useParams();
  const {
    data: members = [],
    isLoading,
    error,
  } = useGetTeamMembersQuery(teamId);
  const { toast } = useToast();
  const { data: projects = [] } = useGetProjectsQuery();
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [isProjectDialogOpen, setIsProjectDialogOpen] = useState(false);
  const [deleteProject] = useDeleteProjectMutation();
  const [deleteConfirmation, setDeleteConfirmation] = useState({
    isOpen: false,
    projectId: null,
    projectName: "",
  });

  const handleDeleteClick = async () => {
    try {
      await deleteProject(deleteConfirmation.projectId).unwrap();
      toast({
        title: "Project deleted successfully",

        description: "Project deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting project:", error);
      toast({ description: "Failed to delete project" });
    } finally {
      setDeleteConfirmation({
        isOpen: false,
        projectId: null,
        projectName: "",
      });
    }
  };

  const teamProjects = projects.filter((project) => project.team_id === teamId);

  const renderMembers = () => {
    if (isLoading)
      return <div className="text-muted-foreground">Loading members...</div>;
    if (error) {
      console.error("Members error:", error);
      return (
        <div className="text-destructive">
          Error loading members: {error.message}
        </div>
      );
    }
    if (!members?.length)
      return (
        <div className="text-muted-foreground">
          No members found for team ID: {teamId}
        </div>
      );

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {members.map((member) => (
          <Card key={member.id}>
            <CardContent className="flex items-center gap-2 p-4">
              <Avatar>
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {member.email?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="text-sm font-medium">
                  {member.users?.full_name || member.email}
                </span>
                <span className="text-xs text-muted-foreground">
                  {member.email}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      {/* Members Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">
            Members ({members?.length || 0})
          </h2>
          <Dialog open={isAddMemberOpen} onOpenChange={setIsAddMemberOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="flex items-center">
                <Plus className="h-4 w-4 mr-2" />
                Add Member
              </Button>
            </DialogTrigger>
            <TeamMemberDialog
              teamId={teamId}
              onClose={() => setIsAddMemberOpen(false)}
            />
          </Dialog>
        </div>

        {renderMembers()}
      </div>

      {/* Projects Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">
            Projects ({teamProjects.length})
          </h2>
          <Button
            variant="outline"
            className="flex items-center"
            onClick={() => setIsProjectDialogOpen(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            New Project
          </Button>
        </div>

        <ProjectCreationDialog
          isOpen={isProjectDialogOpen}
          onClose={() => setIsProjectDialogOpen(false)}
        />

        <div className="space-y-2">
          {teamProjects.map((project) => (
            <Card key={project.id} className="group">
              <CardContent className="flex items-center justify-between p-4 hover:bg-accent transition-colors">
                <div className="flex items-center gap-4">
                  <div className="flex flex-col">
                    <span className="font-medium">{project.name}</span>
                    <div className="flex items-center text-sm text-muted-foreground gap-1">
                      {project.visibility === "private" ? (
                        <Lock className="h-3 w-3" />
                      ) : (
                        <Globe className="h-3 w-3" />
                      )}
                      <span>
                        {project.visibility === "private"
                          ? "Private"
                          : "Public"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
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
              </CardContent>
            </Card>
          ))}

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
                  Are you sure you want to delete "
                  {deleteConfirmation.projectName}"? This action cannot be
                  undone and will remove all associated tasks and sections.
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
        </div>
      </div>
    </div>
  );
};

export default TeamsPage;
