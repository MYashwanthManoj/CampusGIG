import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { getTask } from "@/lib/db/queries";
import { getProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { money, date } from "@/lib/format";
import { WorkflowForm } from "@/components/workflow-form";
import { calculateMatch } from "@/lib/matching";
import type { StudentEvidence } from "@/lib/matching";
import { explainMatchWithAI } from "@/lib/ai";
import { canonicalSkillsSchema } from "@/lib/validation";

export default async function TaskDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!z.guid().safeParse(id).success) notFound();
  const task = await getTask(id);
  if (!task) notFound();
  const profile = await getProfile();
  let match: ReturnType<typeof calculateMatch> | null = null;
  let explanation = "";
  let explanationSource = "fallback";
  let applied = false;
  if (profile?.role === "student") {
    const supabase = await createClient();
    const [evidence, application] = await Promise.all([
      supabase.rpc("get_student_evidence", { p_student_id: profile.id, p_task_id: task.id }),
      supabase.from("applications").select("id").eq("task_id", task.id).eq("student_id", profile.id).maybeSingle(),
    ]);
    if (evidence.error || application.error) throw new Error("Evidence could not be loaded. Please retry.");
    if (evidence.data) {
      const facts = evidence.data as StudentEvidence;
      const requirements = canonicalSkillsSchema.parse((task.task_skills ?? []).flatMap(item => item.skills ? [item.skills.slug] : []));
      match = calculateMatch({ requiredSkills: requirements }, facts);
      const rationale = await explainMatchWithAI({ requiredSkills: requirements }, facts, match);
      explanation = rationale.explanation;
      explanationSource = rationale.source;
    }
    applied = Boolean(application.data);
  }
  const analysis = task.ai_analysis as { deliverables?: string[]; requirements?: string[]; hoursMin?: number; hoursMax?: number } | null;
  return <main className="page-shell">
    <Link href="/tasks" className="muted">← All tasks</Link>
    <div className="page-heading"><p className="eyebrow">{task.status.replaceAll("_", " ")} · {task.ai_source === "fallback" ? "Difficulty not estimated" : task.difficulty ?? "Scope defined by client"}</p><h1>{task.title}</h1><div className="metadata"><strong>{money(task.fixed_price)}</strong><span>Due {date(task.deadline)}</span><span>{analysis?.hoursMax ? `${analysis.hoursMin}–${analysis.hoursMax} estimated hours` : "Effort estimate unavailable"}</span></div></div>
    <div className="workspace-grid">
      <section className="stack"><div className="panel"><h2>The brief</h2><p style={{ whiteSpace: "pre-wrap" }}>{task.description}</p><div className="metadata">{task.task_skills?.map(({ skills }) => skills && <span className="badge" key={skills.slug}>{skills.name}</span>)}</div></div>
        {analysis && <div className="panel"><p className="eyebrow">Analysis source: {task.ai_source ?? "client"}</p><h2>What needs to be delivered</h2><ul>{analysis.deliverables?.map(item => <li key={item}>{item}</li>)}</ul><h3>Requirements</h3><ul>{analysis.requirements?.map(item => <li key={item}>{item}</li>)}</ul></div>}
        <p className="notice">Demo payment state — no real money is transferred.</p>
      </section>
      <aside className="stack">
        {match && <div className="panel"><p className="eyebrow">Code calculates. Evidence explains.</p><h2>{match.total}% evidence-based match</h2><dl className="stack">{Object.entries(match).filter(([key]) => key !== "total").map(([factor, value]) => <div className="metadata" key={factor}><dt>{factor}</dt><dd>{value}</dd></div>)}</dl><p>{explanation}</p><small className="muted">{explanationSource === "live" ? "AI-selected explanation, rendered from validated evidence." : `Explanation source: ${explanationSource}. No live AI prose is being claimed.`}</small></div>}
        <div className="panel"><h2>Your next move</h2>{profile?.role === "student" ? applied ? <><p>You have already applied.</p><Link className="button secondary" href="/student/applications">View applications</Link></> : task.status === "OPEN" ? <WorkflowForm operation="apply" entityId={task.id} label="Apply for this task" /> : <p>This task is no longer accepting applications.</p> : profile?.id === task.client_id ? <Link className="button primary" href={`/client/tasks/${task.id}/applicants`}>Review applicants</Link> : <><p>Sign in as a student to see your evidence-based match and apply.</p><Link className="button primary" href="/login">Sign in</Link></>}</div>
      </aside>
    </div>
  </main>;
}