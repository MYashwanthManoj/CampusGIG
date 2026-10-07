import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calculateMatch, evidenceSchema, matchScoreSchema, COMPONENT_MAXIMA } from '../../lib/matching/index.ts';
import type { StudentEvidence } from '../../lib/matching/index.ts';
import { normalizeSkillSlug } from '../../lib/validation/skills.ts';

const fresh: StudentEvidence = {
  studentId: 'student-1', skills: [], completedCount: 0, relevantCompletedCount: 0,
  activeContractCount: 0, averageRating: null, onTimeRate: 0,
};

test('no history is safe and earns availability only', () => {
  assert.deepEqual(calculateMatch({ requiredSkills: ['react'] }, fresh), {
    skill: 0, pastWork: 0, availability: 15, experience: 0, rating: 0, reliability: 0, total: 15,
  });
  assert.equal(calculateMatch({ requiredSkills: [] }, fresh).skill, 0);
});

test('all six component ceilings reach exactly 100 and saturation never exceeds them', () => {
  const score = calculateMatch({ requiredSkills: ['react'] }, {
    ...fresh, skills: [{ slug: 'react', name: 'React', evidenceScore: 100 }],
    completedCount: 1000, relevantCompletedCount: 1000, averageRating: 5, onTimeRate: 1,
  });
  for (const [key, max] of Object.entries(COMPONENT_MAXIMA)) assert.equal(score[key as keyof typeof score], max);
  assert.equal(score.total, 100);
});

test('canonical skill mean includes missing skills, ignores names and irrelevant skills', () => {
  const score = calculateMatch({ requiredSkills: ['react', 'nextjs', 'css'] }, {
    ...fresh, skills: [
      { slug: 'react', name: 'Python', evidenceScore: 100 },
      { slug: 'nextjs', name: 'Next.js', evidenceScore: 50 },
      { slug: 'writing', name: 'CSS', evidenceScore: 100 },
    ],
  });
  assert.equal(score.skill, 18);
});

test('locked round/math boundaries for past work experience rating and reliability', () => {
  const score = calculateMatch({ requiredSkills: [] }, {
    ...fresh, completedCount: 7, relevantCompletedCount: 3, averageRating: 4.25, onTimeRate: 0.5,
  });
  assert.equal(score.pastWork, 13);
  assert.equal(score.experience, 5);
  assert.equal(score.rating, 9);
  assert.equal(score.reliability, 3);
  assert.equal(calculateMatch({ requiredSkills: [] }, { ...fresh, completedCount: 63 }).experience, 10);
  assert.equal(calculateMatch({ requiredSkills: [] }, { ...fresh, averageRating: 0 }).rating, 0);
});

test('availability uses exact concurrency tiers', () => {
  for (const [activeContractCount, availability] of [[0, 15], [1, 8], [2, 0], [50, 0]]) {
    assert.equal(calculateMatch({ requiredSkills: [] }, { ...fresh, activeContractCount }).availability, availability);
  }
});

test('every component and sum remain integral and bounded over representative input grid', () => {
  for (const completedCount of [0, 1, 3, 6, 7, 63, 1000]) {
    for (const evidenceScore of [0, 0.5, 20, 50, 99.9, 100]) {
      const score = calculateMatch({ requiredSkills: ['react'] }, {
        ...fresh, completedCount, relevantCompletedCount: Math.min(6, completedCount),
        activeContractCount: completedCount % 3, averageRating: 4.7, onTimeRate: 0.81,
        skills: [{ slug: 'react', name: 'React', evidenceScore }],
      });
      let sum = 0;
      for (const [key, max] of Object.entries(COMPONENT_MAXIMA)) {
        const value = score[key as keyof typeof score];
        assert.ok(Number.isInteger(value) && value >= 0 && value <= max);
        sum += value;
      }
      assert.equal(score.total, sum);
      assert.ok(score.total >= 0 && score.total <= 100);
    }
  }
});

test('invalid evidence and fabricated or noninteger totals are rejected', () => {
  for (const value of [NaN, Infinity, -1, 101]) {
    assert.equal(evidenceSchema.safeParse({ ...fresh, skills: [{ slug: 'react', name: 'React', evidenceScore: value }] }).success, false);
  }
  for (const key of ['averageRating', 'onTimeRate', 'completedCount', 'activeContractCount']) {
    assert.equal(evidenceSchema.safeParse({ ...fresh, [key]: NaN }).success, false);
  }
  assert.equal(evidenceSchema.safeParse({ ...fresh, averageRating: 5.1 }).success, false);
  assert.equal(evidenceSchema.safeParse({ ...fresh, onTimeRate: 1.1 }).success, false);
  assert.equal(evidenceSchema.safeParse({ ...fresh, completedCount: -1 }).success, false);
  assert.equal(evidenceSchema.safeParse({ ...fresh, relevantCompletedCount: 1 }).success, false);
  assert.equal(evidenceSchema.safeParse({ ...fresh, skills: [{ slug: 'reactjs', name: 'React', evidenceScore: 100 }] }).success, false);
  const score = calculateMatch({ requiredSkills: [] }, fresh);
  assert.equal(matchScoreSchema.safeParse({ ...score, total: 100 }).success, false);
  assert.equal(matchScoreSchema.safeParse({ ...score, reliability: 0.1 }).success, false);
  for (const [key, max] of Object.entries(COMPONENT_MAXIMA)) {
    assert.equal(matchScoreSchema.safeParse({ ...score, [key]: max + 1 }).success, false);
  }
});

test('aliases normalize explicitly and unknowns/prototype names never match', () => {
  for (const [alias, slug] of [[' React.js ', 'react'], ['Next JS', 'nextjs'], ['UI/UX', 'uiux'], ['Google Sheets', 'spreadsheet']]) {
    assert.equal(normalizeSkillSlug(alias), slug);
  }
  assert.equal(normalizeSkillSlug('SQL'), null);
  assert.equal(normalizeSkillSlug('constructor'), null);
});