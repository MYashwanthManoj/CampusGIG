import { requireRole } from "@/lib/auth/session";
import { ProfileForm } from "@/components/profile-form";

export default async function ClientProfilePage() {
  const profile = await requireRole("client");
  return <main className="page-shell">
    <div className="page-heading"><p className="eyebrow">Your account</p><h1>Client profile</h1><p className="muted">Update the details students see when working with you.</p></div>
    <section className="panel stack" aria-labelledby="profile-details-heading"><h2 id="profile-details-heading">Profile details</h2><ProfileForm profile={profile} /></section>
  </main>;
}