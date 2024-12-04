"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ChevronFirst,
  ChevronLast,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Clock,
  ArrowUp,
  ArrowDown,
  CheckCircle2,
  View,
  Loader2,
} from "lucide-react";
import { useSelector } from "react-redux";
import { cn } from "@/lib/utils";
import { useGetTasksQuery } from "@/redux/features/services/api";

const columns = [
  { id: "description", label: "Description" },
  { id: "status", label: "Status" },
  { id: "priority", label: "Priority" },
  { id: "dueDate", label: "Due Date" },
  { id: "project", label: "Project" },
];

function MyTasks() {
  const [filterText, setFilterText] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [visibleColumns, setVisibleColumns] = useState({
    description: true,
    status: true,
    priority: true,
    dueDate: true,
    project: true,
  });

  const { session } = useSelector((state) => state.user);
  const userId = session?.user?.id;
  const { data: tasks = [], isLoading } = useGetTasksQuery();

  const statusConfig = {
    completed: { icon: CheckCircle2, color: "text-green-600" },
    overdue: { icon: Clock, color: "text-red-600" },
    upcoming: { icon: Clock, color: "text-blue-600" },
  };

  const priorityConfig = {
    high: { icon: ArrowUp, color: "text-red-600", label: "High" },
    low: { icon: ArrowDown, color: "text-blue-600", label: "Low" },
    medium: { icon: ArrowUpDown, color: "text-yellow-600", label: "Medium" },
    default: { icon: ArrowUpDown, color: "text-gray-600", label: "Normal" },
  };

  const getTaskStatus = (task) => {
    if (!task.due_date) return "upcoming";
    if (task.completed) return "completed";
    return new Date(task.due_date) < new Date() ? "overdue" : "upcoming";
  };

  const filteredTasks = tasks.filter((task) => {
    const matchesText =
      !filterText ||
      task.description?.toLowerCase().includes(filterText.toLowerCase());

    const taskStatus = getTaskStatus(task);
    const matchesStatus = statusFilter === "all" || taskStatus === statusFilter;

    const taskPriority = (task.priority || "low").toLowerCase();
    const matchesPriority =
      priorityFilter === "all" || taskPriority === priorityFilter;

    return matchesText && matchesStatus && matchesPriority;
  });

  const paginatedTasks = filteredTasks.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const totalPages = Math.ceil(filteredTasks.length / rowsPerPage);

  const getStatusIcon = (task) => {
    const status = getTaskStatus(task);
    const StatusIcon = statusConfig[status].icon;
    return <StatusIcon className={cn("h-4 w-4", statusConfig[status].color)} />;
  };

  const getPriorityIcon = (priority) => {
    const priorityKey = (priority || "low").toLowerCase();
    const config = priorityConfig[priorityKey] || priorityConfig.default;
    const PriorityIcon = config.icon;
    return (
      <div className="flex items-center gap-2">
        <PriorityIcon className={cn("h-4 w-4", config.color)} />
        <span>{config.label}</span>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Welcome back!</h1>
        <p className="text-muted-foreground">
          Here's a list of your tasks in this workspace!
        </p>
      </div>

      <div className="flex items-center justify-between gap-4 flex-col sm:flex-row">
        <Input
          placeholder="Filter tasks..."
          className="w-full sm:w-[300px]"
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
        />

        <div className="flex items-center gap-4 flex-wrap">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]">
              <Clock className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="upcoming">Upcoming</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>

          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-[150px]">
              <ArrowUpDown className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priority</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <View className="h-4 w-4 mr-2" />
                Toggle columns
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[150px]">
              {columns.map((column) => (
                <DropdownMenuCheckboxItem
                  key={column.id}
                  checked={visibleColumns[column.id]}
                  onCheckedChange={(checked) =>
                    setVisibleColumns((prev) => ({
                      ...prev,
                      [column.id]: checked,
                    }))
                  }
                >
                  {column.label}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Table Section */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map(
                (column) =>
                  visibleColumns[column.id] && (
                    <TableHead key={column.id}>{column.label}</TableHead>
                  )
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedTasks.length > 0 ? (
              paginatedTasks.map((task) => (
                <TableRow key={task.id}>
                  {visibleColumns.description && (
                    <TableCell>{task.description}</TableCell>
                  )}
                  {visibleColumns.status && (
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(task)}
                        <span className="capitalize">
                          {getTaskStatus(task)}
                        </span>
                      </div>
                    </TableCell>
                  )}
                  {visibleColumns.priority && (
                    <TableCell>{getPriorityIcon(task.priority)}</TableCell>
                  )}
                  {visibleColumns.dueDate && (
                    <TableCell>
                      {task.due_date
                        ? new Date(task.due_date).toLocaleDateString("en-US", {
                            month: "short",
                            day: "2-digit",
                            year: "2-digit",
                          })
                        : "No due date"}
                    </TableCell>
                  )}
                  {visibleColumns.project && (
                    <TableCell>
                      <span className="px-2 py-1 text-sm bg-muted rounded">
                        {task.projects?.name || "No Project"}
                      </span>
                    </TableCell>
                  )}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={Object.values(visibleColumns).filter(Boolean).length}
                  className="text-center py-8 text-muted-foreground"
                >
                  No tasks found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Section */}
      <div className="flex items-center justify-between flex-col gap-4 sm:flex-row">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Rows per page</span>
          <Select
            value={rowsPerPage.toString()}
            onValueChange={(value) => {
              setRowsPerPage(Number(value));
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="w-[70px]">
              <SelectValue>{rowsPerPage}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {[5, 10, 20, 50].map((value) => (
                <SelectItem key={value} value={value.toString()}>
                  {value}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages || 1}
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
            >
              <ChevronFirst className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() =>
                setCurrentPage((prev) => Math.min(totalPages, prev + 1))
              }
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
            >
              <ChevronLast className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MyTasks;
