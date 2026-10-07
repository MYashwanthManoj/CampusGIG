import { test } from 'node:test';
import assert from 'node:assert/strict';
import { analysisSchema, taskBriefSchema, declareSkillSchema, applicationSchema, submissionSchema, reviewSchema } from '../../lib/validation/index.ts';

const uuid = 'c5c39e38-3c47-4c24-8c53-d41ad2dcbde2';
const analysis = {
  category: 'Web development', skills: ['react'], difficulty: 'Beginner', hoursMin: 1, hoursMax: 4,
  budgetMin: 500, budgetMax: 1000, deliverables: ['Landing page'], requirements: ['Responsive layout'],
};

test('analysis schema enforces canonical dictionary, lengths and numeric crossbounds', () => {
  assert.equal(analysisSchema.safeParse(analysis).success, true);
  for (const patch of [
    { skills: ['reactjs'] }, { skills: ['react', 'react'] },
    { skills: ['react', 'nextjs', 'css', 'uiux', 'python', 'design', 'video'] },
    { deliverables: Array(9).fill('item') }, { requirements: Array(9).fill('item') },
    { hoursMin: 5 }, { budgetMin: 1001 }, { hoursMin: NaN }, { budgetMax: Infinity },
    { hoursMin: -1 }, { difficulty: 'expert' }, { category: '' }, { extra: true },
  ]) assert.equal(analysisSchema.safeParse({ ...analysis, ...patch }).success, false, JSON.stringify(patch));
});

test('brief requires bounded text, finite positive price and ISO deadline', () => {
  const brief = { title: 'Task', description: 'A clear brief', fixedPrice: 500, deadline: '2026-11-01T12:00:00Z' };
  assert.equal(taskBriefSchema.safeParse(brief).success, true);
  for (const patch of [{ title: ' ' }, { description: 'x'.repeat(10001) }, { fixedPrice: 0 }, { fixedPrice: NaN }, { deadline: 'tomorrow' }]) {
    assert.equal(taskBriefSchema.safeParse({ ...brief, ...patch }).success, false);
  }
});

test('application, declaration, submission and review do not accept forged server fields', () => {
  assert.equal(declareSkillSchema.safeParse({ slug: 'python' }).success, true);
  assert.equal(declareSkillSchema.safeParse({ slug: 'python', evidenceScore: 100 }).success, false);
  assert.equal(applicationSchema.safeParse({ taskId: uuid, proposal: 'I can deliver this.' }).success, true);
  assert.equal(applicationSchema.safeParse({ taskId: uuid, proposal: 'Proposal', score: 100 }).success, false);
  assert.equal(submissionSchema.safeParse({ contractId: uuid, message: 'Done', artifactUrl: 'https://example.com/result' }).success, true);
  assert.equal(submissionSchema.safeParse({ contractId: uuid, message: 'Done', artifactUrl: 'javascript:alert(1)' }).success, false);
  assert.equal(reviewSchema.safeParse({ contractId: uuid, rating: 5, comment: '' }).success, true);
  for (const rating of [0, 6, 4.5, NaN]) assert.equal(reviewSchema.safeParse({ contractId: uuid, rating, comment: '' }).success, false);
});

test('database GUIDs do not require RFC UUID version bits', () => {
  const seedId = '5b655dfc-2eef-0321-dff5-f65c02d7cac9';
  assert.equal(applicationSchema.safeParse({ taskId: seedId, proposal: 'Proposal' }).success, true);
  assert.equal(submissionSchema.safeParse({ contractId: seedId, message: 'Done' }).success, true);
  assert.equal(reviewSchema.safeParse({ contractId: seedId, rating: 4, comment: '' }).success, true);
});