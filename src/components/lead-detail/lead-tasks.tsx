"use client";

import * as React from "react";
import { toast } from "sonner";
import { isPast, parseISO } from "date-fns";
import { ListChecks, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyState } from "@/components/shared/empty-state";
import { useCrmStore } from "@/store/use-crm-store";
import { formatDate } from "@/lib/format";
import { PRIORITY_MAP, TASK_PRIORITIES, TONE_BADGE } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { Task, TaskPriority } from "@/lib/types";

export function LeadTasks({
  leadId,
  tasks,
}: {
  leadId: string;
  tasks: Task[];
}) {
  const addTask = useCrmStore((s) => s.addTask);
  const toggleTask = useCrmStore((s) => s.toggleTask);
  const deleteTask = useCrmStore((s) => s.deleteTask);

  const [title, setTitle] = React.useState("");
  const [due, setDue] = React.useState("");
  const [priority, setPriority] = React.useState<TaskPriority>("medium");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    await addTask({
      leadId,
      title: title.trim(),
      dueDate: due ? new Date(`${due}T09:00:00`).toISOString() : undefined,
      priority,
    });
    setTitle("");
    setDue("");
    setPriority("medium");
    toast.success("Task added");
  }

  return (
    <div className="space-y-4">
      <form onSubmit={submit} className="space-y-2">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Add a task…"
        />
        <div className="flex gap-2">
          <Input
            type="date"
            value={due}
            onChange={(e) => setDue(e.target.value)}
            className="flex-1"
          />
          <Select
            value={priority}
            onValueChange={(v) => setPriority(v as TaskPriority)}
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TASK_PRIORITIES.map((p) => (
                <SelectItem key={p.value} value={p.value}>
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button type="submit" size="icon" disabled={!title.trim()}>
            <Plus className="size-4" />
          </Button>
        </div>
      </form>

      {tasks.length === 0 ? (
        <EmptyState
          icon={ListChecks}
          title="No tasks yet"
          description="Add to-dos to stay on top of this deal."
          className="border-0 py-6"
        />
      ) : (
        <ul className="space-y-1.5">
          {tasks.map((task) => {
            const overdue =
              !task.completed && task.dueDate && isPast(parseISO(task.dueDate));
            const tone = PRIORITY_MAP[task.priority].tone ?? "slate";
            return (
              <li
                key={task.id}
                className="group flex items-center gap-3 rounded-lg border px-3 py-2"
              >
                <Checkbox
                  checked={task.completed}
                  onCheckedChange={() => toggleTask(task.id)}
                />
                <div className="min-w-0 flex-1">
                  <p
                    className={cn(
                      "text-sm",
                      task.completed && "text-muted-foreground line-through",
                    )}
                  >
                    {task.title}
                  </p>
                  {task.dueDate && (
                    <p
                      className={cn(
                        "text-xs",
                        overdue ? "text-destructive" : "text-muted-foreground",
                      )}
                    >
                      Due {formatDate(task.dueDate)}
                    </p>
                  )}
                </div>
                <span
                  className={cn(
                    "rounded-md border px-1.5 py-0.5 text-[11px] font-medium",
                    TONE_BADGE[tone],
                  )}
                >
                  {PRIORITY_MAP[task.priority].label}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7 opacity-0 transition-opacity group-hover:opacity-100"
                  onClick={async () => {
                    await deleteTask(task.id);
                    toast.success("Task deleted");
                  }}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
