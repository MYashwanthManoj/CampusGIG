"use client";

import { useActionState } from "react";
import { performWorkflow, type ActionState } from "@/lib/actions/workflow";

type Operation = "apply" | "hire" | "submit" | "revise" | "approve" | "review";
export function WorkflowForm({ operation, entityId, label }: { operation: Operation; entityId: string; label: string }) {
  const [state, action, pending] = useActionState(performWorkflow.bind(null, operation), {} as ActionState);
  const key = operation === "apply" ? "taskId" : operation === "hire" ? "applicationId" : "contractId";
  const prefix = `${operation}-${entityId}`;
  return <form action={action} className="stack">
    <input type="hidden" name={key} value={entityId} />
    {operation === "apply" && <label className="field" htmlFor={`${prefix}-note`}>Why are you a good fit?<textarea id={`${prefix}-note`} name="coverNote" minLength={20} maxLength={1500} required rows={4} aria-describedby={state.error ? `${prefix}-result` : undefined} /></label>}
    {operation === "submit" && <>
      <label className="field" htmlFor={`${prefix}-url`}>Work URL<input id={`${prefix}-url`} name="workUrl" type="url" required placeholder="https://…" /></label>
      <label className="field" htmlFor={`${prefix}-summary`}>Delivery summary<textarea id={`${prefix}-summary`} name="summary" minLength={10} maxLength={2000} required rows={3} /></label>
    </>}
    {operation === "revise" && <label className="field" htmlFor={`${prefix}-feedback`}>Revision feedback<textarea id={`${prefix}-feedback`} name="feedback" minLength={10} maxLength={1000} required rows={3} /></label>}
    {operation === "review" && <>
      <div className="field"><label htmlFor={`${prefix}-rating`}>Rating</label><select id={`${prefix}-rating`} name="rating" required defaultValue=""><option value="" disabled>Choose a rating</option>{[5, 4, 3, 2, 1].map(rating => <option key={rating} value={rating}>{rating} / 5</option>)}</select></div>
      <label className="field" htmlFor={`${prefix}-comment`}>What did this student deliver?<textarea id={`${prefix}-comment`} name="comment" minLength={5} maxLength={1000} required rows={3} /></label>
    </>}
    <button className="button primary" disabled={pending || Boolean(state.success)} type="submit">{pending ? "Saving…" : state.success ? "Saved" : label}</button>
    <div id={`${prefix}-result`} role={state.error ? "alert" : "status"} aria-live="polite">{state.error && <p className="notice error">{state.error} <small>{state.code}</small></p>}{state.success && <p className="notice success">{state.success}</p>}</div>
  </form>;
}