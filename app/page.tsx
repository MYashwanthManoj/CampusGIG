import Link from "next/link";
import { ArrowDown, ArrowRight, ArrowUpRight, Check, CheckCheck, FileText, Sprout } from "lucide-react";

export default function HomePage() {
  return <main className="landing">
    <section className="hero" aria-labelledby="hero-title">
      <div className="hero-copy"><p className="eyebrow"><span className="tiny-dot" />Small gigs. A bigger beginning.</p>
        <h1 id="hero-title">Good work.<br /><span>Real proof.</span></h1>
        <p className="hero-description">Your skills deserve more than a line on a résumé. Take on real tasks, deliver something useful, and build a record that speaks for itself.</p>
        <div className="hero-actions"><Link href="/tasks" className="button primary">Find your first gig <ArrowUpRight size={19} aria-hidden="true" /></Link><Link href="/register" className="text-link">Have a task? Start here <ArrowRight size={17} aria-hidden="true" /></Link></div>
        <p className="hero-note">For students ready to do. For people who need things done.</p>
      </div>
      <div className="hero-art" role="img" aria-label="Concept illustration: a clear task brief becomes completed work, then a record of career proof. Not a live task or profile.">
        <div className="art-caption"><span className="art-index">01 / THE IDEA</span><span>A little work. A lasting signal.</span></div>
        <div className="art-canvas"><div className="art-grid" />
          <div className="art-orbit" />
          <div className="concept-brief"><div className="concept-topline"><span><FileText size={15} aria-hidden="true" />THE TASK</span><span>↗</span></div><h2>Make something<br />that matters.</h2><p>A clear brief. A defined scope.<br />Something you can deliver.</p><div className="concept-tags"><span>Your skills</span><span>A real outcome</span></div><div className="concept-check"><Check size={15} aria-hidden="true" /><span>Do the work</span><ArrowRight size={17} aria-hidden="true" /></div></div>
          <div className="concept-proof"><span className="proof-icon"><CheckCheck size={24} aria-hidden="true" /></span><div><span className="eyebrow">THE PROOF</span><strong>More than a promise.</strong><p>Delivered work. A client review.<br />A stronger next step.</p></div></div>
          <div className="art-star" aria-hidden="true">✳</div><span className="art-margin-note">WORK → PROOF → POSSIBILITY</span>
        </div><p className="art-footnote">Concept illustration — not a live task or student record.</p>
      </div>
    </section>
    <section className="skills-strip" aria-label="Skills you can put to work"><p>Put what you know<br /><strong>to work.</strong></p><div><span>Development</span><span>Design</span><span>Writing</span><span>Video</span><span>Data & spreadsheets</span></div><ArrowDown size={23} strokeWidth={1.5} aria-hidden="true" /></section>
    <section className="story-section" aria-labelledby="story-title"><div className="section-intro"><p className="eyebrow">A better kind of starting point</p><h2 id="story-title">Experience isn’t given.<br />It’s built.</h2><p>You don’t need a long work history to begin. You need a clear task, a chance to deliver, and a place for that work to count.</p></div>
      <div className="steps-grid"><article><span className="step-number">01</span><h3>Find your fit.</h3><p>Explore scoped tasks. Understand the skills, deadline, and fixed price before you apply.</p><span className="step-label">A clear beginning <ArrowUpRight size={15} aria-hidden="true" /></span></article><article><span className="step-number">02</span><h3>Make it happen.</h3><p>Agree on the work, submit your delivery, and keep feedback in one shared workspace.</p><span className="step-label">Work with intention <ArrowUpRight size={15} aria-hidden="true" /></span></article><article><span className="step-number">03</span><h3>Let it speak.</h3><p>Approved work becomes evidence: completed tasks, demonstrated skills, and client reviews.</p><span className="step-label">Proof you can point to <ArrowUpRight size={15} aria-hidden="true" /></span></article></div>
    </section>
    <section className="landing-cta"><Sprout size={42} strokeWidth={1.2} aria-hidden="true" /><div><p className="eyebrow">The next step is a small one</p><h2>Start with a gig.<br />Leave with proof.</h2></div><Link href="/register" className="button paper">Make your start <ArrowUpRight size={19} aria-hidden="true" /></Link></section>
  </main>;
}