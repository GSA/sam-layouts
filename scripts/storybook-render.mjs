#!/usr/bin/env node
/** Render each concrete Storybook story in Chromium and verify its component DOM. */
import { createReadStream, existsSync, readFileSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, relative, resolve } from 'node:path';
import { argv, exit, stderr, stdout } from 'node:process';

export const DEFAULT_STORYBOOK_DIR = 'dist/storybook/sam-layouts';

// Contracts intentionally name component descendants and concrete story content.
// Do not replace these with body text or generic layout selectors.
export const DOM_CONTRACTS = {
  Footer: { selector: 'sds-footer', text: /Our Website|Customer Service/i },
  Header: { selector: 'sds-header', text: /Home|Search/i },
  'Landing/Button Group': { selector: 'button.sds-button, button.usa-button', text: /Lorem ipsum|Consectetur/i },
  'Landing/List': { selector: 'sds-landing-list, .sds-list', text: /Lorem ipsum|Curabitur|Nunc vitae/i },
  'Landing/Card': { selector: 'sds-landing-card', text: /Rhoncus id ullamcorper sed/i },
  'Landing/Link': { selector: 'a.usa-link', text: /External|Internal|link/i },
  'Responsive Layout': { selector: 'demo-search-list-layout', text: /Search List Layout|Select Criteria/i },
  Stepper: { selector: 'demo-stepper-simple, demo-stepper-advanced', text: /Step|Next|Back|Complete/i },
  Subheader: { selector: 'demo-subheader', text: /Search|Workspace|Subheader/i },
  'Subheader/Modes': { selector: 'sds-subheader-wrapper', text: /Request|Submit|Tab|Search/i },
  'System Alerts': { selector: '.sds-alert--header, sds-system-alert', text: /alert|warning|information/i },
  'Workspace Tier 2/Results Item': { selector: 'sds-workspace-tier2-item', text: /Entity LLC|DUNS|SAM|address/i },
};

export function readStoryEntries(indexPath) {
  const index = JSON.parse(readFileSync(indexPath, 'utf8'));
  const entries = Object.values(index.entries ?? {}).filter((entry) => entry.type === 'story');
  if (!entries.length) throw new Error(`No story entries found in ${indexPath}`);
  const unknown = [...new Set(entries.map((entry) => entry.title))].filter((title) => !DOM_CONTRACTS[title]);
  if (unknown.length) throw new Error(`Missing DOM contract(s) for story title(s): ${unknown.join(', ')}`);
  const invalid = entries.filter((entry) => !entry.id || !entry.title);
  if (invalid.length) throw new Error(`Invalid Storybook index entry (missing id/title): ${invalid.map((e) => JSON.stringify(e)).join(', ')}`);
  return entries;
}

function contentType(path) {
  return ({ '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.woff': 'font/woff', '.woff2': 'font/woff2' })[extname(path)] ?? 'application/octet-stream';
}

export function serveDirectory(root) {
  const resolvedRoot = resolve(root);
  return createServer((request, response) => {
    let pathname;
    try {
      pathname = decodeURIComponent(new URL(request.url ?? '/', 'http://localhost').pathname);
    } catch {
      response.writeHead(400); response.end('Bad request'); return;
    }
    const file = resolve(resolvedRoot, `.${pathname}`);
    const withinRoot = !relative(resolvedRoot, file).startsWith('..') && !relative(resolvedRoot, file).startsWith('/');
    if (!withinRoot || !existsSync(file) || !statSync(file).isFile()) {
      response.writeHead(404); response.end('Not found'); return;
    }
    response.writeHead(200, { 'content-type': contentType(file), 'cache-control': 'no-store' });
    const stream = createReadStream(file);
    stream.on('error', () => { if (!response.headersSent) response.writeHead(404); response.end(); });
    stream.pipe(response);
  });
}

export async function assertStoryDom(page, entry) {
  const contract = DOM_CONTRACTS[entry.title];
  if (!contract) throw new Error(`Unknown story title: ${entry.title}`);
  const root = page.locator('#storybook-root');
  const component = root.locator(contract.selector).first();
  await component.waitFor({ state: 'visible', timeout: 10_000 });
  const text = await component.innerText();
  if (!contract.text.test(text)) throw new Error(`expected #storybook-root ${contract.selector} content matching ${contract.text}, got ${JSON.stringify(text)}`);
}

export async function runStorybookRender({ root = resolve(argv[2] ?? DEFAULT_STORYBOOK_DIR), screenshotDir } = {}) {
  const entries = readStoryEntries(join(root, 'index.json'));
  const { chromium } = await import('playwright');
  const server = serveDirectory(root);
  let browser;
  const failures = [];
  try {
    await new Promise((resolveListen, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolveListen); });
    const { port } = server.address();
    browser = await chromium.launch({ headless: true });
    for (const entry of entries) {
      const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
      const errors = [];
      page.on('console', (message) => { if (message.type() === 'error') errors.push(`console: ${message.text()}`); });
      page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`));
      page.on('requestfailed', (request) => errors.push(`resource failed: ${request.url()} (${request.failure()?.errorText ?? 'unknown'})`));
      try {
        await page.goto(`http://127.0.0.1:${port}/iframe.html?id=${encodeURIComponent(entry.id)}&viewMode=story`, { waitUntil: 'networkidle', timeout: 30_000 });
        await assertStoryDom(page, entry);
        if (errors.length) throw new Error(errors.join('\n'));
        if (screenshotDir) await page.screenshot({ path: join(resolve(screenshotDir), `${entry.id.replaceAll('--', '__')}.png`), fullPage: true });
        stdout.write(`PASS ${entry.id}\n`);
      } catch (error) { failures.push(`${entry.id}: ${error.message}${errors.length ? `\n${errors.join('\n')}` : ''}`); }
      finally { await page.close(); }
    }
  } finally {
    if (browser) await browser.close();
    if (server.listening) await new Promise((done) => server.close(done));
  }
  if (failures.length) throw new Error(`${failures.length}/${entries.length} stories failed\n${failures.join('\n')}`);
  return entries.length;
}

if (import.meta.url === `file://${process.argv[1]}`) runStorybookRender().then((count) => stdout.write(`Rendered ${count} Storybook stories with component DOM assertions\n`)).catch((error) => { stderr.write(`${error.stack ?? error}\n`); exit(1); });
