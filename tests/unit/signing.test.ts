import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { signAnalysis, verifyAnalysis } from '../../lib/ai/signing.ts';
import type { SignedAnalysis } from '../../lib/ai/signing.ts';

const userId = 'c5c39e38-3c47-4c24-8c53-d41ad2dcbde2';
const otherId = '7eec82ad-0d14-4520-8aa5-73a120bd1de3';
const testSecret = 'unit-test-signing-secret-not-production-123456';
function payload(): SignedAnalysis {
  return {
    userId, expiresAt: Date.now() + 60_000,
    brief: { title: 'Task', description: 'A clear brief', fixedPrice: 100, deadline: '2026-11-01T12:00:00Z' },
    analysis: { category: 'Web', skills: ['react'], difficulty: 'Beginner', hoursMin: 1, hoursMax: 2, budgetMin: 100, budgetMax: 100, deliverables: ['Page'], requirements: [] },
    source: 'fallback', warning: 'Deterministic fallback',
  };
}

// One sequential parent owns and restores env, avoiding cross-test mutation races.
test('signed analysis security and input validation', async (t) => {
  const original = process.env.ANALYSIS_SIGNING_SECRET;
  process.env.ANALYSIS_SIGNING_SECRET = testSecret;
  try {
    await t.test('roundtrip is bound to user and preserves validated payload', () => {
      const input = payload();
      const token = signAnalysis(input);
      assert.deepEqual(verifyAnalysis(token, userId), input);
      assert.throws(() => verifyAnalysis(token, otherId));
      assert.ok(!token.includes(testSecret));
    });
    await t.test('Postgres GUID seed identifiers and optional request nonce roundtrip', () => {
      const seedId = '5b655dfc-2eef-0321-dff5-f65c02d7cac9';
      const input = { ...payload(), userId: seedId, requestId: otherId };
      assert.deepEqual(verifyAnalysis(signAnalysis(input), seedId), input);
      assert.throws(() => signAnalysis({ ...input, requestId: 'bad-guid' }));
    });
    await t.test('expired and exact-expiry tokens fail', () => {
      assert.throws(() => verifyAnalysis(signAnalysis({ ...payload(), expiresAt: Date.now() - 1 }), userId));
      const originalNow = Date.now;
      Date.now = () => 1_000;
      try { assert.throws(() => verifyAnalysis(signAnalysis({ ...payload(), expiresAt: 1_000 }), userId)); }
      finally { Date.now = originalNow; }
    });
    await t.test('malformed token, trailing separator and oversized token fail', () => {
      const token = signAnalysis(payload());
      for (const invalid of ['', '.', 'abc', '.abc', 'abc.', 'abc.def.extra', `${token}.`, 'x'.repeat(40_001)]) {
        assert.throws(() => verifyAnalysis(invalid, userId), invalid.slice(0, 80));
      }
    });
    await t.test('tampering body, signature and noncanonical signature encoding fail', () => {
      const token = signAnalysis(payload());
      const [body, signature] = token.split('.');
      const decoded = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
      decoded.brief.fixedPrice = 900;
      const changed = Buffer.from(JSON.stringify(decoded)).toString('base64url');
      assert.throws(() => verifyAnalysis(`${changed}.${signature}`, userId));
      assert.throws(() => verifyAnalysis(`${body}.${signature.slice(0, -1)}`, userId));
      assert.throws(() => verifyAnalysis(`${body}.${signature === 'A'.repeat(43) ? 'B'.repeat(43) : 'A'.repeat(43)}`, userId));
      assert.throws(() => verifyAnalysis(`${body}.${signature}!`, userId));
      assert.throws(() => verifyAnalysis(`${body}.${signature}=`, userId));
    });
    await t.test('missing or short secret fails closed for both operations', () => {
      const token = signAnalysis(payload());
      for (const value of [undefined, '', 'short', 'x'.repeat(31)]) {
        if (value === undefined) delete process.env.ANALYSIS_SIGNING_SECRET;
        else process.env.ANALYSIS_SIGNING_SECRET = value;
        assert.throws(() => signAnalysis(payload()), /not configured/);
        assert.throws(() => verifyAnalysis(token, userId), /not configured/);
      }
      process.env.ANALYSIS_SIGNING_SECRET = testSecret;
    });
    await t.test('invalid inputs are rejected before signing and after authenticating body', () => {
      for (const input of [
        { ...payload(), userId: 'not-uuid' }, { ...payload(), expiresAt: NaN },
        { ...payload(), brief: { ...payload().brief, fixedPrice: 0 } },
        { ...payload(), analysis: { ...payload().analysis, hoursMin: 10, hoursMax: 1 } },
      ]) assert.throws(() => signAnalysis(input as SignedAnalysis));
      const body = Buffer.from('{"userId":"not-uuid"}').toString('base64url');
      const signature = createHmac('sha256', testSecret).update(body).digest('base64url');
      assert.throws(() => verifyAnalysis(`${body}.${signature}`, userId));
      const malformed = Buffer.from('{not json').toString('base64url');
      assert.throws(() => verifyAnalysis(`${malformed}.${createHmac('sha256', testSecret).update(malformed).digest('base64url')}`, userId));
    });
  } finally {
    if (original === undefined) delete process.env.ANALYSIS_SIGNING_SECRET;
    else process.env.ANALYSIS_SIGNING_SECRET = original;
  }
});