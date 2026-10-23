import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { compareBaseline, violationFingerprints, WCAG_21_AA_TAGS } from '../../scripts/storybook-a11y.mjs';

const baselinePath = resolve('tests/accessibility/wcag-2.1-aa-baseline.json');
const renderFailuresPath = resolve('tests/accessibility/storybook-render-failures.json');
const readBaseline = () => JSON.parse(readFileSync(baselinePath, 'utf8')) as string[];

function assertAxeEvaluatedRules(results: {
  passes: unknown[];
  violations: unknown[];
  incomplete: unknown[];
  inapplicable: unknown[];
}) {
  const evaluated =
    results.passes.length + results.violations.length + results.incomplete.length + results.inapplicable.length;
  expect(
    evaluated,
    'axe returned an empty result; refuse to trust or write a baseline from empty analysis',
  ).toBeGreaterThan(0);
}

async function assertAxeSelfTest(page: Page) {
  await page.setContent('<main><p style="color:#aaa;background:#fff">Contrast check</p></main>');
  const results = await new AxeBuilder({ page }).withTags(WCAG_21_AA_TAGS).analyze();
  assertAxeEvaluatedRules(results);

  // Negative-control switch for verifying the self-test itself; never used in CI.
  const reported = process.env.AXE_SELF_TEST_INJECT_EMPTY === '1' ? [] : results.violations;
  expect(reported.map(({ id }: { id: string }) => id)).toContain('color-contrast');
}

test.describe.configure({ mode: 'serial' });

test('axe detects a real WCAG 2.1 AA contrast violation', async ({ page }) => {
  await assertAxeSelfTest(page);
});

test('rendered stories have no new or stale WCAG 2.1 AA violations', async ({ baseURL, page }, testInfo) => {
  // Re-run inline so baseline updates can never proceed without a valid self-test,
  // even when this test is run directly.
  await assertAxeSelfTest(page);

  const { MIN_RENDERED_STORIES, normalizeKnownFailures, runStorybookRender } =
    await import('../../scripts/storybook-render.mjs');
  const knownFailures = normalizeKnownFailures(JSON.parse(readFileSync(renderFailuresPath, 'utf8')));
  expect(
    knownFailures.filter(({ phase }) => phase === 'post-render'),
    'Axe failures must never be allowlisted',
  ).toEqual([]);

  const baselineBefore = readBaseline();
  const fingerprints: string[] = [];
  const count = await runStorybookRender({
    root: resolve('dist/storybook/sam-layouts'),
    baseURL,
    artifactDir: testInfo.outputPath('render-diagnostics'),
    knownFailures,
    minimumStories: MIN_RENDERED_STORIES,
    onStory: async (storyPage, entry) => {
      const root = storyPage.locator('#storybook-root');
      await expect(root).toBeVisible();
      await expect(root).not.toHaveAttribute('aria-hidden', 'true');
      expect(
        await root.locator(':scope > *').count(),
        `${entry.id} rendered no storybook-root children`,
      ).toBeGreaterThan(0);

      // Explicit negative-control probe: inject a real missing-alt image into one rendered story.
      if (process.env.AXE_INJECT_VIOLATION === '1' && entry.id === 'footer--footer')
        await root.evaluate((storyRoot) => {
          const image = document.createElement('img');
          image.src = 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=';
          storyRoot.append(image);
        });

      const results = await new AxeBuilder({ page: storyPage }).withTags(WCAG_21_AA_TAGS).analyze();
      assertAxeEvaluatedRules(results);
      fingerprints.push(...violationFingerprints(entry.id, results.violations));
    },
  });

  expect(count - knownFailures.length, 'Axe must analyze at least 26 real stories').toBeGreaterThanOrEqual(
    MIN_RENDERED_STORIES,
  );
  const current = [...fingerprints].sort();
  const { added, resolved } = compareBaseline(current, baselineBefore);

  // An explicit update is permitted only after all stories rendered and axe self-test passed.
  if (process.env.UPDATE_A11Y_BASELINE === '1') {
    expect(process.env.AXE_INJECT_VIOLATION, 'Do not update the baseline with a negative-control violation').not.toBe(
      '1',
    );
    expect(process.env.AXE_SELF_TEST_INJECT_EMPTY, 'Do not update the baseline with disabled axe').not.toBe('1');
    writeFileSync(baselinePath, `${JSON.stringify(current, null, 2)}\n`);
    console.log(`Updated WCAG baseline after analyzing ${count} stories (${current.length} fingerprints)`);
    return;
  }

  console.log(
    `Axe checked ${count - knownFailures.length} rendered stories; ${current.length} violation fingerprints (${added.length} added, ${resolved.length} resolved)`,
  );
  expect(added, 'New WCAG 2.1 AA violations: fix them, do not automatically update the baseline').toEqual([]);
  expect(resolved, 'Resolved WCAG 2.1 AA violations: explicitly regenerate the baseline').toEqual([]);
});
