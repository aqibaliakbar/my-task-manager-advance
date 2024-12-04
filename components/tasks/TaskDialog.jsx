"use client";

import { useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import {
  useCreateTaskMutation,
  useGetSectionsQuery,
} from "@/redux/features/services/api";
import { useSelector } from "react-redux";
import { useToast } from "@/hooks/use-toast";

function TaskDialog({ isOpen, onClose, projectId, sectionId }) {
  const { toast } = useToast();
  const { session } = useSelector((state) => state.user);
  const user = session?.user;

  const [createTask, { isLoading: isCreating }] = useCreateTaskMutation();
  const { data: sections = [], isLoading: isLoadingSections } =
    useGetSectionsQuery(projectId);

  const [formData, setFormData] = useState({
    description: "",
    priority: "",
    due_date: "",
    section_id: sectionId,
    project_id: projectId,
    created_by: user?.id,
    created_at: new Date().toISOString(),
    completed: false,
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.description.trim()) {
      toast({
        title: "Validation Error",
        description: "Description is required",
        variant: "destructive",
      });
      return;
    }

    try {
      await createTask({
        ...formData,
        description: formData.description.trim(),
      }).unwrap();

      toast({
        title: "Success",
        description: "Task created successfully",
      });

      onClose();

      setFormData({
        description: "",
        priority: "",
        due_date: "",
        section_id: sectionId,
        project_id: projectId,
        created_by: user?.id,
        created_at: new Date().toISOString(),
        completed: false,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to create task",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            Create Task
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Task description"
              className="resize-none h-24"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="section">Section</Label>
            <Select
              value={formData.section_id}
              onValueChange={(value) =>
                setFormData({ ...formData, section_id: value })
              }
              disabled={isLoadingSections}
            >
              <SelectTrigger id="section" className="w-full">
                <SelectValue placeholder="Select section" />
              </SelectTrigger>
              <SelectContent>
                {sections.map((section) => (
                  <SelectItem key={section.id} value={section.id}>
                    {section.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="priority">Priority</Label>
            <Select
              value={formData.priority}
              onValueChange={(value) =>
                setFormData({ ...formData, priority: value })
              }
            >
              <SelectTrigger id="priority" className="w-full">
                <SelectValue placeholder="Select task priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Low">Low</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="High">High</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Due date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !formData.due_date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.due_date ? (
                    format(new Date(formData.due_date), "PPP")
                  ) : (
                    <span>Pick due date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={
                    formData.due_date ? new Date(formData.due_date) : undefined
                  }
                  onSelect={(date) =>
                    setFormData({
                      ...formData,
                      due_date: date ? date.toISOString() : "",
                    })
                  }
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <Button
            type="submit"
            className="w-full mt-6"
            disabled={isCreating || !formData.description.trim()}
          >
            {isCreating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              "Create Task"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default TaskDialog;
