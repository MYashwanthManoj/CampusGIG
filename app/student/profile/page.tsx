import { z } from "zod";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { careerProof, DatabaseError } from "@/lib/db/queries";
import { CareerProof } from "@/components/career-proof";
import { DeclareSkillForm, ProfileForm } from "@/components/profile-form";
import { date } from "@/lib/format";

const verificationSchema = z.array(z.object({
  id: z.string(),
  method: z.string(),
  status: z.enum(["PENDING", "VERIFIED", "REJECTED"]),
  verified_at: z.string().nullable(),
}));

export default async function StudentProfilePage() {
  const profile = await requireRole("student");
  const supabase = await createClient();
  const [proof, verification] = await Promise.all([
    careerProof(profile.id),
    supabase.from("verification_records").select("id,method,status,verified_at")
      .eq("student_id", profile.id).order("created_at", { ascending: false }),
  ]);
  if (verification.error) throw new DatabaseError();
  const records = verificationSchema.safeParse(verification.data ?? []);
  if (!records.success) throw new DatabaseError();

  return <main className="page-shell">
    <div className="page-heading"><p className="eyebrow">Your account</p><h1>Student profile</h1><p className="muted">Keep your details current. Your earned record comes from completed work, not profile claims.</p></div>
    <section className="panel stack" aria-labelledby="profile-details-heading"><h2 id="profile-details-heading">Profile details</h2><ProfileForm profile={profile} /></section>
    <section className="panel stack" aria-labelledby="verification-heading">
      <h2 id="verification-heading">Student verification</h2>
      <p className="badge">{profile.verified_status ? "Verified student" : "Not verified"}</p>
      <p className="muted">No institution integration connected in this MVP.</p>
      <p className="muted">Local demo verification records represent fictional seeded verification, not a real institution integration.</p>
      {records.data.length ? <ul className="proof-work">{records.data.map(record => <li key={record.id}><strong>Type: {record.method.replaceAll("_", " ")}</strong><span>Status: {record.status.replaceAll("_", " ")}</span><span className="muted">Reviewed at: {record.verified_at ? date(record.verified_at) : "Not recorded"}</span></li>)}</ul> : <p className="muted">No verification records for your account.</p>}
    </section>
    <section className="panel stack" aria-labelledby="declare-skill-heading"><h2 id="declare-skill-heading">Declare a skill</h2><DeclareSkillForm /></section>
    <CareerProof proof={proof} />
  </main>;
}