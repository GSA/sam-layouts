import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DOM_CONTRACTS, readStoryEntries, serveDirectory } from './storybook-render.mjs';

test('DOM contracts cover every registered story title and exclude docs', () => {
  const root = mkdtempSync(join(tmpdir(), 'storybook-render-'));
  mkdirSync(join(root, 'nested'));
  writeFileSync(
    join(root, 'index.json'),
    JSON.stringify({
      entries: {
        story: { id: 'landing-card--default', type: 'story', title: 'Landing/Card' },
        docs: { id: 'landing-card--docs', type: 'docs', title: 'Landing/Card' },
      },
    }),
  );
  const entries = readStoryEntries(join(root, 'index.json'));
  assert.deepEqual(
    entries.map(({ id }) => id),
    ['landing-card--default'],
  );
  assert.ok(DOM_CONTRACTS['Landing/Card'].selector);
});

test('static server rejects paths outside the Storybook artifact', async () => {
  const root = mkdtempSync(join(tmpdir(), 'storybook-server-'));
  writeFileSync(join(root, 'index.html'), 'ok');
  const server = serveDirectory(root);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();
  try {
    const response = await fetch(`http://127.0.0.1:${port}/../package.json`);
    assert.equal(response.status, 404);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
