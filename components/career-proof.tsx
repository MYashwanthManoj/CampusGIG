import { BadgeCheck } from "lucide-react";

export type CareerProofData = {
  completedCount: number; onTimeRate: number; averageRating: number | null; earnedAmount: number;
  skills?: { name: string; evidenceScore: number }[];
  recentWork?: { id: string; title: string; completedAt: string }[];
};

export function CareerProof({ proof }: { proof: CareerProofData }) {
  const money = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(proof.earnedAmount);
  return <section className="panel career-proof stack" aria-labelledby="proof-heading">
    <div className="proof-heading"><div><p className="eyebrow">Earned, not claimed</p><h2 id="proof-heading">Career proof</h2></div><BadgeCheck size={30} strokeWidth={1.5} aria-hidden="true" /></div>
    <p className="muted">A record built from completed contracts and client reviews.</p>
    <dl className="metric-grid"><div><dt>Completed tasks</dt><dd>{proof.completedCount}</dd></div><div><dt>On-time delivery</dt><dd>{proof.completedCount ? new Intl.NumberFormat("en-IN", { style: "percent", maximumFractionDigits: 0 }).format(proof.onTimeRate) : "—"}</dd></div><div><dt>Client rating</dt><dd>{proof.averageRating === null ? "—" : `${proof.averageRating.toFixed(1)} / 5`}</dd></div><div><dt>Demo earnings</dt><dd>{money}</dd></div></dl>
    <p className="proof-disclaimer">Demo earnings — no real money transferred. A dash means there is no completed-work or review evidence yet.</p>
    <div className="divider" />
    <h3>Skills backed by work</h3>
    {proof.skills?.length ? <ul className="proof-skills">{proof.skills.map(skill => <li key={skill.name}><span>{skill.name}</span><span className="muted">{skill.evidenceScore > 0 ? `${skill.evidenceScore}/100 evidence score` : "Declared · no completed-work evidence"}</span></li>)}</ul> : <p className="muted">No skill evidence yet. Completed work will build this record.</p>}
    <h3>Recent completed work</h3>
    {proof.recentWork?.length ? <ul className="proof-work">{proof.recentWork.map(work => {
      const completed = new Date(work.completedAt);
      return <li key={work.id}><strong>{work.title}</strong><span className="muted">{Number.isNaN(completed.getTime()) ? "Completion date unavailable" : new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" }).format(completed)}</span></li>;
    })}</ul> : <p className="muted">No completed work yet. Every approved delivery is a new piece of proof.</p>}
  </section>;
}