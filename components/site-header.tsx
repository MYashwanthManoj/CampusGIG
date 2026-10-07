import Link from "next/link";
import { ArrowUpRight, Sprout } from "lucide-react";
import { signOut } from "@/lib/auth/actions";

type Profile = { full_name: string; role: "student" | "client" | "admin" };

export function SiteHeader({ profile }: { profile?: Profile | null }) {
  const dashboard = profile?.role === "client" ? "/client/dashboard" : profile?.role === "student" ? "/student/dashboard" : "/tasks";
  return <header className="site-header">
    <div className="header-inner">
      <Link href="/" className="wordmark" aria-label="CampusGig home"><span className="brand-icon"><Sprout size={22} strokeWidth={2} aria-hidden="true" /></span>CampusGig<span className="brand-period">.</span></Link>
      <nav className="main-nav" aria-label="Main navigation"><Link href="/tasks">Explore tasks</Link><Link href="/how-it-works">How it works</Link></nav>
      <div className="header-actions">{profile ? <><Link className="header-dashboard" href={dashboard}>Your workspace <ArrowUpRight size={15} aria-hidden="true" /></Link><form action={signOut}><button className="button secondary compact" type="submit">Log out</button></form></> : <><Link href="/login" className="login-link">Log in</Link><Link href="/register" className="button primary compact">Get started <ArrowUpRight size={16} aria-hidden="true" /></Link></>}</div>
    </div>
  </header>;
}