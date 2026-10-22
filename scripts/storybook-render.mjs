#!/usr/bin/env node
/**
 * Render every registered Storybook story in Chromium and assert component DOM.
 * This deliberately reads index.json (not the manager UI): docs entries are
 * excluded and every concrete story gets its own iframe render.
 *
 * Build first: CI=1 npx nx build-storybook sam-layouts
 * Run: node scripts/storybook-render.mjs [storybook-dir]
 */
import { createReadStream, existsSync, readFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize, resolve } from 'node:path';
import { argv, exit, stderr, stdout } from 'node:process';

export const DEFAULT_STORYBOOK_DIR = 'dist/storybook/sam-layouts';

// These are intentionally component-level assertions, not a generic
// "iframe loaded" check. Every title in the current #95 story set must have
// an entry here; adding a new title requires adding a meaningful DOM contract.
export const DOM_CONTRACTS = {
  Footer: { selector: '.usa-footer', text: /footer|navigation/i },
  Header: { selector: '.usa-header', text: /home|search|header/i },
  'Landing/Button Group': { selector: 'button.sds-button, button.usa-button', text: /./ },
  'Landing/List': { selector: 'ul.sds-list', text: /lorem|item|./i },
  'Landing/Card': { selector: '.sds-card', text: /rhoncus|aliquam|./i },
  'Landing/Link': { selector: 'a.usa-link', text: /link/i },
  'Responsive Layout': { selector: 'demo-search-list-layout, .grid-row', text: /search|results|./i },
  Stepper: { selector: 'demo-stepper-simple, demo-stepper-advanced, .grid-row', text: /step|navigate|./i },
  Subheader: { selector: '.sds-subheader__content', text: /./ },
  'Subheader/Modes': { selector: '.sds-subheader__content', text: /./ },
  'System Alerts': { selector: '.sds-alert--header', text: /alert/i },
  'Workspace Tier 2/Results Item': { selector: 'sds-workspace-tier2-item', text: /entity|duns|sam|address/i },
};

export function readStoryEntries(indexPath) {
  const index = JSON.parse(readFileSync(indexPath, 'utf8'));
  const entries = Object.values(index.entries ?? {}).filter((entry) => entry.type === 'story');
  if (!entries.length) throw new Error(`No story entries found in ${indexPath}`);
  const unknown = [...new Set(entries.map((entry) => entry.title))].filter((title) => !DOM_CONTRACTS[title]);
  if (unknown.length) throw new Error(`Missing DOM contract(s) for story title(s): ${unknown.join(', ')}`);
  return entries;
}

function contentType(path) {
  return (
    {
      '.html': 'text/html',
      '.js': 'text/javascript',
      '.css': 'text/css',
      '.json': 'application/json',
      '.svg': 'image/svg+xml',
      '.ico': 'image/x-icon',
      '.woff': 'font/woff',
      '.woff2': 'font/woff2',
    }[extname(path)] ?? 'application/octet-stream'
  );
}

export function serveDirectory(root) {
  const server = createServer((request, response) => {
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    const file = resolve(root, `.${normalize(pathname)}`);
    if (!file.startsWith(resolve(root)) || !existsSync(file)) {
      response.writeHead(404);
      response.end('Not found');
      return;
    }
    response.writeHead(200, { 'content-type': contentType(file), 'cache-control': 'no-store' });
    createReadStream(file).pipe(response);
  });
  return server;
}

async function main() {
  const root = resolve(argv[2] ?? DEFAULT_STORYBOOK_DIR);
  const indexPath = join(root, 'index.json');
  const entries = readStoryEntries(indexPath);
  const { chromium } = await import('playwright');
  const server = serveDirectory(root);
  await new Promise((resolveListen, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolveListen);
  });
  const { port } = server.address();
  const browser = await chromium.launch({ headless: true });
  const failures = [];
  const screenshotDir = process.env.STORYBOOK_SCREENSHOT_DIR;
  try {
    for (const entry of entries) {
      const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
      const errors = [];
      page.on('console', (message) => {
        if (message.type() === 'error') errors.push(`console: ${message.text()}`);
      });
      page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`));
      const url = `http://127.0.0.1:${port}/iframe.html?id=${encodeURIComponent(entry.id)}&viewMode=story`;
      try {
        await page.goto(url, { waitUntil: 'networkidle', timeout: 30_000 });
        const contract = DOM_CONTRACTS[entry.title];
        await page.locator(contract.selector).first().waitFor({ state: 'visible', timeout: 10_000 });
        const bodyText = await page.locator('body').innerText();
        if (!contract.text.test(bodyText)) throw new Error(`expected rendered content matching ${contract.text}`);
        if (screenshotDir)
          await page.screenshot({
            path: join(resolve(screenshotDir), `${entry.id.replaceAll('--', '__')}.png`),
            fullPage: true,
          });
        if (errors.length) throw new Error(errors.join('\n'));
        stdout.write(`PASS ${entry.id}\n`);
      } catch (error) {
        failures.push(`${entry.id}: ${error.message}${errors.length ? `\n${errors.join('\n')}` : ''}`);
      } finally {
        await page.close();
      }
    }
  } finally {
    await browser.close();
    await new Promise((resolveClose) => server.close(resolveClose));
  }
  if (failures.length) {
    stderr.write(`${failures.length}/${entries.length} stories failed\n${failures.join('\n')}\n`);
    exit(1);
  }
  stdout.write(`Rendered ${entries.length}/${entries.length} Storybook stories with component DOM assertions\n`);
}

if (import.meta.url === `file://${process.argv[1]}`)
  main().catch((error) => {
    stderr.write(`${error.stack ?? error}\n`);
    exit(1);
  });
