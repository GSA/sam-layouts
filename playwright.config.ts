import { defineConfig } from '@playwright/test';

const e2eHtmlReport = 'playwright-report/e2e';

// The CI job builds once. Local runs build first so the served artifact is fresh.
export default defineConfig({
  testDir: './tests/e2e',
  timeout: 600_000,
  workers: 1,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  outputDir: 'test-results/e2e',
  reporter: process.env.CI
    ? [['github'], ['html', { open: 'never', outputFolder: e2eHtmlReport }]]
    : [['list'], ['html', { open: 'never', outputFolder: e2eHtmlReport }]],
  use: { baseURL: 'http://127.0.0.1:6007', trace: 'retain-on-failure' },
  webServer: {
    command: process.env.CI
      ? 'npx --no-install http-server dist/storybook/sam-layouts --port 6007 --silent'
      : 'CI=1 npx nx build-storybook sam-layouts && npx --no-install http-server dist/storybook/sam-layouts --port 6007 --silent',
    url: 'http://127.0.0.1:6007/iframe.html',
    reuseExistingServer: false,
    timeout: 600_000,
    env: { NODE_OPTIONS: '--max_old_space_size=8192' },
  },
});
