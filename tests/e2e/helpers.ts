import { expect, type Page, type TestInfo } from "@playwright/test";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const localPassword = process.env.E2E_PASSWORD ?? "CampusGigLocal!2026";
export const accounts = {
  client: process.env.E2E_CLIENT_EMAIL ?? "client01@campusgig.test",
  student: process.env.E2E_STUDENT_EMAIL ?? "student01@campusgig.test",
  outsider: process.env.E2E_OTHER_CLIENT_EMAIL ?? "client02@campusgig.test",
};

export async function authenticatedDatabase(email: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error("Local Supabase URL and public key are required for real E2E verification.");
  if (!["localhost", "127.0.0.1"].includes(new URL(url).hostname)) {
    throw new Error("Mutating E2E tests refuse non-local Supabase databases.");
  }
  const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await db.auth.signInWithPassword({ email, password: localPassword });
  expect(error?.message, "Seeded account must authenticate against real local Supabase").toBeUndefined();
  expect(data.user?.id).toBeTruthy();
  return { db, id: data.user!.id };
}

export async function browserLogin(page: Page, email: string, role: "client" | "student") {
  await page.goto("/login");
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel("Password", { exact: true }).fill(localPassword);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`/${role}/dashboard$`));
  await expect(page.getByRole("main")).toBeVisible();
}

export function collectBrowserErrors(page: Page, label: string, errors: string[]) {
  page.on("pageerror", error => errors.push(`${label}: pageerror: ${error.message}`));
  page.on("console", message => {
    if (message.type() === "error") errors.push(`${label}: console: ${message.text()}`);
  });
}

export async function attachEvidence(info: TestInfo, evidence: unknown) {
  await info.attach("committed-database-evidence", {
    body: JSON.stringify(evidence, null, 2), contentType: "application/json",
  });
}

export async function careerProof(db: SupabaseClient, studentId: string) {
  const { data, error } = await db.rpc("get_career_proof", { p_student_id: studentId });
  expect(error?.message).toBeUndefined();
  expect(data).toBeTruthy();
  return data as { completedCount: number; earnedAmount: number; averageRating: number | null; onTimeRate: number };
}

export async function assertProofUI(page: Page, completedCount: number, earnings: number) {
  const proof = page.getByRole("region", { name: "Career proof", exact: true });
  await expect(proof).toBeVisible();
  await expect(proof.locator("dl > div").filter({ has: page.getByText("Completed tasks", { exact: true }) }).locator("dd")).toHaveText(String(completedCount));
  await expect(proof.locator("dl > div").filter({ has: page.getByText("Demo earnings", { exact: true }) }).locator("dd")).toHaveText(
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(earnings),
  );
}