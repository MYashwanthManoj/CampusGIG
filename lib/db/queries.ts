import { createClient } from "@/lib/supabase/server";
import type { Application, CareerProof, Contract, Review, Submission, Task } from "./types";

export class DatabaseError extends Error {
  constructor() { super("Database unavailable. Check your Supabase setup and try again."); }
}
const taskSelection = "*, task_skills(skills(slug,name))";

export async function listTasks(search = ""): Promise<Task[]> {
  const supabase = await createClient();
  let query = supabase.from("tasks").select(taskSelection).eq("status", "OPEN").order("created_at", { ascending: false }).limit(60);
  const term = search.replace(/[%_\\]/g, "").slice(0, 100);
  if (term) query = query.ilike("title", `%${term}%`);
  const { data, error } = await query;
  if (error) throw new DatabaseError();
  return (data ?? []) as Task[];
}

export async function getTask(id: string): Promise<Task | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("tasks").select(taskSelection).eq("id", id).maybeSingle();
  if (error) throw new DatabaseError();
  return data as Task | null;
}

export async function ownTasks(clientId: string): Promise<Task[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("tasks").select(taskSelection).eq("client_id", clientId).order("created_at", { ascending: false });
  if (error) throw new DatabaseError();
  return (data ?? []) as Task[];
}

export async function applicationsForTask(taskId: string): Promise<Application[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("applications").select("*").eq("task_id", taskId).order("match_score", { ascending: false }).order("created_at");
  if (error) throw new DatabaseError();
  return (data ?? []) as Application[];
}

export async function ownApplications(studentId: string): Promise<(Application & { tasks: Task | null })[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("applications").select("*,tasks(*)").eq("student_id", studentId).order("created_at", { ascending: false });
  if (error) throw new DatabaseError();
  return (data ?? []) as (Application & { tasks: Task | null })[];
}

export async function ownContracts(userId: string, role: "student" | "client"): Promise<(Contract & { tasks: Task | null })[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("contracts").select("*,tasks(*)").eq(role === "student" ? "student_id" : "client_id", userId).order("started_at", { ascending: false });
  if (error) throw new DatabaseError();
  return (data ?? []) as (Contract & { tasks: Task | null })[];
}

export async function careerProof(studentId: string): Promise<CareerProof> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_career_proof", { p_student_id: studentId });
  if (error || !data) throw new DatabaseError();
  return data as CareerProof;
}

export async function workspace(contractId: string) {
  const supabase = await createClient();
  const { data: contract, error } = await supabase.from("contracts").select("*").eq("id", contractId).maybeSingle();
  if (error) throw new DatabaseError();
  if (!contract) return null;
  const [task, submissions, payment, review] = await Promise.all([
    getTask(contract.task_id),
    supabase.from("submissions").select("*").eq("contract_id", contractId).order("attempt_number", { ascending: false }),
    supabase.from("payments").select("status,amount,released_at").eq("contract_id", contractId).maybeSingle(),
    supabase.from("reviews").select("id,rating,comment").eq("contract_id", contractId).maybeSingle(),
  ]);
  if (submissions.error || payment.error || review.error) throw new DatabaseError();
  return { contract: contract as Contract, task, submissions: (submissions.data ?? []) as Submission[], payment: payment.data as { status: string; amount: number } | null, review: review.data as Review | null };
}