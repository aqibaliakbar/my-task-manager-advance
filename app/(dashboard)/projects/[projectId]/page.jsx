"use client";

import { useState, useMemo } from "react";
import { useParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Loader2 } from "lucide-react";
import {
  useDeleteTaskMutation,
  useGetProjectQuery,
  useGetProjectTasksQuery,
  useGetSectionsQuery,
  useMoveTaskMutation,
  useUpdateSectionMutation,
} from "@/redux/features/services/api";
import { useSelector } from "react-redux";

import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

import TaskDialog from "@/components/tasks/TaskDialog";
import SectionDialog from "@/components/projects/SectionDialog";
import DroppableSection from "@/components/projects/DroppableSection";
import DragDropProvider from "@/components/Drag&DropProvider";
import { DragDropContext, Droppable } from "@hello-pangea/dnd";

function ProjectBoard() {
  const params = useParams();
  const projectId = params.projectId;

  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [isSectionDialogOpen, setIsSectionDialogOpen] = useState(false);
  const [selectedSection, setSelectedSection] = useState(null);
  const [sectionToDelete, setSectionToDelete] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const { toast } = useToast();

  const { session } = useSelector((state) => state.user);
  const userId = session?.user?.id;

  const { data: project } = useGetProjectQuery(projectId);
  const { data: sections = [], isLoading: isLoadingSections } =
    useGetSectionsQuery(projectId, {
      skip: !projectId,
    });
  const { data: tasks = [], isLoading: isLoadingTasks } =
    useGetProjectTasksQuery(projectId, {
      skip: !projectId,
    });

  const [moveTask] = useMoveTaskMutation();
  const [updateSection] = useUpdateSectionMutation();
  const [deleteTask] = useDeleteTaskMutation();

  const tasksBySection = useMemo(() => {
    const mainTasks = tasks.filter((task) => !task.is_subtask);
    return sections.reduce((acc, section) => {
      acc[section.id] = mainTasks.filter(
        (task) => task.section_id === section.id
      );
      return acc;
    }, {});
  }, [tasks, sections]);

  const onDragEnd = async (result) => {
    setIsDragging(false);
    const { destination, source, draggableId, type } = result;

    if (!destination) return;
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    try {
      if (type === "section") {
        const newSections = Array.from(sections);
        const [removed] = newSections.splice(source.index, 1);
        newSections.splice(destination.index, 0, removed);

        for (let i = 0; i < newSections.length; i++) {
          await updateSection({
            sectionId: newSections[i].id,
            position: i,
            project_id: projectId,
          }).unwrap();
        }
      } else {
        await moveTask({
          taskId: draggableId,
          sectionId: destination.droppableId,
          project_id: projectId,
        }).unwrap();
      }
    } catch (error) {
      console.error("Error during drag and drop:", error);
      toast.error("Failed to update position");
    }
  };

  const handleAddTask = (sectionId) => {
    setSelectedSection(sectionId);
    setIsTaskDialogOpen(true);
  };

  const handleDeleteTask = async (taskId) => {
    try {
      await deleteTask({
        taskId,
        project_id: projectId,
      }).unwrap();
      toast("Task deleted successfully");
    } catch (error) {
      console.error("Error deleting task:", error);
      toast("Failed to delete task");
    }
  };

  const handleDeleteSection = (section) => {
    setSectionToDelete(section);
    setIsSectionDialogOpen(true);
  };

  if (isLoadingSections || isLoadingTasks) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-10 flex items-center justify-between p-4 bg-background border-b backdrop-blur-sm bg-background/90">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold text-foreground">
            {project?.name}
          </h1>
          <Badge variant="secondary" className="font-medium">
            {project?.privacy}
          </Badge>
        </div>
      </div>
      <DragDropProvider>
        <DragDropContext
          onDragEnd={onDragEnd}
          onDragStart={() => setIsDragging(true)}
        >
          <Droppable droppableId="board" type="section" direction="horizontal">
            {(provided) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className={cn(
                  "p-6 flex gap-4 overflow-x-auto min-h-[calc(100vh-4rem)]",
                  "transition-colors duration-200",
                  isDragging ? "bg-muted" : "bg-background"
                )}
              >
                {sections.map((section, index) => (
                  <DroppableSection
                    key={section.id}
                    section={section}
                    index={index}
                    tasks={tasksBySection[section.id] || []}
                    onAddTask={handleAddTask}
                    onDeleteTask={handleDeleteTask}
                    onDeleteSection={handleDeleteSection}
                    projectId={projectId}
                    userId={userId}
                    isDragging={isDragging}
                  />
                ))}
                {provided.placeholder}

                <Button
                  variant="outline"
                  className="flex items-center gap-2 h-10 whitespace-nowrap hover:bg-accent transition-colors"
                  onClick={() => {
                    setSectionToDelete(null);
                    setIsSectionDialogOpen(true);
                  }}
                >
                  <Plus className="h-4 w-4" />
                  Add Section
                </Button>
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </DragDropProvider>

      {isTaskDialogOpen && (
        <TaskDialog
          isOpen={isTaskDialogOpen}
          onClose={() => {
            setIsTaskDialogOpen(false);
            setSelectedSection(null);
          }}
          projectId={projectId}
          sectionId={selectedSection}
          userId={userId}
        />
      )}

      <SectionDialog
        isOpen={isSectionDialogOpen}
        onClose={() => {
          setIsSectionDialogOpen(false);
          setSectionToDelete(null);
        }}
        projectId={projectId}
        mode={sectionToDelete ? "delete" : "create"}
        sectionToDelete={sectionToDelete}
      />
    </div>
  );
}

export default ProjectBoard;
