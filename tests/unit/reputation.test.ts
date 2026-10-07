import { test } from 'node:test';
import assert from 'node:assert/strict';
import { deriveReputation, reviewGuard, evidenceFromReputation } from '../../lib/reputation/index.ts';
import type { ContractEvidence, ReputationInput } from '../../lib/reputation/index.ts';

const contract: ContractEvidence = {
  id: 'c1', studentId: 's1', clientId: 'client1', status: 'COMPLETED',
  dueAt: '2026-11-01T12:00:00Z', submittedAt: '2026-11-01T12:00:00Z', completedAt: '2026-11-01T12:00:00Z', skills: ['react', 'css'],
};
const empty: ReputationInput = { studentId: 's1', contracts: [], payments: [], reviews: [] };

test('reputation has honest no-history defaults', () => {
  const result = deriveReputation(empty);
  assert.equal(result.completedCount, 0);
  assert.equal(result.averageRating, null);
  assert.equal(result.onTimeRate, 0);
  assert.equal(result.totalEarned, 0);
  assert.ok(Object.values(result.skillCompletedCounts).every((count) => count === 0));
});

test('earnings require released payments on owned completed contracts and ratings require valid participants', () => {
  const result = deriveReputation({
    ...empty,
    contracts: [contract,
      { ...contract, id: 'c2', submittedAt: '2026-11-01T12:00:01Z', completedAt: '2026-11-01T12:00:01Z', skills: ['writing'] },
      { ...contract, id: 'c3', status: 'ACTIVE', completedAt: null },
      { ...contract, id: 'c4', studentId: 'other' },
      { ...contract, id: 'c5', status: 'SUBMITTED', completedAt: null },
      { ...contract, id: 'c6', status: 'REVISION_REQUESTED', completedAt: null },
    ],
    payments: [
      { contractId: 'c1', amount: 100.25, status: 'RELEASED' },
      { contractId: 'c2', amount: 500, status: 'HELD' },
      { contractId: 'c3', amount: 600, status: 'RELEASED' },
      { contractId: 'c4', amount: 700, status: 'RELEASED' },
      { contractId: 'c5', amount: 800, status: 'REFUNDED' },
    ],
    reviews: [
      { contractId: 'c1', studentId: 's1', clientId: 'client1', rating: 4 },
      { contractId: 'c2', studentId: 's1', clientId: 'imposter', rating: 5 },
      { contractId: 'c3', studentId: 's1', clientId: 'client1', rating: 5 },
      { contractId: 'c4', studentId: 'other', clientId: 'client1', rating: 5 },
    ],
  });
  assert.equal(result.completedCount, 2);
  assert.equal(result.activeContractCount, 3);
  assert.equal(result.onTimeRate, 0.5);
  assert.equal(result.totalEarned, 100.25);
  assert.equal(result.releasedPaymentCount, 1);
  assert.equal(result.averageRating, 4);
  assert.equal(result.reviewCount, 1);
  assert.equal(result.skillCompletedCounts.react, 1);
  assert.equal(result.skillCompletedCounts.writing, 1);
});

test('currency aggregation rounds cents rather than accumulating floating point drift', () => {
  const result = deriveReputation({ ...empty,
    contracts: [contract, { ...contract, id: 'c2' }],
    payments: [{ contractId: 'c1', status: 'RELEASED', amount: 0.1 }, { contractId: 'c2', status: 'RELEASED', amount: 0.2 }],
  });
  assert.equal(result.totalEarned, 0.3);
});

test('review guards forbid incomplete, nonclient, self and duplicate reviews', () => {
  assert.deepEqual(reviewGuard(contract, 'client1'), { allowed: true });
  assert.equal(reviewGuard({ ...contract, status: 'ACTIVE', completedAt: null }, 'client1').allowed, false);
  assert.equal(reviewGuard(contract, 's1').allowed, false);
  assert.equal(reviewGuard({ ...contract, clientId: 's1' }, 's1').allowed, false);
  assert.equal(reviewGuard(contract, 'client1', 1).allowed, false);
});

test('invalid data and duplicate reputation rows fail rather than inflate reputation', () => {
  assert.throws(() => deriveReputation({ ...empty, contracts: [contract, contract] }));
  assert.throws(() => deriveReputation({ ...empty, contracts: [{ ...contract, completedAt: null }] }));
  assert.throws(() => deriveReputation({ ...empty, payments: [{ contractId: 'c1', status: 'RELEASED', amount: NaN }] }));
  assert.throws(() => deriveReputation({ ...empty, reviews: [{ contractId: 'c1', studentId: 's1', clientId: 'client1', rating: 6 }] }));
  assert.throws(() => deriveReputation({ ...empty, payments: Array(2).fill({ contractId: 'c1', status: 'RELEASED', amount: 10 }) }));
});

test('timeliness uses first submission, not client completion delay; missing submission is not on-time', () => {
  assert.equal(deriveReputation({ ...empty, contracts: [{ ...contract, completedAt: '2026-12-01T00:00:00Z' }] }).onTimeRate, 1);
  assert.equal(deriveReputation({ ...empty, contracts: [{ ...contract, submittedAt: null }] }).onTimeRate, 0);
});

test('approved work derives skill evidence while declaration alone never fabricates it', () => {
  const evidence = evidenceFromReputation({ ...empty, contracts: [contract] }, ['react', 'css'], ['python']);
  assert.equal(evidence.relevantCompletedCount, 1);
  assert.deepEqual(evidence.skills.map((s) => [s.slug, s.evidenceScore]), [['react', 17], ['css', 17], ['python', 0]]);
  const capped = evidenceFromReputation({ ...empty, contracts: Array.from({ length: 7 }, (_, i) => ({ ...contract, id: `c${i}` })) }, ['react']);
  assert.equal(capped.skills[0].evidenceScore, 100);
  assert.equal(capped.relevantCompletedCount, 7);
});