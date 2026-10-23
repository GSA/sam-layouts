import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { runStorybookRender } from '../../scripts/storybook-render.mjs';
import { compareBaseline, violationFingerprints, WCAG_21_AA_TAGS } from '../../scripts/storybook-a11y.mjs';

const baselinePath = resolve('tests/accessibility/wcag-2.1-aa-baseline.json');
const renderFailuresPath = resolve('tests/accessibility/storybook-render-failures.json');
const knownFailures = JSON.parse(readFileSync(renderFailuresPath, 'utf8')) as string[];
const readBaseline = () => JSON.parse(readFileSync(baselinePath, 'utf8')) as string[];

// If axe silently returns no violations this must fail before the story gate runs.
test('axe detects a real WCAG 2.1 AA contrast violation', async ({ page }) => {
  await page.setContent('<main><p style="color:#aaa;background:#fff">Contrast check</p></main>');
  const results = await new AxeBuilder({ page }).withTags(WCAG_21_AA_TAGS).analyze();
  // Negative-control switch for verifying the self-test itself; never used in CI.
  const reported = process.env.AXE_SELF_TEST_INJECT_EMPTY === '1' ? [] : results.violations;
  expect(reported.map(({ id }) => id)).toContain('color-contrast');
});

test('rendered stories have no new or stale WCAG 2.1 AA violations', async ({ baseURL }) => {
  const fingerprints: string[] = [];
  const count = await runStorybookRender({
    root: resolve('dist/storybook/sam-layouts'),
    baseURL,
    knownFailures,
    minimumStories: 26,
    onStory: async (page, entry) => {
      // Explicit negative-control probe: inject a real missing-alt image into one rendered story.
      if (process.env.AXE_INJECT_VIOLATION === '1' && entry.id === 'footer--footer')
        await page.locator('#storybook-root').evaluate((root) => {
          const image = document.createElement('img');
          image.src = 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=';
          root.append(image);
        });
      const results = await new AxeBuilder({ page })
        .withTags(WCAG_21_AA_TAGS)
        .exclude("#storybook-root[aria-hidden='true']")
        .analyze();
      fingerprints.push(...violationFingerprints(entry.id, results.violations));
    },
  });
  const current = [...new Set(fingerprints)].sort();
  // An explicit update is permitted only after all stories have rendered and axe ran.
  if (process.env.UPDATE_A11Y_BASELINE === '1') {
    expect(process.env.AXE_INJECT_VIOLATION, 'Do not update the baseline with a negative-control violation').not.toBe(
      '1',
    );
    expect(process.env.AXE_SELF_TEST_INJECT_EMPTY, 'Do not update the baseline with disabled axe').not.toBe('1');
    writeFileSync(baselinePath, `${JSON.stringify(current, null, 2)}\n`);
  }
  const { added, resolved } = compareBaseline(current, readBaseline());
  console.log(`Axe checked ${count - knownFailures.length} rendered stories; ${current.length} violation fingerprints`);
  expect(added, 'New WCAG 2.1 AA violations: fix them, do not automatically update the baseline').toEqual([]);
  expect(resolved, 'Resolved WCAG 2.1 AA violations: explicitly regenerate the baseline').toEqual([]);
});
