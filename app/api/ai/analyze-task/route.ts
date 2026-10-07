import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { getProfile } from "@/lib/auth/session";
import { analyzeTask, taskBriefSchema } from "@/lib/ai";
import { signAnalysis } from "@/lib/ai/signing";

// Single-process demo protection; production needs a shared rate-limit store.
const requests = new Map<string, number>();
export async function POST(request: Request) {
  const url = new URL(request.url);
  if (request.headers.get("origin") !== url.origin) return NextResponse.json({ code: "FORBIDDEN", error: "Cross-origin requests are not allowed." }, { status: 403 });
  const profile = await getProfile();
  if (!profile) return NextResponse.json({ code: "UNAUTHENTICATED", error: "Please sign in." }, { status: 401 });
  if (profile.role !== "client") return NextResponse.json({ code: "FORBIDDEN", error: "Only clients can analyze tasks." }, { status: 403 });
  if (Date.now() - (requests.get(profile.id) ?? 0) < 3000) return NextResponse.json({ code: "RATE_LIMITED", error: "Please wait a few seconds before analyzing again." }, { status: 429 });
  requests.set(profile.id, Date.now());
  if (requests.size > 1000) for (const [key, time] of requests) if (Date.now() - time > 60_000) requests.delete(key);
  const body = await request.text();
  if (body.length > 20_000) return NextResponse.json({ code: "INVALID_INPUT", error: "Task brief is too long." }, { status: 413 });
  const started = Date.now();
  try {
    const parsed = taskBriefSchema.safeParse(JSON.parse(body));
    if (!parsed.success) return NextResponse.json({ code: "INVALID_INPUT", error: parsed.error.issues[0]?.message ?? "Check the task fields." }, { status: 400 });
    if (new Date(parsed.data.deadline).getTime() <= Date.now()) return NextResponse.json({ code: "INVALID_INPUT", error: "Deadline must be in the future." }, { status: 400 });
    const result = await analyzeTask(parsed.data);
    const token = signAnalysis({ userId: profile.id, requestId: randomUUID(), expiresAt: Date.now() + 20 * 60_000, brief: parsed.data, ...result });
    console.info(JSON.stringify({ action: "analyze_task", userId: profile.id, role: profile.role, success: true, source: result.source, durationMs: Date.now() - started }));
    return NextResponse.json({ ...result, token }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    console.warn(JSON.stringify({ action: "analyze_task", userId: profile.id, role: profile.role, success: false, code: "AI_UNAVAILABLE", durationMs: Date.now() - started }));
    return NextResponse.json({ code: "AI_UNAVAILABLE", error: "Analysis could not be prepared. Check server configuration and retry." }, { status: 503 });
  }
}