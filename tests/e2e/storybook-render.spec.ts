import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { runStorybookRender } from '../../scripts/storybook-render.mjs';

const knownFailures = JSON.parse(
  readFileSync(resolve('tests/accessibility/storybook-render-failures.json'), 'utf8'),
) as string[];

test('every registered story renders expected component DOM without browser errors', async ({ baseURL }) => {
  const count = await runStorybookRender({
    root: resolve('dist/storybook/sam-layouts'),
    baseURL,
    knownFailures,
    minimumStories: 26,
  });
  expect(count).toBeGreaterThanOrEqual(26);
});
