import type { Metadata } from "next";
import { getProfile } from "@/lib/auth/session";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

export const metadata: Metadata = { title: "CampusGig — Work becomes proof", description: "A student micro-work marketplace where completed work becomes verified career proof." };
export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const profile = await getProfile();
  return <html lang="en" data-scroll-behavior="smooth"><body><a href="#main-content" className="skip-link">Skip to content</a><SiteHeader profile={profile} /><div id="main-content" tabIndex={-1}>{children}</div><footer className="site-footer"><strong>CampusGig</strong><p>Your degree says what you studied. Your work shows what you can do.</p><small>Hackathon sandbox. No real funds are transferred.</small></footer></body></html>;
}