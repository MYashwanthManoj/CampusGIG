import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth/session";
import { workspace } from "@/lib/db/queries";
import { WorkflowForm } from "@/components/workflow-form";
import { money, date } from "@/lib/format";
import { z } from "zod";

export async function ContractWorkspace({ id, role }: { id: string; role: "student" | "client" }) {
  const profile = await requireRole(role);
  if (!z.guid().safeParse(id).success) notFound();
  const data = await workspace(id);
  if (!data || (role === "student" ? data.contract.student_id : data.contract.client_id) !== profile.id) notFound();
  const { contract, task, submissions, payment, review } = data;
  return <main className="page-shell"><Link href={`/${role}/dashboard`} className="muted">← Your dashboard</Link>
    <div className="page-heading"><p className="eyebrow">Work → proof</p><h1>{task?.title ?? "Work workspace"}</h1><div className="metadata"><span className="badge">{contract.status.replaceAll("_", " ")}</span><strong>{money(contract.agreed_amount)}</strong><span>Due {date(contract.due_at)}</span></div></div>
    <div className="workspace-grid"><section className="stack">
      <div className="panel"><h2>Agreed scope</h2><p style={{ whiteSpace: "pre-wrap" }}>{task?.description}</p></div>
      {contract.revision_feedback && <div className="notice"><h2>Revision feedback</h2><p>{contract.revision_feedback}</p></div>}
      <div className="panel stack"><h2>Delivery history</h2>{submissions.length ? submissions.map(submission => <article key={submission.id} className="stack"><p className="eyebrow">Attempt {submission.attempt_number} · {date(submission.submitted_at)}</p><p>{submission.summary}</p>{/^https?:\/\//i.test(submission.work_url) ? <a className="button secondary" href={submission.work_url} target="_blank" rel="noopener noreferrer">Open submitted work ↗</a> : <p>Work link unavailable.</p>}</article>) : <p className="muted">No submission yet. Delivery will be recorded here.</p>}</div>
    </section><aside className="stack">
      <div className="panel stack"><h2>Next action</h2>
        {role === "student" && ["ACTIVE", "REVISION_REQUESTED"].includes(contract.status) && <WorkflowForm operation="submit" entityId={id} label={contract.status === "REVISION_REQUESTED" ? "Resubmit work" : "Submit work"} />}
        {role === "student" && contract.status === "SUBMITTED" && <p>Your work is with the client. Await approval or revision feedback.</p>}
        {role === "client" && contract.status === "ACTIVE" && <p>Waiting for the student to submit their work.</p>}
        {role === "client" && contract.status === "REVISION_REQUESTED" && <p>Revision requested. Waiting for the second delivery.</p>}
        {role === "client" && contract.status === "SUBMITTED" && <><p>Review the delivery before approving. Approval atomically completes the contract and releases its demo payment state.</p><WorkflowForm operation="approve" entityId={id} label="Approve work" />{contract.revision_count < 1 && <details><summary>Request the one allowed revision</summary><WorkflowForm operation="revise" entityId={id} label="Request revision" /></details>}</>}
        {contract.status === "COMPLETED" && <><p className="notice success">Work completed. Career proof is now backed by this contract.</p><Link className="button secondary" href={`/students/${contract.student_id}`}>View career proof</Link></>}
      </div>
      <div className="panel"><p className="eyebrow">Demo payment state</p><h2>{payment?.status ?? "Unavailable"}</h2><p>{payment ? money(payment.amount) : "Payment state could not be found."}</p><p className="muted">No real money is transferred.</p></div>
      {contract.status === "COMPLETED" && <div className="panel stack"><h2>Client review</h2>{review ? <><strong>{review.rating} / 5</strong><p>{review.comment}</p></> : role === "client" ? <WorkflowForm operation="review" entityId={id} label="Publish review" /> : <p>The client can now leave a review of your completed work.</p>}</div>}
    </aside></div>
  </main>;
}