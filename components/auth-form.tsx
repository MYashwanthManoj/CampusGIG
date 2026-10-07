"use client";
import { useActionState } from "react";
import { login, register, type AuthState } from "@/lib/auth/actions";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const registering = mode === "register";
  const [state, action, pending] = useActionState(registering ? register : login, {} as AuthState);
  return <form action={action} className="stack">
    {registering && <><label className="field" htmlFor="full_name">Full name<input id="full_name" name="full_name" autoComplete="name" minLength={2} maxLength={100} required /></label><label className="field" htmlFor="role">I am a<select id="role" name="role" defaultValue="student"><option value="student">Student looking for work</option><option value="client">Client posting work</option></select></label><label className="field" htmlFor="college">College or organization<input id="college" name="college" minLength={2} maxLength={150} required /></label></>}
    <label className="field" htmlFor="email">Email<input id="email" name="email" type="email" autoComplete="email" maxLength={254} required /></label>
    <label className="field" htmlFor="password">Password<input id="password" name="password" type="password" autoComplete={registering ? "new-password" : "current-password"} minLength={8} maxLength={128} required /></label>
    <button className="button primary" disabled={pending}>{pending ? "Please wait…" : registering ? "Create account" : "Sign in"}</button>
    {state.error && <p className="notice error" role="alert">{state.error}</p>}{state.success && <p className="notice success" role="status">{state.success}</p>}
  </form>;
}