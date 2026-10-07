import { z } from 'zod';
import { canonicalSkillsSchema, skillSlugSchema } from './skills.ts';
export * from './skills.ts';

const shortText = z.string().trim().min(1).max(500);
const price = z.number().finite().positive().max(1_000_000);
const timestamp = z.iso.datetime({ offset: true });

export const taskBriefSchema = z.object({
  title: z.string().trim().min(1).max(160),
  description: z.string().trim().min(1).max(10_000),
  fixedPrice: price,
  deadline: timestamp,
}).strict();
export type TaskBrief = z.infer<typeof taskBriefSchema>;

export const analysisSchema = z.object({
  category: z.string().trim().min(1).max(80),
  skills: canonicalSkillsSchema,
  difficulty: z.enum(['Beginner', 'Intermediate', 'Advanced']),
  hoursMin: z.number().finite().nonnegative().max(10_000),
  hoursMax: z.number().finite().nonnegative().max(10_000),
  budgetMin: z.number().finite().nonnegative().max(1_000_000),
  budgetMax: z.number().finite().nonnegative().max(1_000_000),
  deliverables: z.array(shortText).max(8),
  requirements: z.array(shortText).max(8),
}).strict().superRefine((value, ctx) => {
  if (value.hoursMin > value.hoursMax) ctx.addIssue({ code: 'custom', path: ['hoursMax'], message: 'Must be at least hoursMin' });
  if (value.budgetMin > value.budgetMax) ctx.addIssue({ code: 'custom', path: ['budgetMax'], message: 'Must be at least budgetMin' });
});
export type TaskAnalysis = z.infer<typeof analysisSchema>;

export const declareSkillSchema = z.object({
  slug: skillSlugSchema,
  description: z.string().trim().max(1000).optional(),
}).strict();
export const applicationSchema = z.object({
  taskId: z.guid(),
  proposal: z.string().trim().min(1).max(4000),
}).strict();
export const submissionSchema = z.object({
  contractId: z.guid(),
  message: z.string().trim().min(1).max(4000),
  artifactUrl: z.url().refine((value) => ['https:', 'http:'].includes(new URL(value).protocol), 'Must use HTTP or HTTPS').optional(),
}).strict();
export const reviewSchema = z.object({
  contractId: z.guid(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().max(2000),
}).strict();