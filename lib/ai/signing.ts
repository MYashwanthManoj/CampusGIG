import { createHmac, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { analysisSchema, taskBriefSchema } from "../validation/index.ts";

const payloadSchema = z.object({ userId: z.guid(), requestId: z.guid().optional(), expiresAt: z.number(), brief: taskBriefSchema, analysis: analysisSchema, source: z.enum(["live", "fallback", "mock"]), warning: z.string().optional() });
export type SignedAnalysis = z.infer<typeof payloadSchema>;
function secret() {
  const value = process.env.ANALYSIS_SIGNING_SECRET;
  if (!value || value.length < 32) throw new Error("Analysis signing secret is not configured.");
  return value;
}
export function signAnalysis(payload: SignedAnalysis): string {
  const body = Buffer.from(JSON.stringify(payloadSchema.parse(payload))).toString("base64url");
  return `${body}.${createHmac("sha256", secret()).update(body).digest("base64url")}`;
}
export function verifyAnalysis(token: string, userId: string): SignedAnalysis {
  if (token.length > 40_000) throw new Error("Invalid analysis.");
  const parts = token.split(".");
  const [body, signature] = parts;
  if (parts.length !== 2 || !body || !signature || !/^[A-Za-z0-9_-]+$/.test(body) || !/^[A-Za-z0-9_-]{43}$/.test(signature)) throw new Error("Invalid analysis.");
  const expected = createHmac("sha256", secret()).update(body).digest();
  const actual = Buffer.from(signature, "base64url");
  if (actual.toString("base64url") !== signature) throw new Error("Invalid analysis.");
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) throw new Error("Analysis was changed. Analyze the task again.");
  const payload = payloadSchema.parse(JSON.parse(Buffer.from(body, "base64url").toString("utf8")));
  if (payload.userId !== userId || payload.expiresAt <= Date.now()) throw new Error("Analysis expired. Analyze the task again.");
  return payload;
}