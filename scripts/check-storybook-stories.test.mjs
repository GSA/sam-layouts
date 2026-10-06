import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

import { checkStorybookStories } from './check-storybook-stories.mjs';

const scriptPath = fileURLToPath(
  new URL('./check-storybook-stories.mjs', import.meta.url)
);

/** Run the script the way CI runs it. */
function runCli(args) {
  return spawnSync(process.execPath, [scriptPath, ...args], {
    encoding: 'utf8',
  });
}

/** Write an index.json fixture and return its path. */
function fixture(contents) {
  const dir = mkdtempSync(join(tmpdir(), 'storybook-index-'));
  const file = join(dir, 'index.json');
  writeFileSync(
    file,
    typeof contents === 'string' ? contents : JSON.stringify(contents)
  );
  return file;
}

/** An index with `count` story entries, named deterministically. */
function indexWithStories(count) {
  const entries = {};
  for (let i = 0; i < count; i++) {
    entries[`component--story-${i}`] = {
      id: `component--story-${i}`,
      title: 'Component',
      name: `Story ${i}`,
      type: 'story',
    };
  }
  return { v: 5, entries };
}

test('rejects the empty index that a mismatched stories glob produces', () => {
  // This is the exact artifact `main` shipped before GSA/sam-layouts#75.
  const indexPath = fixture({ v: 5, entries: {} });

  assert.throws(
    () => checkStorybookStories({ indexPath, minimumEntries: 34 }),
    {
      message: /registered 0 entries/,
    }
  );
});

test('accepts an index at the floor', () => {
  const indexPath = fixture(indexWithStories(34));

  const report = checkStorybookStories({ indexPath, minimumEntries: 34 });

  assert.equal(report.total, 34);
});

test('accepts an index above the floor, so adding a story cannot break CI', () => {
  const indexPath = fixture(indexWithStories(40));

  const report = checkStorybookStories({ indexPath, minimumEntries: 34 });

  assert.equal(report.total, 40);
});

test('rejects an index that is non-empty but below the floor', () => {
  const indexPath = fixture(indexWithStories(12));

  assert.throws(
    () => checkStorybookStories({ indexPath, minimumEntries: 34 }),
    {
      message: /registered 12 entries.*at least 34/s,
    }
  );
});

test('reports stories and docs separately', () => {
  const index = indexWithStories(2);
  index.entries['component--docs'] = {
    id: 'component--docs',
    title: 'Component',
    name: 'Docs',
    type: 'docs',
  };
  const indexPath = fixture(index);

  const report = checkStorybookStories({ indexPath, minimumEntries: 3 });

  assert.deepEqual(
    { total: report.total, stories: report.stories, docs: report.docs },
    { total: 3, stories: 2, docs: 1 }
  );
});

test('reports the registered titles, so a lost story file is visible', () => {
  const index = indexWithStories(1);
  index.entries['subheader-modes--default'] = {
    id: 'subheader-modes--default',
    title: 'Subheader/Modes',
    name: 'Default',
    type: 'story',
  };
  const indexPath = fixture(index);

  const report = checkStorybookStories({ indexPath, minimumEntries: 2 });

  assert.deepEqual(report.titles, ['Component', 'Subheader/Modes']);
});

test('rejects a missing index, rather than reading it as zero stories', () => {
  const indexPath = join(
    mkdtempSync(join(tmpdir(), 'storybook-index-')),
    'index.json'
  );

  assert.throws(
    () => checkStorybookStories({ indexPath, minimumEntries: 34 }),
    {
      message: /not found/,
    }
  );
});

test('rejects an unparseable index', () => {
  const indexPath = fixture('{ not json');

  assert.throws(
    () => checkStorybookStories({ indexPath, minimumEntries: 34 }),
    {
      message: /could not be parsed/,
    }
  );
});

test('rejects an index with no entries map at all', () => {
  const indexPath = fixture({ v: 5 });

  assert.throws(
    () => checkStorybookStories({ indexPath, minimumEntries: 34 }),
    {
      message: /no "entries" map/,
    }
  );
});

test('rejects a floor of zero, which would make the guard vacuous', () => {
  const indexPath = fixture(indexWithStories(34));

  assert.throws(() => checkStorybookStories({ indexPath, minimumEntries: 0 }), {
    message: /minimumEntries must be a positive integer/,
  });
});

test('rejects an index missing a required title, even when the count clears the floor', () => {
  // The two subheader story files register as separate titles. Losing one of
  // them costs 5-6 entries, which a floor alone would not necessarily catch
  // once other stories are added. See GSA/sam-layouts#75.
  const indexPath = fixture(indexWithStories(34));

  assert.throws(
    () =>
      checkStorybookStories({
        indexPath,
        minimumEntries: 34,
        requiredTitles: ['Subheader', 'Subheader/Modes'],
      }),
    { message: /missing required titles: Subheader, Subheader\/Modes/ }
  );
});

test('accepts an index containing every required title', () => {
  const index = indexWithStories(1);
  index.entries['subheader--basic'] = {
    id: 'subheader--basic',
    title: 'Subheader',
    name: 'Basic',
    type: 'story',
  };
  index.entries['subheader-modes--default'] = {
    id: 'subheader-modes--default',
    title: 'Subheader/Modes',
    name: 'Default',
    type: 'story',
  };
  const indexPath = fixture(index);

  const report = checkStorybookStories({
    indexPath,
    minimumEntries: 3,
    requiredTitles: ['Subheader', 'Subheader/Modes'],
  });

  assert.equal(report.total, 3);
});

test('run as a CLI, exits non-zero and explains itself on an empty index', () => {
  const indexPath = fixture({ v: 5, entries: {} });

  const result = runCli([indexPath, '--min', '34']);

  assert.equal(result.status, 1);
  assert.match(result.stderr, /registered 0 entries, expected at least 34/);
});

test('run as a CLI, exits zero and reports the count on a healthy index', () => {
  const indexPath = fixture(indexWithStories(34));

  const result = runCli([indexPath, '--min', '34']);

  assert.equal(result.status, 0);
  assert.match(result.stdout, /34 entries/);
});

test('run as a CLI, exits non-zero when a required title is absent', () => {
  const indexPath = fixture(indexWithStories(34));

  const result = runCli([
    indexPath,
    '--min',
    '34',
    '--require-title',
    'Subheader',
  ]);

  assert.equal(result.status, 1);
  assert.match(result.stderr, /missing required titles: Subheader/);
});
