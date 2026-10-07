import { notFound } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { careerProof } from "@/lib/db/queries";
import { CareerProof } from "@/components/career-proof";

export default async function StudentProfile({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!z.guid().safeParse(id).success) notFound();
  const supabase = await createClient();
  const { data: student, error } = await supabase.from("public_student_profiles").select("id,full_name,headline,bio,college,verified_status").eq("id", id).maybeSingle();
  if (error) throw new Error("Public student profile could not be loaded.");
  if (!student) notFound();
  const proof = await careerProof(id);
  return <main className="page-shell"><div className="page-heading"><p className="eyebrow">{student.verified_status ? "Verified student" : "Student · not yet verified"}</p><h1>{student.full_name}</h1><p>{student.headline}</p><p className="muted">{student.college}</p></div><div className="panel"><h2>About</h2><p>{student.bio || "This student has not added a bio yet."}</p></div><CareerProof proof={proof} /></main>;
}