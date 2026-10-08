#!/usr/bin/env node
/**
 * Ratcheting warning-baseline gate for ESLint (run via the Nx `@nx/eslint:lint`
 * executor).
 *
 * This workspace carries a large amount of pre-existing lint debt that is
 * deliberately classified `warn` rather than `error` (see the inline comments
 * in `sam-layouts/eslint.config.mjs` — `prefer-standalone` is owned by the
 * Wave 3 Angular 21 slice, `@nx/dependency-checks` by the peer-dependency
 * slice, template interaction a11y by the WCAG gate slice). ESLint's own
 * `--max-warnings` only supports a single fixed number, which cannot ratchet
 * down as debt is paid off without editing CI config on every cleanup PR. This
 * script enforces a *ceiling* per Nx project, recorded in
 * `eslint-baseline.json` at the repo root:
 *
 *   - New warnings above the recorded baseline fail the gate.
 *   - Any ESLint error fails the gate, regardless of the warning count.
 *   - Reducing warnings does NOT fail the gate; run with `--bump` to lock the
 *     improvement in as the new (lower) baseline.
 *
 * The baseline is a ratchet — `--bump` only ever lowers it. It never raises it,
 * so an accidental regression can't be "fixed" by re-bumping.
 *
 * Usage:
 *   node scripts/check-lint-baseline.mjs <project> <path/to/eslint-report.json>
 *   node scripts/check-lint-baseline.mjs --bump <project> <path/to/eslint-report.json>
 *
 * Where <project> is a key in eslint-baseline.json (an Nx project name, e.g.
 * "layouts" or "sam-layouts") and the ESLint report is produced with
 * `npx nx run <project>:lint --format json --output-file <path>`.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const baselinePath = resolve(scriptDir, '..', 'eslint-baseline.json');

const args = process.argv.slice(2);
const bump = args.includes('--bump');
const positional = args.filter((arg) => !arg.startsWith('--'));
const [project, reportArg] = positional;

if (!project || !reportArg) {
  console.error(
    'Usage: node scripts/check-lint-baseline.mjs [--bump] <project> <path/to/eslint-report.json>'
  );
  process.exit(1);
}

const reportPath = resolve(reportArg);

let report;
try {
  report = JSON.parse(readFileSync(reportPath, 'utf8'));
} catch (error) {
  console.error(`✖ Could not read ESLint report at ${reportPath}`);
  console.error(`  ${error.message}`);
  console.error(
    '  Run `npm run lint:report` first to generate the per-project reports.'
  );
  process.exit(1);
}

if (!Array.isArray(report)) {
  console.error(`✖ Invalid ESLint report format: report must be a JSON array.`);
  process.exit(1);
}

// Fail closed on an empty report. An empty array is *valid* JSON and would
// otherwise total to 0 errors / 0 warnings and sail through the gate — but it
// proves no files were linted at all, which means the lint target, its file
// globs, or the project name passed to `lint:report` is broken. A silent PASS
// there is strictly worse than a hard failure, and `--bump` would compound it
// by ratcheting the baseline down to 0.
if (report.length === 0) {
  console.error(
    `✖ ${project}: ESLint report at ${reportPath} is empty — no files were linted.`
  );
  console.error(
    '  An empty report cannot prove the project is clean; it means the lint\n' +
      '  target, its file globs, or the project name is wrong. Check that\n' +
      `  \`npx nx run ${project}:lint\` actually matches source files, then re-run\n` +
      '  `npm run lint:report`.'
  );
  process.exit(1);
}

for (const result of report) {
  if (!result || typeof result !== 'object') {
    console.error(
      `✖ Invalid ESLint report format: report contains non-object results.`
    );
    process.exit(1);
  }
  // Same reasoning as the empty-array guard, one level down: a result with no
  // filePath is not a linted file, so it must not be allowed to contribute a
  // reassuring 0/0 to the totals.
  if (typeof result.filePath !== 'string' || result.filePath.length === 0) {
    console.error(
      `✖ Invalid ESLint report format: result has a missing or empty filePath.`
    );
    process.exit(1);
  }
  const { errorCount, warningCount } = result;
  if (
    typeof errorCount !== 'number' ||
    !Number.isFinite(errorCount) ||
    errorCount < 0 ||
    typeof warningCount !== 'number' ||
    !Number.isFinite(warningCount) ||
    warningCount < 0
  ) {
    console.error(
      `✖ Invalid ESLint report format: missing or invalid errorCount/warningCount values.`
    );
    process.exit(1);
  }
}

let baselines;
try {
  baselines = JSON.parse(readFileSync(baselinePath, 'utf8'));
} catch (error) {
  console.error(`✖ Could not read lint baselines at ${baselinePath}`);
  console.error(`  ${error.message}`);
  process.exit(1);
}

const totals = report.reduce(
  (acc, result) => {
    acc.errors += result.errorCount;
    acc.warnings += result.warningCount;
    return acc;
  },
  { errors: 0, warnings: 0 }
);

if (bump) {
  const current = baselines[project];
  if (!Number.isFinite(current)) {
    console.error(`✖ ${project}: missing or invalid entry in ${baselinePath}`);
    process.exit(1);
  }

  // Ratchet only ever moves down.
  const next = Math.min(current, totals.warnings);

  if (totals.errors > 0) {
    console.error(
      `✖ ${project}: ${totals.errors} ESLint error(s) found; fix errors before bumping the baseline.`
    );
    process.exit(1);
  }

  if (next === current) {
    console.log(
      `= ${project}: baseline already at or below current warnings (${current}); nothing to bump.`
    );
    process.exit(0);
  }

  baselines[project] = next;
  writeFileSync(baselinePath, `${JSON.stringify(baselines, null, 2)}\n`);
  console.log(
    `↓ ${project}: baseline lowered ${current} → ${next} (measured ${totals.warnings}). Commit this change on its own.`
  );
  process.exit(0);
}

const baseline = baselines[project];
if (!Number.isFinite(baseline)) {
  console.error(`✖ ${project}: missing or invalid entry in ${baselinePath}`);
  process.exit(1);
}

if (totals.errors > 0) {
  console.error(
    `✖ ${project}: ${totals.errors} ESLint error(s) found. Errors are never allowed, regardless of the warning baseline.`
  );
  process.exit(1);
}

if (totals.warnings > baseline) {
  console.error(`✖ ${project}: ESLint warning baseline exceeded.`);
  console.error(`  expected: <= ${baseline} warnings`);
  console.error(`  actual:   ${totals.warnings} warnings`);
  console.error(
    '\n  This change introduced new ESLint warnings beyond the accepted baseline.\n' +
      '  Fix the new findings, or if you intentionally reduced warnings elsewhere,\n' +
      `  run \`node scripts/check-lint-baseline.mjs --bump ${project} ${reportArg}\` and commit\n` +
      '  the lowered baseline as its own change.'
  );
  process.exit(1);
}

console.log(
  `✓ ${project}: ${totals.warnings} warnings (baseline ${baseline}), ${totals.errors} errors. Lint baseline gate passed.`
);
