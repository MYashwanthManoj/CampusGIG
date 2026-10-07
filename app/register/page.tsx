import Link from "next/link";
import { AuthForm } from "@/components/auth-form";
export default function RegisterPage() {
  return <main className="page-shell auth-shell"><div className="page-heading"><p className="eyebrow">Work becomes proof</p><h1>Start with what you can do.</h1></div><section className="panel stack"><h2>Create your account</h2><AuthForm mode="register" /><p className="muted">Registration does not verify student identity. Verification is a separate trust process.</p><p>Already here? <Link href="/login">Sign in</Link></p></section></main>;
}