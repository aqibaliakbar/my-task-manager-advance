"use client";

import { useMemo } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

import { useSelector } from "react-redux";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useGetProjectTasksQuery,
  useGetTasksQuery,
} from "@/redux/features/services/api";

function TaskList({ selectedProjectId, projectName }) {
  const { session } = useSelector((state) => state.user);
  const user = session?.user;

  const { data: allTasks = [], isLoading: isLoadingAllTasks } =
    useGetTasksQuery();
  const { data: projectTasks = [], isLoading: isLoadingProjectTasks } =
    useGetProjectTasksQuery(selectedProjectId, {
      skip: selectedProjectId === "all",
    });

  const filterUserTasks = useMemo(() => {
    return (tasks) => tasks.filter((task) => task.assigned_to === user?.id);
  }, [user?.id]);

  const getFilteredTasks = (status) => {
    let tasksToFilter =
      selectedProjectId === "all" ? filterUserTasks(allTasks) : projectTasks;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    switch (status) {
      case "upcoming":
        return tasksToFilter.filter(
          (task) =>
            !task.completed && task.due_date && new Date(task.due_date) >= today
        );
      case "overdue":
        return tasksToFilter.filter(
          (task) =>
            !task.completed && task.due_date && new Date(task.due_date) < today
        );
      case "completed":
        return tasksToFilter.filter(
          (task) => task.completed || task.sections?.name === "Done"
        );
      default:
        return tasksToFilter;
    }
  };

  const getPriorityStyles = (priority) => {
    switch (priority) {
      case "High":
        return "bg-destructive/10 text-destructive";
      case "Medium":
        return "bg-warning/10 text-warning";
      case "Low":
        return "bg-success/10 text-success";
      default:
        return "bg-secondary/50 text-secondary-foreground";
    }
  };

  const renderTask = (task) => (
    <div
      key={task.id}
      className={cn(
        "flex items-center justify-between p-4 border rounded-lg",
        "hover:bg-muted transition-colors duration-200",
        "group"
      )}
    >
      <div className="flex flex-col gap-1">
        <span className="font-medium text-foreground">{task.description}</span>
        {task.is_subtask && (
          <span className="text-sm text-muted-foreground">
            Subtask of: {task?.description}
          </span>
        )}
      </div>
      <div className="flex items-center gap-2">
        {task.due_date && (
          <span className="text-sm text-muted-foreground whitespace-nowrap">
            {new Date(task.due_date).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}
          </span>
        )}
        <Badge
          variant="outline"
          className={cn(
            getPriorityStyles(task.priority),
            "transition-colors duration-200"
          )}
        >
          {task.priority}
        </Badge>
        {selectedProjectId === "all" && task.project?.name && (
          <Badge variant="secondary" className="whitespace-nowrap">
            {task.project.name}
          </Badge>
        )}
      </div>
    </div>
  );

  const renderLoading = () => (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="flex items-center justify-between p-4 border rounded-lg"
        >
          <div className="space-y-2">
            <Skeleton className="h-4 w-[250px]" />
            <Skeleton className="h-4 w-[150px]" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-5 w-16" />
          </div>
        </div>
      ))}
    </div>
  );

  const isLoading = isLoadingAllTasks || isLoadingProjectTasks;

  return (
    <>
      <h2 className="text-xl font-semibold mb-6 text-foreground">
        {selectedProjectId === "all" ? "My Tasks" : `Tasks - ${projectName}`}
      </h2>
      <Tabs defaultValue="upcoming" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="overdue">Overdue</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>

        {isLoading
          ? renderLoading()
          : ["upcoming", "overdue", "completed"].map((status) => (
              <TabsContent
                key={status}
                value={status}
                className="space-y-4 focus:outline-none"
              >
                {getFilteredTasks(status).map(renderTask)}
                {getFilteredTasks(status).length === 0 && (
                  <div className="text-center text-muted-foreground py-8">
                    No {status} tasks{" "}
                    {selectedProjectId === "all"
                      ? "assigned to you"
                      : "in this project"}
                  </div>
                )}
              </TabsContent>
            ))}
      </Tabs>
    </>
  );
}

export default TaskList;
