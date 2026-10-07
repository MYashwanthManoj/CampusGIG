import Link from "next/link";
import { requireRole } from "@/lib/auth/session";
import { careerProof, ownApplications, ownContracts } from "@/lib/db/queries";
import { CareerProof as CareerProofPanel } from "@/components/career-proof";
import { date } from "@/lib/format";

export default async function StudentDashboard() {
  const profile = await requireRole("student");
  const [proof, contracts, applications] = await Promise.all([careerProof(profile.id), ownContracts(profile.id, "student"), ownApplications(profile.id)]);
  const active = contracts.filter(contract => !["COMPLETED", "CANCELLED"].includes(contract.status));
  return <main className="page-shell"><div className="page-heading"><p className="eyebrow">{profile.verified_status ? "Verified student" : "Student · verification pending"}</p><h1>Make your next move, {profile.full_name.split(" ")[0]}.</h1><p className="muted">Your work, your next action, your growing proof.</p></div>
    <section className="panel stack"><div className="metadata"><h2>Work needing attention</h2><Link href="/tasks" className="button secondary">Find work</Link></div>{active.length ? active.map(contract => <Link className="work-row" key={contract.id} href={`/student/work/${contract.id}`}><strong>{contract.tasks?.title ?? "Task"}</strong><span className="badge">{contract.status.replaceAll("_", " ")}</span><span>Due {date(contract.due_at)}</span></Link>) : <p className="muted">No active work. Apply to a task to start building proof.</p>}</section>
    <section className="panel stack"><h2>Applications</h2><p>{applications.filter(app => app.status === "PENDING").length} pending · {applications.filter(app => app.status === "ACCEPTED").length} accepted</p><Link href="/student/applications" className="button secondary">Track applications</Link></section>
    <section className="panel"><Link className="button secondary" href="/student/profile">Manage profile and verification</Link></section>
    <CareerProofPanel proof={proof} />
  </main>;
}