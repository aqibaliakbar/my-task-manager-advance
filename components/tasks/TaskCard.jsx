"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, User, Calendar, X, Check } from "lucide-react";

import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  useCreateTaskMutation,
  useGetProjectQuery,
  useGetTeamMembersQuery,
  useGetUsersQuery,
  useUpdateTaskMutation,
} from "@/redux/features/services/api";
import { Draggable } from "@hello-pangea/dnd";

function TaskCard({ task, index, onDelete, projectId, userId }) {
  const { toast } = useToast();
  const [updateTask] = useUpdateTaskMutation();
  const [createTask] = useCreateTaskMutation();
  const [showSubtaskInput, setShowSubtaskInput] = useState(false);
  const [newSubtaskDescription, setNewSubtaskDescription] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [open, setOpen] = useState(false);

  const { data: allUsers = [] } = useGetUsersQuery();
  const { data: project } = useGetProjectQuery(projectId);
  const { data: teamMembers = [] } = useGetTeamMembersQuery(project?.team_id, {
    skip: !project?.team_id,
  });

  const handleComplete = async () => {
    if (isUpdating) return;
    setIsUpdating(true);

    try {
      await updateTask({
        taskId: task.id,
        completed: !task.completed,
        project_id: projectId,
      }).unwrap();

      toast({
        description: `Task marked as ${
          !task.completed ? "complete" : "incomplete"
        }`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        description: "Failed to update task status",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAddSubtask = async (e) => {
    e.preventDefault();
    if (!newSubtaskDescription.trim() || isUpdating) return;

    setIsUpdating(true);
    try {
      await createTask({
        description: newSubtaskDescription,
        project_id: projectId,
        section_id: task.section_id,
        parent_task_id: task.id,
        is_subtask: true,
        created_by: userId,
        priority: task.priority,
        created_at: new Date().toISOString(),
        completed: false,
      }).unwrap();

      setNewSubtaskDescription("");
      setShowSubtaskInput(false);
      toast({
        description: "Subtask added successfully",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        description: "Failed to create subtask",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSubtaskComplete = async (subtaskId, currentCompleted) => {
    if (isUpdating) return;
    setIsUpdating(true);

    try {
      await updateTask({
        taskId: subtaskId,
        completed: !currentCompleted,
        project_id: projectId,
      }).unwrap();

      toast({
        description: `Subtask marked as ${
          !currentCompleted ? "complete" : "incomplete"
        }`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        description: "Failed to update subtask",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAssignUser = async (selectedUserId) => {
    if (isUpdating) return;
    setIsUpdating(true);

    try {
      await updateTask({
        taskId: task.id,
        assigned_to: selectedUserId,
        project_id: projectId,
      }).unwrap();

      setOpen(false);
      toast({
        description: selectedUserId
          ? "Task assigned successfully"
          : "Task unassigned successfully",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        description: "Failed to assign task",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const getPriorityVariant = (priority) => {
    switch (priority) {
      case "Low":
        return "success";
      case "Medium":
        return "warning";
      case "High":
        return "destructive";
      default:
        return "secondary";
    }
  };

  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={cn(
            "bg-card rounded-lg border p-3 mb-2 select-none",
            "transition-all duration-200",
            snapshot.isDragging ? "shadow-lg scale-102" : "hover:shadow-sm",
            isUpdating && "opacity-70 pointer-events-none"
          )}
        >
          {/* Priority and Menu */}
          <div className="flex justify-between items-start mb-2">
            <Badge variant={getPriorityVariant(task.priority)}>
              {task.priority}
            </Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  aria-label="Task actions"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => onDelete(task.id)}
                  className="text-destructive"
                >
                  Delete Task
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Task Description */}
          <h3
            className={cn(
              "font-medium mb-2 text-foreground",
              task.completed && "line-through text-muted-foreground"
            )}
          >
            {task.description}
          </h3>

          {/* Task Actions */}
          <div className="flex items-center justify-between text-muted-foreground">
            <div className="flex items-center gap-2">
              <span className="text-xs">
                {task.subtasks?.filter((st) => st.completed).length || 0}/
                {task.subtasks?.length || 0}
              </span>

              {/* Assignee Popover */}
              <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    aria-label="Assign task"
                  >
                    {task.assigned_to ? (
                      <Avatar className="h-6 w-6">
                        <AvatarFallback>
                          {allUsers
                            .find((u) => u.id === task.assigned_to)
                            ?.full_name?.charAt(0)
                            .toUpperCase() || "?"}
                        </AvatarFallback>
                      </Avatar>
                    ) : (
                      <User className="h-4 w-4" />
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0" align="start">
                  <Command>
                    <CommandInput
                      placeholder="Search users..."
                      className="border-none focus:ring-0"
                    />
                    <CommandList>
                      <CommandEmpty>No users found</CommandEmpty>
                      <CommandGroup>
                        <ScrollArea className="h-[200px]">
                          <CommandItem
                            onSelect={() => handleAssignUser(null)}
                            className="flex items-center gap-2 p-2"
                          >
                            <div className="flex items-center gap-2 flex-1">
                              <Avatar className="h-6 w-6">
                                <AvatarFallback>
                                  <User className="h-4 w-4" />
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex flex-col">
                                <span className="text-sm font-medium">
                                  Unassigned
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  Remove assignee
                                </span>
                              </div>
                            </div>
                            {!task.assigned_to && <Check className="h-4 w-4" />}
                          </CommandItem>

                          {allUsers.map((user) => (
                            <CommandItem
                              key={user.id}
                              onSelect={() => handleAssignUser(user.id)}
                              className="flex items-center gap-2 p-2"
                            >
                              <div className="flex items-center gap-2 flex-1">
                                <Avatar className="h-6 w-6">
                                  <AvatarFallback>
                                    {user.full_name?.charAt(0).toUpperCase() ||
                                      "?"}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex flex-col">
                                  <span className="text-sm font-medium">
                                    {user.full_name || "Unknown"}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    {user.email}
                                  </span>
                                </div>
                              </div>
                              {task.assigned_to === user.id && (
                                <Check className="h-4 w-4" />
                              )}
                            </CommandItem>
                          ))}
                        </ScrollArea>
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>

              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={handleComplete}
                disabled={isUpdating}
                aria-label={
                  task.completed ? "Mark as incomplete" : "Mark as complete"
                }
              >
                <Checkbox checked={task.completed} />
              </Button>
            </div>

            {task.due_date && (
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span className="text-sm">
                  {new Date(task.due_date).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </div>
            )}
          </div>

          {/* Subtasks */}
          {task.subtasks?.map((subtask) => (
            <div
              key={subtask.id}
              className="flex items-center justify-between mt-2 pl-4 group hover:bg-muted rounded-sm py-1"
            >
              <div className="flex items-center gap-2">
                <Checkbox
                  id={`subtask-${subtask.id}`}
                  checked={subtask.completed}
                  disabled={isUpdating}
                  onCheckedChange={() =>
                    handleSubtaskComplete(subtask.id, subtask.completed)
                  }
                />
                <label
                  htmlFor={`subtask-${subtask.id}`}
                  className={cn(
                    "text-sm cursor-pointer text-foreground",
                    subtask.completed && "line-through text-muted-foreground"
                  )}
                >
                  {subtask.description}
                </label>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 opacity-0 group-hover:opacity-100"
                disabled={isUpdating}
                onClick={() => onDelete(subtask.id)}
                aria-label="Delete subtask"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}

          {/* Add Subtask */}
          {showSubtaskInput ? (
            <form onSubmit={handleAddSubtask} className="mt-2">
              <Input
                value={newSubtaskDescription}
                onChange={(e) => setNewSubtaskDescription(e.target.value)}
                placeholder="Add subtask..."
                className="text-sm"
                disabled={isUpdating}
                autoFocus
                onBlur={() => {
                  if (!newSubtaskDescription.trim()) {
                    setShowSubtaskInput(false);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    setShowSubtaskInput(false);
                    setNewSubtaskDescription("");
                  }
                }}
              />
            </form>
          ) : (
            <Button
              variant="ghost"
              className="w-full mt-2 justify-start text-muted-foreground text-sm hover:text-foreground"
              disabled={isUpdating}
              onClick={() => setShowSubtaskInput(true)}
            >
              + Add SubTask
            </Button>
          )}
        </div>
      )}
    </Draggable>
  );
}

export default TaskCard;
