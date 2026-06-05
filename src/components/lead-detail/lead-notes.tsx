"use client";

import * as React from "react";
import { toast } from "sonner";
import { StickyNote, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/shared/empty-state";
import { useCrmStore } from "@/store/use-crm-store";
import { formatRelative } from "@/lib/format";
import type { Note } from "@/lib/types";

export function LeadNotes({
  leadId,
  notes,
}: {
  leadId: string;
  notes: Note[];
}) {
  const addNote = useCrmStore((s) => s.addNote);
  const deleteNote = useCrmStore((s) => s.deleteNote);
  const [value, setValue] = React.useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!value.trim()) return;
    await addNote(leadId, value.trim());
    setValue("");
    toast.success("Note added");
  }

  return (
    <div className="space-y-4">
      <form onSubmit={submit} className="space-y-2">
        <Textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Write a note about this lead…"
          rows={3}
        />
        <div className="flex justify-end">
          <Button type="submit" size="sm" disabled={!value.trim()}>
            Add note
          </Button>
        </div>
      </form>

      {notes.length === 0 ? (
        <EmptyState
          icon={StickyNote}
          title="No notes yet"
          description="Capture context, requirements and next steps here."
          className="border-0 py-6"
        />
      ) : (
        <ul className="space-y-3">
          {notes.map((note) => (
            <li
              key={note.id}
              className="group bg-muted/30 rounded-lg border p-3"
            >
              <p className="text-sm whitespace-pre-wrap">{note.content}</p>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-muted-foreground text-xs">
                  {note.author ?? "You"} · {formatRelative(note.createdAt)}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7 opacity-0 transition-opacity group-hover:opacity-100"
                  onClick={async () => {
                    await deleteNote(note.id);
                    toast.success("Note deleted");
                  }}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
