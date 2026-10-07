import { test } from 'node:test';
import assert from 'node:assert/strict';
import { transitionContract, transitionTask } from '../../lib/validation/transitions.ts';

test('single revision lifecycle completes without mutating input', () => {
  const original = { status: 'ACTIVE' as const, revisionCount: 0 };
  const submitted = transitionContract(original, 'submit');
  const revision = transitionContract(submitted, 'requestRevision');
  assert.deepEqual(revision, { status: 'REVISION_REQUESTED', revisionCount: 1 });
  const resubmitted = transitionContract(revision, 'submit');
  assert.throws(() => transitionContract(resubmitted, 'requestRevision'));
  assert.deepEqual(transitionContract(resubmitted, 'approve'), { status: 'COMPLETED', revisionCount: 1 });
  assert.deepEqual(original, { status: 'ACTIVE', revisionCount: 0 });
});

test('out-of-order and terminal transitions are rejected', () => {
  assert.throws(() => transitionContract({ status: 'ACTIVE', revisionCount: 0 }, 'approve'));
  assert.throws(() => transitionContract({ status: 'ACTIVE', revisionCount: 0 }, 'requestRevision'));
  assert.throws(() => transitionContract({ status: 'SUBMITTED', revisionCount: 0 }, 'submit'));
  for (const status of ['COMPLETED', 'CANCELLED'] as const) {
    for (const action of ['submit', 'approve', 'requestRevision'] as const) assert.throws(() => transitionContract({ status, revisionCount: 0 }, action));
  }
  assert.throws(() => transitionContract({ status: 'ACTIVE', revisionCount: 2 }, 'submit'));
});

test('task lifecycle mirrors contract workflow and refuses hiring twice', () => {
  assert.equal(transitionTask('DRAFT', 'publish'), 'OPEN');
  assert.equal(transitionTask('OPEN', 'hire'), 'IN_PROGRESS');
  assert.throws(() => transitionTask('IN_PROGRESS', 'hire'));
  assert.equal(transitionTask('IN_PROGRESS', 'submit'), 'SUBMITTED');
  assert.equal(transitionTask('SUBMITTED', 'requestRevision'), 'REVISION_REQUESTED');
  assert.equal(transitionTask('REVISION_REQUESTED', 'submit'), 'SUBMITTED');
  assert.equal(transitionTask('SUBMITTED', 'approve'), 'COMPLETED');
  assert.throws(() => transitionTask('OPEN', 'approve'));
  assert.throws(() => transitionTask('COMPLETED', 'hire'));
  assert.throws(() => transitionTask('CANCELLED', 'publish'));
});