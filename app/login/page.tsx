import Link from "next/link";
import { AuthForm } from "@/components/auth-form";
import { supabaseEnvironment } from "@/lib/supabase/env";
export default function LoginPage() {
  return <main className="page-shell auth-shell"><div className="page-heading"><p className="eyebrow">Back to making things happen</p><h1>Your next opportunity starts here.</h1></div><section className="panel stack"><h2>Sign in</h2>{!supabaseEnvironment() && <p className="notice error">Setup required: configure Supabase URL and publishable key. No demo authentication bypass is provided.</p>}<AuthForm mode="login" /><p>New to CampusGig? <Link href="/register">Create an account</Link></p></section></main>;
}