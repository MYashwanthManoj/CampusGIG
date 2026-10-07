import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { supabaseEnvironment } from "@/lib/supabase/env";
import type { Role } from "@/lib/db/types";

export interface Profile { id: string; role: Role; full_name: string; headline: string | null; bio: string | null; college: string | null; verified_status: boolean }
export const getProfile = cache(async (): Promise<Profile | null> => {
  if (!supabaseEnvironment()) return null;
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;
  const { data, error: profileError } = await supabase.from("profiles").select("id,role,full_name,headline,bio,college,verified_status").eq("id", user.id).maybeSingle();
  if (profileError || !data) throw new Error("Your profile could not be loaded. Check database setup.");
  return data as Profile;
});
export async function requireRole(role: "student" | "client"): Promise<Profile> {
  const profile = await getProfile();
  if (!profile) redirect("/login");
  if (profile.role !== role) redirect(profile.role === "student" ? "/student/dashboard" : profile.role === "client" ? "/client/dashboard" : "/");
  return profile;
}