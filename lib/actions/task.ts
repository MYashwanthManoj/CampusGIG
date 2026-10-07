"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { verifyAnalysis } from "@/lib/ai/signing";
import type { ActionState } from "./workflow";

export async function publishTask(_previous: ActionState, form: FormData): Promise<ActionState> {
  const profile = await requireRole("client");
  let taskId: string;
  const started = Date.now();
  try {
    const payload = verifyAnalysis(String(form.get("analysisToken") ?? ""), profile.id);
    if (!payload.requestId) return { error: "Analyze the task again before publishing.", code: "INVALID_INPUT" };
    if (new Date(payload.brief.deadline).getTime() <= Date.now()) return { error: "The deadline must still be in the future.", code: "INVALID_INPUT" };
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("publish_task", {
      p_title: payload.brief.title,
      p_description: payload.brief.description,
      p_fixed_price: payload.brief.fixedPrice,
      p_deadline: payload.brief.deadline,
      p_analysis: payload.analysis,
      p_analysis_source: payload.source,
      p_skill_slugs: payload.analysis.skills,
      p_request_id: payload.requestId,
    });
    if (error || typeof data !== "string") {
      console.warn(JSON.stringify({ action: "publish_task", userId: profile.id, role: profile.role, success: false, code: "DATABASE_UNAVAILABLE", durationMs: Date.now() - started }));
      return { error: "Publishing could not be confirmed. Check the dashboard before trying again.", code: "DATABASE_UNAVAILABLE" };
    }
    taskId = data;
    console.info(JSON.stringify({ action: "publish_task", userId: profile.id, role: profile.role, entityId: taskId, success: true, durationMs: Date.now() - started }));
  } catch (error) {
    return { error: error instanceof Error && /Analysis|analysis/.test(error.message) ? error.message : "Task could not be published. Check setup and try again.", code: "INVALID_INPUT" };
  }
  revalidatePath("/tasks");
  revalidatePath("/client/dashboard");
  redirect(`/tasks/${taskId}`);
}