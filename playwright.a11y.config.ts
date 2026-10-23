import { defineConfig } from '@playwright/test';
import baseConfig from './playwright.config';

const a11yHtmlReport = 'playwright-report/a11y';

export default defineConfig({
  ...baseConfig,
  testDir: './tests/accessibility',
  outputDir: 'test-results/a11y',
  reporter: process.env.CI
    ? [['github'], ['html', { open: 'never', outputFolder: a11yHtmlReport }]]
    : [['list'], ['html', { open: 'never', outputFolder: a11yHtmlReport }]],
});
