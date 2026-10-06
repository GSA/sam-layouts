#!/usr/bin/env node
/**
 * Tests for the ZAP severity gate (scripts/check-zap-severity.mjs).
 *
 * These run on the Node built-in test runner (no extra deps) by invoking the
 * script as a child process against temp fixture files, so we exercise the real
 * CLI surface (exit codes, riskcode gating, .zap/rules.tsv exceptions) rather
 * than internals.
 *
 * Ported from GSA/ngx-uswds (scripts/check-zap-severity.test.mjs); see
 * GSA/sam-layouts#80.
 *
 * Run: node --test scripts/check-zap-severity.test.mjs
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const script = join(scriptDir, 'check-zap-severity.mjs');

/** Run the gate, returning { status, stdout, stderr }. */
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

/**
 * Write fixtures to a fresh temp dir, run the gate, then clean up.
 *
 * A rules file is ALWAYS written — empty unless the caller supplies one — and
 * always passed explicitly. Letting the script fall back to its default
 * `.zap/rules.tsv` would make these tests depend on the repo's real waiver
 * ledger and on the cwd, so adding a production waiver would silently flip a
 * test's expected outcome.
 */
function withFixtures({ report, rules = '' }, run_) {
  const dir = mkdtempSync(join(tmpdir(), 'zap-gate-'));
  try {
    const reportPath = join(dir, 'report_json.json');
    writeFileSync(reportPath, JSON.stringify(report));
    const rulesPath = join(dir, 'rules.tsv');
    writeFileSync(rulesPath, rules);
    return run_([reportPath, rulesPath]);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

function reportWith(alerts) {
  return { site: [{ alerts }] };
}

// Exception layout: rule-id  IGNORE  scope  issue  owner  expiry  rationale
function ruleRow(pluginId, scope = '*') {
  return `${pluginId}\tIGNORE\t${scope}\thttps://github.com/GSA/sam-layouts/issues/1\towner\t2999-01-01\trationale`;
}

test('passes when there are no alerts', () => {
  const result = withFixtures({ report: reportWith([]) }, run);
  assert.equal(result.status, 0);
  assert.match(result.stdout, /no unexcepted medium- or high-risk alerts/);
});

test('passes when only low-risk alerts are present', () => {
  const report = reportWith([
    {
      pluginid: '10096',
      alert: 'Timestamp Disclosure',
      riskcode: '1',
      riskdesc: 'Low',
    },
    {
      pluginid: '10027',
      alert: 'Info Disclosure',
      riskcode: '0',
      riskdesc: 'Informational',
    },
  ]);
  const result = withFixtures({ report }, run);
  assert.equal(result.status, 0);
});

test('fails on a medium-risk alert', () => {
  const report = reportWith([
    {
      pluginid: '10038',
      alert: 'CSP Header Not Set',
      riskcode: '2',
      riskdesc: 'Medium (High)',
    },
  ]);
  const result = withFixtures({ report }, run);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /medium- or high-risk alerts/);
  assert.match(result.stderr, /\[10038\] CSP Header Not Set/);
});

test('fails on a high-risk alert', () => {
  const report = reportWith([
    {
      pluginid: '40012',
      alert: 'Cross Site Scripting',
      riskcode: '3',
      riskdesc: 'High',
    },
  ]);
  const result = withFixtures({ report }, run);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /\[40012\] Cross Site Scripting/);
});

test('honors a rule-wide (*) IGNORE exception in the rules file', () => {
  const report = reportWith([
    {
      pluginid: '10038',
      alert: 'CSP Header Not Set',
      riskcode: '2',
      riskdesc: 'Medium',
      url: 'http://x/a',
    },
  ]);
  const rules = ['# comment line is ignored', ruleRow('10038', '*')].join('\n');
  const result = withFixtures({ report, rules }, run);
  assert.equal(result.status, 0);
  assert.match(result.stdout, /no unexcepted/);
});

test('a URL-scoped exception suppresses only the matching instance', () => {
  const report = reportWith([
    {
      pluginid: '10038',
      alert: 'CSP',
      riskcode: '2',
      riskdesc: 'Medium',
      url: 'http://127.0.0.1:4200/docs',
    },
    {
      pluginid: '10038',
      alert: 'CSP',
      riskcode: '2',
      riskdesc: 'Medium',
      url: 'http://127.0.0.1:4200/other',
    },
  ]);
  const rules = ruleRow('10038', '/docs');
  const result = withFixtures({ report, rules }, run);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /\/other/);
  assert.doesNotMatch(result.stderr, /\/docs/);
});

test('an unrelated exception does not suppress a different rule', () => {
  const report = reportWith([
    {
      pluginid: '40012',
      alert: 'Cross Site Scripting',
      riskcode: '3',
      riskdesc: 'High',
    },
  ]);
  const rules = ruleRow('10038', '*');
  const result = withFixtures({ report, rules }, run);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /\[40012\]/);
});

test('aggregates alerts across multiple sites', () => {
  const report = {
    site: [
      {
        alerts: [
          { pluginid: '1', alert: 'A', riskcode: '0', riskdesc: 'Info' },
        ],
      },
      {
        alerts: [
          { pluginid: '2', alert: 'B', riskcode: '3', riskdesc: 'High' },
        ],
      },
    ],
  };
  const result = withFixtures({ report }, run);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /\[2\] B/);
});

// --- Real-report shape ---------------------------------------------------
// ZAP 0.15.0 does NOT put a `url` on an alert: it groups observations under
// `alert.instances[].uri`. The fixtures above use the flat `url` shape the
// upstream ngx-uswds tests assumed, which is why the upstream scope matching
// was never exercised against a real report. These tests pin the actual shape,
// taken from the recorded run on GSA/sam-layouts#80.

function instanceAlert(pluginId, name, riskcode, uris) {
  return {
    pluginid: pluginId,
    alert: name,
    riskcode,
    riskdesc: riskcode === '3' ? 'High (Medium)' : 'Medium (High)',
    count: String(uris.length),
    instances: uris.map((uri) => ({ uri, method: 'GET', evidence: '' })),
  };
}

test('reports instance URLs, not "no url", for a real ZAP alert', () => {
  const report = reportWith([
    instanceAlert('10055', 'CSP: style-src unsafe-inline', '2', [
      'http://127.0.0.1:4200/',
      'http://127.0.0.1:4200/robots.txt',
    ]),
  ]);
  const result = withFixtures({ report }, run);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /\[10055\]/);
  assert.match(result.stderr, /robots\.txt/);
  assert.doesNotMatch(result.stderr, /no url/);
});

test('a URL-scoped exception matches instances[].uri', () => {
  const report = reportWith([
    instanceAlert('10055', 'CSP', '2', ['http://127.0.0.1:4200/robots.txt']),
  ]);
  const result = withFixtures(
    { report, rules: ruleRow('10055', '/robots.txt') },
    run
  );
  assert.equal(result.status, 0);
  assert.match(result.stdout, /no unexcepted/);
});

test('a scoped exception covering only some instances still blocks on the rest', () => {
  const report = reportWith([
    instanceAlert('10055', 'CSP', '2', [
      'http://127.0.0.1:4200/robots.txt',
      'http://127.0.0.1:4200/sitemap.xml',
    ]),
  ]);
  const result = withFixtures(
    { report, rules: ruleRow('10055', '/robots.txt') },
    run
  );
  assert.equal(result.status, 1);
  assert.match(result.stderr, /sitemap\.xml/);
  assert.doesNotMatch(result.stderr, /robots\.txt/);
});

test('a rule-wide exception covers an instance-shaped alert', () => {
  const report = reportWith([
    instanceAlert('10003', 'Vulnerable JS Library', '3', [
      'http://127.0.0.1:4200/main-OS7FNWK6.js',
    ]),
  ]);
  const result = withFixtures({ report, rules: ruleRow('10003', '*') }, run);
  assert.equal(result.status, 0);
});

test('an alert with no URL anywhere cannot be suppressed by a narrow scope', () => {
  const report = reportWith([
    { pluginid: '10055', alert: 'CSP', riskcode: '2', riskdesc: 'Medium' },
  ]);
  const result = withFixtures(
    { report, rules: ruleRow('10055', '/robots.txt') },
    run
  );
  assert.equal(result.status, 1);
  assert.match(result.stderr, /no url/);
});

// --- Fail-closed ---------------------------------------------------------

test('exits non-zero on an unreadable report', () => {
  const result = run([join(tmpdir(), 'does-not-exist-zap.json')]);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Unable to read ZAP JSON report/);
});

test('fails closed on an empty-object report (missing site array)', () => {
  const result = withFixtures({ report: {} }, run);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /missing the expected "site" array/);
});

test('fails closed on a site with no alerts array', () => {
  const result = withFixtures({ report: { site: [{}] } }, run);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /no "alerts" array/);
});

test('fails closed on invalid top-level JSON (array instead of object)', () => {
  const result = withFixtures({ report: [] }, run);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /missing the expected "site" array/);
});

test('fails closed on a missing riskcode', () => {
  const report = reportWith([
    { pluginid: '10038', alert: 'No riskcode', riskdesc: 'Medium' },
  ]);
  const result = withFixtures({ report }, run);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /missing or non-numeric riskcode/);
});

test('fails closed on a non-numeric riskcode', () => {
  const report = reportWith([
    { pluginid: '10038', alert: 'Bad', riskcode: 'oops', riskdesc: 'Medium' },
  ]);
  const result = withFixtures({ report }, run);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /missing or non-numeric riskcode/);
});
