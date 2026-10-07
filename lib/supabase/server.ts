import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { supabaseEnvironment } from "./env";

export async function createClient() {
  const env = supabaseEnvironment();
  if (!env) throw new Error("Supabase is not configured. Set the public URL and publishable key.");
  const store = await cookies();
  return createServerClient(env.url, env.key, { cookies: {
    getAll() { return store.getAll(); },
    setAll(values) {
      try { for (const { name, value, options } of values) store.set(name, value, options); }
      catch { /* Read-only Server Component; proxy refreshes session cookies. */ }
    },
  } });
}