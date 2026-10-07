"use server";
import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { supabaseEnvironment } from "@/lib/supabase/env";

export interface AuthState { error?: string; success?: string }
const credentials = z.object({ email: z.email().max(254), password: z.string().min(8).max(128) });
export async function login(_previous: AuthState, form: FormData): Promise<AuthState> {
  if (!supabaseEnvironment()) return { error: "Supabase is not configured. Follow the setup instructions before signing in." };
  const parsed = credentials.safeParse({ email: form.get("email"), password: form.get("password") });
  if (!parsed.success) return { error: "Enter a valid email and password of at least 8 characters." };
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error || !data.user) return { error: "Sign-in failed. Check your credentials or service availability." };
  const { data: profile, error: profileError } = await supabase.from("profiles").select("role").eq("id", data.user.id).maybeSingle();
  if (profileError || !profile) return { error: "Signed in, but your profile is unavailable. Check the database migration." };
  revalidatePath("/", "layout");
  redirect(profile.role === "student" ? "/student/dashboard" : profile.role === "client" ? "/client/dashboard" : "/");
}
export async function register(_previous: AuthState, form: FormData): Promise<AuthState> {
  if (!supabaseEnvironment()) return { error: "Supabase is not configured. Follow the setup instructions first." };
  const schema = credentials.extend({ full_name: z.string().trim().min(2).max(100), role: z.enum(["student", "client"]), college: z.string().trim().min(2).max(150) });
  const parsed = schema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Please check your details." };
  const { email, password, ...metadata } = parsed.data;
  const supabase = await createClient();
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const { data, error } = await supabase.auth.signUp({ email, password, options: { data: metadata, emailRedirectTo: `${site}/auth/callback` } });
  if (error) return { error: "Registration could not be completed. Check your details and service availability." };
  if (data.session) { revalidatePath("/", "layout"); redirect(`/${metadata.role}/dashboard`); }
  return { success: "Check your email to confirm your account, then sign in." };
}
export async function signOut() {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();
  if (error) throw new Error("Sign-out could not be confirmed. Please retry.");
  revalidatePath("/", "layout");
  redirect("/login");
}