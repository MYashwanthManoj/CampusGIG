import Link from "next/link";
import { listTasks } from "@/lib/db/queries";
import { TaskCard } from "@/components/task-card";

export default async function TasksPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  let tasks: Awaited<ReturnType<typeof listTasks>> = [];
  let unavailable = false;
  try { tasks = await listTasks(q); } catch { unavailable = true; }
  return <main className="page-shell">
    <div className="page-heading"><p className="eyebrow">Small work. Real proof.</p><h1>Find your next proof point.</h1><p className="muted">Clearly scoped work for verified student talent.</p></div>
    <form className="inline-form" role="search"><label className="field" htmlFor="task-search">Search tasks<input id="task-search" name="q" defaultValue={q} maxLength={100} placeholder="Try landing page, design, spreadsheet…" /></label><button className="button primary">Search</button></form>
    {unavailable ? <div className="notice error" role="alert"><h2>Marketplace temporarily unavailable</h2><p>No tasks are being invented. Configure Supabase and apply the migration to load real listings.</p><Link href="/login">Check sign-in setup</Link></div> : tasks.length === 0 ? <div className="panel"><h2>No open tasks found.</h2><p>Try a different search or publish the first task.</p><Link className="button secondary" href="/client/tasks/new">Post a task</Link></div> : <div className="task-grid">{tasks.map(task => <TaskCard key={task.id} task={task} />)}</div>}
  </main>;
}