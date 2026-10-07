import { z } from 'zod';
import { canonicalSkillsSchema, skillSlugSchema } from '../validation/skills.ts';

const count = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER);
export const evidenceSchema = z.object({
  studentId: z.string().min(1),
  skills: z.array(z.object({
    slug: skillSlugSchema,
    name: z.string().trim().min(1).max(80),
    evidenceScore: z.number().finite().min(0).max(100),
  }).strict()).max(9).refine((skills) => new Set(skills.map((s) => s.slug)).size === skills.length, 'Duplicate skill evidence'),
  completedCount: count,
  relevantCompletedCount: count,
  activeContractCount: count,
  averageRating: z.number().finite().min(0).max(5).nullable(),
  onTimeRate: z.number().finite().min(0).max(1),
}).strict().refine((value) => value.relevantCompletedCount <= value.completedCount, 'Relevant completions cannot exceed total completions');
export type StudentEvidence = z.infer<typeof evidenceSchema>;
export const matchTaskSchema = z.object({ requiredSkills: canonicalSkillsSchema }).strict();
export type MatchTask = z.infer<typeof matchTaskSchema>;

export const COMPONENT_MAXIMA = { skill: 35, pastWork: 25, availability: 15, experience: 10, rating: 10, reliability: 5 } as const;
export const matchScoreSchema = z.object({
  skill: z.number().int().min(0).max(35),
  pastWork: z.number().int().min(0).max(25),
  availability: z.number().int().min(0).max(15),
  experience: z.number().int().min(0).max(10),
  rating: z.number().int().min(0).max(10),
  reliability: z.number().int().min(0).max(5),
  total: z.number().int().min(0).max(100),
}).strict().refine((score) => score.total === score.skill + score.pastWork + score.availability + score.experience + score.rating + score.reliability, 'Total must equal the sum of components');
export type MatchScore = z.infer<typeof matchScoreSchema>;

/** Missing required skills contribute zero; an empty requirement list earns zero skill points. */
export function calculateMatch(taskInput: MatchTask, evidenceInput: StudentEvidence): MatchScore {
  const task = matchTaskSchema.parse(taskInput);
  const evidence = evidenceSchema.parse(evidenceInput);
  const scores = new Map(evidence.skills.map((skill) => [skill.slug, skill.evidenceScore]));
  const mean = task.requiredSkills.length === 0 ? 0
    : task.requiredSkills.reduce((sum, slug) => sum + (scores.get(slug) ?? 0) / 100, 0) / task.requiredSkills.length;
  const components = {
    skill: Math.round(35 * mean),
    pastWork: Math.round(25 * Math.min(evidence.relevantCompletedCount / 6, 1)),
    availability: evidence.activeContractCount === 0 ? 15 : evidence.activeContractCount === 1 ? 8 : 0,
    experience: Math.round(10 * Math.min(Math.log2(evidence.completedCount + 1) / 6, 1)),
    rating: Math.round((evidence.averageRating ?? 0) / 5 * 10),
    reliability: Math.round(evidence.onTimeRate * 5),
  };
  return matchScoreSchema.parse({ ...components, total: Object.values(components).reduce((sum, value) => sum + value, 0) });
}