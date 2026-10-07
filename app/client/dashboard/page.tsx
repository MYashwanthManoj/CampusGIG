import Link from "next/link";
import { requireRole } from "@/lib/auth/session";
import { applicationsForTask, ownContracts, ownTasks } from "@/lib/db/queries";

export default async function ClientDashboard() {
  const profile = await requireRole("client");
  const [tasks, contracts] = await Promise.all([ownTasks(profile.id), ownContracts(profile.id, "client")]);
  const applicantSets = await Promise.all(tasks.filter(task => task.status === "OPEN").map(async task => ({ task, applications: await applicationsForTask(task.id) })));
  const submitted = contracts.filter(contract => contract.status === "SUBMITTED");
  const active = contracts.filter(contract => !["COMPLETED", "CANCELLED"].includes(contract.status));
  return <main className="page-shell"><div className="page-heading"><p className="eyebrow">The client desk</p><h1>Small tasks. Serious talent.</h1><p className="muted">Welcome back, {profile.full_name}. Here is what needs your attention.</p><Link href="/client/tasks/new" className="button primary">Post a new task</Link></div>
    <section className="panel stack"><h2>Work waiting for approval</h2>{submitted.length ? submitted.map(contract => <Link className="work-row" key={contract.id} href={`/client/contracts/${contract.id}`}><strong>{contract.tasks?.title}</strong><span className="badge">Review delivery</span></Link>) : <p className="muted">No submissions waiting for review.</p>}</section>
    <section className="panel stack"><h2>Applicants and open tasks</h2>{applicantSets.length ? applicantSets.map(({ task, applications }) => <Link className="work-row" key={task.id} href={`/client/tasks/${task.id}/applicants`}><strong>{task.title}</strong><span>{applications.filter(app => app.status === "PENDING").length} pending applications</span><span className="badge">Review applicants →</span></Link>) : <p className="muted">Post a task to receive applications.</p>}</section>
    <section className="panel stack"><h2>Active contracts</h2>{active.length ? active.map(contract => <Link className="work-row" key={contract.id} href={`/client/contracts/${contract.id}`}><strong>{contract.tasks?.title}</strong><span className="badge">{contract.status.replaceAll("_", " ")}</span></Link>) : <p className="muted">No active contracts.</p>}</section>
    <Link href="/client/profile" className="button secondary">Manage your profile</Link>
    <p className="notice">Demo payment state — no real money is transferred.</p>
  </main>;
}