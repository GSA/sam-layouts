import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import {
  extractRuntimeSpecifiers,
  angularCompilationKind,
  checkPackageContract,
  validateContract,
  REQUIRED_PEERS,
} from './check-package-contract.mjs';

const allPeers = Object.fromEntries(
  REQUIRED_PEERS.map((name) => [
    name,
    name.startsWith('@gsa-sam/') ? '>=21.0.2 <22.0.0' : name.startsWith('@angular/') ? '>=21.0.0 <22.0.0' : '*',
  ]),
);
test('extracts static imports and leaves lazy import optional', () => {
  assert.deepEqual(
    extractRuntimeSpecifiers(
      "/* import 'missing' */\nimport x from 'qs'; require('rxjs/operators'); import('lazy-pkg');",
    ),
    ['qs', 'rxjs'],
  );
});
test('rejects malformed JavaScript', () =>
  assert.throws(() => extractRuntimeSpecifiers('import {', 'broken.mjs'), /broken\.mjs:1: malformed JavaScript/));
test('identifies partial Ivy and full AOT without confusing them', () => {
  assert.equal(angularCompilationKind('const x = ɵɵngDeclareComponent({});'), 'partial-ivy');
  assert.equal(angularCompilationKind('const x = ɵɵdefineComponent({});'), 'full-aot');
});
test('reports missing qs and icons and accepts declared tslib dependency', () => {
  const errors = validateContract({
    manifest: {
      peerDependencies: Object.fromEntries(
        REQUIRED_PEERS.filter((x) => x !== 'qs' && x !== '@gsa-sam/ngx-uswds-icons').map((x) => [x, allPeers[x]]),
      ),
      dependencies: { tslib: '^2.3.0' },
    },
    dependencies: ['qs', '@gsa-sam/ngx-uswds-icons', 'tslib'],
  });
  assert.match(errors.join('\n'), /qs/);
  assert.match(errors.join('\n'), /ngx-uswds-icons/);
  assert.doesNotMatch(errors.join('\n'), /tslib/);
});
test('rejects widened Angular ranges and defective SDS artifacts while accepting valid USWDS', () => {
  const base = { peerDependencies: allPeers };
  assert.deepEqual(validateContract({ manifest: base, dependencies: [] }), []);
  assert.match(
    validateContract({
      manifest: { peerDependencies: { ...allPeers, '@angular/core': '>=21 <23' } },
      dependencies: [],
    }).join('\n'),
    /Angular 21/,
  );
  assert.deepEqual(
    validateContract({
      manifest: {
        peerDependencies: { ...allPeers, '@gsa-sam/ngx-uswds': '^21.0.0', '@gsa-sam/ngx-uswds-icons': '^21.0.0' },
      },
      dependencies: [],
    }),
    [],
  );
  for (const name of ['@gsa-sam/components', '@gsa-sam/sam-formly', '@gsa-sam/sam-material-extensions']) {
    assert.match(
      validateContract({ manifest: { peerDependencies: { ...allPeers, [name]: '^21.0.0' } }, dependencies: [] }).join(
        '\n',
      ),
      /21\.0\.2/,
    );
  }
  assert.match(
    validateContract({
      manifest: { peerDependencies: { ...allPeers, '@angular/core': '^21.0.0 || ^22.0.0' } },
      dependencies: [],
    }).join('\n'),
    /Angular 21/,
  );
});
test('empty artifact directory fails', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'contract-'));
  const manifestPath = path.join(root, 'package.json');
  await writeFile(manifestPath, '{}');
  await assert.rejects(checkPackageContract({ dist: root, manifestPath }), /no emitted JavaScript/);
});
test('checks emitted artifact', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'contract-'));
  const dist = path.join(root, 'fesm');
  await mkdir(dist);
  await writeFile(path.join(dist, 'index.mjs'), "import '@gsa-sam/ngx-uswds-icons'; import 'qs';");
  const manifestPath = path.join(root, 'package.json');
  await writeFile(manifestPath, JSON.stringify({ peerDependencies: allPeers }));
  assert.deepEqual((await checkPackageContract({ dist: root, manifestPath })).errors, []);
});
