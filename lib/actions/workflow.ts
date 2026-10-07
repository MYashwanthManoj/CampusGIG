"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export interface ActionState { error?: string; code?: string; success?: string; entityId?: string }
const id = z.guid();
const inputSchemas = {
  apply: z.object({ taskId: id, coverNote: z.string().trim().min(20).max(1500) }),
  hire: z.object({ applicationId: id }),
  submit: z.object({ contractId: id, workUrl: z.url().refine(v => /^https?:\/\//i.test(v), "Use an HTTP or HTTPS work URL."), summary: z.string().trim().min(10).max(2000) }),
  revise: z.object({ contractId: id, feedback: z.string().trim().min(10).max(1000) }),
  approve: z.object({ contractId: id }),
  review: z.object({ contractId: id, rating: z.coerce.number().int().min(1).max(5), comment: z.string().trim().min(5).max(1000) }),
};
const roles = { apply: "student", hire: "client", submit: "student", revise: "client", approve: "client", review: "client" } as const;
const rpcs = { apply: "apply_to_task", hire: "hire_application", submit: "submit_work", revise: "request_revision", approve: "approve_work", review: "review_work" } as const;

function safeError(message: string): ActionState {
  const codes = ["FORBIDDEN", "NOT_FOUND", "INVALID_INPUT", "INVALID_STATE", "CONFLICT", "RATE_LIMITED", "UNAUTHENTICATED"];
  const code = codes.find(code => message.includes(code)) ?? "DATABASE_UNAVAILABLE";
  const text: Record<string, string> = {
    FORBIDDEN: "You do not have permission to perform this action.",
    NOT_FOUND: "This work record could not be found.",
    INVALID_INPUT: "Please check the fields and try again.",
    INVALID_STATE: "This action is no longer available. Refresh to see the current state.",
    CONFLICT: "This action has already been completed. Refresh to see the result.",
    RATE_LIMITED: "Please wait before trying again.",
    UNAUTHENTICATED: "Please sign in again.",
    DATABASE_UNAVAILABLE: "The operation could not be confirmed. Refresh before retrying; no success is being assumed.",
  };
  return { code, error: text[code] };
}

export async function performWorkflow(operation: keyof typeof inputSchemas, _previous: ActionState, form: FormData): Promise<ActionState> {
  if (!Object.hasOwn(inputSchemas, operation)) return { error: "Unknown operation.", code: "INVALID_INPUT" };
  const profile = await requireRole(roles[operation]);
  const started = Date.now();
  const parsed = inputSchemas[operation].safeParse(Object.fromEntries(form));
  if (!parsed.success) return { code: "INVALID_INPUT", error: parsed.error.issues[0]?.message ?? "Check your input." };
  const values = parsed.data as Record<string, unknown>;
  const args: Record<string, unknown> = {};
  const keys: Record<string, string> = { taskId: "p_task_id", coverNote: "p_cover_note", applicationId: "p_application_id", contractId: "p_contract_id", workUrl: "p_work_url", summary: "p_summary", feedback: "p_feedback", rating: "p_rating", comment: "p_comment" };
  for (const [key, value] of Object.entries(values)) args[keys[key]] = value;
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc(rpcs[operation], args);
    const result: ActionState = error ? safeError(error.code === "42501" ? "FORBIDDEN" : error.code === "23505" ? "CONFLICT" : error.message) : { success: "Saved. This view now reflects committed database state.", entityId: typeof data === "string" ? data : undefined };
    console.info(JSON.stringify({ action: operation, userId: profile.id, role: profile.role, entityId: values.contractId ?? values.taskId ?? values.applicationId, success: !error, code: result.code, durationMs: Date.now() - started }));
    if (!error) {
      revalidatePath("/", "layout");
    }
    return result;
  } catch {
    console.error(JSON.stringify({ action: operation, userId: profile.id, role: profile.role, success: false, code: "DATABASE_UNAVAILABLE", durationMs: Date.now() - started }));
    return safeError("DATABASE_UNAVAILABLE");
  }
}