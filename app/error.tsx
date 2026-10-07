"use client";
import Link from "next/link";
export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <main className="page-shell"><section className="panel stack" role="alert"><p className="eyebrow">We could not confirm that state</p><h1>Something did not load.</h1><p>Your work is not being silently replaced with demo data. Check service availability and retry.</p><button className="button primary" onClick={reset}>Try again</button><Link href="/" className="button secondary">Back to CampusGig</Link></section></main>;
}