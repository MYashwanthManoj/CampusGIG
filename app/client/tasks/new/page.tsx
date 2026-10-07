import { requireRole } from "@/lib/auth/session";
import { TaskComposer } from "@/components/task-composer";
export default async function NewTask() {
  await requireRole("client");
  return <main className="page-shell"><div className="page-heading"><p className="eyebrow">Brief → requirements → opportunity</p><h1>What needs doing?</h1><p className="muted">Start with a natural-language brief. Review its structure before publishing.</p></div><TaskComposer /></main>;
}