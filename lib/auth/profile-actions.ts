"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { supabaseEnvironment } from "@/lib/supabase/env";
import { skillSlugSchema } from "@/lib/validation";

export type ProfileActionState = {
  code?: "SAVED" | "DECLARED" | "INVALID_INPUT" | "UNAUTHENTICATED" | "FORBIDDEN" | "DATABASE_UNAVAILABLE" | "SETUP_REQUIRED";
  error?: string;
  success?: string;
};

const profileSchema = z.object({
  full_name: z.string().trim().min(2, "Full name must contain at least 2 characters.").max(100),
  headline: z.string().trim().max(160),
  bio: z.string().trim().max(2000),
  college: z.string().trim().max(150),
}).strict();
const declarationSchema = z.object({ slug: skillSlugSchema }).strict();
const unavailable: ProfileActionState = { code: "DATABASE_UNAVAILABLE", error: "Database unavailable. Your changes could not be confirmed. Please retry." };
const signedOut: ProfileActionState = { code: "UNAUTHENTICATED", error: "Please sign in again before changing your profile." };
const setupRequired: ProfileActionState = { code: "SETUP_REQUIRED", error: "Supabase is not configured. Follow the setup instructions first." };

// React supplies its own action metadata. All other unexpected fields (including
// id, role and verified_status) are rejected by the strict input schemas.
function submittedFields(form: FormData): Record<string, FormDataEntryValue> {
  return Object.fromEntries([...form.entries()].filter(([key]) => !key.startsWith("$ACTION_")));
}

export async function updateProfile(_previous: ProfileActionState, form: FormData): Promise<ProfileActionState> {
  if (!supabaseEnvironment()) return setupRequired;
  const parsed = profileSchema.safeParse(submittedFields(form));
  if (!parsed.success) return { code: "INVALID_INPUT", error: "Check your profile details. Only name, headline, bio and college or organization can be edited." };
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return signedOut;
    const { data: owner, error: ownerError } = await supabase.from("profiles").select("id,role").eq("id", user.id).maybeSingle();
    if (ownerError || !owner) return unavailable;
    if (owner.role !== "student" && owner.role !== "client") return { code: "FORBIDDEN", error: "This profile cannot be edited here." };
    const { full_name, headline, bio, college } = parsed.data;
    const { data: updated, error } = await supabase.from("profiles")
      .update({ full_name, headline: headline || null, bio: bio || null, college: college || null })
      .eq("id", user.id).select("id").maybeSingle();
    if (error || !updated || updated.id !== user.id) return unavailable;
    revalidatePath("/", "layout");
    return { code: "SAVED", success: "Profile updated." };
  } catch {
    return unavailable;
  }
}

export async function declareSkill(_previous: ProfileActionState, form: FormData): Promise<ProfileActionState> {
  if (!supabaseEnvironment()) return setupRequired;
  const parsed = declarationSchema.safeParse(submittedFields(form));
  if (!parsed.success) return { code: "INVALID_INPUT", error: "Choose a skill from the canonical list." };
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return signedOut;
    const { data: owner, error: ownerError } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
    if (ownerError || !owner) return unavailable;
    if (owner.role !== "student") return { code: "FORBIDDEN", error: "Only students can declare skills." };
    const { error } = await supabase.rpc("declare_skill", { p_skill_slug: parsed.data.slug });
    if (error) return unavailable;
    const { data: persisted, error: readError } = await supabase.from("student_skills")
      .select("student_id,skills!inner(slug)").eq("student_id", user.id).eq("skills.slug", parsed.data.slug).maybeSingle();
    if (readError || !persisted || persisted.student_id !== user.id) return unavailable;
    revalidatePath("/", "layout");
    return { code: "DECLARED", success: "Skill declaration saved. Declaring a skill does not create earned evidence; existing completed-work evidence is unchanged." };
  } catch {
    return unavailable;
  }
}