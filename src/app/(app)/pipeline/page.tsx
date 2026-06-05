import { PageHeader } from "@/components/shared/page-header";
import { KanbanBoard } from "@/components/pipeline/kanban-board";

export default function PipelinePage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Pipeline"
        description="Drag leads between stages to move deals forward."
      />
      <KanbanBoard />
    </div>
  );
}
