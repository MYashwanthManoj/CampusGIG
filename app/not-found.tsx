import Link from "next/link";
export default function NotFound() {
  return <main className="page-shell"><div className="page-heading"><p className="eyebrow">404</p><h1>This work is not here.</h1><p>It may be private, removed, or unavailable to your account.</p><Link href="/tasks" className="button primary">Browse open tasks</Link></div></main>;
}