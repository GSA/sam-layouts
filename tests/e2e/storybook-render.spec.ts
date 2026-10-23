import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
test('every registered story renders expected component DOM without browser errors', async ({ baseURL }, testInfo) => {
  const { MIN_RENDERED_STORIES, normalizeKnownFailures, runStorybookRender } =
    await import('../../scripts/storybook-render.mjs');
  const knownFailures = normalizeKnownFailures(
    JSON.parse(readFileSync(resolve('tests/accessibility/storybook-render-failures.json'), 'utf8')),
  );
  const count = await runStorybookRender({
    root: resolve('dist/storybook/sam-layouts'),
    baseURL,
    artifactDir: testInfo.outputPath('render-diagnostics'),
    knownFailures,
    minimumStories: MIN_RENDERED_STORIES,
  });
  expect(count).toBeGreaterThanOrEqual(MIN_RENDERED_STORIES);
});
