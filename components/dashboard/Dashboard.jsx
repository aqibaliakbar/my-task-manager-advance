"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";

import { Plus, Users, Loader2 } from "lucide-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { cn } from "@/lib/utils";
import {
  useGetProjectsQuery,
  useGetProjectTasksQuery,
  useGetTasksQuery,
} from "@/redux/features/services/api";
import ProjectCard from "@/components/projects/ProjectCard";
import ProjectCreationDialog from "@/components/projects/ProjectCreationDialog";
import TaskList from "@/components/tasks/TaskLst";
import { useSelector } from "react-redux";
import { withAuth } from "@/lib/withAuth";

function Dashboard() {
  const { session } = useSelector((state) => state.user);
  const user = session?.user;

  const [selectedProjectId, setSelectedProjectId] = useState("all");
  const [isProjectDialogOpen, setIsProjectDialogOpen] = useState(false);

  const { data: projects = [], isLoading: isLoadingProjects } =
    useGetProjectsQuery();
  const { data: allTasks = [], isLoading: isLoadingTasks } = useGetTasksQuery();
  const { data: projectTasks = [], isLoading: isLoadingProjectTasks } =
    useGetProjectTasksQuery(selectedProjectId, {
      skip: selectedProjectId === "all",
    });

  const currentDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const getStats = () => {
    if (selectedProjectId === "all") {
      return {
        tasksCompleted: allTasks.filter((t) => t.sections?.name === "Done")
          .length,
        collaborators: new Set(
          allTasks.map((t) => t.assigned_to).filter(Boolean)
        ).size,
        projectName: "All Projects",
      };
    } else {
      const selectedProject = projects.find((p) => p.id === selectedProjectId);
      const projectTeamMembers = selectedProject?.teams?.team_members || [];
      return {
        tasksCompleted: projectTasks.filter((t) => t.sections?.name === "Done")
          .length,
        collaborators: projectTeamMembers.length,
        projectName: selectedProject?.name,
      };
    }
  };

  const stats = getStats();
  const isLoading =
    isLoadingProjects || isLoadingTasks || isLoadingProjectTasks;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* Header Section */}
      <div className="text-center space-y-2">
        <p className="text-muted-foreground">{currentDate}</p>
        <h1 className="text-2xl font-semibold text-foreground">
          Hello, {user?.user_metadata?.full_name || "there"}
        </h1>
      </div>

      {/* Stats Bar */}
      <div className="bg-muted rounded-lg p-4 flex items-center justify-center gap-8 flex-wrap">
        <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
          <SelectTrigger className="w-[180px] bg-background">
            <SelectValue placeholder="All Projects" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Projects</SelectItem>
            {projects.map((project) => (
              <SelectItem key={project.id} value={project.id}>
                {project.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex items-center gap-8 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-semibold text-foreground">
              {stats.tasksCompleted}
            </span>
            <span className="text-sm text-muted-foreground">
              Tasks Completed
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-semibold text-foreground">
              {stats.collaborators}
            </span>
            <span className="text-sm text-muted-foreground">Collaborators</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Projects Section */}
        <Card
          className={cn(
            "p-6",
            "border border-border",
            "bg-card text-card-foreground",
            "min-h-[500px]"
          )}
        >
          <ProjectCard
            onNewProject={() => setIsProjectDialogOpen(true)}
            selectedProjectId={selectedProjectId}
          />
        </Card>

        {/* Tasks Section */}
        <Card
          className={cn(
            "p-6",
            "border border-border",
            "bg-card text-card-foreground",
            "min-h-[500px]"
          )}
        >
          <TaskList
            selectedProjectId={selectedProjectId}
            projectName={stats.projectName}
          />
        </Card>
      </div>

      <ProjectCreationDialog
        isOpen={isProjectDialogOpen}
        onClose={() => setIsProjectDialogOpen(false)}
      />
    </div>
  );
}

export default withAuth(Dashboard);
