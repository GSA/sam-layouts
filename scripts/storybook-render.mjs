#!/usr/bin/env node
/** Render each concrete Storybook story in Chromium and verify its component DOM. */
import { createReadStream, existsSync, mkdirSync, readFileSync, realpathSync, statSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, relative, resolve } from 'node:path';
import { argv, exit, stderr, stdout } from 'node:process';
import { fileURLToPath } from 'node:url';

export const DEFAULT_STORYBOOK_DIR = 'dist/storybook/sam-layouts';
export const MIN_RENDERED_STORIES = 26;

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
  Subheader: { selector: 'demo-subheader sds-subheader', text: /Contract Opportunities|Workspace/i },
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
  if (invalid.length)
    throw new Error(
      `Invalid Storybook index entry (missing id/title): ${invalid.map((e) => JSON.stringify(e)).join(', ')}`,
    );
  return entries.sort((left, right) => left.id.localeCompare(right.id));
}

export function normalizeKnownFailures(knownFailures) {
  if (!Array.isArray(knownFailures)) throw new Error('Known failures must be an array');
  return knownFailures.map((entry, index) => {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry))
      throw new Error(
        `Known failure #${index} must be an object { id, phase, signature }; bare story IDs are not supported`,
      );
    const { id, phase, signature } = entry;
    if (typeof id !== 'string' || !id.trim()) throw new Error(`Known failure #${index} has invalid id`);
    if (phase !== 'render' && phase !== 'post-render')
      throw new Error(`Known failure #${index} has invalid phase ${JSON.stringify(phase)}`);
    if (typeof signature !== 'string' || !signature.trim())
      throw new Error(`Known failure #${index} has invalid signature`);
    return { id: id.trim(), phase, signature: signature.trim() };
  });
}

export function failureSignature(error, browserErrors = []) {
  const primary = String(error?.message ?? error)
    .split('\n')[0]
    .trim();
  const browser = browserErrors[0]?.split('\n')[0]?.trim();
  return browser ? `${primary} :: ${browser}` : primary;
}

export function matchKnownFailure(knownFailures, failure) {
  return knownFailures.findIndex(
    (entry) => entry.id === failure.id && entry.phase === failure.phase && entry.signature === failure.signature,
  );
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

function artifactSlug(storyId) {
  return storyId.replaceAll('--', '__').replaceAll(/[^a-zA-Z0-9._-]/g, '_');
}

export function serveDirectory(root) {
  const resolvedRoot = resolve(root);
  return createServer((request, response) => {
    let pathname;
    try {
      pathname = decodeURIComponent(new URL(request.url ?? '/', 'http://localhost').pathname);
    } catch {
      response.writeHead(400);
      response.end('Bad request');
      return;
    }
    const file = resolve(resolvedRoot, `.${pathname}`);
    const withinRoot = !relative(resolvedRoot, file).startsWith('..') && !relative(resolvedRoot, file).startsWith('/');
    if (!withinRoot || !existsSync(file) || !statSync(file).isFile()) {
      response.writeHead(404);
      response.end('Not found');
      return;
    }
    response.writeHead(200, { 'content-type': contentType(file), 'cache-control': 'no-store' });
    const stream = createReadStream(file);
    stream.on('error', () => {
      if (!response.headersSent) response.writeHead(404);
      response.end();
    });
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
  if (!contract.text.test(text))
    throw new Error(
      `expected #storybook-root ${contract.selector} content matching ${contract.text}, got ${JSON.stringify(text)}`,
    );
}

export async function runStorybookRender({
  root = resolve(argv[2] ?? DEFAULT_STORYBOOK_DIR),
  screenshotDir,
  artifactDir,
  baseURL,
  browser: providedBrowser,
  onStory,
  knownFailures = [],
  minimumStories = MIN_RENDERED_STORIES,
} = {}) {
  const entries = readStoryEntries(join(root, 'index.json'));
  if (entries.length < minimumStories)
    throw new Error(`Storybook registered ${entries.length} stories, expected at least ${minimumStories}`);

  const normalizedKnownFailures = normalizeKnownFailures(knownFailures);
  const unknownAllowlistStories = normalizedKnownFailures
    .map(({ id }) => id)
    .filter((id) => !entries.some((entry) => entry.id === id));
  if (unknownAllowlistStories.length)
    throw new Error(
      `Known failure allowlist references missing story IDs: ${[...new Set(unknownAllowlistStories)].join(', ')}`,
    );

  const requiredRenderedStories = Math.max(1, entries.length - normalizedKnownFailures.length);
  const server = baseURL ? undefined : serveDirectory(root);
  const diagnosticsRoot = artifactDir ? resolve(artifactDir) : undefined;
  let browser = providedBrowser;
  let ownsBrowser = false;
  const failures = [];
  const observedKnownFailures = new Set();
  let renderedStories = 0;

  try {
    if (server) {
      await new Promise((resolveListen, reject) => {
        server.once('error', reject);
        server.listen(0, '127.0.0.1', resolveListen);
      });
    }

    const url = baseURL ?? `http://127.0.0.1:${server.address().port}`;
    if (!browser) {
      const { chromium } = await import('playwright');
      browser = await chromium.launch({ headless: true });
      ownsBrowser = true;
    }

    for (const entry of entries) {
      const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
      const page = await context.newPage();
      const errors = [];
      page.on('console', (message) => {
        if (message.type() === 'error') errors.push(`console: ${message.text()}`);
      });
      page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`));
      page.on('requestfailed', (request) =>
        errors.push(`resource failed: ${request.url()} (${request.failure()?.errorText ?? 'unknown'})`),
      );

      const storyDiagnostics = [];
      const storyArtifactDir = diagnosticsRoot ? join(diagnosticsRoot, artifactSlug(entry.id)) : undefined;
      let rendered = false;
      let failure = null;

      try {
        await page.goto(`${url}/iframe.html?id=${encodeURIComponent(entry.id)}&viewMode=story`, {
          waitUntil: 'networkidle',
          timeout: 30_000,
        });
        await assertStoryDom(page, entry);
        if (errors.length) throw new Error(errors.join('\n'));
        rendered = true;
        renderedStories += 1;

        if (onStory) await onStory(page, entry);

        if (screenshotDir) {
          mkdirSync(resolve(screenshotDir), { recursive: true });
          await page.screenshot({
            path: join(resolve(screenshotDir), `${entry.id.replaceAll('--', '__')}.png`),
            fullPage: true,
          });
        }

        stdout.write(`PASS ${entry.id}\n`);
      } catch (error) {
        const phase = rendered ? 'post-render' : 'render';
        const signature = failureSignature(error, errors);
        failure = {
          id: entry.id,
          phase,
          signature,
          message: `${entry.id} [${phase}] ${signature}`,
          detail: `${String(error?.stack ?? error)}${errors.length ? `\n${errors.join('\n')}` : ''}`,
        };

        if (storyArtifactDir) {
          mkdirSync(storyArtifactDir, { recursive: true });
          const screenshotPath = join(storyArtifactDir, 'failure.png');
          const domPath = join(storyArtifactDir, 'dom.html');
          const errorPath = join(storyArtifactDir, 'error.txt');
          try {
            await page.screenshot({ path: screenshotPath, fullPage: true });
            storyDiagnostics.push(`screenshot=${screenshotPath}`);
          } catch {
            // Best effort diagnostics only.
          }
          try {
            writeFileSync(domPath, await page.content());
            storyDiagnostics.push(`dom=${domPath}`);
          } catch {
            // Best effort diagnostics only.
          }
          writeFileSync(errorPath, `${failure.detail}\n`);
          storyDiagnostics.push(`error=${errorPath}`);
        }
      } finally {
        await context.close();
      }

      if (failure) {
        const detailsSuffix = storyDiagnostics.length ? `\n  diagnostics: ${storyDiagnostics.join(', ')}` : '';
        const knownFailureIndex = matchKnownFailure(normalizedKnownFailures, failure);
        if (knownFailureIndex >= 0) {
          observedKnownFailures.add(knownFailureIndex);
          stdout.write(`ALLOWLIST ${failure.id} [${failure.phase}] ${failure.signature}${detailsSuffix}\n`);
        } else {
          failures.push(`${failure.message}\n${failure.detail}${detailsSuffix}`);
        }
      }
    }
  } finally {
    if (ownsBrowser && browser) await browser.close();
    if (server?.listening) await new Promise((done) => server.close(done));
  }

  const fixedKnownFailures = normalizedKnownFailures.filter((_, index) => !observedKnownFailures.has(index));
  if (renderedStories < requiredRenderedStories)
    failures.push(
      `Rendered-story floor failed: rendered ${renderedStories}/${entries.length}, expected at least ${requiredRenderedStories}`,
    );

  if (failures.length || fixedKnownFailures.length)
    throw new Error(
      `${failures.length}/${entries.length} stories failed unexpectedly; ${fixedKnownFailures.length} allowlisted failures are now stale\n` +
        [
          ...failures,
          ...fixedKnownFailures.map(
            (entry) =>
              `${entry.id} [${entry.phase}] ${entry.signature}: remove this stale known-failure signature from the allowlist`,
          ),
        ].join('\n'),
    );

  return entries.length;
}

export function isExecutedDirectly(metaUrl = import.meta.url, argvPath = process.argv[1]) {
  if (!argvPath) return false;
  const modulePath = realpathSync(fileURLToPath(metaUrl));
  try {
    return realpathSync(argvPath) === modulePath;
  } catch {
    return resolve(argvPath) === modulePath;
  }
}

if (isExecutedDirectly())
  runStorybookRender()
    .then((count) => stdout.write(`Rendered ${count} Storybook stories with component DOM assertions\n`))
    .catch((error) => {
      stderr.write(`${error.stack ?? error}\n`);
      exit(1);
    });
