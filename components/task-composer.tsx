"use client";

import { useActionState, useState } from "react";
import { publishTask } from "@/lib/actions/task";
import type { TaskAnalysis } from "@/lib/validation";
import type { ActionState } from "@/lib/actions/workflow";

interface Result { analysis: TaskAnalysis; source: string; warning?: string; token: string }
export function TaskComposer() {
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [state, publish, publishing] = useActionState(publishTask, {} as ActionState);
  async function analyze(form: FormData) {
    setAnalyzing(true); setError(""); setResult(null);
    try {
      const deadline = new Date(String(form.get("deadline")));
      const response = await fetch("/api/ai/analyze-task", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: form.get("title"), description: form.get("description"), fixedPrice: Number(form.get("fixedPrice")), deadline: deadline.toISOString() }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Analysis failed.");
      setResult(data);
    } catch (error) { setError(error instanceof Error ? error.message : "Analysis unavailable."); }
    finally { setAnalyzing(false); }
  }
  return <div className="workspace-grid">
    <form action={analyze} className="panel stack" onChange={() => setResult(null)}>
      <label className="field" htmlFor="title">Task title<input id="title" name="title" required minLength={5} maxLength={160} placeholder="What do you need done?" /></label>
      <label className="field" htmlFor="description">The brief<textarea id="description" name="description" required minLength={20} maxLength={10000} rows={7} placeholder="Describe the scope, deliverables, and required skills." /></label>
      <div className="form-grid"><label className="field" htmlFor="price">Fixed price (INR)<input id="price" name="fixedPrice" type="number" min={1} max={1000000} step="0.01" required /></label><label className="field" htmlFor="deadline">Deadline<input id="deadline" name="deadline" type="datetime-local" required /></label></div>
      <p className="muted">You confirm this price. AI budget suggestions never control the contract amount.</p>
      <button type="submit" className="button primary" disabled={analyzing}>{analyzing ? "Analyzing your brief…" : "Analyze task"}</button>
      <p role="alert" className={error ? "notice error" : undefined}>{error}</p>
    </form>
    <section className="panel stack" aria-live="polite"><p className="eyebrow">Structure before you publish</p><h2>{result ? "Review the analysis" : "A clear brief is a better beginning."}</h2>{analyzing && <p role="status">Extracting task requirements. A provider failure will use an explicitly labeled deterministic fallback.</p>}{result ? <>
      <span className="badge">Analysis source: {result.source}</span>{result.warning && <p className="notice">{result.warning}</p>}
      <p>{result.analysis.category} · {result.analysis.difficulty}</p><p>{result.analysis.hoursMax > 0 ? `${result.analysis.hoursMin}–${result.analysis.hoursMax} estimated hours` : "Effort estimate unavailable"}</p>
      <div className="metadata">{result.analysis.skills.map(skill => <span key={skill} className="badge">{skill}</span>)}</div>
      <h3>Deliverables</h3><ul>{result.analysis.deliverables.map(item => <li key={item}>{item}</li>)}</ul><h3>Requirements</h3><ul>{result.analysis.requirements.map(item => <li key={item}>{item}</li>)}</ul>
      <form action={publish} className="stack"><input type="hidden" name="analysisToken" value={result.token} /><p>Publishing confirms the brief and price above. Editing the brief requires fresh analysis.</p><button className="button primary" disabled={publishing}>{publishing ? "Publishing…" : "Confirm and publish task"}</button>{state.error && <p className="notice error" role="alert">{state.error}</p>}</form>
    </> : !analyzing && <p className="muted">Live Gemini when configured. Deterministic fallback when unavailable. Both follow the same validated schema.</p>}<p className="muted">Demo payment state — no real money is transferred.</p></section>
  </div>;
}