#!/usr/bin/env node
/**
 * Tests for the ZAP exception-ledger validator
 * (scripts/check-zap-exceptions.mjs).
 *
 * Node built-in test runner, no extra deps. The validator is exercised through
 * its real CLI surface against temp fixture files.
 *
 * Run: node --test scripts/check-zap-exceptions.test.mjs
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const script = join(scriptDir, 'check-zap-exceptions.mjs');

function run(args) {
  try {
    const stdout = execFileSync('node', [script, ...args], {
      encoding: 'utf8',
    });
    return { status: 0, stdout, stderr: '' };
  } catch (error) {
    return {
      status: error.status ?? 1,
      stdout: error.stdout?.toString() ?? '',
      stderr: error.stderr?.toString() ?? '',
    };
  }
}

/** Write a ledger to a temp dir, validate it, clean up. */
function withLedger(contents) {
  const dir = mkdtempSync(join(tmpdir(), 'zap-rules-'));
  try {
    const path = join(dir, 'rules.tsv');
    writeFileSync(path, contents);
    return run([path]);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

const FUTURE = '2999-01-01';
const PAST = '2020-01-01';

function row({
  id = '10055',
  action = 'IGNORE',
  scope = '127.0.0.1:4200',
  issue = 'https://github.com/GSA/sam-layouts/issues/80',
  owner = 'sam-layouts maintainers',
  expiry = FUTURE,
  rationale = 'a genuine justification with enough words',
} = {}) {
  return [id, action, scope, issue, owner, expiry, rationale].join('\t');
}

test('passes a well-formed ledger', () => {
  const result = withLedger(['# header comment', row()].join('\n'));
  assert.equal(result.status, 0);
  assert.match(result.stdout, /1 reviewed exception, all unexpired/);
});

test('passes a comments-only ledger with no rows', () => {
  const result = withLedger('# nothing waived yet\n');
  assert.equal(result.status, 0);
  assert.match(result.stdout, /0 reviewed exceptions/);
});

test('treats a missing ledger as no waivers, not an error', () => {
  const result = run([join(tmpdir(), 'no-such-rules-file.tsv')]);
  assert.equal(result.status, 0);
  assert.match(result.stdout, /no waivers/);
});

test('rejects an expired waiver', () => {
  const result = withLedger(row({ expiry: PAST }));
  assert.equal(result.status, 1);
  assert.match(result.stderr, /is in the past/);
});

test('rejects a date that looks valid but is not a real day', () => {
  const result = withLedger(row({ expiry: '2027-02-30' }));
  assert.equal(result.status, 1);
  assert.match(result.stderr, /not a real YYYY-MM-DD date/);
});

test('rejects a non-numeric rule id', () => {
  const result = withLedger(row({ id: '1005X' }));
  assert.equal(result.status, 1);
  assert.match(result.stderr, /not a numeric ZAP plugin id/);
});

test('rejects an action other than IGNORE', () => {
  const result = withLedger(row({ action: 'WARN' }));
  assert.equal(result.status, 1);
  assert.match(result.stderr, /action must be IGNORE/);
});

test('rejects an empty scope', () => {
  const result = withLedger(row({ scope: '' }));
  assert.equal(result.status, 1);
  assert.match(result.stderr, /scope is empty/);
});

test('accepts an explicit rule-wide * scope', () => {
  const result = withLedger(row({ scope: '*' }));
  assert.equal(result.status, 0);
});

test('rejects an issue URL from another repository', () => {
  const result = withLedger(
    row({ issue: 'https://github.com/GSA/ngx-uswds/issues/272' })
  );
  assert.equal(result.status, 1);
  assert.match(result.stderr, /must be a GSA\/sam-layouts issue URL/);
});

test('rejects a missing issue URL', () => {
  const result = withLedger(row({ issue: 'none' }));
  assert.equal(result.status, 1);
  assert.match(result.stderr, /issue must be a GSA/);
});

test('rejects an empty owner', () => {
  const result = withLedger(row({ owner: '' }));
  assert.equal(result.status, 1);
  assert.match(result.stderr, /owner is empty/);
});

test('rejects a one-word rationale', () => {
  const result = withLedger(row({ rationale: 'noise' }));
  assert.equal(result.status, 1);
  assert.match(result.stderr, /rationale is missing or too short/);
});

test('rejects a row with the wrong column count', () => {
  const result = withLedger('10055\tIGNORE\tscope');
  assert.equal(result.status, 1);
  assert.match(result.stderr, /expected 7 tab-separated columns, found 3/);
});

test('rejects a space-separated row (not tabs)', () => {
  const result = withLedger(row().replace(/\t/g, ' '));
  assert.equal(result.status, 1);
  assert.match(result.stderr, /expected 7 tab-separated columns, found 1/);
});

test('rejects duplicate (rule-id, scope) pairs', () => {
  const result = withLedger([row(), row()].join('\n'));
  assert.equal(result.status, 1);
  assert.match(result.stderr, /duplicate \(rule-id, scope\) pair/);
});

test('allows the same rule id at two different scopes', () => {
  const result = withLedger(
    [row({ scope: '/a' }), row({ scope: '/b' })].join('\n')
  );
  assert.equal(result.status, 0);
  assert.match(result.stdout, /2 reviewed exceptions/);
});

test('reports the offending line number', () => {
  const result = withLedger(
    [
      '# comment',
      row({ scope: '/a' }),
      row({ scope: '/b', expiry: PAST }),
    ].join('\n')
  );
  assert.equal(result.status, 1);
  assert.match(result.stderr, /:3: expiry 2020-01-01 is in the past/);
});
