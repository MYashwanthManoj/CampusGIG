import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { requireRole } from "@/lib/auth/session";
import { applicationsForTask, getTask } from "@/lib/db/queries";
import { createClient } from "@/lib/supabase/server";
import { WorkflowForm } from "@/components/workflow-form";

export default async function ApplicantsPage({ params }: { params: Promise<{ id: string }> }) {
  const profile = await requireRole("client");
  const { id } = await params;
  if (!z.guid().safeParse(id).success) notFound();
  const task = await getTask(id);
  if (!task || task.client_id !== profile.id) notFound();
  const applications = await applicationsForTask(id);
  const supabase = await createClient();
  const studentIds = applications.map(app => app.student_id);
  const { data: students, error } = studentIds.length ? await supabase.from("public_student_profiles").select("id,full_name,headline,verified_status,college").in("id", studentIds) : { data: [], error: null };
  if (error) throw new Error("Student profiles could not be loaded.");
  const { data: contract, error: contractError } = await supabase.from("contracts").select("id").eq("task_id", id).maybeSingle();
  if (contractError) throw new Error("Contract state could not be loaded.");
  return <main className="page-shell"><Link href="/client/dashboard" className="muted">← Client desk</Link><div className="page-heading"><p className="eyebrow">{task.status.replaceAll("_", " ")}</p><h1>Talent for {task.title}</h1><p className="muted">Ranked by deterministic evidence, not invented proficiency.</p></div>{contract && <Link className="button primary" href={`/client/contracts/${contract.id}`}>Open hired workspace</Link>}
    <div className="stack">{applications.length ? applications.map(app => {
      const student = students?.find(student => student.id === app.student_id);
      return <article className="panel stack" key={app.id}><div className="metadata"><h2><Link href={`/students/${app.student_id}`}>{student?.full_name ?? "Student"}</Link></h2>{student?.verified_status && <span className="badge">Verified student</span>}<strong>{app.match_score}% evidence-based match</strong></div><p className="muted">{student?.headline} · {student?.college}</p><p>{app.cover_note}</p><dl className="metadata">{Object.entries(app.match_breakdown ?? {}).map(([key, value]) => <div key={key}><dt>{key}</dt><dd>{value}</dd></div>)}</dl>{app.match_explanation && <p>{app.match_explanation}</p>}<p>Status: {app.status}</p>{task.status === "OPEN" && app.status === "PENDING" && <WorkflowForm operation="hire" entityId={app.id} label="Hire this student" />}</article>;
    }) : <div className="panel"><h2>No applications yet.</h2><Link href={`/tasks/${task.id}`}>View the published task</Link></div>}</div>
  </main>;
}