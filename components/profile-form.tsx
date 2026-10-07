"use client";

import { useActionState } from "react";
import type { Profile } from "@/lib/auth/session";
import { declareSkill, updateProfile, type ProfileActionState } from "@/lib/auth/profile-actions";
import { SKILL_NAMES, SKILL_SLUGS } from "@/lib/validation";

const initialState: ProfileActionState = {};

function ActionFeedback({ state }: { state: ProfileActionState }) {
  return <>{state.error && <p className="notice error" role="alert">{state.error}</p>}{state.success && <p className="notice success" role="status">{state.success}</p>}</>;
}

export function ProfileForm({ profile }: { profile: Profile }) {
  const [state, action, pending] = useActionState(updateProfile, initialState);
  return <form action={action} className="stack">
    <div className="field"><label htmlFor="profile-name">Full name</label><input id="profile-name" name="full_name" autoComplete="name" defaultValue={profile.full_name} minLength={2} maxLength={100} required /></div>
    <div className="field"><label htmlFor="profile-headline">Headline</label><input id="profile-headline" name="headline" defaultValue={profile.headline ?? ""} maxLength={160} /></div>
    <div className="field"><label htmlFor="profile-bio">Bio</label><textarea id="profile-bio" name="bio" defaultValue={profile.bio ?? ""} maxLength={2000} rows={5} /></div>
    <div className="field"><label htmlFor="profile-college">{profile.role === "student" ? "College" : "College or organization"}</label><input id="profile-college" name="college" autoComplete="organization" defaultValue={profile.college ?? ""} maxLength={150} /></div>
    <p className="muted">Role and verification status cannot be changed here.</p>
    <button className="button primary" type="submit" disabled={pending}>{pending ? "Saving…" : "Save profile"}</button>
    <ActionFeedback state={state} />
  </form>;
}

export function DeclareSkillForm() {
  const [state, action, pending] = useActionState(declareSkill, initialState);
  return <form action={action} className="stack">
    <div className="field"><label htmlFor="declared-skill">Skill</label><select id="declared-skill" name="slug" defaultValue="" required><option value="" disabled>Choose a skill</option>{SKILL_SLUGS.map(slug => <option key={slug} value={slug}>{SKILL_NAMES[slug]}</option>)}</select></div>
    <p className="muted">A declaration shows what you want to work on. It does not add completed-work evidence or improve your earned skill score.</p>
    <button className="button secondary" type="submit" disabled={pending}>{pending ? "Saving…" : "Declare skill"}</button>
    <ActionFeedback state={state} />
  </form>;
}