import { ArrowUpRight, CalendarDays } from "lucide-react";

export type TaskCardTask = {
  id: string; title: string; description: string; fixed_price: number;
  status: string; deadline: string; difficulty: string | null;
  task_skills?: { skills: { name: string; slug: string } | null }[];
};

export function TaskCard({ task }: { task: TaskCardTask }) {
  const deadline = new Date(task.deadline);
  const date = Number.isNaN(deadline.getTime()) ? "Not available" : new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" }).format(deadline);
  const price = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(task.fixed_price);
  return <article className="task-card">
    <div className="task-card-top"><span className="badge">{task.status.replaceAll("_", " ")}</span>{task.difficulty && <span className="muted">{task.difficulty}</span>}</div>
    <h2><a href={`/tasks/${task.id}`}>{task.title}<ArrowUpRight size={20} aria-hidden="true" /></a></h2>
    <p className="task-description">{task.description}</p>
    <div className="metadata task-tags">{task.task_skills?.map(({ skills }) => skills ? <span className="badge neutral" key={skills.slug}>{skills.name}</span> : null)}</div>
    <div className="task-card-bottom"><strong>{price}<span>Fixed price · demo</span></strong><span className="task-date"><CalendarDays size={14} aria-hidden="true" />{date}</span></div>
  </article>;
}