"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSelector } from "react-redux";
import { useToast } from "@/hooks/use-toast";
import {
  useCreateProjectMutation,
  useCreateSectionMutation,
  useGetTeamsQuery,
} from "@/redux/features/services/api";
import HeaderTeamCreationDialog from "../teams/HeaderTeamCreationDialog";

const DEFAULT_SECTIONS = [
  { name: "To Do", position: 0 },
  { name: "In Progress", position: 1 },
  { name: "Done", position: 2 },
];

function ProjectCreationDialog({ isOpen, onClose, teamId }) {
  const { toast } = useToast();
  const { session } = useSelector((state) => state.user);
  const user = session?.user;

  const [createProject] = useCreateProjectMutation();
  const [createSection] = useCreateSectionMutation();
  const { data: teams = [] } = useGetTeamsQuery(user?.id);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTeamDialogOpen, setIsTeamDialogOpen] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    privacy: "private", // lowercase initial value
    team_id: teamId || "",
    created_by: null,
    created_at: new Date().toISOString(),
  });

  // Add useEffect to update created_by when user session is available
  useEffect(() => {
    if (user?.id) {
      setFormData((prev) => ({
        ...prev,
        created_by: user.id,
      }));
    }
  }, [user?.id]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!user?.id) {
      toast({
        title: "Error",
        description: "User session not found. Please try again.",
        variant: "destructive",
      });
      return;
    }

    const selectedTeamId = teamId || formData.team_id;
    if (!selectedTeamId) {
      toast({
        title: "Error",
        description: "Please select a team",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const projectData = {
        ...formData,
        team_id: selectedTeamId,
        created_by: user.id,
        privacy: formData.privacy.toLowerCase(),
        name: formData.name.trim(),
      };

      const newProject = await createProject(projectData).unwrap();
      const projectId = newProject[0].id;

      await createSection(
        DEFAULT_SECTIONS.map((section) => ({
          name: section.name,
          project_id: projectId,
          position: section.position,
          created_at: new Date().toISOString(),
        }))
      ).unwrap();

      toast({
        title: "Success",
        description: "Project created successfully",
      });

      setFormData({
        name: "",
        privacy: "Private",
        team_id: selectedTeamId,
        created_by: user.id,
        created_at: new Date().toISOString(),
      });
      onClose();
    } catch (error) {
      console.error("Project creation error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create project",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateWorkforce = () => {
    onClose();
    setIsTeamDialogOpen(true);
  };

  const handleTeamDialogClose = () => {
    setIsTeamDialogOpen(false);
  };
  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create Project</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="grid gap-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Project Name</label>
              <Input
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Enter project name"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Privacy</label>
              <div className="space-y-2">
                <label className="text-sm font-medium">Privacy</label>
                <Select
                  value={formData.privacy}
                  onValueChange={(value) =>
                    setFormData({ ...formData, privacy: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select privacy" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="private">Private</SelectItem>
                    <SelectItem value="public">Public</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {!teamId && teams.length > 0 ? (
              <div className="space-y-2">
                <label className="text-sm font-medium">Team</label>
                <Select
                  value={formData.team_id}
                  onValueChange={(value) =>
                    setFormData({ ...formData, team_id: value })
                  }
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select team" />
                  </SelectTrigger>
                  <SelectContent>
                    {teams.map((team) => (
                      <SelectItem key={team.id} value={team.id}>
                        {team.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : !teamId ? (
              <div className="space-y-2">
                <label className="text-sm font-medium">Team</label>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={handleCreateWorkforce}
                >
                  Create Workforce
                </Button>
              </div>
            ) : null}

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Project"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isTeamDialogOpen} onOpenChange={setIsTeamDialogOpen}>
        <HeaderTeamCreationDialog onClose={handleTeamDialogClose} />
      </Dialog>
    </>
  );
}

export default ProjectCreationDialog;
