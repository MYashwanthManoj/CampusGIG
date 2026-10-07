import { z } from 'zod';
import { SKILL_SLUGS, canonicalSkillsSchema } from '../validation/skills.ts';
import type { SkillSlug } from '../validation/skills.ts';
import { SKILL_NAMES } from '../validation/skills.ts';
import { evidenceSchema } from '../matching/index.ts';
import type { StudentEvidence } from '../matching/index.ts';

export const contractEvidenceSchema = z.object({
  id: z.string().min(1), studentId: z.string().min(1), clientId: z.string().min(1),
  status: z.enum(['ACTIVE', 'SUBMITTED', 'REVISION_REQUESTED', 'COMPLETED', 'CANCELLED']),
  dueAt: z.iso.datetime({ offset: true }),
  submittedAt: z.iso.datetime({ offset: true }).nullable(),
  completedAt: z.iso.datetime({ offset: true }).nullable(),
  skills: canonicalSkillsSchema,
}).strict().refine((contract) => contract.status !== 'COMPLETED' || contract.completedAt !== null, 'Completed contracts require completedAt');
export type ContractEvidence = z.infer<typeof contractEvidenceSchema>;
export const paymentEvidenceSchema = z.object({
  contractId: z.string().min(1), status: z.enum(['HELD', 'RELEASED', 'REFUNDED', 'FAILED']),
  amount: z.number().finite().nonnegative().max(1_000_000),
}).strict();
export type PaymentEvidence = z.infer<typeof paymentEvidenceSchema>;
export const reviewEvidenceSchema = z.object({
  contractId: z.string().min(1), studentId: z.string().min(1), clientId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
}).strict();
export type ReviewEvidence = z.infer<typeof reviewEvidenceSchema>;

export const reputationInputSchema = z.object({
  studentId: z.string().min(1),
  contracts: z.array(contractEvidenceSchema).refine((rows) => new Set(rows.map((r) => r.id)).size === rows.length, 'Duplicate contracts'),
  payments: z.array(paymentEvidenceSchema).refine((rows) => new Set(rows.map((r) => r.contractId)).size === rows.length, 'One payment per contract'),
  reviews: z.array(reviewEvidenceSchema).refine((rows) => new Set(rows.map((r) => r.contractId)).size === rows.length, 'One review per contract'),
}).strict();
export type ReputationInput = z.infer<typeof reputationInputSchema>;
export interface Reputation {
  completedCount: number;
  activeContractCount: number;
  averageRating: number | null;
  onTimeRate: number;
  totalEarned: number;
  releasedPaymentCount: number;
  reviewCount: number;
  skillCompletedCounts: Record<SkillSlug, number>;
}

/** Authorization guidance only. The server/database must enforce the same guard atomically. */
export function reviewGuard(contractInput: ContractEvidence, reviewerId: string, existingReviewCount = 0): { allowed: boolean; reason?: string } {
  const contract = contractEvidenceSchema.parse(contractInput);
  z.number().int().nonnegative().parse(existingReviewCount);
  if (contract.status !== 'COMPLETED') return { allowed: false, reason: 'Only completed contracts may be reviewed.' };
  if (reviewerId !== contract.clientId) return { allowed: false, reason: 'Only the contract client may review.' };
  if (contract.clientId === contract.studentId) return { allowed: false, reason: 'Self-reviews are not allowed.' };
  if (existingReviewCount > 0) return { allowed: false, reason: 'This contract already has a review.' };
  return { allowed: true };
}

/** Display reputation is derived, never declared. Held/refunded payments are not earnings. */
export function deriveReputation(input: ReputationInput): Reputation {
  const data = reputationInputSchema.parse(input);
  const owned = data.contracts.filter((c) => c.studentId === data.studentId);
  const completed = owned.filter((c) => c.status === 'COMPLETED');
  const completedById = new Map(completed.map((c) => [c.id, c]));
  const released = data.payments.filter((p) => p.status === 'RELEASED' && completedById.has(p.contractId));
  const validReviews = data.reviews.filter((r) => {
    const contract = completedById.get(r.contractId);
    return contract && contract.studentId === r.studentId && contract.clientId === r.clientId
      && reviewGuard(contract, r.clientId).allowed;
  });
  const skillCompletedCounts = Object.fromEntries(SKILL_SLUGS.map((slug) => [slug, 0])) as Record<SkillSlug, number>;
  for (const contract of completed) for (const skill of contract.skills) skillCompletedCounts[skill]++;
  const onTimeCount = completed.filter((c) => c.submittedAt !== null && Date.parse(c.submittedAt) <= Date.parse(c.dueAt)).length;
  // Aggregate integer cents to avoid floating-point currency drift.
  const totalCents = released.reduce((total, payment) => total + Math.round(payment.amount * 100), 0);
  if (!Number.isSafeInteger(totalCents)) throw new RangeError('Earnings exceed safe currency precision');
  return {
    completedCount: completed.length,
    activeContractCount: owned.filter((c) => ['ACTIVE', 'SUBMITTED', 'REVISION_REQUESTED'].includes(c.status)).length,
    averageRating: validReviews.length ? validReviews.reduce((sum, r) => sum + r.rating, 0) / validReviews.length : null,
    onTimeRate: completed.length ? onTimeCount / completed.length : 0,
    totalEarned: totalCents / 100,
    releasedPaymentCount: released.length,
    reviewCount: validReviews.length,
    skillCompletedCounts,
  };
}

/** Declared skills remain score zero until backed by completed contracts. */
export function evidenceFromReputation(input: ReputationInput, requiredSkills: SkillSlug[], declaredSkills: SkillSlug[] = []): StudentEvidence {
  const required = canonicalSkillsSchema.parse(requiredSkills);
  const declared = z.array(z.enum(SKILL_SLUGS)).max(9).parse(declaredSkills);
  const data = reputationInputSchema.parse(input);
  const reputation = deriveReputation(data);
  const relevantCompletedCount = data.contracts.filter((contract) => contract.studentId === data.studentId
    && contract.status === 'COMPLETED' && contract.skills.some((slug) => required.includes(slug))).length;
  const slugs = SKILL_SLUGS.filter((slug) => declared.includes(slug) || reputation.skillCompletedCounts[slug] > 0);
  return evidenceSchema.parse({
    studentId: data.studentId,
    skills: slugs.map((slug) => ({ slug, name: SKILL_NAMES[slug], evidenceScore: Math.round(100 * Math.min(reputation.skillCompletedCounts[slug] / 6, 1)) })),
    completedCount: reputation.completedCount, relevantCompletedCount,
    activeContractCount: reputation.activeContractCount,
    averageRating: reputation.averageRating, onTimeRate: reputation.onTimeRate,
  });
}