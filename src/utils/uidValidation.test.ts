import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeUid, validateUid } from './uidValidation.ts';

test('normalizeUid trims and removes inner spaces', () => {
  assert.equal(normalizeUid('  8492 0192  '), '84920192');
  assert.equal(normalizeUid('UID-908127'), 'UID-908127');
});

test('validateUid rejects empty input', () => {
  const res = validateUid('   ');
  assert.equal(res.isValid, false);
  assert.equal(res.strengthLevel, 0);
  assert.equal(res.statusLabel, 'Empty');
  assert.ok(res.errorMessage);
});

test('validateUid rejects short UIDs under 6 characters', () => {
  const res = validateUid('12345');
  assert.equal(res.isValid, false);
  assert.equal(res.statusLabel, 'Too short');
  assert.equal(res.strengthLevel, 2);
});

test('validateUid rejects special symbols', () => {
  const res = validateUid('8492@0192!');
  assert.equal(res.isValid, false);
  assert.equal(res.statusLabel, 'Invalid chars');
});

test('validateUid accepts valid numeric, alphanumeric, and secret admin UID 766758', () => {
  const numericRes = validateUid('518294012');
  assert.equal(numericRes.isValid, true);
  assert.equal(numericRes.strengthLevel, 3);
  assert.equal(numericRes.statusLabel, 'Ready');
  assert.equal(numericRes.errorMessage, null);

  const alphaRes = validateUid('UID-8849201');
  assert.equal(alphaRes.isValid, true);
  assert.equal(alphaRes.normalizedUid, 'UID-8849201');

  const adminRes = validateUid('766758');
  assert.equal(adminRes.isValid, true);
  assert.equal(adminRes.normalizedUid, '766758');
});
