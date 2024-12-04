"use client";

import { useState } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  CheckSquare,
  Home,
  Inbox,
  Users,
  Trash2,
  Loader2,
  FolderPlus,
  UserPlus,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { usePathname, useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useDispatch, useSelector } from "react-redux";
import { setCurrentTeam } from "@/redux/features/teamSlice";
import {
  useDeleteProjectMutation,
  useDeleteTeamMutation,
  useGetProjectsQuery,
  useGetTeamsQuery,
} from "@/redux/features/services/api";

function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useDispatch();
  const { toast } = useToast();
  const currentTeam = useSelector((state) => state.team.currentTeam);

  const { data: projects = [], isLoading: isLoadingProjects } =
    useGetProjectsQuery();
  const { data: teams = [], isLoading: isLoadingTeams } = useGetTeamsQuery();
  const [deleteProject] = useDeleteProjectMutation();
  const [deleteTeam] = useDeleteTeamMutation();

  const handleTeamClick = (team) => {
    dispatch(setCurrentTeam(team));
    router.push(`/teams/${team.id}`);
  };

  const handleProjectDelete = async (projectId) => {
    try {
      await deleteProject(projectId).unwrap();
      toast({
        title: "Success",
        description: "Project deleted successfully",
      });
      if (pathname.includes(`/projects/${projectId}`)) {
        router.push("/");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete project",
        variant: "destructive",
      });
    }
  };

  const handleTeamDelete = async (teamId) => {
    try {
      if (currentTeam?.id === teamId) {
        dispatch(setCurrentTeam(null));
      }
      await deleteTeam(teamId).unwrap();
      toast({
        title: "Workspace Deleted",
        description: "Workspace deleted successfully",
       
      });
      if (pathname.includes(`/teams/${teamId}`)) {
        router.push("/");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete team",
        variant: "destructive",
      });
    }
  };

  const navigationItems = [
    { path: "/", label: "Home", icon: Home },
    { path: "/tasks", label: "My Tasks", icon: CheckSquare },
    { path: "/inbox", label: "Inbox", icon: Inbox },
  ];

  const EmptyState = ({ type, icon: Icon }) => (
    <div className="px-2 py-4">
      <div className="rounded-lg border border-dashed p-4 text-center">
        <Icon className="mx-auto h-8 w-8 text-muted-foreground/60 mb-2" />
        <p className="text-sm text-muted-foreground mb-2">No {type} yet</p>
      </div>
    </div>
  );

  return (
    <Sidebar className="border-r pt-20 fixed inset-y-0 left-0 z-20 w-64 bg-background">
      <SidebarContent>
        {/* Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton asChild>
                      <Link
                        href={item.path}
                        className={cn(
                          "flex items-center gap-2 px-2 py-1.5",
                          pathname === item.path && "bg-secondary"
                        )}
                      >
                        <Icon className="h-4 w-4" />
                        {item.label}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Projects */}
        <SidebarGroup>
          <SidebarGroupLabel>Projects</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {isLoadingProjects ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              ) : projects.length === 0 ? (
                <EmptyState type="Projects" icon={FolderPlus} />
              ) : (
                projects.map((project) => (
                  <SidebarMenuItem key={project.id}>
                    <div className="flex items-center group w-full">
                      <SidebarMenuButton asChild className="flex-1">
                        <Link
                          href={`/projects/${project.id}`}
                          className={cn(
                            "flex items-center px-2 py-1.5",
                            pathname === `/projects/${project.id}` &&
                              "bg-secondary"
                          )}
                        >
                          {project.name}
                        </Link>
                      </SidebarMenuButton>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="opacity-0 group-hover:opacity-100 h-8 w-8"
                        onClick={() => handleProjectDelete(project.id)}
                      >
                        <Trash2 className="h-4 w-4 hover:text-destructive" />
                      </Button>
                    </div>
                  </SidebarMenuItem>
                ))
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Teams */}
        <SidebarGroup>
          <SidebarGroupLabel>Teams</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {isLoadingTeams ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              ) : teams.length === 0 ? (
                <EmptyState type="Teams" icon={UserPlus} />
              ) : (
                teams.map((team) => (
                  <SidebarMenuItem key={team.id}>
                    <div className="flex items-center group w-full">
                      <SidebarMenuButton asChild className="flex-1">
                        <Link
                          href={`/teams/${team.id}`}
                          className={cn(
                            "flex items-center gap-2 px-2 py-1.5",
                            (pathname === `/teams/${team.id}` ||
                              currentTeam?.id === team.id) &&
                              "bg-secondary"
                          )}
                          onClick={() => handleTeamClick(team)}
                        >
                          <Users className="h-4 w-4" />
                          {team.name}
                          {team.team_members?.length > 0 && (
                            <span className="text-xs text-muted-foreground">
                              ({team.team_members.length})
                            </span>
                          )}
                        </Link>
                      </SidebarMenuButton>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="opacity-0 group-hover:opacity-100 h-8 w-8"
                        onClick={() => handleTeamDelete(team.id)}
                      >
                        <Trash2 className="h-4 w-4 hover:text-destructive" />
                      </Button>
                    </div>
                  </SidebarMenuItem>
                ))
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}

export default AppSidebar;
