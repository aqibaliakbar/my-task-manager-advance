"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, MoreHorizontal, GripVertical } from "lucide-react";

import { cn } from "@/lib/utils";
import TaskCard from "../tasks/TaskCard";
import { Draggable, Droppable } from "@hello-pangea/dnd";

const DroppableSection = ({
  section,
  index,
  tasks = [],
  onAddTask,
  onDeleteTask,
  onDeleteSection,
  projectId,
  userId,
  isDragging,
}) => {
  return (
    <Draggable draggableId={section.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          className={cn(
            "w-[300px] flex-shrink-0",
            "transition-transform duration-200",
            snapshot.isDragging && "rotate-[2deg] scale-105"
          )}
        >
          <div
            className={cn(
              "flex flex-col bg-card rounded-lg border",
              "transition-shadow duration-200",
              snapshot.isDragging && "shadow-lg"
            )}
          >
            {/* Section Header with Drag Handle */}
            <div
              className="flex items-center justify-between p-3 border-b group cursor-grab active:cursor-grabbing"
              {...provided.dragHandleProps}
            >
              <div className="flex items-center gap-2">
                <GripVertical
                  className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-hidden="true"
                />
                <h2 className="font-medium truncate text-foreground">
                  {section.name}
                </h2>
                <Badge variant="secondary" aria-label={`${tasks.length} tasks`}>
                  {tasks.length}
                </Badge>
              </div>

              {/* Section Actions */}
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onAddTask(section.id)}
                  className="hover:bg-muted transition-colors"
                  aria-label="Add task"
                >
                  <Plus className="h-4 w-4" />
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="hover:bg-muted transition-colors"
                      aria-label="More options"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive focus:bg-destructive/10"
                      onClick={() => onDeleteSection(section)}
                    >
                      Delete Section
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Tasks Droppable Area */}
            <Droppable droppableId={section.id} type="TASK">
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={cn(
                    "flex-1 p-2 min-h-[200px] rounded-lg",
                    "transition-colors duration-200",
                    snapshot.isDraggingOver
                      ? "bg-muted ring-2 ring-inset ring-primary/20"
                      : isDragging
                      ? "bg-muted/50"
                      : ""
                  )}
                >
                  <div className="space-y-2">
                    {tasks.map((task, taskIndex) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        index={taskIndex}
                        onDelete={onDeleteTask}
                        projectId={projectId}
                        userId={userId}
                      />
                    ))}
                  </div>
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </div>
        </div>
      )}
    </Draggable>
  );
};

export default DroppableSection;
