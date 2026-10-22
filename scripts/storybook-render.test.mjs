import test from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, symlinkSync, cpSync } from 'node:fs';
import { promisify } from 'node:util';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { DOM_CONTRACTS, readStoryEntries, serveDirectory } from './storybook-render.mjs';

const run = promisify(execFile);

function index(root, entries) {
  writeFileSync(join(root, 'index.json'), JSON.stringify({ entries }));
}

test('CLI runs from a checkout path containing spaces and rejects a missing artifact', async () => {
  const root = mkdtempSync(join(tmpdir(), 'storybook checkout with spaces-'));
  const script = resolve('scripts/storybook-render.mjs');
  await assert.rejects(
    run(process.execPath, [script, join(root, 'missing-dist')], { cwd: root }),
    /index\.json|ENOENT/,
  );
});

test('contracts cover stories and exclude docs', () => {
  const root = mkdtempSync(join(tmpdir(), 'storybook-render-'));
  index(root, {
    story: { id: 'landing-card--default', type: 'story', title: 'Landing/Card' },
    docs: { id: 'landing-card--docs', type: 'docs', title: 'Landing/Card' },
  });
  assert.deepEqual(
    readStoryEntries(join(root, 'index.json')).map(({ id }) => id),
    ['landing-card--default'],
  );
});

test('unknown title and invalid index entry fail clearly', () => {
  const root = mkdtempSync(join(tmpdir(), 'storybook-index-'));
  index(root, { bad: { id: 'x--x', type: 'story', title: 'Unknown' } });
  assert.throws(() => readStoryEntries(join(root, 'index.json')), /Missing DOM contract/);
  index(root, { bad: { type: 'story', title: 'Landing/Card' } });
  assert.throws(() => readStoryEntries(join(root, 'index.json')), /missing id\/title/);
});

test('static server rejects traversal, malformed encoding, directories, and sibling prefixes', async () => {
  const root = mkdtempSync(join(tmpdir(), 'storybook-server-'));
  const sibling = `${root}-sibling`;
  mkdirSync(sibling);
  writeFileSync(join(sibling, 'secret'), 'secret');
  mkdirSync(join(root, 'dir'));
  writeFileSync(join(root, 'index.html'), 'ok');
  const server = serveDirectory(root);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();
  try {
    for (const path of ['/../package.json', '/%2e%2e/package.json', '/%E0%A4%A', '/dir/', `${sibling}/secret`])
      assert.ok([400, 404].includes((await fetch(`http://127.0.0.1:${port}${path}`)).status));
    assert.equal((await fetch(`http://127.0.0.1:${port}/index.html`)).status, 200);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

test('contracts are concrete rather than generic body assertions', () => {
  for (const contract of Object.values(DOM_CONTRACTS)) {
    assert.notEqual(contract.selector, 'body');
    assert.notEqual(String(contract.text), '/./', 'contracts must not use a match-anything text regex');
  }
});
