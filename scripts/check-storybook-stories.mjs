#!/usr/bin/env node
/**
 * Assert that a built Storybook actually registered stories.
 *
 * `build-storybook` exits 0 on an empty Storybook. On `main` the `stories`
 * glob in `apps/sam-layouts/.storybook/main.ts` pointed at the demo app's
 * `src/app/`, where no story has ever lived, so the build shipped
 * `{"v":5,"entries":{}}` and every downstream check — a Pages deploy, an
 * axe/Playwright gate walking `index.json` — would have been green against
 * nothing. See GSA/sam-layouts#75.
 *
 * This reads the built `index.json` and fails unless it holds at least
 * `--min` entries, and (optionally) every `--require-title`. The floor is a
 * floor rather than an equality so that adding a story does not break CI;
 * the title checks pin the entries that are structurally easy to lose —
 * notably the two separate `Subheader` / `Subheader/Modes` titles, which come
 * from two distinct story files.
 *
 * Usage:
 *   node scripts/check-storybook-stories.mjs [indexPath] \
 *     [--min <n>] [--require-title <title>]...
 */

import { readFileSync } from 'node:fs';
import { argv, exit, stderr, stdout } from 'node:process';
import { fileURLToPath } from 'node:url';

/** Entries registered at the time of GSA/sam-layouts#75: 26 stories + 8 docs. */
const DEFAULT_MINIMUM_ENTRIES = 34;
const DEFAULT_INDEX_PATH = 'dist/storybook/sam-layouts/index.json';

export function checkStorybookStories({
  indexPath,
  minimumEntries,
  requiredTitles = [],
}) {
  // A floor of zero is the exact failure mode this guard exists to prevent: it
  // would pass against the empty `{"v":5,"entries":{}}` artifact that shipped
  // on `main`. Refuse to be configured into uselessness.
  if (!Number.isInteger(minimumEntries) || minimumEntries < 1) {
    throw new Error(
      `minimumEntries must be a positive integer, got ${minimumEntries}`
    );
  }

  let raw;
  try {
    raw = readFileSync(indexPath, 'utf8');
  } catch (cause) {
    throw new Error(
      `Storybook index not found at ${indexPath} — did build-storybook run?`,
      { cause }
    );
  }

  let index;
  try {
    index = JSON.parse(raw);
  } catch (cause) {
    throw new Error(`Storybook index at ${indexPath} could not be parsed`, {
      cause,
    });
  }

  if (index.entries === null || typeof index.entries !== 'object') {
    throw new Error(
      `Storybook index at ${indexPath} has no "entries" map — the artifact is not a v5 index`
    );
  }

  const entries = Object.values(index.entries);
  if (entries.length < minimumEntries) {
    throw new Error(
      `Storybook registered ${entries.length} entries, expected at least ${minimumEntries}`
    );
  }

  const titles = [...new Set(entries.map((entry) => entry.title))].sort();
  const missingTitles = requiredTitles.filter(
    (title) => !titles.includes(title)
  );
  if (missingTitles.length > 0) {
    throw new Error(
      `Storybook index is missing required titles: ${missingTitles.join(', ')}`
    );
  }

  return {
    total: entries.length,
    stories: entries.filter((entry) => entry.type === 'story').length,
    docs: entries.filter((entry) => entry.type === 'docs').length,
    titles,
  };
}

function parseArgs(args) {
  const requiredTitles = [];
  let indexPath;
  let minimumEntries = DEFAULT_MINIMUM_ENTRIES;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--min') {
      minimumEntries = Number(args[++i]);
    } else if (arg === '--require-title') {
      requiredTitles.push(args[++i]);
    } else if (arg.startsWith('--')) {
      throw new Error(`Unknown option ${arg}`);
    } else {
      indexPath = arg;
    }
  }

  return {
    indexPath: indexPath ?? DEFAULT_INDEX_PATH,
    minimumEntries,
    requiredTitles,
  };
}

const isCli = argv[1] && fileURLToPath(import.meta.url) === argv[1];
if (isCli) {
  try {
    const options = parseArgs(argv.slice(2));
    const report = checkStorybookStories(options);
    stdout.write(
      `Storybook index OK: ${report.total} entries ` +
        `(${report.stories} stories + ${report.docs} docs) ` +
        `across ${report.titles.length} titles, floor ${options.minimumEntries}\n` +
        report.titles.map((title) => `  - ${title}\n`).join('')
    );
  } catch (error) {
    stderr.write(`${error.message}\n`);
    exit(1);
  }
}
