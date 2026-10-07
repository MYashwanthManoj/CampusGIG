import Link from "next/link";
import { requireRole } from "@/lib/auth/session";
import { ownApplications } from "@/lib/db/queries";

export default async function ApplicationsPage() {
  const profile = await requireRole("student");
  const applications = await ownApplications(profile.id);
  return <main className="page-shell"><div className="page-heading"><p className="eyebrow">Your pipeline</p><h1>Applications, without the guesswork.</h1></div><div className="stack">{applications.length ? applications.map(app => <article className="panel" key={app.id}><div className="metadata"><h2><Link href={`/tasks/${app.task_id}`}>{app.tasks?.title ?? "Task"}</Link></h2><span className="badge">{app.status}</span></div><p>{app.cover_note}</p><p>{app.match_score}% evidence-based match at application time</p>{app.status === "ACCEPTED" && <Link href="/student/dashboard" className="button primary">Open your work dashboard</Link>}</article>) : <div className="panel"><p>No applications yet.</p><Link href="/tasks" className="button primary">Find your first task</Link></div>}</div></main>;
}