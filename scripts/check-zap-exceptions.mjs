#!/usr/bin/env node
/**
 * Validator for the ZAP reviewed-exception ledger (`.zap/rules.tsv`).
 *
 * `scripts/check-zap-severity.mjs` reads this file to decide which medium/high
 * findings are waived. Nothing else checks that a row is well formed, which
 * means a typo in the plugin id column silently widens or voids a waiver, and
 * an `expiry` date is decorative unless something refuses to pass once it is in
 * the past. This script is that something, and the DAST job runs it before the
 * scan.
 *
 * Adapted from the `.zap/rules.tsv` half of GSA/ngx-uswds'
 * `scripts/validate-security-workflow.mjs`; the rest of that script asserts on
 * the shape of files this repo structures differently.
 *
 * A row must be exactly 7 tab-separated columns:
 *   rule-id  IGNORE  scope  issue-url  owner  expiry(YYYY-MM-DD)  rationale
 *
 * Rules enforced:
 *   - rule-id is all digits (a ZAP plugin id)
 *   - the action column is literally `IGNORE`
 *   - scope is non-empty (use `*` to mean rule-wide, deliberately)
 *   - issue-url is a GSA/sam-layouts issue URL, so every waiver is tracked
 *   - owner is non-empty
 *   - expiry is a REAL calendar date (not 2027-02-30) and is not in the past
 *   - rationale is non-empty and not a one-word shrug
 *   - no duplicate (rule-id, scope) pairs
 *
 * Usage:
 *   node scripts/check-zap-exceptions.mjs [.zap/rules.tsv]
 */
import { readFileSync } from 'node:fs';

const rulesPath = process.argv[2] ?? '.zap/rules.tsv';

/**
 * True only for a real ISO calendar date that round-trips through Date, so
 * values like 9999-99-99 or 2027-02-30 are rejected even though they satisfy a
 * naive \d{4}-\d{2}-\d{2} match.
 */
function isRealIsoDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return (
    !Number.isNaN(parsed.getTime()) &&
    parsed.toISOString().slice(0, 10) === value
  );
}

let contents;
try {
  contents = readFileSync(rulesPath, 'utf8');
} catch {
  // A missing ledger is not an error: it means no waivers, and the severity
  // gate is strictest in that state.
  console.log(
    `No ZAP exception ledger at ${rulesPath}; the gate has no waivers.`
  );
  process.exit(0);
}

const today = new Date().toISOString().slice(0, 10);
const failures = [];
const seen = new Map();

const rows = contents
  .split(/\r?\n/)
  .map((line, index) => ({ line, lineNumber: index + 1 }))
  .filter(({ line }) => line.trim() && !line.startsWith('#'));

for (const { line, lineNumber } of rows) {
  const columns = line.split('\t');
  const [ruleId, action, scope, issue, owner, expiry, rationale] = columns;
  const problems = [];

  if (columns.length !== 7) {
    problems.push(`expected 7 tab-separated columns, found ${columns.length}`);
  }
  if (!/^\d+$/.test(ruleId ?? '')) {
    problems.push(
      `rule-id is not a numeric ZAP plugin id: ${JSON.stringify(ruleId)}`
    );
  }
  if (action !== 'IGNORE') {
    problems.push(`action must be IGNORE, found ${JSON.stringify(action)}`);
  }
  if (!scope?.trim()) {
    problems.push('scope is empty (use * for a deliberate rule-wide waiver)');
  }
  if (
    !/^https:\/\/github\.com\/GSA\/sam-layouts\/issues\/\d+$/.test(issue ?? '')
  ) {
    problems.push(
      `issue must be a GSA/sam-layouts issue URL, found ${JSON.stringify(
        issue
      )}`
    );
  }
  if (!owner?.trim()) {
    problems.push('owner is empty');
  }
  if (!isRealIsoDate(expiry ?? '')) {
    problems.push(
      `expiry is not a real YYYY-MM-DD date: ${JSON.stringify(expiry)}`
    );
  } else if (expiry < today) {
    problems.push(
      `expiry ${expiry} is in the past (today is ${today}) — re-review or remove this waiver`
    );
  }
  if (!rationale?.trim() || rationale.trim().split(/\s+/).length < 5) {
    problems.push(
      'rationale is missing or too short to be a real justification'
    );
  }

  const key = `${ruleId}\u0000${scope}`;
  if (seen.has(key)) {
    problems.push(
      `duplicate (rule-id, scope) pair, already defined on line ${seen.get(
        key
      )}`
    );
  } else {
    seen.set(key, lineNumber);
  }

  for (const problem of problems) {
    failures.push(`${rulesPath}:${lineNumber}: ${problem}`);
  }
}

if (failures.length > 0) {
  console.error('ZAP exception ledger validation failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(
  `${rulesPath} passes validation: ${rows.length} reviewed exception${
    rows.length === 1 ? '' : 's'
  }, all unexpired.`
);
